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
import willPhotoRoutes from './routes/willPhotoRoutes';
import { requestId, accessLog } from './middleware/requestLog';
import { errorHandler } from './middleware/errorHandler';
import { installRateLimits } from './middleware/rateLimit';
import { buildCorsOptions } from './config/cors';
import { kstIso } from './utils/kst';

// Express 앱 조립만 한다 — listen·dotenv·부팅 점검은 server.ts 몫이다.
// 회귀 테스트(backend/tests/)가 서버를 띄우지 않고 이 앱을 그대로 불러 쓰려고 분리했다(00-15 §6 ②).
// 🔴 여기에 dotenv를 넣지 않는다 — 테스트가 개발 DB의 .env를 끌어오면 안 된다.
const app = express();

// 00-42 §5.2 ④ — Render 앞단 프록시 1단을 믿는다. 안 하면 req.ip가 전부 Render 내부 주소가 된다.
// 🔴 숫자 1이다(true 금지) — true면 클라이언트가 X-Forwarded-For를 위조해 IP를 바꿀 수 있다.
app.set('trust proxy', 1);

// 🔴 어떤 API 응답에도 createdAtKst·updatedAtKst를 싣지 않는다 — 이 칸들은 사람이 DB를 열 때 한국 시간을 보는 보기 전용이다(10-01).
// Prisma가 행을 읽으면 이 칸도 같이 오므로, 행을 통째로 res.json으로 돌려주는 곳(시설·추모관·전문가 상담 등)에서 새는 것을
// 여기서 한 번에 막는다. Express의 'json replacer'는 모든 res.json에 적용되고 중첩 객체·배열까지 덮는다(컨트롤러를 안 건드린다).
// 한계: res.json을 거치지 않는 응답(res.send(문자열)·파일 전송)은 대상이 아니다 — 지금 그런 곳에서 모델 행을 내보내지 않는다.
const HIDDEN_RESPONSE_KEYS = new Set(['createdAtKst', 'updatedAtKst']);
app.set('json replacer', (key: string, value: unknown) => (HIDDEN_RESPONSE_KEYS.has(key) ? undefined : value));

// 요청 번호·접속기록(00-42 §5) — 가장 먼저 걸어 cors·body-parser 에러도 번호를 갖게 한다.
app.use(requestId);
app.use(accessLog);

// 미들웨어 설정
// CORS는 허용 목록(config/cors.ts · CORS_ORIGINS 환경변수) — 00-42 §10. X-Request-Id 노출도 거기서 건다.
// 🔴 요청 횟수 제한보다 앞이다 — 429 응답에도 CORS 헤더가 붙어야 다른 출처 프론트가 "잠시 후 다시 시도"를 읽을 수 있다.
app.use(cors(buildCorsOptions()));

// 업로드된 시설 이미지 정적 서빙 — 로컬 디스크 저장(config/upload.ts). ⚠️ 배포 환경에서는
// 재배포 시 사라지는 임시 저장소다 — 실서비스 전 외부 스토리지로 교체 필요.
// 요청 횟수 제한보다 앞에 둔다 — 이미지 여러 장을 한 화면에서 불러오는 것이 분당 300을 쓰지 않게(제한 대상은 API).
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 요청 횟수 제한(같은 IP 기준 · 00-42 §10) — 본문 파싱보다 앞에서 걸러 넘친 요청이 파싱 비용을 쓰지 않게 한다.
installRateLimits(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

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
app.use('/api/will-photos', willPhotoRoutes); // docs 06-06 §5-2 — 보관한 유언장 사진(스위치 R2_WILL_ENABLED)

// 기본 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Eobom Backend API Server',
    time: kstIso(),
  });
});

// 전역 에러 처리기(00-42 §5.1 ③) — 반드시 모든 라우터 뒤. 컨트롤러가 못 잡고 흘린 예외를 에러 기록에 남기고 JSON으로 답한다.
app.use(errorHandler);

export default app;
