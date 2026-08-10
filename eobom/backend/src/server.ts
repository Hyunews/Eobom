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

// 라우터 연결
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/geo', geoRoutes);

// 기본 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Eobom Backend API Server',
    time: new Date().toISOString(),
  });
});

const scheme = hasLocalCert ? 'https' : 'http';
const startServer = () => {
  console.log(`===================================================`);
  console.log(`🌿 이어봄 (Eobom) 백엔드 API 서버 구동 완료`);
  console.log(`📍 서버 주소: ${scheme}://localhost:${PORT}`);
  console.log(`🔒 소셜 로그인 엔드포인트: ${scheme}://localhost:${PORT}/api/auth/[kakao|naver|google]`);
  console.log(`===================================================`);
};

if (hasLocalCert) {
  https
    .createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
    .listen(PORT, startServer);
} else {
  app.listen(PORT, startServer);
}
