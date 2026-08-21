import { Router } from 'express';
import { listMyCleanupItems, createCleanupItem, updateCleanupItem } from '../controllers/cleanupController';
import { listMyMemorials } from '../controllers/memorialController';
import { getMyProfile, updateMyProfile } from '../controllers/profileController';

// B2C 로그인 유저 전용 "내 활동" 네임스페이스 (docs 04-01 §5.2 · 05-01 §4.2). /api/auth/me(계정 정보)와는
// 별개 — 이쪽은 도메인 데이터(정리 진행·추모관)를 모은다. 회원 프로필(연락처·주소 등, 00-28 §6.1)도 여기 붙는다.

const router = Router();

router.get('/cleanup-items', listMyCleanupItems);
router.post('/cleanup-items', createCleanupItem);
router.patch('/cleanup-items/:id', updateCleanupItem);

router.get('/memorials', listMyMemorials);

router.get('/profile', getMyProfile);
router.patch('/profile', updateMyProfile);

export default router;
