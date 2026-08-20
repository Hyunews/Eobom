import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import https from 'https';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import facilityRoutes from './routes/facilityRoutes';
import geoRoutes from './routes/geoRoutes';
import partnerRoutes from './routes/partnerRoutes';
import expertRoutes from './routes/expertRoutes';
import expertPublicRoutes from './routes/expertPublicRoutes';
import adminRoutes from './routes/adminRoutes';
import digitalPlatformRoutes from './routes/digitalPlatformRoutes';
import meRoutes from './routes/meRoutes';
import memorialRoutes from './routes/memorialRoutes';
import obituaryRoutes from './routes/obituaryRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// mkcert로 만든 로컬 인증서가 있으면 HTTPS로 띄운다(프론트가 HTTPS일 때 이 API를 fetch하면
// mixed content로 막히는 걸 방지). 인증서는 기기별 생성물이라 커밋 안 됨(eobom/.certs/) —
// Render 등 배포 환경엔 이 파일이 없으므로 자동으로 아래 http 경로로 폴백된다(정상 동작).
const certDir = path.resolve(__dirname, '../../.certs');
const certPath = path.join(certDir, 'localhost+2.pem');
const keyPath = path.join(certDir, 'localhost+2-key.pem');
const hasLocalCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

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
app.use('/api/digital-platforms', digitalPlatformRoutes);
app.use('/api/me', meRoutes);
app.use('/api/memorials', memorialRoutes);
app.use('/api/obituaries', obituaryRoutes);

// 기본 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Eobom Backend API Server',
    time: new Date().toISOString(),
  });
});

const scheme = hasLocalCert ? 'https' : 'http';

// 로그에 찍을 공개 주소. 배포 환경에서 localhost로 찍으면 로그를 보는 사람이 헷갈린다
// (2026-08-20 Render 첫 배포 때 실제로 그랬다). Render는 RENDER_EXTERNAL_URL을 주입한다.
// 로컬은 인증서 유무에 따라 https/http가 갈리므로 scheme을 그대로 쓴다.
const publicUrl = process.env.RENDER_EXTERNAL_URL || `${scheme}://localhost:${PORT}`;

const startServer = () => {
  console.log(`===================================================`);
  console.log(`🌿 이어봄 (Eobom) 백엔드 API 서버 구동 완료`);
  console.log(`📍 서버 주소: ${publicUrl}`);
  console.log(`🔒 소셜 로그인 엔드포인트: ${publicUrl}/api/auth/[kakao|naver|google]`);
  console.log(`   (내부 리스닝 포트: ${PORT}${hasLocalCert ? ', mkcert HTTPS' : ''})`);
  console.log(`===================================================`);
};

if (hasLocalCert) {
  https
    .createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
    .listen(PORT, startServer);
} else {
  app.listen(PORT, startServer);
}
