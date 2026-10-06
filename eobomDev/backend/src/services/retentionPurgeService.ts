import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { POLICY } from '../config/policy';
import { maskPhone, normalizePhone } from '../utils/phone';

// 개인정보처리방침(docs 00-19) 제4조·제8조의 보관기간 파기·마스킹 — 소셜 연동 해제 기록 · 삭제된 방명록 · 문의·상담 신청자 원본.
// prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 배치)만 부른다. 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다 — opsLogPurgeService와 같은 방식.
// 🔴 호출 전 db-safety.md 게이트(승인·백업·파일 확인)는 호출한 쪽(스크립트)의 몫이다 — 여기는 deleteMany·update를 바로 실행한다.
// 보관기간 숫자는 config/policy.ts `retention`이 정본이다.

const DAY_MS = 24 * 60 * 60 * 1000;

const minusYears = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setUTCFullYear(r.getUTCFullYear() - n);
  return r;
};
const minusMonths = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() - n);
  return r;
};

// ─ 소셜 연동 해제 기록(00-19 제4조 "연동 해제 기록을 남긴 후 1년 경과 시 파기") ─
const socialWhere = (now: Date) => ({ unlinkedAt: { not: null, lte: minusYears(now, POLICY.retention.socialUnlinkedYears) } });

export const countSocialUnlinkedExpired = (now = new Date()) => prisma.socialAccount.count({ where: socialWhere(now) });

// 🔴 deleteMany — 조건은 unlinkedAt 하나(연동 중인 행은 unlinkedAt이 null이라 걸리지 않는다). 연동 중인 계정을 지우면 로그인이 끊긴다.
export async function purgeSocialUnlinkedExpired(now = new Date()): Promise<number> {
  return (await prisma.socialAccount.deleteMany({ where: socialWhere(now) })).count;
}

// ─ 삭제된 방명록(00-19 제4조 "삭제된 게시물 … 3개월 후 완전 삭제") ─
// 🔴 운영자가 내린 글(hiddenAt)은 대상이 아니다 — 증거로 남긴다(00-20 §6.2).
const guestbookWhere = (now: Date) => {
  const cutoff = minusMonths(now, POLICY.retention.deletedGuestbookMonths);
  return {
    hiddenAt: null,
    OR: [{ deletedByOwnerAt: { not: null, lte: cutoff } }, { deletedByAuthorAt: { not: null, lte: cutoff } }],
  };
};

export const countGuestbookDeletedExpired = (now = new Date()) => prisma.memorialGuestbook.count({ where: guestbookWhere(now) });

export async function purgeGuestbookDeletedExpired(now = new Date()): Promise<number> {
  return (await prisma.memorialGuestbook.deleteMany({ where: guestbookWhere(now) })).count;
}

// ─ DB 원본 마스킹(00-19 제4조·제8조 "끝난 날부터 90일이 지나면 … 원본도 마스킹") ─
// 대상: 업체 문의 Lead(RESPONDED·CONVERTED·LOST) · 상담 신청 ConsultRequest(COMPLETED·CANCELLED·INVALID) 중 maskedAt이 비어 있는 것.
// 이름·연락처만 가린 값으로 덮어쓰고 maskedAt을 찍는다. 접수번호·일시·대상·금액·payload·content(거래 근거)는 건드리지 않는다.
export const LEAD_ENDED_STATUSES = ['RESPONDED', 'CONVERTED', 'LOST'] as const;
export const CONSULT_ENDED_STATUSES = ['COMPLETED', 'CANCELLED', 'INVALID'] as const;

// 이름 마스킹 — 홍길동 → 홍*동, 이순 → 이*, 한 글자는 *. (leadController의 표시용 maskName과 같은 규칙이되 한 글자도 가린다.)
export const maskApplicantName = (name: string): string => {
  const n = name.trim();
  if (n.length <= 1) return '*';
  if (n.length === 2) return `${n[0]}*`;
  return `${n[0]}${'*'.repeat(n.length - 2)}${n[n.length - 1]}`;
};

// 연락처 마스킹 — 숫자만 뽑아 maskPhone 규칙(010-****-5678)을 쓴다. 규칙 밖 길이는 원본이 남지 않게 고정 표기.
export const maskApplicantPhone = (raw: string): string => {
  const digits = normalizePhone(raw);
  const masked = maskPhone(digits);
  return !digits || masked === digits ? '****' : masked;
};

// "끝난 시각" — 상태 이력(statusHistory)에서 현재 상태로 들어간 마지막 기록의 at. 같은 상태가 여러 번이면 가장 늦은 것(되돌렸다 다시 끝난 경우).
// 이력에 현재 상태 기록이 없거나 시각을 못 읽으면 updatedAt으로 대신한다(이력이 비어 있는 옛 행 — 마스킹이 앞당겨지지 않는 쪽).
// 🔴 updatedAt은 "끝난 뒤 다른 칸을 고쳐도" 늦춰진다 — 그래서 이력이 우선이고 updatedAt은 대체값일 뿐이다.
export const getEndedAt = (row: { status: string; statusHistory: Prisma.JsonValue; updatedAt: Date }): Date => {
  const history = Array.isArray(row.statusHistory) ? row.statusHistory : [];
  let latest: number | null = null;
  for (const h of history) {
    if (!h || typeof h !== 'object' || Array.isArray(h)) continue;
    const e = h as { status?: unknown; at?: unknown };
    if (e.status !== row.status || typeof e.at !== 'string') continue;
    const t = new Date(e.at).getTime();
    if (!Number.isNaN(t) && (latest === null || t > latest)) latest = t;
  }
  return latest === null ? row.updatedAt : new Date(latest);
};

export type MaskTarget = { id: string; applicantName: string | null; applicantPhone: string | null; endedAt: Date };

const maskCutoff = (now: Date) => new Date(now.getTime() - POLICY.retention.contactMaskAfterEndDays * DAY_MS);

export async function findLeadMaskTargets(now = new Date()): Promise<MaskTarget[]> {
  const rows = await prisma.lead.findMany({
    where: { status: { in: [...LEAD_ENDED_STATUSES] }, maskedAt: null },
    select: { id: true, status: true, statusHistory: true, updatedAt: true, applicantName: true, applicantPhone: true },
  });
  return rows
    .map((r) => ({ id: r.id, applicantName: r.applicantName, applicantPhone: r.applicantPhone, endedAt: getEndedAt(r) }))
    .filter((r) => r.endedAt.getTime() <= maskCutoff(now).getTime());
}

export async function findConsultMaskTargets(now = new Date()): Promise<MaskTarget[]> {
  const rows = await prisma.consultRequest.findMany({
    where: { status: { in: [...CONSULT_ENDED_STATUSES] }, maskedAt: null },
    select: { id: true, status: true, statusHistory: true, updatedAt: true, applicantName: true, applicantPhone: true },
  });
  return rows
    .map((r) => ({ id: r.id, applicantName: r.applicantName, applicantPhone: r.applicantPhone, endedAt: getEndedAt(r) }))
    .filter((r) => r.endedAt.getTime() <= maskCutoff(now).getTime());
}

const maskedValues = (t: MaskTarget, now: Date) => ({
  applicantName: t.applicantName ? maskApplicantName(t.applicantName) : t.applicantName,
  applicantPhone: t.applicantPhone ? maskApplicantPhone(t.applicantPhone) : t.applicantPhone,
  maskedAt: now,
});

// 한 건씩, maskedAt이 비어 있는 행에만 쓴다(where에 maskedAt: null) — 같은 건을 두 번 덮어쓰지 않는다. 처리한 건수를 돌려준다.
export async function maskLeads(targets: MaskTarget[], now = new Date()): Promise<number> {
  let done = 0;
  for (const t of targets) {
    done += (await prisma.lead.updateMany({ where: { id: t.id, maskedAt: null }, data: maskedValues(t, now) })).count;
  }
  return done;
}

export async function maskConsultRequests(targets: MaskTarget[], now = new Date()): Promise<number> {
  let done = 0;
  for (const t of targets) {
    done += (await prisma.consultRequest.updateMany({ where: { id: t.id, maskedAt: null }, data: maskedValues(t, now) })).count;
  }
  return done;
}

// ─ 실행 이력(00-19 제8조 "실행 이력을 기록합니다") ─ 건수만 남긴다.
export type PurgeStep =
  | 'MEMORIAL_FREEZE'
  | 'MEMORIAL_PURGE'
  | 'SOCIAL_UNLINKED'
  | 'GUESTBOOK_DELETED'
  | 'CONTACT_MASK_LEAD'
  | 'CONTACT_MASK_CONSULT';

export const recordPurgeRun = (step: PurgeStep, affected: number) => prisma.purgeRunLog.create({ data: { step, affected } });
