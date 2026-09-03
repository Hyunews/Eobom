import { randomUUID } from 'crypto';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { getVoiceClient, getVoiceBucket } from '../config/r2';
import { encryptNoteBuffer, decryptNoteBuffer } from '../utils/crypto';

// docs 06-05 §8 D-1~D-2 · 00-11 §5.4-5-3 — 유족 메시지 음성(Ⓐ·Ⓑ 공통) 업로드/다운로드.
// 원본 버퍼는 여기 들어오기 전까지 메모리에만 있다가(multer memoryStorage) 암호화 후 R2로
// 그대로 스트리밍된다 — 디스크에 쓰지 않는다.

// 🔴 객체 키는 UUID·타임스탬프로 만든다(00-11 §5.4-5-3) — 재녹음이 같은 키를 덮어쓰지
// 않고 항상 새 키가 되게 해, 소프트 삭제·아카이브 복제 전제(§5.4-5-2)가 성립하게 한다.
const buildObjectKey = (): string => `${Date.now()}-${randomUUID()}`;

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

// docs 00-11 §5.4-4 — R2엔 CMK가 없어 앱단 선암호화가 필수. R2에는 이어봄 키로 잠근 덩어리만
// 올라간다(R2 자동 암호화는 그 위 한 겹일 뿐).
export const uploadVoiceObject = async (buffer: Buffer): Promise<{ mediaKey: string }> => {
  const mediaKey = buildObjectKey();
  const encrypted = encryptNoteBuffer(buffer);
  await getVoiceClient().send(
    new PutObjectCommand({
      Bucket: getVoiceBucket(),
      Key: mediaKey,
      Body: encrypted,
    }),
  );
  return { mediaKey };
};

export const downloadVoiceObject = async (mediaKey: string): Promise<Buffer> => {
  const res = await getVoiceClient().send(
    new GetObjectCommand({ Bucket: getVoiceBucket(), Key: mediaKey }),
  );
  const body = await streamToBuffer(res.Body as Readable);
  return decryptNoteBuffer(body);
};
