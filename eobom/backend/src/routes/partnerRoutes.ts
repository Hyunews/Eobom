import { Router } from 'express';
import { signup, login, refresh, getMe, updateMe } from '../controllers/partnerController';
import { submitClaim, listMyClaims, listMyFacilities } from '../controllers/claimController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', getMe);
router.patch('/me', updateMe);

// 시설 소유권 클레임(연동)
router.post('/claims', submitClaim);
router.get('/claims', listMyClaims);
router.get('/facilities', listMyFacilities);

export default router;
