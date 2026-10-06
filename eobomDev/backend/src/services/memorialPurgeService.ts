import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { MEMORIAL_PHOTO_DIR } from '../config/upload';
import { getReconfirmGate } from '../utils/memorialLifecycle';

// docs 00-20 §8.1-1 "purgeAt 파기"(09-30 확정) — purgeAt이 지난 추모관을 방명록·헌화·사진과 함께 삭제한다.
// prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 수동 파기 스크립트)만 이 파일을 부른다.
// 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다 — 새 스케줄러 금지. accountPurgeService와 같은 방식.
//
// purgeAt을 채우는 경로: 탈퇴 요청(+30일, accountDeletionController) · 개설자가 직접 닫음(+30일, closeMemorial, 09-30) · 동결 +3년(memorialLifecycleService, 10-06).
// 🔴 동결 경로는 파기 전 재확인 통지가 SENT여야 한다(§5.2-1) — 아래 판정(judge)이 그 관문이다.
//
// 한 추모관의 순서(고정):
//   1. 사진 파일 경로를 먼저 뽑아 둔다(행이 지워지면 url을 잃는다).
//   2. 한 트랜잭션 — Obituary.memorialId를 null로 끊고(FK에 onDelete가 없어 안 끊으면 삭제가 막힌다) 추모관 행 삭제.
//      MemorialGuestbook·MemorialTribute·MemorialPhoto는 Cascade로 함께 지워진다.
//      🔴 부고장 행은 지우지 않는다 — 탈퇴한 회원의 부고장은 accountPurgeService가 지운다. 여기서는 연결만 끊는다.
//   3. DB가 성공한 뒤에 로컬 디스크 사진 파일을 지운다(실패해도 행은 이미 없다 — 경고만, 고아 파일로 남는다).

export type ExpiredMemorial = { id: string; purgeAt: Date };

export type MemorialPlan = {
  memorial: ExpiredMemorial;
  guestbook: number;
  tributes: number;
  photos: number;
  obituaryLinks: number; // memorialId를 null로 끊는 부고장 수
};

// 대상 조건(09-30) — `purgeAt ≤ now` 또는 `(purgeAt IS NULL AND closedAt ≤ now − 30일)`.
// 뒤쪽은 purgeAt을 안 채우던 시절에 직접 닫힌 옛 행 — DB 값을 채우지 않고(일괄 update 금지) 조건으로만 잡는다.
// 🔴 hiddenAt만 있고 closedAt이 없는 추모관(운영자가 내린 것)은 대상이 아니다 — 두 조건 모두 값이 있어야 하므로 자연히 빠진다.
// 🔴 hiddenAt이 있으면 closedAt·purgeAt이 있어도 건너뛴다 — 운영자가 내린 추모관은 자동 파기하지 않는다(증거로 남김, 00-20 §6.2).
const CLOSE_GRACE_DAYS = 30;
const expiredWhere = (now: Date) => ({
  hiddenAt: null,
  OR: [
    { purgeAt: { not: null, lte: now } },
    { purgeAt: null, closedAt: { not: null, lte: new Date(now.getTime() - CLOSE_GRACE_DAYS * 24 * 60 * 60 * 1000) } },
  ],
});

// 🔴 통지 관문(10-06, 00-20 §5.2-1) — 개설자가 닫지 않은 추모관(= 동결 +3년으로 도래한 것)은 파기 전 재확인 통지가 SENT여야 한다.
// 통지 실패 기록이 있거나 재확인을 안 보냈거나 보낸 지 30일이 안 됐으면 건너뛴다(동결 유지). 닫은 추모관(closedAt 있음)은 본인이 정한 파기라 관문이 없다.
const candidateSelect = {
  id: true,
  purgeAt: true,
  closedAt: true,
  notices: { where: { kind: 'RECONFIRM' }, select: { kind: true, result: true, createdAt: true } },
} as const;

type Candidate = {
  id: string;
  purgeAt: Date | null;
  closedAt: Date | null;
  notices: { kind: string; result: string; createdAt: Date }[];
};

const judge = (r: Candidate, now: Date): { target: ExpiredMemorial | null; skippedReason: string | null } => {
  // 옛 행(purgeAt null)은 기준 시각이 closedAt + 30일이라 dry-run 출력용으로 그 값을 purgeAt 자리에 계산해 돌려준다(DB엔 안 쓴다).
  const purgeAt = r.purgeAt ?? new Date((r.closedAt as Date).getTime() + CLOSE_GRACE_DAYS * 24 * 60 * 60 * 1000);
  if (r.closedAt === null) {
    const gate = getReconfirmGate(purgeAt, r.notices, now);
    if (!gate.passed) return { target: null, skippedReason: gate.reason };
  }
  return { target: { id: r.id, purgeAt }, skippedReason: null };
};

// 파기 대상과, 도래했지만 관문에 막혀 건너뛴 건(사유 포함)을 함께 돌려준다 — dry-run이 둘 다 보여 준다.
export async function findMemorialExpiredWithSkips(
  now = new Date(),
): Promise<{ targets: ExpiredMemorial[]; skipped: { id: string; purgeAt: Date; reason: string }[] }> {
  const rows = await prisma.memorial.findMany({ where: expiredWhere(now), select: candidateSelect });
  const targets: ExpiredMemorial[] = [];
  const skipped: { id: string; purgeAt: Date; reason: string }[] = [];
  for (const r of rows) {
    const { target, skippedReason } = judge(r, now);
    if (target) targets.push(target);
    else skipped.push({ id: r.id, purgeAt: (r.purgeAt ?? r.closedAt) as Date, reason: skippedReason as string });
  }
  targets.sort((a, b) => a.purgeAt.getTime() - b.purgeAt.getTime());
  return { targets, skipped };
}

export async function findMemorialExpired(): Promise<ExpiredMemorial[]> {
  return (await findMemorialExpiredWithSkips()).targets;
}

// 목록을 만든 뒤 실행하기까지 사이에 "계속 이용"으로 purgeAt이 비워졌거나 운영자가 내렸을 수 있다 — 지우기 직전에 같은 조건(관문 포함)으로 다시 본다.
export async function isStillMemorialExpired(id: string): Promise<boolean> {
  const now = new Date();
  const row = await prisma.memorial.findFirst({ where: { id, ...expiredWhere(now) }, select: candidateSelect });
  return row !== null && judge(row, now).target !== null;
}

// 조회뿐이다(dry-run 출력 겸 범위 확인).
export async function planMemorial(memorial: ExpiredMemorial): Promise<MemorialPlan> {
  const memorialId = memorial.id;
  const [guestbook, tributes, photos, obituaryLinks] = await prisma.$transaction([
    prisma.memorialGuestbook.count({ where: { memorialId } }),
    prisma.memorialTribute.count({ where: { memorialId } }),
    prisma.memorialPhoto.count({ where: { memorialId } }),
    prisma.obituary.count({ where: { memorialId } }),
  ]);
  return { memorial, guestbook, tributes, photos, obituaryLinks };
}

export async function purgeMemorial(memorial: ExpiredMemorial): Promise<{ purged: boolean; files: number; reason?: string }> {
  if (!(await isStillMemorialExpired(memorial.id))) return { purged: false, files: 0, reason: 'purgeAt이 비워졌거나 아직 아님(복구됐거나 이미 파기됨)' };

  const photos = await prisma.memorialPhoto.findMany({ where: { memorialId: memorial.id }, select: { url: true } });

  await prisma.$transaction([
    prisma.obituary.updateMany({ where: { memorialId: memorial.id }, data: { memorialId: null } }),
    prisma.memorial.delete({ where: { id: memorial.id } }), // 방명록·헌화·사진 Cascade
  ]);

  let files = 0;
  for (const p of photos) {
    // 🔴 basename만 쓴다 — url이 무엇이든 MEMORIAL_PHOTO_DIR 밖은 건드리지 않는다
    const filename = path.basename(p.url);
    try {
      await fs.promises.unlink(path.join(MEMORIAL_PHOTO_DIR, filename));
      files++;
    } catch (err) {
      console.warn('추모 사진 파일 삭제 실패(무시):', filename, (err as Error).message);
    }
  }
  return { purged: true, files };
}
