import { Router } from 'express';
import { signup, login, refresh, getMe, updateMe } from '../controllers/partnerController';
import { submitClaim, listMyClaims, listMyFacilities } from '../controllers/claimController';
import { addFacilityImage, removeFacilityImage, setCoverImage } from '../controllers/facilityMediaController';
import { listMyLeads, getMyLeadDetail, updateMyLeadStatus } from '../controllers/leadController';

const router = Router();

// 사업자 가입 신청 — 승인 전까지 로그인 불가
router.post('/signup', signup);
// 사업자 로그인 — 승인된 계정만
router.post('/login', login);
// 사업자 토큰 갱신(리프레시 토큰 회전)
router.post('/refresh', refresh);
// 사업자 내 정보 조회
router.get('/me', getMe);
// 담당자·연락처·정산계좌 수정
router.patch('/me', updateMe);

// 시설 소유권 클레임(연동)
router.post('/claims', submitClaim);
// 내 시설 클레임 신청 목록
router.get('/claims', listMyClaims);
// 클레임 승인된 내 시설 목록
router.get('/facilities', listMyFacilities);
// 시설 이미지 업로드(multipart)
router.post('/facilities/:id/images', addFacilityImage);
// 시설 이미지 삭제
router.delete('/facilities/:id/images', removeFacilityImage);
// 시설 대표 사진 지정
router.patch('/facilities/:id/images/cover', setCoverImage);

// 리드(업체 문의) 조회·상태 신고 (docs 01-05 §11 4단계, §6.1)
router.get('/leads', listMyLeads);
// 내 시설 리드 상세 — 본인 시설 건만
router.get('/leads/:leadNo', getMyLeadDetail);
// 리드 상태 신고(응답·성사·무산) — 허용된 전이만
router.patch('/leads/:leadNo/status', updateMyLeadStatus);

export default router;
