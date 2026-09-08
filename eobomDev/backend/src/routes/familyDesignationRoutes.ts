import { Router } from 'express';
import {
  listFamilyDesignations,
  createFamilyDesignation,
  updateFamilyDesignation,
  deleteFamilyDesignation,
  inviteFamilyDesignation,
  getFamilyInvite,
  acceptFamilyInvite,
  declineFamilyInvite,
} from '../controllers/familyDesignationController';

// 00-27 §8.1 Phase 1(기록) + §9.1 Phase 2(초대 링크). 전부 본인 것만(초대 발급 포함), 인증은
// 컨트롤러 내부 verifyBearerToken 패턴(cleanupController.ts와 동일). 🔴 "내가 지정됐는지" 조회
// API는 만들지 않는다(§3 불변식 3) — 초대 3종은 전부 추측 불가 토큰으로만 접근한다.

const router = Router();

router.get('/', listFamilyDesignations);
router.post('/', createFamilyDesignation);
router.patch('/:id', updateFamilyDesignation);
router.delete('/:id', deleteFamilyDesignation);

router.post('/:id/invite', inviteFamilyDesignation); // 개설자만(§9.1)
router.get('/invite/:token', getFamilyInvite); // 공개 — 받는 사람은 아직 회원이 아닐 수 있다
router.post('/invite/:token/accept', acceptFamilyInvite); // 로그인 필요
router.post('/invite/:token/decline', declineFamilyInvite); // 로그인 불필요

export default router;
