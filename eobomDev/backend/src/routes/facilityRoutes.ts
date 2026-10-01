import { Router } from 'express';
import { getFacilities, getFacilityById } from '../controllers/facilityController';
import { createQuote, createCallEvent } from '../controllers/leadController';

const router = Router();

router.get('/', getFacilities);
router.get('/:id', getFacilityById);
router.post('/:id/quotes', createQuote);
router.post('/:id/call-events', createCallEvent);

export default router;
