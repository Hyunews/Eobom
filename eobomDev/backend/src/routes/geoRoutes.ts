import { Router } from 'express';
import { reverseGeocode, geocode, getRegions } from '../controllers/geoController';

const router = Router();

// 좌표를 대략적인 지역명으로 변환
router.get('/reverse', reverseGeocode);
// 주소·지역명·장소명을 좌표로 변환(주소 검색 실패 시 키워드 검색)
router.get('/geocode', geocode);
// 보유 시설 기준 시/도·시/군/구 목록
router.get('/regions', getRegions);

export default router;
