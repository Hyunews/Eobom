import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { MEMORIAL_PHOTO_DIR } from '../config/upload';

// docs 00-20 §8.1-1 "purgeAt 파기"(09-30 확정) — purgeAt이 지난 추모관을 방명록·헌화·사진과 함께 삭제한다.
// prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 수동 파기 스크립트)만 이 파일을 부른다.
// 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다 — 새 스케줄러 금지. accountPurgeService와 같은 방식.
//
// purgeAt을 채우는 경로: 탈퇴 요청(+30일, accountDeletionController) · 개설자가 직접 닫음(+30일, closeMemorial, 09-30) · (미구현) 동결 +3년.
// 🔴 통지 실패 기록이 있으면 건너뛴다(§5.2-1)는 동결 경로 몫이라 여기엔 없다 — 그 경로가 생길 때 findMemorialExpired에 조건을 더할 것.
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

// 옛 행(purgeAt null)은 기준 시각이 closedAt + 30일이라 dry-run 출력용으로 그 값을 purgeAt 자리에 계산해 돌려준다(DB엔 안 쓴다).
export async function findMemorialExpired(): Promise<ExpiredMemorial[]> {
  const rows = await prisma.memorial.findMany({
    where: expiredWhere(new Date()),
    select: { id: true, purgeAt: true, closedAt: true },
  });
  return rows
    .map((r) => ({ id: r.id, purgeAt: r.purgeAt ?? new Date((r.closedAt as Date).getTime() + CLOSE_GRACE_DAYS * 24 * 60 * 60 * 1000) }))
    .sort((a, b) => a.purgeAt.getTime() - b.purgeAt.getTime());
}

// 목록을 만든 뒤 실행하기까지 사이에 "계속 이용"으로 purgeAt이 비워졌거나 운영자가 내렸을 수 있다 — 지우기 직전에 같은 조건으로 다시 본다.
export async function isStillMemorialExpired(id: string): Promise<boolean> {
  return (await prisma.memorial.count({ where: { id, ...expiredWhere(new Date()) } })) === 1;
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
