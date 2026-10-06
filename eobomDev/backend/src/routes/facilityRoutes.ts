import { Router } from 'express';
import { getFacilities, getFacilityById } from '../controllers/facilityController';
import { createQuote, createCallEvent } from '../controllers/leadController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';

const router = Router();

router.get('/', getFacilities);
router.get('/:id', getFacilityById);
router.post('/:id/quotes', blockDuringDeletionGrace, createQuote); // 로그인 필수(01-05 §10-2, 10-06 · 컨트롤러가 401) · 탈퇴 유예 중 403(00-36 §4.3-1)
router.post('/:id/call-events', createCallEvent);

export default router;
