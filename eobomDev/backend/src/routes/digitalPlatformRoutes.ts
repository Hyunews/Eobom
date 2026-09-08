import { Router } from 'express';
import { listPublicDigitalPlatforms } from '../controllers/digitalPlatformController';

const router = Router();

// 공개 조회 (docs 04-01 §5.1)
router.get('/', listPublicDigitalPlatforms);

export default router;
