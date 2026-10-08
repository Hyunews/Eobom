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
  listFarewellPurgeLogs,
  completeArchivePurge,
} from '../controllers/farewellPurgeController';

import { adminAudit } from '../middleware/adminAudit';

const router = Router();

// 인증 (공개 가입 없음 — prisma/seed-admin.ts로만 계정 생성)
router.post('/login', login);
// 운영자 토큰 갱신(리프레시 토큰 회전)
router.post('/refresh', refresh);

// 00-37 A-1 #1 — 이 아래 전부 라우터 레벨 가드. 예전엔 핸들러마다 verifyAdminBearerToken(req)를
// 직접 불렀는데(새 엔드포인트에서 한 줄 빠지면 그대로 공개되는 구조적 위험, §2.3), router.use()로
// 한 번에 걸어 그 위험을 없앤다. /login·/refresh는 토큰이 아직 없는 시점이라 이 줄보다 위에 둔다.
router.use(requireAdminAuth);
// 00-42 §7 — 운영자 감사 자동화. 이 아래 모든 요청이 한 곳에서 AdminAuditLog에 남는다(핸들러에 한 줄씩 넣지 않는다).
router.use(adminAudit);

// 운영자 내 정보 조회
router.get('/me', getMe);

// 사업자·전문가 가입 심사
router.get('/partners', listPartners);
// 사업자 승인·반려·정지
router.patch('/partners/:id/status', updatePartnerStatus);
// 사업자 담당자 정보 수정(검증된 신원 필드 제외)
router.patch('/partners/:id', updatePartnerInfo);
// 전문가 가입 심사 목록(status로 필터)
router.get('/experts', listExperts);
// 전문가 승인·반려·정지
router.patch('/experts/:id/status', updateExpertStatus);
// 전문가 공개 노출 토글
router.patch('/experts/:id/publish', updateExpertPublish);
// 전문가 연락처·소개 수정(검증 필드 제외)
router.patch('/experts/:id', updateExpertInfo);

// 전문가 상담 신청 전체 조회 (분쟁 대응·품질 모니터링)
router.get('/consult-requests', listConsultRequestsForAdmin);

// 시설 클레임(연동) 심사
router.get('/claims', listClaimsForAdmin);
// 시설 클레임 승인·반려
router.patch('/claims/:id/status', updateClaimStatus);

// 사후 개봉 사망 확인 (docs 00-41 §5.3·§9) — 응답에 엔딩노트 본문·섹션 제목·편지가 없다
router.get('/death-verifications', listDeathVerifications);
// 사망 확인 요청 상세 — 열람 기록을 남김
router.get('/death-verifications/:id', getDeathVerification);
// 사망 확인 완료 처리
router.patch('/death-verifications/:id/verify', verifyDeathVerification);
// 사망 확인 반려 — 사유는 코드만
router.patch('/death-verifications/:id/reject', rejectDeathVerification);

// 추모관 목록·방명록 숨김 (docs 05-01 §4.3). 09-30 신고 폐지로 PATCH .../review 삭제.
router.get('/memorials', listMemorialsForAdmin);
router.patch('/memorials/:id/hide', hideMemorial); // 09-30 운영자 내리기(00-20 §6.2) — 사유 필수·감사로그
// 내린 추모관 되돌리기
router.patch('/memorials/:id/unhide', unhideMemorial);
router.get('/memorials/:id/guestbook', listMemorialGuestbookForAdmin); // 00-37 A-2 신규(편차 — walkthrough 참고)
// 방명록 글 강제 비공개(소프트 삭제)
router.patch('/memorials/:id/guestbook/:gid/hide', hideMemorialGuestbookEntry);

// 회원 목록·상세 — 도메인 데이터 조인 (docs 04-01 §5.4 · 05-01 §4.4 · 00-37 §6 A-2 #8)
router.get('/users', listUsersForAdmin);
// 회원 상세 — 도메인 데이터 조인
router.get('/users/:id', getUserDetailForAdmin);

// 유족 메시지 파기 (docs 06-05 §5.6-8-3 D-11) — 정상 만료분만, 강제 삭제 경로 없음
router.get('/farewell-purge/expired', listFarewellPurgeExpired);
// 아카이브 2단계 미이행 목록
router.get('/farewell-purge/pending-archive', listFarewellPendingArchive);
// 유족 메시지 건별 파기 실행
router.post('/farewell-purge/execute', executeFarewellPurge);
// 파기 기록 조회
router.get('/farewell-purge/logs', listFarewellPurgeLogs);
// 아카이브 2단계 완료 표시
router.patch('/farewell-purge/pending-archive/:id/complete', completeArchivePurge);

export default router;
