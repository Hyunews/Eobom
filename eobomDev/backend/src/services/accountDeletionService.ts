import prisma from '../config/prisma';

// 회원 탈퇴 접수의 쓰기 부분 — 본인 탈퇴(`POST /api/me/deletion-request`)와 운영자 대리 접수(`POST /api/admin/users/:id/deletion-request`,
// 00-37 §4.1 "탈퇴 대리 접수")가 **같은 처리**를 부르도록 한 곳에 둔다. 🔴 유예는 항상 30일 — 줄이거나 건너뛰지 않는다.
// 🔴 런타임에서 아무것도 지우지 않는다: 시각 두 개를 찍고 추모관·부고장을 닫을 뿐이다(실삭제는 유예 뒤 사람이 승인하는 파기 배치).

export const GRACE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DeletionSchedule = { deletionRequestedAt: Date; deletionScheduledAt: Date };

/**
 * 탈퇴를 접수한다. 회원이 없으면(또는 이미 익명화됐으면) null.
 * 이미 접수된 계정이면 **다시 찍지 않고** 기존 값을 돌려준다(중복 클릭·재전송이 유예를 연장하지 않게) — created=false.
 */
export async function scheduleAccountDeletion(userId: string): Promise<(DeletionSchedule & { created: boolean }) | null> {
  // 🔴 purgedAt: null — 이미 익명화된 계정(유령)은 없는 회원으로 취급한다
  const user = await prisma.user.findFirst({
    where: { id: userId, purgedAt: null },
    select: { id: true, deletionRequestedAt: true, deletionScheduledAt: true },
  });
  if (!user) return null;
  if (user.deletionRequestedAt && user.deletionScheduledAt) {
    return { deletionRequestedAt: user.deletionRequestedAt, deletionScheduledAt: user.deletionScheduledAt, created: false };
  }

  const now = new Date();
  const scheduled = new Date(now.getTime() + GRACE_DAYS * DAY_MS);
  // 🔵 09-30 — 추모관·부고장도 탈퇴를 따라간다(00-20 §6.3-2). 같은 트랜잭션에서 함께 닫는다.
  // 🔴 closedAt에 **User.deletionRequestedAt과 같은 `now`** 를 넣는다 — 이 일치가 "탈퇴로 닫힌 것"의 표지다.
  // 복구 때 이 값이 같은 것만 되살린다(원래 본인이 닫아둔 것은 closedAt이 다른 시각이라 안 건드린다).
  // 이미 닫힌(closedAt != null) 행은 여기서 걸리지 않는다 — 기존 closedAt·purgeAt을 덮어쓰지 않는다.
  // User는 id 하나만 갱신한다(db-safety.md §3). 추모관·부고장은 `createdByUserId` + `closedAt: null` — 본인 것 중 열려 있는 것뿐이다.
  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: now, deletionScheduledAt: scheduled },
      select: { deletionRequestedAt: true, deletionScheduledAt: true },
    }),
    prisma.memorial.updateMany({ where: { createdByUserId: user.id, closedAt: null }, data: { closedAt: now, purgeAt: scheduled } }),
    prisma.obituary.updateMany({ where: { createdByUserId: user.id, closedAt: null }, data: { closedAt: now } }),
  ]);
  return { deletionRequestedAt: updated.deletionRequestedAt!, deletionScheduledAt: updated.deletionScheduledAt!, created: true };
}
