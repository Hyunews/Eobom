import { Router } from 'express';
import { signup, login, refresh, getMe, updateMe } from '../controllers/partnerController';
import { submitClaim, listMyClaims, listMyFacilities } from '../controllers/claimController';
import { addFacilityImage, removeFacilityImage, setCoverImage } from '../controllers/facilityMediaController';
import { listMyLeads, getMyLeadDetail, updateMyLeadStatus } from '../controllers/leadController';

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
router.post('/facilities/:id/images', addFacilityImage);
router.delete('/facilities/:id/images', removeFacilityImage);
router.patch('/facilities/:id/images/cover', setCoverImage);

// 리드(업체 문의) 조회·상태 신고 (docs 01-05 §11 4단계, §6.1)
router.get('/leads', listMyLeads);
router.get('/leads/:leadNo', getMyLeadDetail);
router.patch('/leads/:leadNo/status', updateMyLeadStatus);

export default router;
