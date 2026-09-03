import { Router } from 'express';
import { createObituary, getObituaryBySlug, updateObituary, closeObituary, deleteObituary } from '../controllers/obituaryController';

// 모바일 부고장(Domain 07). Phase 1(§5.1)은 POST·GET :slug·PATCH — docs 07-03 §9 로드맵.
// Phase 3(§9 #9)에서 close를 추가한다. share 집계·GET /api/me/obituaries(마이페이지 목록)는
// 여전히 범위 밖 — 이번 착수 지시가 "종료 기능"으로 좁혀져 있었다.
// 인증 여부는 각 컨트롤러 내부에서 verifyBearerToken으로 판단한다(memorialRoutes.ts와 동일 패턴).

const router = Router();

router.get('/:slug', getObituaryBySlug); // 공개(§5.3) — 비회원도 접근 가능. 개설자 본인은 종료 후에도 조회 가능(§9 #9)
router.post('/', createObituary); // 로그인 필요(§5.2)
router.patch('/:id', updateObituary); // 개설자만(§5.1)
router.patch('/:id/close', closeObituary); // 개설자만, 되돌리기 없음(§6.2-3·§9 #9)
router.delete('/:id', deleteObituary); // 개설자만, 되돌리기 없음 — "내 부고장" 리스트 삭제 버튼

export default router;
