import prisma from '../config/prisma';
import { willPhotoStorage } from './willPhotoStorage';
import { cutoff } from './farewellPurgeService';

// docs 06-06 §5-2 — 유언장 사진 보관의 단일 출처. ocrController(저장)·willPhotoController(목록·보기·삭제)·
// farewellPurgeController(어드민 파기 ④)·accountPurgeService(탈퇴 파기)·prisma/destroy-will-photos.ts(일괄 파기)가
// 이 파일만 부른다 — 한쪽만 고쳐지는 날이 오지 않게 한다(farewellPurgeService와 같은 원칙).

// §5-2-2 상한(잠정) — 회원당 묶음 10개. 본인이 삭제한 묶음(deletedAt)은 세지 않는다.
export const MAX_WILL_PHOTO_SETS = 10;
export const LIMIT_MESSAGE = '보관 사진이 10묶음을 넘었습니다. 이전 사진을 삭제한 뒤 보관할 수 있습니다.';

export type WillPhotoItem = { buffer: Buffer; mime: string };
export type StoreResult = { stored: true; setId: string } | { stored: false; reason: 'LIMIT' };

// 살아 있는 묶음 = 본인이 지우지 않았고 R2에서도 안 지워진 것.
const aliveWhere = (userId: string) => ({ userId, deletedAt: null, purgedAt: null });

// 인식에 성공한 요청 안에서 부른다(§5-2-2). 상한을 넘으면 저장 없이 LIMIT. R2 업로드가 하나라도 실패하면
// 이미 올린 것을 치우고 던진다(호출 측이 "보관 못 함"으로 알리고 인식 결과는 그대로 돌려준다).
export async function storeWillPhotoSet(userId: string, items: WillPhotoItem[]): Promise<StoreResult> {
  if (items.length === 0) return { stored: false, reason: 'LIMIT' };
  const alive = await prisma.willPhotoSet.count({ where: aliveWhere(userId) });
  if (alive >= MAX_WILL_PHOTO_SETS) return { stored: false, reason: 'LIMIT' };

  const keys: string[] = [];
  try {
    for (const item of items) keys.push(await willPhotoStorage.put(item.buffer));
    const set = await prisma.willPhotoSet.create({
      data: {
        userId,
        pageCount: items.length,
        photos: { create: items.map((it, i) => ({ pageIndex: i, mediaKey: keys[i], mediaMime: it.mime, sizeBytes: it.buffer.length })) },
      },
      select: { id: true },
    });
    return { stored: true, setId: set.id };
  } catch (e) {
    await Promise.allSettled(keys.map((k) => willPhotoStorage.remove(k)));
    throw e;
  }
}

// 목록(§5-2-4 ⑨ `보관한 사진`) — 본인 것만, 최근 순. 키·크기는 내려주지 않는다.
export async function listWillPhotoSets(userId: string) {
  const sets = await prisma.willPhotoSet.findMany({
    where: aliveWhere(userId),
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, pageCount: true, photos: { orderBy: { pageIndex: 'asc' }, select: { mediaMime: true } } },
  });
  return sets.map((s) => ({ id: s.id, createdAt: s.createdAt, pageCount: s.pageCount, mimes: s.photos.map((p) => p.mediaMime) }));
}

// 사진 한 쪽을 복호화해 돌려준다. 🔴 소유권은 묶음 기준(userId) — 키를 파라미터로 받지 않는다.
export async function readWillPhoto(userId: string, setId: string, pageIndex: number): Promise<{ buffer: Buffer; mime: string } | null> {
  const photo = await prisma.willPhoto.findFirst({
    where: { setId, pageIndex, purgedAt: null, set: aliveWhere(userId) },
    select: { mediaKey: true, mediaMime: true },
  });
  if (!photo) return null;
  return { buffer: await willPhotoStorage.get(photo.mediaKey), mime: photo.mediaMime };
}

// 본인 삭제(§5-2-5 ①) — 소프트. R2는 그대로 두고 deletedAt + 30일에 어드민 파기 ④가 지운다.
export async function softDeleteWillPhotoSet(userId: string, setId: string): Promise<boolean> {
  const r = await prisma.willPhotoSet.updateMany({ where: { id: setId, ...aliveWhere(userId) }, data: { deletedAt: new Date() } });
  return r.count > 0;
}

// ── 파기 ──────────────────────────────────────────────────────────────

// ④ 대상 — 본인이 지운 지 30일이 지났고 아직 R2에 남은 묶음(§5-2-5 ②).
export async function findWillPhotoExpired() {
  return prisma.willPhotoSet.findMany({
    where: { purgedAt: null, deletedAt: { lte: cutoff() } },
    select: { id: true, deletedAt: true, pageCount: true },
    orderBy: { deletedAt: 'asc' },
  });
}

// 서버 재검증 — 화면이 보낸 id를 믿지 않는다(§5.6-8-3-1과 같다).
export async function isStillWillPhotoExpired(id: string): Promise<boolean> {
  const row = await prisma.willPhotoSet.findUnique({ where: { id }, select: { purgedAt: true, deletedAt: true } });
  return !!row && !row.purgedAt && !!row.deletedAt && row.deletedAt <= cutoff();
}

// 묶음 하나의 R2 원본을 지우고 purgedAt을 찍는다. 🔴 순서 고정: R2 삭제 → purgedAt(행은 지우지 않는다).
// 복제(archive)가 없으므로 원장(ArchivePurgeQueue)에 올리지 않는다. R2 삭제가 실패하면 던진다 — purgedAt이 안 찍혀 다음에 이어진다.
export async function purgeWillPhotoSet(setId: string): Promise<number> {
  const photos = await prisma.willPhoto.findMany({ where: { setId, purgedAt: null }, select: { id: true, mediaKey: true } });
  for (const p of photos) {
    await willPhotoStorage.remove(p.mediaKey);
    await prisma.willPhoto.update({ where: { id: p.id }, data: { purgedAt: new Date() }, select: { id: true } });
  }
  await prisma.willPhotoSet.update({ where: { id: setId }, data: { purgedAt: new Date() }, select: { id: true } });
  return photos.length;
}

// 탈퇴 파기(§5-2-5 ④) — 그 회원의 아직 안 지워진 묶음 전부(본인 삭제 여부와 무관). 엔딩노트·회원 행보다 먼저 부른다.
export async function purgeUserWillPhotos(userId: string): Promise<{ sets: number; photos: number }> {
  const sets = await prisma.willPhotoSet.findMany({ where: { userId, purgedAt: null }, select: { id: true } });
  let photos = 0;
  for (const s of sets) photos += await purgeWillPhotoSet(s.id);
  return { sets: sets.length, photos };
}

export async function countUserWillPhotoSets(userId: string): Promise<number> {
  return prisma.willPhotoSet.count({ where: { userId, purgedAt: null } });
}

// 일괄 파기(§5-2-6 ②, 사장님이 금지했을 때) — 아직 R2에 남은 묶음 전부.
export async function findAllUnpurgedWillPhotoSets() {
  return prisma.willPhotoSet.findMany({
    where: { purgedAt: null },
    select: { id: true, createdAt: true, deletedAt: true, pageCount: true },
    orderBy: { createdAt: 'asc' },
  });
}
