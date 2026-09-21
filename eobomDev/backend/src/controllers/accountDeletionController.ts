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
      // 남는 것
      prisma.obituary.count({ where: { createdByUserId: userId } }),
      prisma.memorial.count({ where: { createdByUserId: userId } }),
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
        willRemain: {
          obituaries, // 부고장 — 추모관과 1:1(봉투/목적지, 07-03 §4.1 E안)이라 함께 남긴다(00-36 §6 #2)
          memorials, // 추모관 — 함께 지워지지 않는다(닫기는 따로)
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
    // where는 id 하나 — 이 행 하나만 갱신한다(db-safety.md §3: 소유자 단위 updateMany 금지)
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: now, deletionScheduledAt: scheduled },
      select: { deletionRequestedAt: true, deletionScheduledAt: true },
    });
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

    await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: null, deletionScheduledAt: null },
    });
    return res.json({ status: 'success', data: { deletionRequestedAt: null, deletionScheduledAt: null } });
  } catch (error) {
    console.error('탈퇴 취소 실패:', error);
    return res.status(500).json({ status: 'error', message: '탈퇴 취소 처리 중 오류가 발생했습니다.' });
  }
};
