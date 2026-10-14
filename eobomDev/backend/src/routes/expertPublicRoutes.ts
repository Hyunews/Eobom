import { Router } from 'express';
import { getPublicExperts, getPublicExpertById, submitConsultRequest } from '../controllers/expertPublicController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';
import { requireUserAuthWith } from '../middleware/requireAuth';

// /api/experts (복수형) — 소비자 공개 API. 전문가 본인 계정 라우트(/api/expert, 단수형)와는 분리.
const router = Router();

// 승인·공개된 전문가 목록
router.get('/', getPublicExperts);
// 승인·공개된 전문가 상세 — 아니면 404
router.get('/:id', getPublicExpertById);
router.post('/:id/consult-requests', requireUserAuthWith('상담 신청은 로그인 후 이용하실 수 있습니다.'), blockDuringDeletionGrace, submitConsultRequest); // 로그인 필수 · 탈퇴 유예 중 403(00-36 §4.3-1)

export default router;
