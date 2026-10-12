import type { NextFunction, Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from '../controllers/authController';

// docs 00-12 §5.3 1차 스펙(10-12) — 비활성 계정(User.memorializedAt)은 이미 받은 회원 토큰(aud=user)도 403.
// 로그인 콜백 차단(authController)만으로는 12시간 안에 남은 토큰이 살아 있어 이 미들웨어가 짝이다.
// 🔴 토큰이 없거나 회원 토큰이 아니면(partner·expert·admin, 비로그인 공개 열람) 여기서 판단하지 않고 넘긴다 —
// verifyBearerToken이 B2C가 아닌 aud를 null로 돌려준다. 막는 대상은 "회원 토큰 + memorializedAt 있음"뿐이다.
// 데이터는 지우지 않으며, 유족 메시지 전달 등 사망 후 흐름은 수신자 링크로 돌아 이 토큰을 쓰지 않는다.
export const blockMemorializedUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = verifyBearerToken(req);
    if (!decoded) return next();
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { memorializedAt: true } });
    if (user?.memorializedAt) {
      return res.status(403).json({ status: 'error', message: '사용할 수 없는 계정입니다. 고객센터로 문의해 주세요.' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
