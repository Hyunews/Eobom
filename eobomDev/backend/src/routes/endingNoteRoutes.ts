import { Router } from 'express';
import {
  getEndingNote,
  agreeEndingNotePolicy,
  saveEndingNoteSection,
  listEndingNoteGrants,
  upsertEndingNoteGrant,
  revokeEndingNoteGrant,
  getFamilyVisibleEndingNotes,
  getFamilyLetterAudio,
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
import { blockDuringDeletionGrace } from '../middleware/blockDuringDeletionGrace';

// docs 06-04 §10 Phase 1·2 — 전부 본인 것만(컨트롤러 내부 verifyBearerToken 패턴). family-view는
// 개봉 전엔 IMMEDIATE(생전 공유)로 명시 지정된 것만, 개봉(EndingNote.RELEASED, 00-41) 뒤엔 자기 권한의
// 사후 섹션 + 자기 앞 편지까지 내려준다(06-05 §3.3, endingNoteController.ts 주석 참고).

const router = Router();

// 내 엔딩노트 조회 — 본문 복호화해 반환
router.get('/', getEndingNote);
// 엔딩노트 정책 동의 기록
router.post('/policy-agree', agreeEndingNotePolicy);
router.put('/sections/:section', blockDuringDeletionGrace, saveEndingNoteSection); // 엔딩노트 작성 — 탈퇴 유예 중 403(00-36 §4.3-1)

// 내가 준 열람 권한 목록(철회분 포함)
router.get('/grants', listEndingNoteGrants);
// 열람 권한 부여·변경(upsert)
router.put('/grants', upsertEndingNoteGrant);
// 열람 권한 철회 — 삭제하지 않음
router.patch('/grants/:id/revoke', revokeEndingNoteGrant);

// 지정 가족이 볼 수 있는 엔딩노트 조회
router.get('/family-view', getFamilyVisibleEndingNotes);
router.get('/family-view/letters/:id/audio', getFamilyLetterAudio); // 00-41 §7.1 — 수신자용 편지 음성

// 00-41 §9 사후 개봉 요청. 🔴 고정 경로(mine·about-me)를 `/:id/...`보다 먼저 둔다 — 안 그러면 "mine"이 id로 먹힌다.
router.post('/release-requests', createReleaseRequest);
// 내가 수락한 분들의 사후 개봉 요청 상태
router.get('/release-requests/mine', listMyReleaseRequests);
// 내 사후 개봉 요청 진행 상황(본인 배너)
router.get('/release-requests/about-me', getReleaseRequestAboutMe);
// 사후 개봉 요청 취소 — 요청한 유족만
router.post('/release-requests/:id/cancel', cancelReleaseRequest);
// 사후 개봉 요청을 본인이 취소 — 요청 중일 때만
router.post('/release-requests/:id/cancel-by-subject', cancelReleaseRequestBySubject);
// 아직 수락하지 않은 가족 목록(이름·관계만)
router.get('/release-requests/:id/pending-family', listPendingFamily);
// 미수락 가족 초대 링크 다시 만들기
router.post('/release-requests/:id/pending-family/:desigId/reinvite', reinvitePendingFamily);

export default router;
