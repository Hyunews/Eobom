import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { checkEncryptionKeyStrength } from './utils/crypto';
import app from './app';
import { writeErrorLog } from './services/opsLogService';

const PORT = process.env.PORT || 5000;

// 00-33 §7.2 — 약한 암호화 키 부팅 점검. 운영은 기동을 막고(사고를 배포 전에 잡음),
// 로컬은 경고만 남긴다(개발 편의를 해치지 않음 — 로컬 키는 이미 개발자가 임의 생성한 32바이트
// hex라 걸리지 않는 게 정상이다).
const weakKeys = checkEncryptionKeyStrength();
if (weakKeys.length > 0) {
  const detail = weakKeys.map((k) => `${k.name}(${k.length}자)`).join(', ');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`암호화 키가 너무 짧습니다 — 운영 환경에서는 기동을 막습니다: ${detail}`);
  }
  console.warn(`⚠️  암호화 키가 32자 미만입니다(로컬은 경고만): ${detail}`);
}

// mkcert로 만든 로컬 인증서가 있으면 HTTPS로 띄운다(프론트가 HTTPS일 때 이 API를 fetch하면
// mixed content로 막히는 걸 방지). 인증서는 기기별 생성물이라 커밋 안 됨(eobomDev/.certs/) —
// Render 등 배포 환경엔 이 파일이 없으므로 자동으로 아래 http 경로로 폴백된다(정상 동작).
const certDir = path.resolve(__dirname, '../../.certs');
const certPath = path.join(certDir, 'localhost+2.pem');
const keyPath = path.join(certDir, 'localhost+2-key.pem');
const hasLocalCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

const scheme = hasLocalCert ? 'https' : 'http';

// 로그에 찍을 공개 주소. 배포 환경에서 localhost로 찍으면 로그를 보는 사람이 헷갈린다
// (2026-08-20 Render 첫 배포 때 실제로 그랬다). Render는 RENDER_EXTERNAL_URL을 주입한다.
// 로컬은 인증서 유무에 따라 https/http가 갈리므로 scheme을 그대로 쓴다.
const publicUrl = process.env.RENDER_EXTERNAL_URL || `${scheme}://localhost:${PORT}`;

// 00-42 §5.1 ③ — 어디서도 catch하지 못한 Promise 거부를 에러 기록에 남긴다.
// 🔴 핸들러를 달면 Node 기본 동작(프로세스 종료)이 바뀐다 — 기록하고 서비스는 계속 돌린다(요청 하나의 실수로 전체가 내려가지 않게).
process.on('unhandledRejection', (reason) => {
  console.error('처리되지 않은 Promise 거부:', reason);
  void writeErrorLog({ requestId: null, path: null, status: null, errorName: 'UnhandledRejection', error: reason });
});

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
