import { Router } from 'express';
import {
  listFamilyDesignations,
  createFamilyDesignation,
  updateFamilyDesignation,
  deleteFamilyDesignation,
} from '../controllers/familyDesignationController';

// 00-27 §8.1 — 생전 가족지정 Phase 1(기록만). 전부 본인 것만, 인증은 컨트롤러 내부
// verifyBearerToken 패턴(cleanupController.ts와 동일). 🔴 "내가 지정됐는지" 조회 API는
// 만들지 않는다(§3 불변식 3) — 아래 4종 외의 라우트를 추가하지 말 것.

const router = Router();

router.get('/', listFamilyDesignations);
router.post('/', createFamilyDesignation);
router.patch('/:id', updateFamilyDesignation);
router.delete('/:id', deleteFamilyDesignation);

export default router;
