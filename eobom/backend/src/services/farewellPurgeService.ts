import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import prisma from '../config/prisma';
import { isR2Enabled, getVoiceClient, getVoiceBucket } from '../config/r2';

// docs 06-05 §5.6-8·§5.6-8-1·§5.6-8-2·§5.6-8-3-3 — 유족 메시지 파기 로직의 단일 출처.
// prisma/destroy-farewell-media.ts(스크립트)와 farewellPurgeController.ts(어드민 화면)가
// 이 파일의 함수만 호출한다. 두 경로가 각자 로직을 가지면 한쪽만 고쳐지는 날이 온다(D-10 #6).

export const GRACE_DAYS = 30;

export const cutoff = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - GRACE_DAYS);
  return d;
};

// 🔴 버킷명이 -dev로 끝나면 개발 모드다(§5.6-8-2) — dev 버킷에는 아카이브가 없다(Worker가
// 운영 버킷만 감시, 00-11 §5.4-6-3). dev에서는 원장에 쓰지 않고 2단계 안내도 하지 않는다.
export const isDevEnvironment = (): boolean => getVoiceBucket().endsWith('-dev');

type MediaRow = { id: string; mediaKey: string | null };

// R2 원본을 지우고 mediaKey·mediaMime을 정리한다(§5.6-8 ①). 행은 건드리지 않는다.
// 🔴 순서 고정: ArchivePurgeQueue 행 생성 → R2 원본 삭제 → mediaKey 정리(§5.6-8-1-1 #46).
// 반환값: 운영 환경에서 실제로 원장에 올라간 키(2단계 안내용). dev 환경이거나 mediaKey가
// 없으면 null.
export async function purgeMediaRow(row: MediaRow): Promise<string | null> {
  if (!row.mediaKey) return null;
  const key = row.mediaKey;
  const bucket = getVoiceBucket();
  const dev = isDevEnvironment();

  if (!dev) {
    // 🔵 행만 남고 R2 삭제가 실패하는 쪽이 안전하다("지울 게 남았다") — 반대는 "지울 게
    // 있는지조차 모른다"가 된다(§5.6-8-1-1).
    await prisma.archivePurgeQueue.create({ data: { mediaKey: key, bucket } });
  }

  if (isR2Enabled()) {
    await getVoiceClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  await prisma.farewellMessage.update({
    where: { id: row.id },
    data: { mediaKey: null, mediaMime: null },
    select: { id: true },
  });

  return dev ? null : key;
}

// 편지 행 자체를 파기한다(§5.6-8 ②) — mediaKey가 남아 있으면 먼저 ①을 수행한다.
export async function purgeLetterRow(row: MediaRow): Promise<string | null> {
  const key = await purgeMediaRow(row);
  await prisma.farewellMessage.delete({ where: { id: row.id } });
  return key;
}

// ① 대상 — 편지는 살아 있고(deletedAt null) 음성만 만료된 것.
export async function findMediaExpired() {
  return prisma.farewellMessage.findMany({
    where: { mediaDeletedAt: { lte: cutoff() }, mediaKey: { not: null }, deletedAt: null },
    select: { id: true, mediaKey: true, mediaDeletedAt: true, title: true },
    orderBy: { mediaDeletedAt: 'asc' },
  });
}

// ② 대상 — 편지 자체가 만료된 것(첨부 유무 무관, purgeLetterRow가 내부에서 ①도 처리).
export async function findLetterExpired() {
  return prisma.farewellMessage.findMany({
    where: { deletedAt: { lte: cutoff() } },
    select: { id: true, mediaKey: true, deletedAt: true, title: true },
    orderBy: { deletedAt: 'asc' },
  });
}

// 서버 재검증(§5.6-8-3-1) — 화면이 보낸 id를 믿지 않고 지금 시점 기준으로 다시 만료를 확인한다.
export async function isStillMediaExpired(id: string): Promise<boolean> {
  const row = await prisma.farewellMessage.findUnique({
    where: { id },
    select: { mediaKey: true, mediaDeletedAt: true, deletedAt: true },
  });
  if (!row || !row.mediaKey || !row.mediaDeletedAt || row.deletedAt) return false;
  return row.mediaDeletedAt <= cutoff();
}

export async function isStillLetterExpired(id: string): Promise<boolean> {
  const row = await prisma.farewellMessage.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!row || !row.deletedAt) return false;
  return row.deletedAt <= cutoff();
}

// purgedAt IS NULL 건수 = 아카이브 2단계 미이행 잔량(§5.6-8-1-1 #48).
export async function countPendingArchivePurge(): Promise<number> {
  return prisma.archivePurgeQueue.count({ where: { purgedAt: null } });
}

export async function listPendingArchivePurge() {
  return prisma.archivePurgeQueue.findMany({ where: { purgedAt: null }, orderBy: { queuedAt: 'asc' } });
}
