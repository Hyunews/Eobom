import { Router } from 'express';
import {
  listFarewellMessages,
  getFarewellMessage,
  createFarewellMessage,
  updateFarewellMessage,
  deleteFarewellMessage,
  getFarewellMessageAudio,
  deleteFarewellMessageAudio,
  exportFarewellMessages,
  exportFarewellMessage,
} from '../controllers/farewellMessageController';
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';

// docs 06-05 §8 Phase B — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). 🔴 유족이 읽는
// 라우트는 없다 — 개봉은 06-04 Phase 3이고 엔딩노트와 동시에 열린다(§3.3).
// 🆕 06-05 §5.6 D-6 — 음성 듣기·삭제. /:id/audio는 별도 경로 세그먼트라 /:id와 충돌하지 않는다.
// 🆕 06-05 §5.4-3 D-5 — 반출(zip). 🔴 `/export`(전체)는 `/:id`보다 먼저 등록 — 안 그러면
// "export"가 id 파라미터로 먹혀 findUnique가 못 찾고 404가 난다. `/:id/export`(단건, §5.4-3-1)는
// 세그먼트가 둘이라 `/:id`와 안 겹친다 — `/:id/audio`와 같은 자리에 둔다.

const router = Router();

// 내 유족 메시지 목록 — 미리보기까지
router.get('/', listFarewellMessages);
// 내 유족 메시지 전체 반출
router.get('/export', exportFarewellMessages);
// 유족 메시지 단건 전문 조회 — 본인만
router.get('/:id', getFarewellMessage);
router.post('/', blockDuringDeletionGrace, createFarewellMessage); // 탈퇴 유예 중 403(00-36 §4.3-1)
// 유족 메시지 수정 — 본인 건만
router.patch('/:id', updateFarewellMessage);
// 유족 메시지 삭제(소프트)
router.delete('/:id', deleteFarewellMessage);
// 유족 메시지 음성 듣기
router.get('/:id/audio', getFarewellMessageAudio);
// 유족 메시지 음성 삭제(소프트)
router.delete('/:id/audio', deleteFarewellMessageAudio);
// 유족 메시지 단건 반출
router.get('/:id/export', exportFarewellMessage);

export default router;
