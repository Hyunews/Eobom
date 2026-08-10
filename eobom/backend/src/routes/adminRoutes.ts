import { Router } from 'express';
import { login, refresh, getMe } from '../controllers/adminController';
import { listPartners, updatePartnerStatus, listExperts, updateExpertStatus } from '../controllers/moderationController';
import { listClaimsForAdmin, updateClaimStatus } from '../controllers/claimController';

const router = Router();

// 인증 (공개 가입 없음 — prisma/seed-admin.ts로만 계정 생성)
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', getMe);

// 사업자·전문가 가입 심사
router.get('/partners', listPartners);
router.patch('/partners/:id/status', updatePartnerStatus);
router.get('/experts', listExperts);
router.patch('/experts/:id/status', updateExpertStatus);

// 시설 클레임(연동) 심사
router.get('/claims', listClaimsForAdmin);
router.patch('/claims/:id/status', updateClaimStatus);

export default router;
