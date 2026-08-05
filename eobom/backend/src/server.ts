import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// 라우터 연결
app.use('/api/auth', authRoutes);

// 기본 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Eobom Backend API Server',
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🌿 이어봄 (Eobom) 백엔드 API 서버 구동 완료`);
  console.log(`📍 서버 주소: http://localhost:${PORT}`);
  console.log(`🔒 소셜 로그인 엔드포인트: http://localhost:${PORT}/api/auth/[kakao|naver|google]`);
  console.log(`===================================================`);
});
