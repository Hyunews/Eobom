import express from 'express';
import cors from 'cors';
import path from 'path';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import facilityRoutes from './routes/facilityRoutes';
import geoRoutes from './routes/geoRoutes';
import partnerRoutes from './routes/partnerRoutes';
import expertRoutes from './routes/expertRoutes';
import expertPublicRoutes from './routes/expertPublicRoutes';
import adminRoutes from './routes/adminRoutes';
import meRoutes from './routes/meRoutes';
import memorialRoutes from './routes/memorialRoutes';
import obituaryRoutes from './routes/obituaryRoutes';
import familyDesignationRoutes from './routes/familyDesignationRoutes';
import farewellMessageRoutes from './routes/farewellMessageRoutes';
import endingNoteRoutes from './routes/endingNoteRoutes';
import sttRoutes from './routes/sttRoutes';
import ocrRoutes from './routes/ocrRoutes';

// Express 앱 조립만 한다 — listen·dotenv·부팅 점검은 server.ts 몫이다.
// 회귀 테스트(backend/tests/)가 서버를 띄우지 않고 이 앱을 그대로 불러 쓰려고 분리했다(00-15 §6 ②).
// 🔴 여기에 dotenv를 넣지 않는다 — 테스트가 개발 DB의 .env를 끌어오면 안 된다.
const app = express();

// 미들웨어 설정
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// 업로드된 시설 이미지 정적 서빙 — 로컬 디스크 저장(config/upload.ts). ⚠️ 배포 환경에서는
// 재배포 시 사라지는 임시 저장소다 — 실서비스 전 외부 스토리지로 교체 필요.
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 라우터 연결
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/experts', expertPublicRoutes); // 소비자 공개 API — 단수형(/api/expert, 본인 계정)과 분리
app.use('/api/admin', adminRoutes);
app.use('/api/me', meRoutes);
app.use('/api/memorials', memorialRoutes);
app.use('/api/obituaries', obituaryRoutes);
app.use('/api/family-designations', familyDesignationRoutes);
app.use('/api/farewell-messages', farewellMessageRoutes);
app.use('/api/ending-note', endingNoteRoutes);
app.use('/api/stt', sttRoutes);
app.use('/api/ocr', ocrRoutes);

// 기본 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Eobom Backend API Server',
    time: new Date().toISOString(),
  });
});

export default app;
