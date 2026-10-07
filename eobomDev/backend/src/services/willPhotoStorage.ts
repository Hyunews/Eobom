import { randomUUID } from 'crypto';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { getWillClient, getWillBucket } from '../config/r2';
import { encryptNoteBuffer, decryptNoteBuffer } from '../utils/crypto';

// docs 06-06 §5-2-2 — 유언장 사진 R2 입출력. r2Storage.ts(음성)와 같은 방식(앱단 선암호화 · UUID 키)이고 버킷·토큰만 다르다.
// 🔴 평문 업로드 금지 — R2에는 ENDING_NOTE_ENCRYPTION_KEY로 잠근 덩어리만 올라간다.
// 시험은 willPhotoStorage 객체의 세 함수를 바꿔 끼운다(R2 자격증명 없이 시험하기 위해).

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
};

export const willPhotoStorage = {
  async put(buffer: Buffer): Promise<string> {
    const key = `${Date.now()}-${randomUUID()}`; // 파일 이름은 쓰지 않는다 — 이름에 개인정보가 들어갈 수 있다
    await getWillClient().send(new PutObjectCommand({ Bucket: getWillBucket(), Key: key, Body: encryptNoteBuffer(buffer) }));
    return key;
  },
  async get(key: string): Promise<Buffer> {
    const res = await getWillClient().send(new GetObjectCommand({ Bucket: getWillBucket(), Key: key }));
    return decryptNoteBuffer(await streamToBuffer(res.Body as Readable));
  },
  async remove(key: string): Promise<void> {
    await getWillClient().send(new DeleteObjectCommand({ Bucket: getWillBucket(), Key: key }));
  },
};
