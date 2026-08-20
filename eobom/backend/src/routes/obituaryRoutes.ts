import { Router } from 'express';
import { createObituary, getObituaryBySlug, updateObituary } from '../controllers/obituaryController';

// 모바일 부고장(Domain 07) Phase 1 — docs 07-03 §5.1. 이번 범위는 POST·GET :slug·PATCH만이다
// (close·share·GET /api/me/obituaries는 Phase 3 — §9 로드맵, 이번 착수 지시 범위 밖).
// 인증 여부는 각 컨트롤러 내부에서 verifyBearerToken으로 판단한다(memorialRoutes.ts와 동일 패턴).

const router = Router();

router.get('/:slug', getObituaryBySlug); // 공개(§5.3) — 비회원도 접근 가능
router.post('/', createObituary); // 로그인 필요(§5.2)
router.patch('/:id', updateObituary); // 개설자만(§5.1)

export default router;
