import { Router } from 'express';
import {
  listFarewellMessages,
  getFarewellMessage,
  createFarewellMessage,
  updateFarewellMessage,
  getFarewellMessageAudio,
  deleteFarewellMessageAudio,
} from '../controllers/farewellMessageController';

// docs 06-05 §8 Phase B — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). 🔴 유족이 읽는
// 라우트는 없다 — 개봉은 06-04 Phase 3이고 엔딩노트와 동시에 열린다(§3.3).
// 🆕 06-05 §5.6 D-6 — 음성 듣기·삭제. /:id/audio는 별도 경로 세그먼트라 /:id와 충돌하지 않는다.

const router = Router();

router.get('/', listFarewellMessages);
router.get('/:id', getFarewellMessage);
router.post('/', createFarewellMessage);
router.patch('/:id', updateFarewellMessage);
router.get('/:id/audio', getFarewellMessageAudio);
router.delete('/:id/audio', deleteFarewellMessageAudio);

export default router;
