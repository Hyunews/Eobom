import { S3Client } from '@aws-sdk/client-s3';

// docs 00-11 §5.4-6-1 — 버킷별 토큰이 3개로 분리되어 있다. 클라이언트를 공용 1개로 합치면
// 토큰 분리의 의미가 없어진다(하나가 뚫리면 세 버킷이 다 뚫린다) — 버킷 성격별로 따로 만든다.
// docs 06-05 §8 D-1 — 지금 실제로 쓰는 것은 VOICE 하나뿐이다(MEDIA·DOCS는 05-01·02-02 몫).
// 그래도 미리 3개로 나눠 두는 이유는 나중에 급하게 만들다 공용 클라이언트로 합치는 실수를
// 막기 위해서다. 셋 다 지연 생성이라 안 쓰는 버킷의 자격증명이 비어 있어도 부팅이 막히지 않는다.

export const isR2Enabled = (): boolean => process.env.R2_ENABLED === 'true';

type R2Purpose = 'VOICE' | 'MEDIA' | 'DOCS';

const requireEnv = (name: string): string => {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`${name}가 설정되지 않았습니다 (.env 확인).`);
  }
  return raw;
};

const clients: Partial<Record<R2Purpose, S3Client>> = {};

const buildClient = (purpose: R2Purpose): S3Client =>
  new S3Client({
    region: 'auto',
    endpoint: requireEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requireEnv(`R2_ACCESS_KEY_ID_${purpose}`),
      secretAccessKey: requireEnv(`R2_SECRET_ACCESS_KEY_${purpose}`),
    },
  });

const getClient = (purpose: R2Purpose): S3Client => {
  const existing = clients[purpose];
  if (existing) return existing;
  const created = buildClient(purpose);
  clients[purpose] = created;
  return created;
};

export const getVoiceClient = (): S3Client => getClient('VOICE');
export const getMediaClient = (): S3Client => getClient('MEDIA');
export const getDocsClient = (): S3Client => getClient('DOCS');

export const getVoiceBucket = (): string => requireEnv('R2_BUCKET_FAREWELL_VOICE');
export const getMediaBucket = (): string => requireEnv('R2_BUCKET_MEMORIAL_MEDIA');
export const getDocsBucket = (): string => requireEnv('R2_BUCKET_BIZ_DOCS');
