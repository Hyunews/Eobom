import { Router } from 'express';
import {
  listFarewellMessages,
  getFarewellMessage,
  createFarewellMessage,
  updateFarewellMessage,
} from '../controllers/farewellMessageController';

// docs 06-05 §8 Phase B — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). 🔴 유족이 읽는
// 라우트는 없다 — 개봉은 06-04 Phase 3이고 엔딩노트와 동시에 열린다(§3.3).

const router = Router();

router.get('/', listFarewellMessages);
router.get('/:id', getFarewellMessage);
router.post('/', createFarewellMessage);
router.patch('/:id', updateFarewellMessage);

export default router;
