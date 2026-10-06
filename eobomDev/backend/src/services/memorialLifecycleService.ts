import prisma from '../config/prisma';
import { POLICY } from '../config/policy';
import {
  calculateMemorialNoticeDate,
  calculateMemorialPurgeAt,
  calculateMemorialReconfirmDate,
} from '../utils/memorialLifecycle';
import type { MemorialNoticeKind } from './memorialNoticeService';

// docs 00-20 §5.2·§8.1-3 — 추모관 활성 만료 → 동결(+3년 파기 예정) · 만료 통지 · 파기 전 재확인 통지.
// prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 배치)만 부른다. 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다.
//
// 🔴 개설자가 닫은 추모관(closedAt)·운영자가 내린 추모관(hiddenAt)은 셋 다 대상이 아니다 —
//    닫은 추모관의 purgeAt(+30일)을 동결 +3년으로 덮어쓰면 파기가 3년 뒤로 밀리고, 내린 추모관은 자동 처리하지 않는다(§6.2).

const DAY_MS = 24 * 60 * 60 * 1000;

// ─ 동결 ─ expiresAt 도래 + frozenAt 없음 → frozenAt=지금, purgeAt=지금+3년
const freezeWhere = (now: Date) => ({
  expiresAt: { not: null, lte: now },
  frozenAt: null,
  closedAt: null,
  hiddenAt: null,
});

export type FreezeTarget = { id: string; expiresAt: Date };

export async function findFreezeTargets(now = new Date()): Promise<FreezeTarget[]> {
  const rows = await prisma.memorial.findMany({ where: freezeWhere(now), select: { id: true, expiresAt: true }, orderBy: { expiresAt: 'asc' } });
  return rows.map((r) => ({ id: r.id, expiresAt: r.expiresAt as Date }));
}

// 한 건씩, 대상 조건을 다시 걸어서 쓴다 — 목록을 만든 뒤 개설자가 연장·닫기를 했으면 0건이 갱신된다.
export async function freezeMemorial(id: string, now = new Date()): Promise<boolean> {
  const r = await prisma.memorial.updateMany({
    where: { id, ...freezeWhere(now) },
    data: { frozenAt: now, purgeAt: calculateMemorialPurgeAt(now) },
  });
  return r.count === 1;
}

// ─ 통지 대상 ─
export type NoticeDue = { id: string; kind: MemorialNoticeKind; dueAt: Date };

// 이번 사이클에 이미 시도했는지 — SENT가 있으면 끝. (RECONFIRM은 FAILED만 있으면 다시 시도한다 — 실행마다 시도 한 줄이 쌓인다.)
// 사이클의 시작: EXPIRY = 이번 활성 기간의 시작(expiresAt − 395일, 연장하면 새로 시작), RECONFIRM = purgeAt − 30일.
export async function findNoticeDue(now = new Date()): Promise<NoticeDue[]> {
  const due: NoticeDue[] = [];

  // 만료 통지 — 활성 중(만료 전)이고 통지일이 도래했고 이번 사이클에 SENT가 없는 것. 만료가 지난 뒤에는 보내지 않는다(이미 동결 대상).
  const active = await prisma.memorial.findMany({
    where: { frozenAt: null, closedAt: null, hiddenAt: null, expiresAt: { gt: now } },
    select: {
      id: true,
      expiresAt: true,
      deceasedDeathDate: true,
      createdAt: true,
      notices: { where: { kind: 'EXPIRY', result: 'SENT' }, select: { createdAt: true } },
    },
  });
  for (const m of active) {
    const expiresAt = m.expiresAt as Date;
    const noticeDate = calculateMemorialNoticeDate(m, expiresAt);
    if (noticeDate.getTime() > now.getTime()) continue;
    const cycleStart = expiresAt.getTime() - POLICY.memorial.activeDays * DAY_MS;
    if (m.notices.some((n) => n.createdAt.getTime() >= cycleStart)) continue;
    due.push({ id: m.id, kind: 'EXPIRY', dueAt: noticeDate });
  }

  // 재확인 통지 — 동결됐고(닫히지 않았고) purgeAt − 30일이 도래했고 이번 사이클에 SENT가 없는 것.
  const frozen = await prisma.memorial.findMany({
    where: { frozenAt: { not: null }, closedAt: null, hiddenAt: null, purgeAt: { not: null } },
    select: {
      id: true,
      purgeAt: true,
      notices: { where: { kind: 'RECONFIRM', result: 'SENT' }, select: { createdAt: true } },
    },
  });
  for (const m of frozen) {
    const dueAt = calculateMemorialReconfirmDate(m.purgeAt as Date);
    if (dueAt.getTime() > now.getTime()) continue;
    if (m.notices.some((n) => n.createdAt.getTime() >= dueAt.getTime())) continue;
    due.push({ id: m.id, kind: 'RECONFIRM', dueAt });
  }

  return due.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}
