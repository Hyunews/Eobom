import { Router } from 'express';
import {
  getMemorialBySlug,
  createMemorial,
  updateMemorial,
  createTribute,
  listGuestbook,
  createGuestbookEntry,
  deleteGuestbookEntry,
  addMemorialPhoto,
  deleteMemorialPhoto,
} from '../controllers/memorialController';
import { reportMemorial } from '../controllers/moderationController';

// 공개 조회(GET)와 로그인 필요 작성(POST/PATCH/DELETE)이 섞여 있다 — 인증 여부는 각 컨트롤러
// 함수 내부에서 verifyBearerToken으로 판단한다(facilityRoutes.ts와 동일 패턴).

const router = Router();

// 공개 (docs 05-01 §4.1) — 비회원도 접근 가능
router.get('/:slug', getMemorialBySlug);
router.get('/:slug/guestbook', listGuestbook);
router.post('/:slug/tributes', createTribute); // 헌화 — 비회원 허용(§4.4)
router.post('/:slug/guestbook', createGuestbookEntry); // 방명록 작성 — 비회원 허용(§4.5)
router.post('/:slug/report', reportMemorial); // 신고 접수 — 즉시 PRIVATE 전환(§4.3-3)

// 로그인 필요 (§6.2)
router.post('/', createMemorial);
router.patch('/:id', updateMemorial); // 개설자만
router.delete('/:id/guestbook/:gid', deleteGuestbookEntry); // 개설자만
router.post('/:id/photos', addMemorialPhoto); // 개설자만
router.delete('/:id/photos/:photoId', deleteMemorialPhoto); // 개설자만

export default router;
