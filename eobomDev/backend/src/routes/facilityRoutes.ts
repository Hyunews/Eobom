import { Router } from 'express';
import { getFacilities, getFacilityById } from '../controllers/facilityController';
import { createQuote } from '../controllers/leadController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';
import { requireUserAuthWith } from '../middleware/requireAuth';

const router = Router();

// 시설 목록 — 필터·거리순 정렬·페이지 단위로 반환
router.get('/', getFacilities);
// 시설 상세 1건 반환
router.get('/:id', getFacilityById);
router.post('/:id/quotes', requireUserAuthWith('업체 문의는 로그인 후 이용하실 수 있습니다.'), blockDuringDeletionGrace, createQuote); // 로그인 필수(01-05 §10-2, 10-06) · 탈퇴 유예 중 403(00-36 §4.3-1)

export default router;
