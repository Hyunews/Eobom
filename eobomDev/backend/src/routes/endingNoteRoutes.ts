import { Router } from 'express';
import {
  getEndingNote,
  agreeEndingNotePolicy,
  saveEndingNoteSection,
  listEndingNoteGrants,
  upsertEndingNoteGrant,
  revokeEndingNoteGrant,
  getFamilyVisibleEndingNotes,
} from '../controllers/endingNoteController';

// docs 06-04 §10 Phase 1·2 — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). Phase 3
// 개봉 전까지는 사후(POSTMORTEM) 콘텐츠를 유족에게 내려주는 라우트가 없다 — family-view는
// IMMEDIATE(생전 공유)로 명시 지정된 것만 내려준다(06-05 §3.3, endingNoteController.ts 주석 참고).

const router = Router();

router.get('/', getEndingNote);
router.post('/policy-agree', agreeEndingNotePolicy);
router.put('/sections/:section', saveEndingNoteSection);

router.get('/grants', listEndingNoteGrants);
router.put('/grants', upsertEndingNoteGrant);
router.patch('/grants/:id/revoke', revokeEndingNoteGrant);

router.get('/family-view', getFamilyVisibleEndingNotes);

export default router;
