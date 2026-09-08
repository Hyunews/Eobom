import crypto from 'crypto';

// 정산 계좌 등 "저장은 해야 하지만 평문으로 두면 안 되는" 필드용 AES-256-GCM 암호화.
// docs/01_장사시설_매칭/01-05_...명세서.md §7.4, .harness/security.md §1(평문 금지) 근거.
// 키 교체(로테이션) 설계는 docs/00_핵심플랫폼/00-33_암호화_키_관리_및_교체_전략_명세서.md가 정본.
// 키는 시크릿이므로 .env에서만 읽는다 — policy.ts(git 커밋)에 두지 않는다.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM 권장 nonce 길이
const CURRENT_VERSION = 'v2'; // 00-33 §5.1 — 현재 쓰는 저장 형식의 프리픽스
const MIN_KEY_LENGTH = 32; // 00-33 §7.2 — sha256은 길이를 맞출 뿐 엔트로피를 만들지 못한다

const requireEnv = (name: string): string => {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`${name}가 설정되지 않았습니다 (.env 확인).`);
  }
  return raw;
};

const deriveKey = (raw: string): Buffer => crypto.createHash('sha256').update(raw).digest();

// v2(현행) 데이터는 항상 `${name}`을 쓴다. v1(프리픽스 없는 옛 데이터)은 실제로 키 교체가
// 일어난 적이 없는 한 같은 값이므로 `${name}`으로 그대로 풀리고, 교체가 일어나면 옛 값을
// `${name}_V1`으로 옮겨 두는 것으로 계속 풀 수 있다(00-33 §5.1·§6.3) — 강제 재암호화 없이
// 점진 전환이 되는 이유가 이것이다.
const resolveKey = (name: string, version: 'v1' | 'v2'): Buffer => {
  if (version === 'v1') {
    const legacy = process.env[`${name}_V1`];
    return deriveKey(legacy || requireEnv(name));
  }
  return deriveKey(requireEnv(name));
};

// 저장 형식: v2:base64(iv):base64(authTag):base64(ciphertext) — 프리픽스 없으면 v1(옛 형식)으로
// 간주한다(00-33 §5.1). 강제 재암호화는 하지 않는다 — 각 행은 다음에 쓰일 때 자연히 v2가 된다.
const parseStored = (
  stored: string,
): { version: 'v1' | 'v2'; iv: string; tag: string; data: string } => {
  const parts = stored.split(':');
  if (parts.length === 4 && parts[0] === CURRENT_VERSION) {
    return { version: 'v2', iv: parts[1], tag: parts[2], data: parts[3] };
  }
  if (parts.length === 3) {
    return { version: 'v1', iv: parts[0], tag: parts[1], data: parts[2] };
  }
  throw new Error('암호화된 필드 형식이 올바르지 않습니다.');
};

const encryptWith =
  (keyEnvName: string) =>
  (plaintext: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, resolveKey(keyEnvName, 'v2'), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${CURRENT_VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
  };

const decryptWith =
  (keyEnvName: string) =>
  (stored: string): string => {
    const { version, iv, tag, data } = parseStored(stored);
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      resolveKey(keyEnvName, version),
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
      'utf8',
    );
  };

export const encryptField = encryptWith('SETTLEMENT_ENCRYPTION_KEY');
export const decryptField = decryptWith('SETTLEMENT_ENCRYPTION_KEY');

// 결정적 해시(HMAC-SHA256) — AES-GCM은 IV가 매번 랜덤이라 암호문으로는 중복검사가 원리적으로
// 불가능하다(docs 00-27 §4.1). 🔴 전용 env HASH_INDEX_KEY를 쓴다(00-33 §4.2) — 예전에는
// SETTLEMENT_ENCRYPTION_KEY에서 파생해 정산 키 교체가 가족지정 중복방지(@@unique([userId,
// phoneHash]))를 조용히 깨뜨렸다. domain 인자는 용도 구분용으로 그대로 유지한다.
// 🔴 이 함수의 키 소스 전환만으로 기존 phoneHash 값이 자동으로 맞춰지지 않는다 — 재해시는
// prisma/rotate-keys.ts(별도 실행, db-safety.md 게이트)의 몫이다.
export const hashField = (plaintext: string, domain: string): string => {
  const raw = requireEnv('HASH_INDEX_KEY');
  const hmacKey = crypto.createHash('sha256').update(`${raw}:${domain}`).digest();
  return crypto.createHmac('sha256', hmacKey).update(plaintext).digest('hex');
};

// 06(엔딩노트·유족 메시지) 전용 암호화 — docs 06-04 §13 #4. 정산 계좌(SETTLEMENT_ENCRYPTION_KEY)와
// 완전히 별도인 환경변수(ENDING_NOTE_ENCRYPTION_KEY)를 쓴다 — 같은 키면 한쪽 유출이 양쪽 유출이
// 된다. 위 encryptField/decryptField와 알고리즘·저장 형식은 같지만 키 소스가 다른, 완전히
// 독립된 함수다 — 기존 시그니처·호출부는 건드리지 않는다.
export const encryptNoteField = encryptWith('ENDING_NOTE_ENCRYPTION_KEY');
export const decryptNoteField = decryptWith('ENDING_NOTE_ENCRYPTION_KEY');

// Buffer(음성 등 바이너리) 전용 — docs 06-05 §8 D-1 #11. encryptNoteField와 같은 키
// (ENDING_NOTE_ENCRYPTION_KEY)·같은 버전 체계(v2, iv, authTag, data 순서)를 쓰되, 텍스트
// 필드처럼 콜론+base64로 이어붙이면 R2에 올라갈 오브젝트가 base64 팽창(약 33%)만큼 커진다.
// 그래서 같은 네 요소를 콜론 문자열이 아니라 바이트를 그대로 이어붙인 바이너리로 담는다:
// [2바이트 'v2'][12바이트 iv][16바이트 authTag][나머지 = 암호문]. R2에는 이 결과만 올라간다
// (00-11 §5.4-4 — R2에 CMK가 없어 선암호화가 필수).
const AUTH_TAG_LENGTH = 16;
const VERSION_MARKER = Buffer.from(CURRENT_VERSION, 'utf8'); // 'v2' = 2바이트

const encryptBufferWith =
  (keyEnvName: string) =>
  (plaintext: Buffer): Buffer => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, resolveKey(keyEnvName, 'v2'), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([VERSION_MARKER, iv, authTag, ciphertext]);
  };

const decryptBufferWith =
  (keyEnvName: string) =>
  (stored: Buffer): Buffer => {
    const version = stored.subarray(0, VERSION_MARKER.length).toString('utf8');
    if (version !== CURRENT_VERSION) {
      throw new Error('암호화된 파일 형식이 올바르지 않습니다.');
    }
    const ivStart = VERSION_MARKER.length;
    const tagStart = ivStart + IV_LENGTH;
    const dataStart = tagStart + AUTH_TAG_LENGTH;
    const iv = stored.subarray(ivStart, tagStart);
    const authTag = stored.subarray(tagStart, dataStart);
    const data = stored.subarray(dataStart);

    const decipher = crypto.createDecipheriv(ALGORITHM, resolveKey(keyEnvName, 'v2'), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  };

// 06(유족 메시지) 음성 전용 — encryptNoteField와 같은 ENDING_NOTE_ENCRYPTION_KEY를 쓴다
// (텍스트 편지와 음성이 같은 도메인 키를 공유해도 문제가 없다 — 애초에 같은 EndingNote 아래
// 있는 데이터다). R2에 올리기 전 여기서 먼저 잠근다.
export const encryptNoteBuffer = encryptBufferWith('ENDING_NOTE_ENCRYPTION_KEY');
export const decryptNoteBuffer = decryptBufferWith('ENDING_NOTE_ENCRYPTION_KEY');

// 00-33 §7.2 — 부팅 시 약한 키 점검. sha256은 임의 길이 문자열을 32바이트로 맞출 뿐 엔트로피를
// 만들지 못하므로("eobom1234"도 통과), 원본 문자열 길이로 최소한의 방어선을 둔다.
// 운영(production)에서는 기동을 막고, 로컬은 경고만 남긴다 — 로컬 개발 편의를 해치지 않기 위함.
export const checkEncryptionKeyStrength = (): { name: string; length: number }[] => {
  const keyNames = ['SETTLEMENT_ENCRYPTION_KEY', 'ENDING_NOTE_ENCRYPTION_KEY', 'HASH_INDEX_KEY'];
  return keyNames
    .map((name) => ({ name, length: (process.env[name] || '').length }))
    .filter(({ length }) => length > 0 && length < MIN_KEY_LENGTH);
};
