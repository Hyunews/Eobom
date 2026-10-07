import { Router } from 'express';
import { listMyWillPhotoSets, getMyWillPhotoPage, deleteMyWillPhotoSet } from '../controllers/willPhotoController';

// docs 06-06 §5-2 — 보관한 유언장 사진. 인증·스위치 확인은 컨트롤러 안에서 한다(ocrRoutes와 같은 결).

const router = Router();

router.get('/', listMyWillPhotoSets);
router.get('/:setId/pages/:index', getMyWillPhotoPage);
router.delete('/:setId', deleteMyWillPhotoSet);

export default router;
