import prisma from '../config/prisma';

// docs 00-42 §5.2 ⑧ — 운영 기록(접속기록·운영자 감사·에러 기록)의 보관기간 파기.
// prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 파기 배치)만 부른다.
// 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다 — 새 스케줄러 금지. accountPurgeService와 같은 방식.
// 🔴 기록 표에는 앱이 추가만 한다(§5.2 ⑥) — 지우는 건 보관기간이 지난 행을 이 배치가 할 때뿐이다.
// 🔴 호출 전 db-safety.md 게이트(승인·백업·파일 확인)는 호출한 쪽(스크립트)의 몫이다 — 여기는 deleteMany를 바로 실행한다.

// 보관기간(일). 근거: 00-42 §5.1 · §9 #2(운영자 2년 확정, 10-01) · 처리방침 "접속기록 1년".
export const OPS_LOG_RETENTION_DAYS = { accessLog: 365, adminAuditLog: 730, errorLog: 90 } as const;

export type OpsLogCounts = { accessLog: number; adminAuditLog: number; errorLog: number };

const DAY_MS = 24 * 60 * 60 * 1000;
// 🔴 이 3개 표의 createdAt은 한국 시간(KST) 벽시계 값이다(schema.prisma AccessLog 주석) — 기준 시각도 +9시간으로 맞춘다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const cutoffOf = (days: number, now: Date) => new Date(now.getTime() + KST_OFFSET_MS - days * DAY_MS);

// 보관기간이 지난 행 수 — dry-run 출력용(조회뿐).
export async function countOpsLogExpired(now = new Date()): Promise<OpsLogCounts> {
  const [accessLog, adminAuditLog, errorLog] = await Promise.all([
    prisma.accessLog.count({ where: { createdAt: { lt: cutoffOf(OPS_LOG_RETENTION_DAYS.accessLog, now) } } }),
    prisma.adminAuditLog.count({ where: { createdAt: { lt: cutoffOf(OPS_LOG_RETENTION_DAYS.adminAuditLog, now) } } }),
    prisma.errorLog.count({ where: { createdAt: { lt: cutoffOf(OPS_LOG_RETENTION_DAYS.errorLog, now) } } }),
  ]);
  return { accessLog, adminAuditLog, errorLog };
}

// 실제 삭제 — 조건은 createdAt 하나뿐이고 소유자·주체 단위 조건이 없다(db-safety.md §3: where가 넓지 않다).
export async function purgeOpsLogExpired(now = new Date()): Promise<OpsLogCounts> {
  const [accessLog, adminAuditLog, errorLog] = await Promise.all([
    prisma.accessLog.deleteMany({ where: { createdAt: { lt: cutoffOf(OPS_LOG_RETENTION_DAYS.accessLog, now) } } }),
    prisma.adminAuditLog.deleteMany({ where: { createdAt: { lt: cutoffOf(OPS_LOG_RETENTION_DAYS.adminAuditLog, now) } } }),
    prisma.errorLog.deleteMany({ where: { createdAt: { lt: cutoffOf(OPS_LOG_RETENTION_DAYS.errorLog, now) } } }),
  ]);
  return { accessLog: accessLog.count, adminAuditLog: adminAuditLog.count, errorLog: errorLog.count };
}
