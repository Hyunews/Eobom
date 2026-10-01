import { Router } from 'express';
import { login, refresh, getMe, getUserDetailForAdmin, listUsersForAdmin, requireAdminAuth } from '../controllers/adminController';
import {
  listPartners,
  updatePartnerStatus,
  updatePartnerInfo,
  listExperts,
  updateExpertStatus,
  updateExpertPublish,
  updateExpertInfo,
  listConsultRequestsForAdmin,
  listMemorialsForAdmin,
  listMemorialGuestbookForAdmin,
  hideMemorialGuestbookEntry,
  hideMemorial,
  unhideMemorial,
} from '../controllers/moderationController';
import { listClaimsForAdmin, updateClaimStatus } from '../controllers/claimController';
import {
  listDeathVerifications,
  getDeathVerification,
  verifyDeathVerification,
  rejectDeathVerification,
} from '../controllers/deathVerificationAdminController';
import {
  listFarewellPurgeExpired,
  listFarewellPendingArchive,
  executeFarewellPurge,
  completeArchivePurge,
} from '../controllers/farewellPurgeController';

import { adminAudit } from '../middleware/adminAudit';

const router = Router();

// 인증 (공개 가입 없음 — prisma/seed-admin.ts로만 계정 생성)
router.post('/login', login);
router.post('/refresh', refresh);

// 00-37 A-1 #1 — 이 아래 전부 라우터 레벨 가드. 예전엔 핸들러마다 verifyAdminBearerToken(req)를
// 직접 불렀는데(새 엔드포인트에서 한 줄 빠지면 그대로 공개되는 구조적 위험, §2.3), router.use()로
// 한 번에 걸어 그 위험을 없앤다. /login·/refresh는 토큰이 아직 없는 시점이라 이 줄보다 위에 둔다.
router.use(requireAdminAuth);
// 00-42 §7 — 운영자 감사 자동화. 이 아래 모든 요청이 한 곳에서 AdminAuditLog에 남는다(핸들러에 한 줄씩 넣지 않는다).
router.use(adminAudit);

router.get('/me', getMe);

// 사업자·전문가 가입 심사
router.get('/partners', listPartners);
router.patch('/partners/:id/status', updatePartnerStatus);
router.patch('/partners/:id', updatePartnerInfo);
router.get('/experts', listExperts);
router.patch('/experts/:id/status', updateExpertStatus);
router.patch('/experts/:id/publish', updateExpertPublish);
router.patch('/experts/:id', updateExpertInfo);

// 전문가 상담 신청 전체 조회 (분쟁 대응·품질 모니터링)
router.get('/consult-requests', listConsultRequestsForAdmin);

// 시설 클레임(연동) 심사
router.get('/claims', listClaimsForAdmin);
router.patch('/claims/:id/status', updateClaimStatus);

// 사후 개봉 사망 확인 (docs 00-41 §5.3·§9) — 응답에 엔딩노트 본문·섹션 제목·편지가 없다
router.get('/death-verifications', listDeathVerifications);
router.get('/death-verifications/:id', getDeathVerification);
router.patch('/death-verifications/:id/verify', verifyDeathVerification);
router.patch('/death-verifications/:id/reject', rejectDeathVerification);

// 추모관 목록·방명록 숨김 (docs 05-01 §4.3). 09-30 신고 폐지로 PATCH .../review 삭제.
router.get('/memorials', listMemorialsForAdmin);
router.patch('/memorials/:id/hide', hideMemorial); // 09-30 운영자 내리기(00-20 §6.2) — 사유 필수·감사로그
router.patch('/memorials/:id/unhide', unhideMemorial);
router.get('/memorials/:id/guestbook', listMemorialGuestbookForAdmin); // 00-37 A-2 신규(편차 — walkthrough 참고)
router.patch('/memorials/:id/guestbook/:gid/hide', hideMemorialGuestbookEntry);

// 회원 목록·상세 — 도메인 데이터 조인 (docs 04-01 §5.4 · 05-01 §4.4 · 00-37 §6 A-2 #8)
router.get('/users', listUsersForAdmin);
router.get('/users/:id', getUserDetailForAdmin);

// 유족 메시지 파기 (docs 06-05 §5.6-8-3 D-11) — 정상 만료분만, 강제 삭제 경로 없음
router.get('/farewell-purge/expired', listFarewellPurgeExpired);
router.get('/farewell-purge/pending-archive', listFarewellPendingArchive);
router.post('/farewell-purge/execute', executeFarewellPurge);
router.patch('/farewell-purge/pending-archive/:id/complete', completeArchivePurge);

export default router;
