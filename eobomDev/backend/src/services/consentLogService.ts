import type { Prisma } from '@prisma/client';
import { POLICY } from '../config/policy';

// docs 00-42 §5.3 D — 동의 이력. User의 동의 칸(termsAgreedAt·privacyAgreedAt·marketingAgreedAt·sttDataAgreedAt)이 바뀌는 곳은
// 전부 이 파일의 함수로 User 변경과 **같은 트랜잭션**에 한 줄을 남긴다(동의 칸만 바뀌고 이력이 없는 상태를 만들지 않는다).
// 🔴 추가만 한다 — 이 파일에는 update·delete가 없다. 보관기간이 지난 행은 retentionPurgeService가 지운다.
// 🔴 소급 행을 만들지 않는다 — 이전 회원은 User의 현재 값 칸이 증빙이다.

export type ConsentKind = 'TERMS' | 'PRIVACY' | 'MARKETING' | 'STT_DATA';
export type ConsentAction = 'AGREE' | 'WITHDRAW';
export type ConsentSource = 'SIGNUP' | 'RECONSENT' | 'MYPAGE' | 'STT_UPLOAD';

export type ConsentEvent = { kind: ConsentKind; action: ConsentAction };

// 가입 — 필수 2개는 항상, 마케팅은 체크했을 때만 AGREE 한 줄(체크 안 한 마케팅은 "철회"가 아니라 애초에 동의 없음이라 행을 만들지 않는다).
export const signupConsentEvents = (marketing: boolean): ConsentEvent[] => [
  { kind: 'TERMS', action: 'AGREE' },
  { kind: 'PRIVACY', action: 'AGREE' },
  ...(marketing ? [{ kind: 'MARKETING' as const, action: 'AGREE' as const }] : []),
];

// 트랜잭션 클라이언트(tx)나 기본 클라이언트 어느 쪽이든 받는다 — 호출하는 쪽이 User 변경과 같은 트랜잭션을 만든다.
const fieldsOf = (e: ConsentEvent, source: ConsentSource) => ({ kind: e.kind, action: e.action, version: POLICY.consentVersion, source });

export const consentLogRows = (userId: string, events: ConsentEvent[], source: ConsentSource): Prisma.ConsentLogCreateManyInput[] =>
  events.map((e) => ({ userId, ...fieldsOf(e, source) }));

export const writeConsentLogs = (
  db: Pick<Prisma.TransactionClient, 'consentLog'>,
  userId: string,
  events: ConsentEvent[],
  source: ConsentSource,
) => (events.length ? db.consentLog.createMany({ data: consentLogRows(userId, events, source) }) : Promise.resolve({ count: 0 }));

// 가입 때 User.create의 중첩 쓰기용 — 같은 쿼리 안에서 만들어지므로 자동으로 한 트랜잭션이다.
export const signupConsentNested = (marketing: boolean) => ({
  create: signupConsentEvents(marketing).map((e) => fieldsOf(e, 'SIGNUP')),
});
