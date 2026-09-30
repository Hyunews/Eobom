import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';

// 회원 탈퇴 — 00-36 §4.3·M-3(#10·#11), 06-05 §5.4-2·§5.4-2-1·§5.6-8 ④.
//
// 🔴 **런타임에서 아무것도 지우지 않는다.** 이 컨트롤러가 하는 쓰기는 `User.deletionRequestedAt`·
// `deletionScheduledAt` 두 시각을 찍고 비우는 것뿐이다(소프트 삭제 = 시각 필드 방식, 06-05 §5.4-2-1). 행·파일·
// 스토리지 객체는 그대로다 — 실삭제는 유예(30일) 뒤 사람이 승인하는 파기 배치(별도 스크립트, §5.6-8 ④)만 한다.
// 🔴 **되살리기는 자동이 아니다.** 유예 중 로그인해도 두 필드는 그대로이고, 사용자가 복구 안내에서
// "계속 이용"을 눌러 `DELETE /api/me/deletion-request`를 호출해야만 비운다(모르고 로그인해서 되살아나면 안 된다).

const GRACE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const FROZEN_PURGE_YEARS = 3; // 00-20 §5.2-1 — 동결 후 파기까지. 복구 시 동결 추모관의 purgeAt 복원용

// 탈퇴 미리보기 (`GET /api/me/deletion-preview`) — ① "무엇이 지워지는가"를 **건수만** 보여준다.
// 🔴 본문 금지(00-36 §4.2와 같은 규칙) — 편지·엔딩노트·방명록의 내용·수신자 실명은 절대 내리지 않는다.
// 🔴 **남는 것을 반드시 함께 알린다**: 추모관(00-20 보존정책 + 타인의 방명록, §6 #2)·이미 접수된 상담/문의
// (계약·정산 증거 — `Lead.userId`·`ConsultRequest.userId`는 SetNull이라 연결만 끊기고 건은 남는다).
// 🔴 왕복 1회 — `$transaction`으로 묶는다(Render↔DB 왕복 ~1.3초, summaryController와 같은 이유).
export const getDeletionPreview = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }
  const userId = decoded.id;

  try {
    const [
      user,
      letters,
      voices,
      endingNoteSections,
      guestbookEntries,
      facilityReviews,
      familyDesignations,
      obituaries,
      memorials,
      leads,
      consultRequests,
    ] = await prisma.$transaction([
      prisma.user.findFirst({ where: { id: userId, purgedAt: null }, select: { deletionRequestedAt: true, deletionScheduledAt: true } }),
      // 지워지는 것
      prisma.farewellMessage.count({ where: { note: { userId }, deletedAt: null } }),
      prisma.farewellMessage.count({ where: { note: { userId }, deletedAt: null, mediaKey: { not: null }, mediaDeletedAt: null } }),
      prisma.endingNoteEntry.count({ where: { note: { userId } } }),
      prisma.memorialGuestbook.count({ where: { userId, deletedByOwnerAt: null, hiddenAt: null, deletedByAuthorAt: null } }),
      prisma.facilityReview.count({ where: { userId } }),
      prisma.familyDesignation.count({ where: { userId } }),
      // 🔵 09-30 — 탈퇴 즉시 닫히는 것(열려 있는 것만 센다. 이미 닫아둔 것은 이번 탈퇴로 달라지는 게 없다)
      prisma.obituary.count({ where: { createdByUserId: userId, closedAt: null } }),
      prisma.memorial.count({ where: { createdByUserId: userId, closedAt: null } }),
      // 남는 것
      prisma.lead.count({ where: { userId, type: { not: 'CALL' } } }),
      prisma.consultRequest.count({ where: { userId } }),
    ]);

    if (!user) {
      return res.status(404).json({ status: 'error', message: '회원 정보를 찾을 수 없습니다.' });
    }

    return res.json({
      status: 'success',
      data: {
        graceDays: GRACE_DAYS,
        deletionRequestedAt: user.deletionRequestedAt,
        deletionScheduledAt: user.deletionScheduledAt,
        willDelete: {
          letters, // 유족 메시지(편지)
          voices, // 그중 음성 첨부가 있는 것
          endingNoteSections,
          guestbookEntries,
          facilityReviews,
          familyDesignations,
        },
        // 🔵 09-30 — 추모관·부고장은 탈퇴를 따라간다(00-20 §6.3-2). 남는 것이 아니라 **별도 칸**이다.
        willClose: {
          memorials, // 즉시 비공개, 30일 뒤 파기. 30일 안에 "계속 이용"이면 되살아난다
          obituaries, // 즉시 닫힘, 계정 파기 때 삭제. "계속 이용"이면 되살아난다
        },
        willRemain: {
          consultations: leads + consultRequests, // 이미 접수된 상담·문의
        },
      },
    });
  } catch (error) {
    console.error('탈퇴 미리보기 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};

// 탈퇴 요청 (`POST /api/me/deletion-request`) — 시각 두 개를 찍는다(요청 시각 + 30일 = 유예 만료).
// 이미 요청된 계정이면 **다시 찍지 않고** 기존 값을 돌려준다(중복 클릭·재전송이 유예를 연장하지 않게).
export const requestAccountDeletion = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    // 🔴 purgedAt: null — 이미 익명화된 계정(유령)은 없는 회원으로 취급한다
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, purgedAt: null },
      select: { id: true, deletionRequestedAt: true, deletionScheduledAt: true },
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: '회원 정보를 찾을 수 없습니다.' });
    }
    if (user.deletionRequestedAt && user.deletionScheduledAt) {
      return res.json({
        status: 'success',
        data: { deletionRequestedAt: user.deletionRequestedAt, deletionScheduledAt: user.deletionScheduledAt },
      });
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
    return res.status(201).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('탈퇴 요청 실패:', error);
    return res.status(500).json({ status: 'error', message: '탈퇴 요청 처리 중 오류가 발생했습니다.' });
  }
};

// 탈퇴 취소 = 계정 복구 (`DELETE /api/me/deletion-request`) — 두 시각을 비운다. 로그인된 본인만.
// 프런트는 유예 중 로그인 직후 복구 안내에서 사용자가 "계속 이용"을 눌렀을 때만 호출한다.
export const cancelAccountDeletion = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const user = await prisma.user.findFirst({ where: { id: decoded.id, purgedAt: null }, select: { id: true, deletionRequestedAt: true } });
    if (!user) {
      return res.status(404).json({ status: 'error', message: '회원 정보를 찾을 수 없습니다.' });
    }
    if (!user.deletionRequestedAt) {
      return res.json({ status: 'success', data: { deletionRequestedAt: null, deletionScheduledAt: null } });
    }

    // 🔴 탈퇴로 닫힌 것만 되살린다 — closedAt이 deletionRequestedAt과 **정확히 같은** 행. 원래 본인이 닫아둔 추모관·부고장은
    // closedAt이 다른 시각이라 걸리지 않는다. purgeAt은 그 추모관이 동결(frozenAt)돼 있었다면 동결 +3년으로 되돌린다(00-20 §5.2-1).
    const requestedAt = user.deletionRequestedAt;
    const closedByWithdrawal = await prisma.memorial.findMany({
      where: { createdByUserId: user.id, closedAt: requestedAt },
      select: { id: true, frozenAt: true },
    });
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { deletionRequestedAt: null, deletionScheduledAt: null },
      }),
      // 동결 안 된 것은 한 번에, 동결된 것은 id별로 purgeAt을 복원한다
      prisma.memorial.updateMany({
        where: { id: { in: closedByWithdrawal.filter((m) => !m.frozenAt).map((m) => m.id) } },
        data: { closedAt: null, purgeAt: null },
      }),
      ...closedByWithdrawal
        .filter((m) => m.frozenAt)
        .map((m) => {
          const purgeAt = new Date(m.frozenAt as Date);
          purgeAt.setFullYear(purgeAt.getFullYear() + FROZEN_PURGE_YEARS);
          return prisma.memorial.update({ where: { id: m.id }, data: { closedAt: null, purgeAt } });
        }),
      prisma.obituary.updateMany({ where: { createdByUserId: user.id, closedAt: requestedAt }, data: { closedAt: null } }),
    ]);
    return res.json({ status: 'success', data: { deletionRequestedAt: null, deletionScheduledAt: null } });
  } catch (error) {
    console.error('탈퇴 취소 실패:', error);
    return res.status(500).json({ status: 'error', message: '탈퇴 취소 처리 중 오류가 발생했습니다.' });
  }
};
