import { Router } from 'express';
import { createObituary, getObituaryBySlug, getObituaryOgBySlug, updateObituary, closeObituary, deleteObituary, shareObituary } from '../controllers/obituaryController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';
import { requireUserAuth } from '../middleware/requireAuth';

// 모바일 부고장(Domain 07). Phase 1(§5.1)은 POST·GET :slug·PATCH — docs 07-03 §9 로드맵.
// Phase 3(§9 #9)에서 close를 추가했고, §9 9-1에서 share 집계를 추가했다.
// GET /api/me/obituaries(마이페이지 목록)는 여전히 범위 밖.
// 공개 3개를 위에 모으고 아래 `router.use(requireUserAuth)`부터는 로그인 필수(memorialRoutes.ts와 동일 패턴).

const router = Router();

router.get('/:slug/og', getObituaryOgBySlug); // 공개 — 카톡 카드용 이름만(07-03 §3.4). 조회수 집계 안 함
router.get('/:slug', getObituaryBySlug); // 공개(§5.3) — 비회원도 접근 가능. 개설자 본인은 종료 후에도 조회 가능(§9 #9)
router.post('/:slug/share', shareObituary); // 인증 불필요 — 공유 집계 +1, 수신자 정보 없음(§5.1·§9 9-1)

router.use(requireUserAuth); // middleware/requireAuth.ts

router.post('/', blockDuringDeletionGrace, createObituary); // 로그인 필요(§5.2) · 탈퇴 유예 중 403(00-36 §4.3-1)
router.patch('/:id', updateObituary); // 개설자만(§5.1)
router.patch('/:id/close', closeObituary); // 개설자만, 되돌리기 없음(§6.2-3·§9 #9)
router.delete('/:id', deleteObituary); // 개설자만, 되돌리기 없음 — "내 부고장" 리스트 삭제 버튼

export default router;
