import { Router } from 'express';
import { listMyCleanupItems, createCleanupItem, updateCleanupItem } from '../controllers/cleanupController';
import { listMyMemorials } from '../controllers/memorialController';
import { listMyObituaries } from '../controllers/obituaryController';
import { getMyProfile, updateMyProfile } from '../controllers/profileController';
import { getMySummary } from '../controllers/summaryController';
import { listMyLeads, listMyConsultRequests, listMyGuestbookEntries, deleteMyGuestbookEntry } from '../controllers/meActivityController';
import { getDeletionPreview, requestAccountDeletion, cancelAccountDeletion } from '../controllers/accountDeletionController';

// B2C 로그인 유저 전용 "내 활동" 네임스페이스 (docs 04-01 §5.2 · 05-01 §4.2). /api/auth/me(계정 정보)와는
// 별개 — 이쪽은 도메인 데이터(정리 진행·추모관)를 모은다. 회원 프로필(연락처·주소 등, 00-28 §6.1)·
// 마이페이지 3칸 카운터 요약도 여기 붙는다.

const router = Router();

router.get('/cleanup-items', listMyCleanupItems);
router.post('/cleanup-items', createCleanupItem);
router.patch('/cleanup-items/:id', updateCleanupItem);

router.get('/memorials', listMyMemorials);
router.get('/obituaries', listMyObituaries);

router.get('/profile', getMyProfile);
router.patch('/profile', updateMyProfile);

router.get('/summary', getMySummary);

// 00-36 M-2 — 내 상담 내역(SCR-019)은 두 테이블을 프런트에서 한 목록으로 합친다(§4.4). 내가 남긴 방명록(#7-1).
router.get('/leads', listMyLeads);
router.get('/consult-requests', listMyConsultRequests);
router.get('/guestbook-entries', listMyGuestbookEntries);
// 🔴 내 글 삭제는 개설자용 `DELETE /api/memorials/:id/guestbook/:gid`와 **다른 엔드포인트**다(00-36 §4.7-1 — 권한 판정이 섞인다).
router.delete('/guestbook-entries/:id', deleteMyGuestbookEntry);

// 00-36 M-3 — 회원 탈퇴(30일 유예, 소프트 삭제). 런타임에서 아무것도 지우지 않는다(시각 두 개만).
router.get('/deletion-preview', getDeletionPreview);
router.post('/deletion-request', requestAccountDeletion);
router.delete('/deletion-request', cancelAccountDeletion);

export default router;
