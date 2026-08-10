import { Router } from 'express';
import { signup, login, refresh, getMe, updateMe } from '../controllers/partnerController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', getMe);
router.patch('/me', updateMe);

export default router;
