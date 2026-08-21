import crypto from 'crypto';

// 정산 계좌 등 "저장은 해야 하지만 평문으로 두면 안 되는" 필드용 AES-256-GCM 암호화.
// docs/01_장사시설_매칭/01-05_...명세서.md §7.4, .harness/security.md §1(평문 금지) 근거.
// 키는 시크릿이므로 .env에서만 읽는다 — policy.ts(git 커밋)에 두지 않는다.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM 권장 nonce 길이

const getKey = (): Buffer => {
  const raw = process.env.SETTLEMENT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('SETTLEMENT_ENCRYPTION_KEY가 설정되지 않았습니다 (.env 확인).');
  }
  // 32바이트(256bit) 키가 필요 — 운영자가 임의 길이 문자열을 넣어도 안전하도록 sha256으로 정규화.
  return crypto.createHash('sha256').update(raw).digest();
};

// 저장 형식: base64(iv) : base64(authTag) : base64(ciphertext)
export const encryptField = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
};

export const decryptField = (stored: string): string => {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('암호화된 필드 형식이 올바르지 않습니다.');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
};

// 결정적 해시(HMAC-SHA256) — AES-GCM은 IV가 매번 랜덤이라 암호문으로는 중복검사가 원리적으로
// 불가능하다(docs 00-27 §4.1). 암호화 키를 그대로 HMAC 키로 재사용하지 않고 domain으로 용도를
// 분리해서 파생한다 — 새 환경변수를 추가하지 않으면서(render.yaml·Render 대시보드가 같이
// 늘어난다, systems.md §5) 암호화 키와 인덱스 키를 갈라놓기 위함.
export const hashField = (plaintext: string, domain: string): string => {
  const raw = process.env.SETTLEMENT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('SETTLEMENT_ENCRYPTION_KEY가 설정되지 않았습니다 (.env 확인).');
  }
  const hmacKey = crypto.createHash('sha256').update(`${raw}:${domain}`).digest();
  return crypto.createHmac('sha256', hmacKey).update(plaintext).digest('hex');
};
