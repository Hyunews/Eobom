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

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/consult-requests', getMyConsultRequests);
router.patch('/consult-requests/:id/status', updateConsultRequestStatus);

export default router;
