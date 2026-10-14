import { Router } from 'express';
import {
  getMemorialBySlug,
  createMemorial,
  updateMemorial,
  closeMemorial,
  createTribute,
  listGuestbook,
  createGuestbookEntry,
  deleteGuestbookEntry,
  addMemorialPhoto,
  deleteMemorialPhoto,
  previewMemorialExtend,
  extendMemorialByLink,
  extendMyMemorial,
} from '../controllers/memorialController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';
import { requireUserAuth, requireUserAuthWith } from '../middleware/requireAuth';

// 공개 조회(GET)와 로그인 필요 작성(POST/PATCH/DELETE)이 섞여 있다 — 공개 라우트를 위에 모으고,
// 아래 `router.use(requireUserAuth)`부터는 로그인 필수. 신원(id)은 컨트롤러가 다시 꺼내 쓴다.

const router = Router();

// 연장 통지 링크(docs 00-20 §8.1-4) — 로그인 불필요, 토큰이 곧 권한. 🔴 GET은 확인 화면용 조회뿐, 연장은 POST.
// 아래 `/:slug` 계열보다 앞에 둔다(`extend`가 slug로 읽히지 않게).
router.get('/extend/:token', previewMemorialExtend); // 연장 확인 화면용 조회 — 로그인 불필요
// 통지 링크로 추모관 연장 — 1회용 토큰
router.post('/extend/:token', extendMemorialByLink);

// 공개 (docs 05-01 §4.1) — 비회원도 접근 가능
router.get('/:slug', getMemorialBySlug);
// 추모관 방명록 목록(삭제·비공개 제외)
router.get('/:slug/guestbook', listGuestbook);
router.post('/:slug/tributes', createTribute); // 헌화 — 비회원 허용(§4.4)
router.post('/:slug/guestbook', requireUserAuthWith('방명록 작성은 로그인 후 이용하실 수 있습니다.'), blockDuringDeletionGrace, createGuestbookEntry); // 방명록 작성 — 로그인 필수(09-29) · 탈퇴 유예 중 403(00-36 §4.3-1)

// 로그인 필요 (§6.2) — 여기부터 아래는 전부 로그인 필수. 공개 라우트는 이 줄 위에 둔다(middleware/requireAuth.ts)
router.use(requireUserAuth);
router.post('/', blockDuringDeletionGrace, createMemorial); // 탈퇴 유예 중 403(00-36 §4.3-1)
router.post('/:id/extend', extendMyMemorial); // 개설자만 — 연장(활성 복귀, 00-20 §8.1-4). `/extend/:token`(POST)보다 뒤라 겹치지 않는다
router.patch('/:id', updateMemorial); // 개설자만
router.delete('/:id', closeMemorial); // 개설자만, 소프트 삭제(closedAt)
router.delete('/:id/guestbook/:gid', deleteGuestbookEntry); // 개설자만
router.post('/:id/photos', addMemorialPhoto); // 개설자만
router.delete('/:id/photos/:photoId', deleteMemorialPhoto); // 개설자만

export default router;
