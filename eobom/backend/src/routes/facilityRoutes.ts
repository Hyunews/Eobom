import { Router } from 'express';
import { getFacilities, getFacilityById, createBooking, createReview } from '../controllers/facilityController';

const router = Router();

router.get('/', getFacilities);
router.get('/:id', getFacilityById);
router.post('/:id/bookings', createBooking);
router.post('/:id/reviews', createReview);

export default router;
