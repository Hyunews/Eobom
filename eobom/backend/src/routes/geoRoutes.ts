import { Router } from 'express';
import { reverseGeocode, geocode, getRegions } from '../controllers/geoController';

const router = Router();

router.get('/reverse', reverseGeocode);
router.get('/geocode', geocode);
router.get('/regions', getRegions);

export default router;
