import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { calculateMemorialExpiresAt, calculateMemorialNoticeDate } from '../utils/memorialLifecycle';

// docs 00-20 §8.1-4 — 추모관 연장(활성 복귀). 효과: expiresAt = 지금 + 395일 · frozenAt = null · purgeAt = null.
// 동결 전(만료 통지)·동결 후(파기 재확인) 같은 동작이다. 경로는 둘: ① 통지 링크(토큰, 로그인 불필요) ② 내 추모관 화면(로그인, 개설자 본인).
// 🔴 링크를 여는 것(GET)은 확인 화면용 조회뿐이다 — 연장은 POST만 한다(메일 보안 검사기가 링크를 미리 열어도 저절로 연장되지 않게).
// 🔴 이 서비스는 요청 처리용 런타임 코드다(파기 스크립트가 아니다) — 지우지는 않고 expiresAt·frozenAt·purgeAt만 되돌린다.

const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_GRACE_DAYS = 30; // purgeAt이 아직 없을 때(동결 전) 토큰 유효 = expiresAt + 30일(§8.1-4 ①)

export type ExtendFailCode = 'INVALID' | 'EXPIRED' | 'CANNOT_EXTEND';
export type ExtendFailure = { ok: false; code: ExtendFailCode; message: string };

const FAIL = {
  INVALID: { ok: false, code: 'INVALID', message: '유효하지 않은 링크입니다. 이미 사용했거나 주소가 잘못되었을 수 있습니다.' },
  EXPIRED: { ok: false, code: 'EXPIRED', message: '링크 사용 기간이 지났습니다.' },
  CLOSED: { ok: false, code: 'CANNOT_EXTEND', message: '이 추모관은 연장할 수 없습니다. 개설자가 닫았거나 탈퇴 처리된 추모관입니다.' },
  HIDDEN: { ok: false, code: 'CANNOT_EXTEND', message: '이 추모관은 연장할 수 없습니다. 운영자가 비공개 처리한 추모관입니다.' },
  NOT_YET: { ok: false, code: 'CANNOT_EXTEND', message: '아직 연장할 수 있는 기간이 아닙니다.' },
} as const satisfies Record<string, ExtendFailure>;

// 토큰 — 원문은 통지 본문에만 두고 DB엔 sha256 해시만 저장한다.
export const generateExtendToken = (): { token: string; tokenHash: string } => {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, tokenHash: hashExtendToken(token) };
};
export const hashExtendToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

type MemorialState = {
  closedAt: Date | null;
  hiddenAt: Date | null;
};

// 연장 가능 여부 — 닫힘(탈퇴 유예 포함)·운영자 내림이면 거부(§8.1-4 "할 수 없는 경우").
export const getExtendBlock = (m: MemorialState): ExtendFailure | null => {
  if (m.closedAt) return FAIL.CLOSED;
  if (m.hiddenAt) return FAIL.HIDDEN;
  return null;
};

type MemorialExtendWindowState = MemorialState & {
  frozenAt: Date | null;
  expiresAt: Date | null;
  deceasedDeathDate: Date | null;
  createdAt: Date;
};

// 로그인 경로의 연장 가능 시점(§8.1-4 ②-가) — 닫힘·내림이 아니고, 동결됐거나 만료 통지 시점(§8.1-2 계산값)이 지났을 때.
// 목록(canExtend)과 연장 API가 이 함수 하나를 쓴다. expiresAt이 없으면(정상 데이터가 아님) 통지 시점을 못 구하므로 동결일 때만 허용한다.
export const canExtendNow = (m: MemorialExtendWindowState, now = new Date()): boolean => {
  if (getExtendBlock(m)) return false;
  if (m.frozenAt) return true;
  if (!m.expiresAt) return false;
  return now.getTime() >= calculateMemorialNoticeDate(m, m.expiresAt).getTime();
};

// 토큰 유효기간 끝 = purgeAt(없으면 expiresAt + 30일). 둘 다 없으면(정상 데이터가 아님) 지금 기준으로 이미 지난 것으로 본다.
export const getTokenDeadline = (m: { purgeAt: Date | null; expiresAt: Date | null }): Date | null => {
  if (m.purgeAt) return m.purgeAt;
  if (m.expiresAt) return new Date(m.expiresAt.getTime() + TOKEN_GRACE_DAYS * DAY_MS);
  return null;
};

export type ExtendPreview = {
  ok: true;
  deceasedName: string;
  frozen: boolean; // 동결 상태면 purgeAt이 "삭제 예정일", 아니면 expiresAt이 "보존 기간 종료일"
  expiresAt: Date | null;
  purgeAt: Date | null;
};

const tokenRowSelect = {
  id: true,
  kind: true,
  usedAt: true,
  memorial: {
    select: { id: true, deceasedName: true, expiresAt: true, frozenAt: true, purgeAt: true, closedAt: true, hiddenAt: true },
  },
} as const;

// GET — 확인 화면용 조회. 아무것도 바꾸지 않는다.
export async function previewExtendByToken(token: string, now = new Date()): Promise<ExtendPreview | ExtendFailure> {
  const row = await prisma.memorialNotice.findUnique({ where: { tokenHash: hashExtendToken(token) }, select: tokenRowSelect });
  if (!row || row.usedAt) return FAIL.INVALID;
  const deadline = getTokenDeadline(row.memorial);
  if (!deadline || deadline.getTime() < now.getTime()) return FAIL.EXPIRED;
  const block = getExtendBlock(row.memorial);
  if (block) return block;
  const m = row.memorial;
  return { ok: true, deceasedName: m.deceasedName, frozen: m.frozenAt !== null, expiresAt: m.expiresAt, purgeAt: m.purgeAt };
}

export type ExtendDone = { ok: true; expiresAt: Date };

// 연장 본체 — 대상 조건(닫히지 않음·내려지지 않음)을 다시 걸어서 쓴다. 0건이면 그 사이에 닫힌 것.
const applyExtend = async (
  tx: Prisma.TransactionClient,
  memorialId: string,
  via: 'LINK' | 'LOGIN',
  now: Date,
): Promise<ExtendDone | ExtendFailure> => {
  const expiresAt = calculateMemorialExpiresAt(now);
  const r = await tx.memorial.updateMany({
    where: { id: memorialId, closedAt: null, hiddenAt: null },
    data: { expiresAt, frozenAt: null, purgeAt: null },
  });
  if (r.count !== 1) return FAIL.CLOSED;
  // 기록 — 경로(LINK·LOGIN)와 시각. 통지 실패로 묶여 있던 건도 연장되면 purgeAt이 비워져 일반 경로로 돌아간다.
  await tx.memorialNotice.create({ data: { memorialId, kind: 'EXTEND', channel: via, result: 'DONE', createdAt: now } });
  return { ok: true, expiresAt };
};

// POST — 통지 링크로 연장. 토큰은 1회용: usedAt을 먼저 채우고(조건부 갱신), 연장이 실패하면 함께 되돌린다.
export async function extendByToken(token: string, now = new Date()): Promise<ExtendDone | ExtendFailure> {
  const preview = await previewExtendByToken(token, now);
  if (!preview.ok) return preview;
  const tokenHash = hashExtendToken(token);

  class Rollback extends Error {
    constructor(public readonly failure: ExtendFailure) {
      super(failure.code);
    }
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const used = await tx.memorialNotice.updateMany({ where: { tokenHash, usedAt: null }, data: { usedAt: now } });
      if (used.count !== 1) throw new Rollback(FAIL.INVALID); // 동시에 두 번 눌렀다
      const notice = await tx.memorialNotice.findUniqueOrThrow({ where: { tokenHash }, select: { memorialId: true } });
      const done = await applyExtend(tx, notice.memorialId, 'LINK', now);
      if (!done.ok) throw new Rollback(done);
      return done;
    });
  } catch (e) {
    if (e instanceof Rollback) return e.failure;
    throw e;
  }
}

// POST — 내 추모관 화면에서 연장(개설자 본인). 소유 확인은 호출한 쪽이 인증으로 넘긴 userId로 한다.
export async function extendByOwner(memorialId: string, userId: string, now = new Date()): Promise<ExtendDone | ExtendFailure | { ok: false; code: 'NOT_FOUND'; message: string }> {
  const m = await prisma.memorial.findFirst({ where: { id: memorialId, createdByUserId: userId }, select: { closedAt: true, hiddenAt: true, frozenAt: true, expiresAt: true, deceasedDeathDate: true, createdAt: true } });
  if (!m) return { ok: false, code: 'NOT_FOUND', message: '추모관을 찾을 수 없습니다.' };
  const block = getExtendBlock(m);
  if (block) return block;
  if (!canExtendNow(m, now)) return FAIL.NOT_YET;
  return prisma.$transaction((tx) => applyExtend(tx, memorialId, 'LOGIN', now));
}
