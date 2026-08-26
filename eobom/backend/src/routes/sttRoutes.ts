import { Router } from 'express';
import { getSttStatus, transcribeAudio } from '../controllers/sttController';

// docs 06-04 §6.4-9·§6.4-11 — STT Ⓐ 파일 업로드. multer는 라우트에 직접 물리지 않고
// 컨트롤러 안에서 수동 호출한다(facilityMediaController.ts와 동일 패턴) — 플래그·인증 체크를
// 업로드 파싱보다 먼저 하기 위해서다.

const router = Router();

router.get('/status', getSttStatus); // 공개 — 업로드 UI 노출 여부
router.post('/transcribe', transcribeAudio); // 로그인 필요, 플래그 켜져 있을 때만

export default router;
