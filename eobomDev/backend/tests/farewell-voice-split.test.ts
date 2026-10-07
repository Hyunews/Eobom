// 06-05 §5.6-9·D-12 #66·#67·#68·#70 — 변환과 저장 분리의 서버 쪽 시험.
//  · 음성이 붙은 편지에 새 mediaKey → 409(덮어쓰지 않는다) · 같은 키 재전송(②재시도)은 통과
//  · 삭제 유예 중인 편지에 새 음성 → FarewellMediaRetired 1행(이전 키 보존·원래 삭제 시각 계승) + 편지 갱신(mediaDeletedAt=null)
//  · 파기 배치 ① 대상 조회(findRetiredExpired)가 30일 지난 미파기 행만 센다
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드가 앱보다 먼저여야 한다. 데이터는 전부 가짜.
import './helpers/testEnv';
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import type { AddressInfo } from 'node:net';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { encryptNoteField } from '../src/utils/crypto';
import { findRetiredExpired } from '../src/services/farewellPurgeService';

const DAY = 24 * 60 * 60 * 1000;
let server: ReturnType<typeof app.listen>;
let base = '';
let userId = '';
let token = '';
let noteId = '';
let recipientId = '';
const messageIds: string[] = [];

const patch = (id: string, body: object) =>
  fetch(`${base}/api/farewell-messages/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

const newMessage = (extra: object) =>
  prisma.farewellMessage.create({
    data: { noteId, recipientId, bodyEnc: encryptNoteField('시험 편지'), ...extra },
    select: { id: true },
  }).then((m) => { messageIds.push(m.id); return m.id; });

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);

  const user = await prisma.user.create({ data: { name: '음성분리시험' } });
  userId = user.id;
  token = jwt.sign({ id: userId, name: '음성분리시험', provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  const note = await prisma.endingNote.create({ data: { userId } });
  noteId = note.id;
  const designation = await prisma.familyDesignation.create({
    data: { userId, name: '시험가족', phoneEnc: 'x', phoneHash: `h-${Date.now()}`, relationship: 'CHILD' },
  });
  recipientId = designation.id;

  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  server?.close();
  await prisma.farewellMediaRetired.deleteMany({ where: { messageId: { in: messageIds } } });
  if (userId) await prisma.user.deleteMany({ where: { id: userId } }); // 노트·지정·편지는 Cascade
  await prisma.$disconnect();
});

describe('음성이 붙은 편지에 새 음성 — §5.6-9-3', () => {
  it('mediaKey가 있고 mediaDeletedAt이 없으면 새 mediaKey는 409이고 이전 키가 그대로 남는다', async () => {
    const id = await newMessage({ mediaKey: 'voice/old-1', mediaMime: 'audio/webm' });
    const res = await patch(id, { body: '고친 글', mediaKey: 'voice/new-1', mediaMime: 'audio/webm' });
    assert.equal(res.status, 409);
    const row = await prisma.farewellMessage.findUniqueOrThrow({ where: { id } });
    assert.equal(row.mediaKey, 'voice/old-1');
    assert.equal(await prisma.farewellMediaRetired.count({ where: { messageId: id } }), 0);
  });

  it('같은 mediaKey가 다시 오면(② 재시도) 409가 아니고 아무것도 옮기지 않는다', async () => {
    const id = await newMessage({ mediaKey: 'voice/same-1', mediaMime: 'audio/webm' });
    const res = await patch(id, { body: '재시도 글', mediaKey: 'voice/same-1', mediaMime: 'audio/webm' });
    assert.equal(res.status, 200);
    const row = await prisma.farewellMessage.findUniqueOrThrow({ where: { id } });
    assert.equal(row.mediaKey, 'voice/same-1');
    assert.equal(await prisma.farewellMediaRetired.count({ where: { messageId: id } }), 0);
  });

  it('음성이 없는 편지에는 새 음성이 그냥 붙는다', async () => {
    const id = await newMessage({});
    const res = await patch(id, { body: '첫 음성', mediaKey: 'voice/first-1', mediaMime: 'audio/webm', mediaDurationSec: 12 });
    assert.equal(res.status, 200);
    const row = await prisma.farewellMessage.findUniqueOrThrow({ where: { id } });
    assert.equal(row.mediaKey, 'voice/first-1');
    assert.equal(row.mediaDurationSec, 12);
  });

  it('mediaKey 없이 글만 고치면 기존 음성은 건드리지 않는다', async () => {
    const id = await newMessage({ mediaKey: 'voice/keep-1', mediaMime: 'audio/webm' });
    const res = await patch(id, { body: '글만 수정' });
    assert.equal(res.status, 200);
    const row = await prisma.farewellMessage.findUniqueOrThrow({ where: { id } });
    assert.equal(row.mediaKey, 'voice/keep-1');
  });
});

describe('삭제 유예 중인 편지에 새 음성 — §5.6-9-4', () => {
  it('Retired 1행(이전 키·원래 삭제 시각)을 만들고 편지는 새 키로 갱신되며 mediaDeletedAt이 null이 된다', async () => {
    const deletedAt = new Date(Date.now() - 5 * DAY);
    const id = await newMessage({ mediaKey: 'voice/gone-1', mediaMime: 'audio/mp4', mediaDeletedAt: deletedAt });
    const res = await patch(id, { body: '새 음성으로', mediaKey: 'voice/new-2', mediaMime: 'audio/webm', mediaDurationSec: 30 });
    assert.equal(res.status, 200);

    const retired = await prisma.farewellMediaRetired.findMany({ where: { messageId: id } });
    assert.equal(retired.length, 1);
    assert.equal(retired[0].mediaKey, 'voice/gone-1');
    assert.equal(retired[0].mediaMime, 'audio/mp4');
    assert.equal(retired[0].deletedAt.getTime(), deletedAt.getTime()); // 파기 시계는 원래 삭제 시각을 이어받는다
    assert.equal(retired[0].purgedAt, null);

    const row = await prisma.farewellMessage.findUniqueOrThrow({ where: { id } });
    assert.equal(row.mediaKey, 'voice/new-2');
    assert.equal(row.mediaMime, 'audio/webm');
    assert.equal(row.mediaDeletedAt, null);
  });

  // 🔵 "Retired 생성이 실패하면 편지도 갱신하지 않는다"는 prisma.$transaction([...]) 배열 구성으로 보장한다
  // (둘 중 하나가 실패하면 전부 롤백). 실패를 만들어 낼 정직한 방법이 없어 별도 시험은 두지 않았다.
});

describe('파기 배치 ① — findRetiredExpired(§5.6-9-4 · D-12 #68)', () => {
  it('deletedAt + 30일이 지났고 purgedAt이 없는 행만 대상이다 — 행은 지우지 않는다', async () => {
    const tag = `r-${Date.now()}`;
    const mk = (suffix: string, ageDays: number, purged: boolean) =>
      prisma.farewellMediaRetired.create({
        data: {
          messageId: `m-${tag}-${suffix}`,
          mediaKey: `voice/${tag}-${suffix}`,
          deletedAt: new Date(Date.now() - ageDays * DAY),
          purgedAt: purged ? new Date() : null,
        },
        select: { id: true },
      });
    const expired = await mk('expired', 31, false);
    await mk('young', 10, false);
    await mk('done', 40, true);
    messageIds.push(`m-${tag}-expired`, `m-${tag}-young`, `m-${tag}-done`);

    const targets = (await findRetiredExpired()).filter((r) => r.mediaKey.startsWith(`voice/${tag}`));
    assert.deepEqual(targets.map((r) => r.id), [expired.id]);
  });
});
