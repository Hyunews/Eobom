import { Router } from 'express';
import { listMyMemorials } from '../controllers/memorialController';
import { listMyObituaries } from '../controllers/obituaryController';
import { getMyProfile, updateMyProfile, recordMyConsent } from '../controllers/profileController';
import { getMySummary } from '../controllers/summaryController';
import { listMyLeads, listMyConsultRequests, listMyGuestbookEntries, deleteMyGuestbookEntry } from '../controllers/meActivityController';
import { listMyCareGuideProgress, checkCareGuideTask, uncheckCareGuideTask } from '../controllers/careGuideController';
import { getDeletionPreview, requestAccountDeletion, cancelAccountDeletion } from '../controllers/accountDeletionController';

// B2C 로그인 유저 전용 "내 활동" 네임스페이스 (docs 04-01 §5.2 · 05-01 §4.2). /api/auth/me(계정 정보)와는
// 별개 — 이쪽은 도메인 데이터(추모관 등)를 모은다. 회원 프로필(연락처·주소 등, 00-28 §6.1)·
// 마이페이지 3칸 카운터 요약도 여기 붙는다.

const router = Router();

// 내가 개설한 추모관 목록
router.get('/memorials', listMyMemorials);
// 내가 만든 부고장 목록
router.get('/obituaries', listMyObituaries);

// 내 프로필 조회
router.get('/profile', getMyProfile);
// 내 프로필 부분 수정
router.patch('/profile', updateMyProfile);
// 00-36 §4.5-1 — 동의 기록 없는 기존 회원의 재동의. 비어 있는 칸만 지금 시각으로 찍는다.
router.post('/consent', recordMyConsent);

// 마이페이지 3칸 카운터 값
router.get('/summary', getMySummary);

// 00-36 M-2 — 내 상담 내역(SCR-019)은 두 테이블을 프런트에서 한 목록으로 합친다(§4.4). 내가 남긴 방명록(#7-1).
router.get('/leads', listMyLeads);
// 내 전문가 상담 신청 목록
router.get('/consult-requests', listMyConsultRequests);
// 내가 남긴 방명록 목록
router.get('/guestbook-entries', listMyGuestbookEntries);
// 🔴 내 글 삭제는 개설자용 `DELETE /api/memorials/:id/guestbook/:gid`와 **다른 엔드포인트**다(00-36 §4.7-1 — 권한 판정이 섞인다).
router.delete('/guestbook-entries/:id', deleteMyGuestbookEntry);

// 07-04 §3.4 — 상중 행정 가이드 체크 상태(회원만). 🔴 운영자 열람 불가 — admin 라우트에 노출하지 않는다.
router.get('/care-guide', listMyCareGuideProgress);
// 상중 행정 가이드 항목 체크(멱등)
router.put('/care-guide/:taskId', checkCareGuideTask);
// 상중 행정 가이드 항목 체크 해제(멱등)
router.delete('/care-guide/:taskId', uncheckCareGuideTask);

// 00-36 M-3 — 회원 탈퇴(30일 유예, 소프트 삭제). 런타임에서 아무것도 지우지 않는다(시각 두 개만).
router.get('/deletion-preview', getDeletionPreview);
// 회원 탈퇴 요청 — 요청 시각·30일 유예 만료 시각 기록
router.post('/deletion-request', requestAccountDeletion);
// 회원 탈퇴 취소 — 계정 복구
router.delete('/deletion-request', cancelAccountDeletion);

export default router;
