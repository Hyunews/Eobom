import type { NextFunction, Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from '../controllers/authController';

// docs 00-36 §4.3-1 — 탈퇴 유예 중(purgedAt == null && deletionRequestedAt != null)인 계정은 새 자산을 만들 수 없다.
// 30일 뒤 파기될 계정으로 타인이 보는 것(부고장·추모관·방명록)을 새로 만들면 파기 시점에 조문객 쪽이 깨지기 때문이다.
// 막는 것은 "생성"뿐이다 — 조회·반출·탈퇴 취소·로그아웃은 이 미들웨어를 달지 않는다.
// 🔴 토큰이 없거나 틀리면 여기서 판단하지 않고 그대로 넘긴다 — 401은 각 컨트롤러가 원래 하던 대로 낸다.
// 🔴 purgedAt != null(파기 완료)도 넘긴다 — 그 계정은 컨트롤러가 없는 회원으로 취급해 401로 끊는다(authController.ts:577).
export const blockDuringDeletionGrace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = verifyBearerToken(req);
    if (!decoded) return next();
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, purgedAt: null },
      select: { deletionRequestedAt: true },
    });
    if (user?.deletionRequestedAt) {
      return res.status(403).json({
        status: 'error',
        message: '탈퇴 신청 상태에서는 새로 만들거나 신청할 수 없습니다. 탈퇴를 취소하시면 다시 이용하실 수 있습니다.',
      });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
