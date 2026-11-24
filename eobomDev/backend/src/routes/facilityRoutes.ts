import { Router } from 'express';
import { getFacilities, getFacilityById, getFacilityPublicDetail } from '../controllers/facilityController';
import { createQuote } from '../controllers/leadController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';
import { requireUserAuthWith } from '../middleware/requireAuth';

const router = Router();

// 시설 목록 — 필터·거리순 정렬·페이지 단위로 반환
router.get('/', getFacilities);
// 시설 공개 상세 — "업체 자세히 보기"(8단계 묶음 5). 공개 칸만 · 전화번호·partnerId 없음(01-01 §5.7 #1). /:id보다 앞에 둘 필요는 없다(경로가 달라서)
router.get('/:id/detail', getFacilityPublicDetail);
// 시설 상세 1건 반환
router.get('/:id', getFacilityById);
router.post('/:id/quotes', requireUserAuthWith('업체 문의는 로그인 후 이용하실 수 있습니다.'), blockDuringDeletionGrace, createQuote); // 로그인 필수(01-05 §10-2, 10-06) · 탈퇴 유예 중 403(00-36 §4.3-1)

export default router;
