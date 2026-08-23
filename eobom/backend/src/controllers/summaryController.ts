import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';

// 마이페이지 3칸 카운터(`GET /api/me/summary`) — MyPage.tsx §1-2 대응. `FacilityBooking`이
// 2026-08-11 폐기돼(schema.prisma) "예약"이라는 개념 자체가 DB에 없다 — 문의(Lead)·상담
// (ConsultRequest)·내 부고장(Obituary) 3개만 센다.
// 🔴 순차 await 금지 — 백엔드(Render 오리건)↔DB(Supabase 서울) 왕복이 회당 ~1.3초라 3번 직렬로
// 타면 그 자리에서 ~4초가 된다. $transaction으로 묶어 한 왕복에 처리한다.
export const getMySummary = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const [leadCount, consultCount, obituaryCount] = await prisma.$transaction([
      prisma.lead.count({ where: { userId: decoded.id } }),
      prisma.consultRequest.count({ where: { userId: decoded.id } }),
      prisma.obituary.count({ where: { createdByUserId: decoded.id } }),
    ]);
    return res.json({ status: 'success', data: { leadCount, consultCount, obituaryCount } });
  } catch (error) {
    console.error('마이페이지 요약 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '요약 조회 중 오류가 발생했습니다.' });
  }
};
