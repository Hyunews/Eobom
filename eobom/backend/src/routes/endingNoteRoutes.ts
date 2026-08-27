import { Router } from 'express';
import { getEndingNote, agreeEndingNotePolicy, saveEndingNoteSection } from '../controllers/endingNoteController';

// docs 06-04 §10 Phase 1 — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). 🔴 유족이
// 읽는 라우트는 없다 — 개봉은 Phase 3이고 엔딩노트와 동시에 열린다(06-05 §3.3).

const router = Router();

router.get('/', getEndingNote);
router.post('/policy-agree', agreeEndingNotePolicy);
router.put('/sections/:section', saveEndingNoteSection);

export default router;
