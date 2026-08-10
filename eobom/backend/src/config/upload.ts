import fs from 'fs';
import path from 'path';
import multer from 'multer';

// 시설 이미지 로컬 디스크 저장 — MVP 구현. ⚠️ Render 등 배포 환경은 재배포 시 디스크가
// 초기화돼 업로드 파일이 사라진다. 실배포 전 S3/Cloudinary 등 외부 스토리지로 반드시 교체할 것
// (외부 서비스 신규 연동은 security.md §5에 따라 사용자 승인 필요 — 지금은 로컬로 동작만 확보).
export const FACILITY_IMAGE_DIR = path.resolve(__dirname, '../../uploads/facility-images');
fs.mkdirSync(FACILITY_IMAGE_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FACILITY_IMAGE_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const facilityId = req.params.id || 'unknown';
    cb(null, `${facilityId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadFacilityImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
}).single('image');

// 클라이언트에 내려줄 상대 경로 — 실제 절대 URL은 프론트가 BACKEND_URL과 조합한다
// (server.ts가 http/https를 배포마다 다르게 서빙하므로 백엔드가 절대 URL을 박아넣지 않는다).
export const toPublicImagePath = (filename: string): string => `/uploads/facility-images/${filename}`;
