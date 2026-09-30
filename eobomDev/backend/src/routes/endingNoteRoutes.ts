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
import {
  createReleaseRequest,
  listMyReleaseRequests,
  cancelReleaseRequest,
  getReleaseRequestAboutMe,
  cancelReleaseRequestBySubject,
  listPendingFamily,
  reinvitePendingFamily,
} from '../controllers/deathVerificationController';

// docs 06-04 §10 Phase 1·2 — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). family-view는
// 개봉 전엔 IMMEDIATE(생전 공유)로 명시 지정된 것만, 개봉(EndingNote.RELEASED, 00-41) 뒤엔 자기 권한의
// 사후 섹션 + 자기 앞 편지까지 내려준다(06-05 §3.3, endingNoteController.ts 주석 참고).

const router = Router();

router.get('/', getEndingNote);
router.post('/policy-agree', agreeEndingNotePolicy);
router.put('/sections/:section', saveEndingNoteSection);

router.get('/grants', listEndingNoteGrants);
router.put('/grants', upsertEndingNoteGrant);
router.patch('/grants/:id/revoke', revokeEndingNoteGrant);

router.get('/family-view', getFamilyVisibleEndingNotes);

// 00-41 §9 사후 개봉 요청. 🔴 고정 경로(mine·about-me)를 `/:id/...`보다 먼저 둔다 — 안 그러면 "mine"이 id로 먹힌다.
router.post('/release-requests', createReleaseRequest);
router.get('/release-requests/mine', listMyReleaseRequests);
router.get('/release-requests/about-me', getReleaseRequestAboutMe);
router.post('/release-requests/:id/cancel', cancelReleaseRequest);
router.post('/release-requests/:id/cancel-by-subject', cancelReleaseRequestBySubject);
router.get('/release-requests/:id/pending-family', listPendingFamily);
router.post('/release-requests/:id/pending-family/:desigId/reinvite', reinvitePendingFamily);

export default router;
