import prisma from '../config/prisma';
import { purgeLetterRow } from './farewellPurgeService';

// docs 06-05 §5.6-8 ④ — 회원 탈퇴 유예(30일) 만료 계정 파기. 00-36 §4.3·M-3.
// prisma/destroy-farewell-media.ts(스크립트)만 이 파일을 부른다. 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다(§5.4-2-1).
//
// 한 회원의 순서(고정):
//   1. 그 회원 엔딩노트의 편지 전부에 ①②를 먼저 — R2 원본 삭제 + 아카이브 원장(ArchivePurgeQueue) 기록 → 행 파기.
//      🔴 이걸 건너뛰고 User를 지우면 EndingNote→FarewellMessage가 Cascade로 같이 사라져 mediaKey를 잃고,
//      R2 원본이 고아로 남는다(§5.6-8-1-1 "지울 게 있는지조차 모르는" 상태).
//   2. 한 트랜잭션에서 방명록·부고장·디지털 정리 항목을 지우고 User를 지운다. 나머지는 스키마의 onDelete가 처리한다:
//      Cascade — SocialAccount·FacilityReview·FamilyDesignation(→EndingNoteGrant)·EndingNote(→Entry)
//      SetNull — Lead·ConsultRequest(정산 증거라 건은 남는다)·MemorialTribute
//
// 🔴 추모관은 대상이 아니다(00-20 보존정책 + 타인의 방명록, 00-36 §6 #2). 그런데 Memorial.createdByUserId·
// MemorialPhoto.uploadedByUserId는 onDelete 없는 필수 FK(RESTRICT)라 그 회원 행을 지우면 FK 위반이 난다.
// → 스키마·스펙 결정이 나기 전까지 이런 회원은 **파기하지 않고 보류로 보고한다**(blockedBy). 조용히 지우지도, 조용히 건너뛰지도 않는다.

export type ExpiredAccount = {
  id: string;
  deletionRequestedAt: Date | null;
  deletionScheduledAt: Date | null;
};

export type AccountPlan = {
  user: ExpiredAccount;
  letters: number; // 편지 전체(삭제됨 표시분 포함) — ①② 처리 대상
  lettersWithMedia: number; // 그중 R2 원본이 남아 있는 것
  guestbookEntries: number;
  obituaries: number;
  cleanupItems: number;
  blockedBy: { memorials: number; memorialPhotos: number } | null; // null이면 파기 가능
};

// 유예 만료 — 요청 시각이 있고 만료 시각이 지난 것. 로그인 복구("계속 이용")로 두 필드가 비워졌으면 걸리지 않는다.
export async function findAccountExpired(): Promise<ExpiredAccount[]> {
  return prisma.user.findMany({
    where: { deletionRequestedAt: { not: null }, deletionScheduledAt: { lte: new Date() } },
    select: { id: true, deletionRequestedAt: true, deletionScheduledAt: true },
    orderBy: { deletionScheduledAt: 'asc' },
  });
}

// 서버 재검증 — 목록을 만든 뒤 실행하기까지 사이에 복구됐을 수 있다. 지우기 직전에 다시 본다.
export async function isStillAccountExpired(id: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id }, select: { deletionRequestedAt: true, deletionScheduledAt: true } });
  return !!u && !!u.deletionRequestedAt && !!u.deletionScheduledAt && u.deletionScheduledAt <= new Date();
}

// 무엇이 몇 건인지 센다(dry-run 출력 겸 실행 전 범위 확인). 조회뿐이다.
export async function planAccount(user: ExpiredAccount): Promise<AccountPlan> {
  const userId = user.id;
  const [letters, lettersWithMedia, guestbookEntries, obituaries, cleanupItems, memorials, memorialPhotos] = await prisma.$transaction([
    prisma.farewellMessage.count({ where: { note: { userId } } }),
    prisma.farewellMessage.count({ where: { note: { userId }, mediaKey: { not: null } } }),
    prisma.memorialGuestbook.count({ where: { userId } }),
    prisma.obituary.count({ where: { createdByUserId: userId } }),
    prisma.digitalCleanupItem.count({ where: { userId } }),
    prisma.memorial.count({ where: { createdByUserId: userId } }),
    prisma.memorialPhoto.count({ where: { uploadedByUserId: userId } }),
  ]);
  return {
    user,
    letters,
    lettersWithMedia,
    guestbookEntries,
    obituaries,
    cleanupItems,
    blockedBy: memorials > 0 || memorialPhotos > 0 ? { memorials, memorialPhotos } : null,
  };
}

// 계정 하나를 파기한다. 반환값은 이번에 아카이브 원장에 올라간 키(2단계 안내용).
// 🔴 보류 대상·복구된 계정에는 아무것도 하지 않는다(호출 측이 걸렀어도 여기서 다시 막는다).
export async function purgeAccount(user: ExpiredAccount): Promise<{ purged: boolean; keys: string[]; reason?: string }> {
  if (!(await isStillAccountExpired(user.id))) return { purged: false, keys: [], reason: '유예 만료가 아님(복구됨)' };
  const plan = await planAccount(user);
  if (plan.blockedBy) return { purged: false, keys: [], reason: '추모관 소유 — FK 보류' };

  // 1. 편지 ①② — 하나라도 실패하면 throw로 이 계정을 멈춘다(User를 지우지 않으므로 다음 실행에서 이어진다).
  const keys: string[] = [];
  const letters = await prisma.farewellMessage.findMany({ where: { note: { userId: user.id } }, select: { id: true, mediaKey: true } });
  for (const row of letters) {
    const key = await purgeLetterRow(row);
    if (key) keys.push(key);
  }

  // 2. 한 트랜잭션 — 중간에 끊겨 User만 남거나 일부만 지워진 상태를 만들지 않는다.
  await prisma.$transaction([
    prisma.memorialGuestbook.deleteMany({ where: { userId: user.id } }),
    prisma.obituary.deleteMany({ where: { createdByUserId: user.id } }), // ObituaryMourner는 Cascade
    prisma.digitalCleanupItem.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return { purged: true, keys };
}
