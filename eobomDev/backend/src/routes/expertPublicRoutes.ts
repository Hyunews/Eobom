import { Router } from 'express';
import { getPublicExperts, getPublicExpertById, submitConsultRequest } from '../controllers/expertPublicController';

// /api/experts (복수형) — 소비자 공개 API. 전문가 본인 계정 라우트(/api/expert, 단수형)와는 분리.
const router = Router();

router.get('/', getPublicExperts);
router.get('/:id', getPublicExpertById);
router.post('/:id/consult-requests', submitConsultRequest);

export default router;
