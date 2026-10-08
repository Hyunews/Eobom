import { Router } from 'express';
import {
  signup,
  login,
  refresh,
  getMe,
  updateMe,
  getMyConsultRequests,
  updateConsultRequestStatus,
} from '../controllers/expertController';

const router = Router();

// 전문가 가입 신청 — 승인 전까지 로그인 불가
router.post('/signup', signup);
// 전문가 로그인 — 승인된 계정만
router.post('/login', login);
// 전문가 토큰 갱신(리프레시 토큰 회전)
router.post('/refresh', refresh);
// 전문가 내 정보 조회
router.get('/me', getMe);
// 연락처·소개·정산계좌 수정
router.patch('/me', updateMe);
// 내게 온 상담 신청 목록(status로 필터)
router.get('/consult-requests', getMyConsultRequests);
// 상담 신청 상태 변경 — 본인 건만
router.patch('/consult-requests/:id/status', updateConsultRequestStatus);

export default router;
