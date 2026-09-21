import prisma from '../config/prisma';
import { purgeLetterRow } from './farewellPurgeService';

// docs 06-05 §5.6-8 ④ — 회원 탈퇴 유예(30일) 만료 계정 파기. 00-36 §4.3·M-3·§6 #2.
// prisma/destroy-farewell-media.ts(스크립트)만 이 파일을 부른다. 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다(§5.4-2-1).
//
// 🔴 User 행은 **지우지 않고 익명화(tombstone)** 한다. Memorial.createdByUserId가 00-20 동결·연장·폐쇄·신고 처리의
// 주체라 FK를 끊을 수 없다(SetNull 금지). 추모관·부고장은 탈퇴 후에도 남고(00-36 §6 #2), 추모관은 자기 수명(purgeAt)이
// 다하면 FK가 자연히 풀린다. 그래서 예전의 "추모관 보유 회원은 보류" 분기는 없다 — 모든 만료 회원이 파기 가능하다.
//
// 한 회원의 순서(고정):
//   1. 그 회원 엔딩노트의 편지 전부에 ①②를 먼저 — R2 원본 삭제 + 아카이브 원장(ArchivePurgeQueue) 기록 → 행 파기.
//      🔴 먼저 하지 않고 엔딩노트를 지우면 FarewellMessage가 Cascade로 사라져 mediaKey를 잃고 R2 원본이 고아로 남는다.
//   2. 한 트랜잭션에서 아래를 처리한다. 🔴 User를 지우지 않으므로 **Cascade가 더는 대신 지워주지 않는다** — 전부 명시한다.
//      지움 : 방명록(본인 글, 하드) · 시설 리뷰 · 디지털 정리 항목 · 엔딩노트(→Entry·Grant·잔여 편지 Cascade)
//             · 지정한 가족(→Grant Cascade) · SocialAccount(로그인 경로 차단)
//      철회 : 내가 수락한 쪽의 가족 지정(acceptedUserId) — 00-27 §9.2 철회와 같은 처리(DECLINED + Grant 전량 revoke).
//             acceptedUserId는 FK가 아니라 남겨두면 지정자 화면에 유령 가족이 남는다.
//      남김 : 추모관·추모 사진·부고장(00-36 §6 #2) · 헌화(익명 해시) · Lead·ConsultRequest(정산 증거)
//      비움 : User 행 — 아래 ANONYMIZED. 남는 것은 id·createdAt·purgedAt(+동의 시각·탈퇴 시각 이력)뿐.

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
  facilityReviews: number;
  cleanupItems: number;
  designations: number; // 내가 지정한 가족 — 삭제
  acceptedDesignations: number; // 내가 수락한 쪽 — 철회 처리
  // 🔵 아래는 지우지 않는다 — 보고용
  keeps: { memorials: number; memorialPhotos: number; obituaries: number };
};

// 익명화로 채우는 값. name은 NOT NULL 컬럼이라 null이 아니라 고정 문구다. email은 unique라 null이어야 재가입과 안 부딪힌다.
const ANONYMIZED = {
  email: null,
  name: '탈퇴한 회원',
  profileImage: null,
  refreshToken: null,
  contactPhone: null,
  phoneVerifiedAt: null,
  addressZonecode: null,
  addressRoad: null,
  addressDetail: null,
  contactTimePref: null,
  marketingAgreedAt: null,
  profileUpdatedAt: null,
} as const;

// 유예 만료 — 요청 시각이 있고 만료 시각이 지난 것. 로그인 복구("계속 이용")로 두 필드가 비워졌으면 걸리지 않는다.
// 🔴 purgedAt: null — 이미 파기한 계정을 다시 집지 않는다(deletion* 이력은 남겨두므로 이 조건이 없으면 매번 걸린다).
export async function findAccountExpired(): Promise<ExpiredAccount[]> {
  return prisma.user.findMany({
    where: { purgedAt: null, deletionRequestedAt: { not: null }, deletionScheduledAt: { lte: new Date() } },
    select: { id: true, deletionRequestedAt: true, deletionScheduledAt: true },
    orderBy: { deletionScheduledAt: 'asc' },
  });
}

// 서버 재검증 — 목록을 만든 뒤 실행하기까지 사이에 복구됐을 수 있다. 지우기 직전에 다시 본다.
export async function isStillAccountExpired(id: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id }, select: { purgedAt: true, deletionRequestedAt: true, deletionScheduledAt: true } });
  return !!u && !u.purgedAt && !!u.deletionRequestedAt && !!u.deletionScheduledAt && u.deletionScheduledAt <= new Date();
}

// 무엇이 몇 건인지 센다(dry-run 출력 겸 실행 전 범위 확인). 조회뿐이다.
export async function planAccount(user: ExpiredAccount): Promise<AccountPlan> {
  const userId = user.id;
  const [letters, lettersWithMedia, guestbookEntries, facilityReviews, cleanupItems, designations, acceptedDesignations, memorials, memorialPhotos, obituaries] =
    await prisma.$transaction([
      prisma.farewellMessage.count({ where: { note: { userId } } }),
      prisma.farewellMessage.count({ where: { note: { userId }, mediaKey: { not: null } } }),
      prisma.memorialGuestbook.count({ where: { userId } }),
      prisma.facilityReview.count({ where: { userId } }),
      prisma.digitalCleanupItem.count({ where: { userId } }),
      prisma.familyDesignation.count({ where: { userId } }),
      prisma.familyDesignation.count({ where: { acceptedUserId: userId, status: 'ACCEPTED' } }),
      prisma.memorial.count({ where: { createdByUserId: userId } }),
      prisma.memorialPhoto.count({ where: { uploadedByUserId: userId } }),
      prisma.obituary.count({ where: { createdByUserId: userId } }),
    ]);
  return {
    user,
    letters,
    lettersWithMedia,
    guestbookEntries,
    facilityReviews,
    cleanupItems,
    designations,
    acceptedDesignations,
    keeps: { memorials, memorialPhotos, obituaries },
  };
}

// 계정 하나를 파기(익명화)한다. 반환값은 이번에 아카이브 원장에 올라간 키(2단계 안내용).
// 🔴 복구된 계정·이미 파기된 계정에는 아무것도 하지 않는다(호출 측이 걸렀어도 여기서 다시 막는다).
export async function purgeAccount(user: ExpiredAccount): Promise<{ purged: boolean; keys: string[]; reason?: string }> {
  if (!(await isStillAccountExpired(user.id))) return { purged: false, keys: [], reason: '유예 만료가 아님(복구됐거나 이미 파기됨)' };

  // 1. 편지 ①② — 하나라도 실패하면 throw로 이 계정을 멈춘다(purgedAt이 안 찍히므로 다음 실행에서 이어진다).
  const keys: string[] = [];
  const letters = await prisma.farewellMessage.findMany({ where: { note: { userId: user.id } }, select: { id: true, mediaKey: true } });
  for (const row of letters) {
    const key = await purgeLetterRow(row);
    if (key) keys.push(key);
  }

  // 2. 한 트랜잭션 — 중간에 끊겨 일부만 지워진 상태를 만들지 않는다. purgedAt은 마지막에 찍어 "끝났다"의 표지가 된다.
  // 내가 수락한 쪽의 지정은 먼저 id를 뽑아 그 id의 Grant만 revoke한다(소유자 단위가 아니라 id 단위, db-safety.md §3).
  const accepted = await prisma.familyDesignation.findMany({ where: { acceptedUserId: user.id, status: 'ACCEPTED' }, select: { id: true } });
  const acceptedIds = accepted.map((d) => d.id);
  const now = new Date();
  await prisma.$transaction([
    prisma.endingNoteGrant.updateMany({ where: { designationId: { in: acceptedIds }, revokedAt: null }, data: { revokedAt: now } }),
    prisma.familyDesignation.updateMany({
      where: { id: { in: acceptedIds } },
      data: { status: 'DECLINED', declinedAt: now, acceptedUserId: null, inviteToken: null },
    }),
    prisma.memorialGuestbook.deleteMany({ where: { userId: user.id } }),
    prisma.facilityReview.deleteMany({ where: { userId: user.id } }),
    prisma.digitalCleanupItem.deleteMany({ where: { userId: user.id } }),
    prisma.familyDesignation.deleteMany({ where: { userId: user.id } }), // EndingNoteGrant Cascade
    prisma.endingNote.deleteMany({ where: { userId: user.id } }), // EndingNoteEntry·잔여 FarewellMessage Cascade
    prisma.socialAccount.deleteMany({ where: { userId: user.id } }), // 🔴 로그인 경로 차단
    prisma.user.update({ where: { id: user.id }, data: { ...ANONYMIZED, purgedAt: now } }),
  ]);
  return { purged: true, keys };
}
