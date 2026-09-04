// 06-05 §5.6-8·§5.6-8-1·§5.6-8-2 D-8+D-9+D-10 — 유족 메시지 파기 배치.
// 🔴 이 파일은 개발용·비상용이다(§5.6-8-2) — 운영에서 사람이 쓰는 정상 경로는 어드민
// 파기 화면(D-11)이다. 로직은 어드민과 같은 farewellPurgeService.ts를 공유한다.
// 🔴 런타임 코드(컨트롤러·라우트·스케줄러)가 이 파일을 부르지 않는다.
// 🔴 작성만 되어 있다 — 실행은 db-safety.md 게이트를 통과해야 한다:
//   사람 승인 → 백업(backup-db.ps1 등) → 백업 파일 존재 확인 → 건수 확인(dry-run) → --confirm 실행.
//
// 사용법:
//   npx ts-node prisma/destroy-farewell-media.ts              (dry-run — 몇 건을 지울지 출력만)
//   npx ts-node prisma/destroy-farewell-media.ts --confirm    (실제 삭제)
//
// 한 배치가 두 만료를 본다(§5.6-8):
//   ① mediaDeletedAt + 30일 — R2 원본 삭제 → mediaKey·mediaMime 정리. 행은 남긴다.
//   ② deletedAt + 30일 — mediaKey가 있으면 ①을 먼저 하고, 그다음 행을 파기한다.
//   ③ 고아 객체 스윕은 이번에 만들지 않는다(⏸ §5.6-8 ③).
//
// 🔴 아카이브는 이 스크립트가 지우지 않는다(§5.6-8-1 D-9) — 백엔드는 아카이브 버킷에 대한
// S3 자격증명을 원천적으로 갖지 않는다(새 토큰도 발급하지 않는다). 파기는 2단계다:
//   1단계(여기) — ArchivePurgeQueue에 원장 행 생성 → R2 원본 삭제 → mediaKey 정리.
//   2단계(사람) — 본인 Cloudflare 로그인(대시보드 또는 wrangler)으로 원장의 키를
//                 아카이브 버킷에서 직접 지운 뒤, 어드민 화면(D-11)에서 완료 표시한다.
// 🔴 dev 버킷(R2_BUCKET_FAREWELL_VOICE가 -dev로 끝남)에는 애초에 아카이브가 없다(§5.6-8-2) —
// 이 경우 원장에 쓰지 않고 2단계 안내도 출력하지 않는다. 환경 판별은 farewellPurgeService가 한다.

import readline from 'readline';
import prisma from '../src/config/prisma';
import { getVoiceBucket, isR2Enabled } from '../src/config/r2';
import {
  cutoff,
  isDevEnvironment,
  purgeMediaRow,
  purgeLetterRow,
  findMediaExpired,
  findLetterExpired,
  countPendingArchivePurge,
} from '../src/services/farewellPurgeService';

const confirmed = process.argv.includes('--confirm');

// DATABASE_URL에서 비밀번호를 뺀 host만 뽑는다 — 화면에 자격증명을 찍지 않는다(security.md §1).
const dbHostLabel = (): string => {
  const raw = process.env.DATABASE_URL || '';
  try {
    const u = new URL(raw);
    return `${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}`;
  } catch {
    return '(DATABASE_URL 파싱 실패)';
  }
};

const ask = (question: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
};

// 🔴 환경을 사람의 기억에 맡기지 않는다(§5.6-8-2 #51) — 시작 시 대상을 먼저 출력하고,
// --confirm이면 한 번 더 확인시킨다.
async function printTargetBanner(): Promise<void> {
  const dev = isDevEnvironment();
  console.log('=== 대상 확인 ===');
  console.log(`  DB 호스트   : ${dbHostLabel()}`);
  console.log(`  R2 버킷     : ${getVoiceBucket()}`);
  console.log(`  환경        : ${dev ? '개발(dev) — 아카이브 없음' : '운영 — 아카이브 있음, 2단계 필요'}`);
  console.log(`  실행 모드   : ${confirmed ? '실행(--confirm)' : 'dry-run'}`);
  console.log('==================');

  if (confirmed) {
    const answer = await ask('위 대상이 맞으면 "yes"를 입력하세요: ');
    if (answer.trim() !== 'yes') {
      console.log('중단됨 — "yes"가 아닌 입력으로 실행을 취소합니다.');
      process.exit(1);
    }
  }
}

async function main(): Promise<void> {
  console.log(`=== 유족 메시지 파기 배치 (${confirmed ? '실행 모드' : 'dry-run — 건수만 출력'}) ===`);
  await printTargetBanner();

  if (!confirmed) {
    console.log('🔴 --confirm 없이 실행됨 — 아무것도 지우지 않습니다. db-safety.md 게이트(승인·백업·파일확인) 통과 후 --confirm으로 재실행할 것.');
  }
  if (!isR2Enabled()) {
    console.log('🟡 R2_ENABLED=false — R2 원본 삭제는 건너뛰고 DB 정리만 수행합니다.');
  }

  const purgedKeys: string[] = [];

  // ① mediaDeletedAt + 30일 — 편지는 살아 있고 음성만 만료된 것
  const mediaExpired = await findMediaExpired();
  console.log(`[①음성 만료] 대상 ${mediaExpired.length}건 (기준: ${cutoff().toISOString()})`);
  if (confirmed) {
    for (const row of mediaExpired) {
      const key = await purgeMediaRow(row);
      if (key) purgedKeys.push(key);
    }
    console.log(`[①음성 만료] 완료: ${mediaExpired.length}건 R2 원본 삭제 + mediaKey 정리`);
  }

  // ② deletedAt + 30일 — 편지 자체가 만료된 것. mediaKey가 남아 있으면 ①을 먼저 수행.
  const letterExpired = await findLetterExpired();
  console.log(`[②편지 만료] 대상 ${letterExpired.length}건 (그 중 첨부 있음 ${letterExpired.filter((r) => r.mediaKey).length}건)`);
  if (confirmed) {
    for (const row of letterExpired) {
      const key = await purgeLetterRow(row);
      if (key) purgedKeys.push(key);
    }
    console.log(`[②편지 만료] 완료: ${letterExpired.length}건 행 파기`);
  }

  // ③ 고아 객체 스윕 — ⏸ 이번에 만들지 않는다(§5.6-8 ③).

  // 🟡 "완료"라고만 찍으면 절반만 지운 상태를 다 지운 것으로 오인한다(§5.6-8-1-1 #48).
  if (confirmed && !isDevEnvironment()) {
    const pending = await countPendingArchivePurge();
    console.log('');
    if (pending > 0) {
      console.log(`🔴 아카이브 ${pending}건 미이행 — 2단계 필요.`);
      console.log('   본인 Cloudflare 로그인(대시보드 또는 wrangler)으로 eobom-farewell-voice-archive');
      console.log('   버킷에서 위 키들을 직접 지운 뒤, 어드민 파기 화면에서 완료 표시하세요(§5.6-8-1).');
      console.log('   🔴 새 토큰을 발급하지 않습니다 — 이미 있는 사람의 로그인만 씁니다.');
    } else {
      console.log('🔵 아카이브 미이행 없음(purgedAt IS NULL 0건).');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
