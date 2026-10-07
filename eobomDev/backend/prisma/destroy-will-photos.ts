// 06-06 §5-2-6 — 유언장 사진 일괄 파기(사장님이 사진 보관을 금지했을 때).
// 🔴 개발용·비상용이다 — 정상 만료분(본인 삭제 + 30일)은 어드민 파기 화면 ④나 destroy-farewell-media.ts가 지운다.
// 🔴 런타임 코드(컨트롤러·라우트·스케줄러)가 이 파일을 부르지 않는다.
// 🔴 --confirm은 사람만 실행한다(command-guard 훅이 막는다). 실행 전 db-safety.md 게이트:
//   사람 승인 → backup-db.ps1 -Target <같은 대상> → 백업 파일 확인 → dry-run 건수 확인 → --confirm.
//
// 사용법:
//   npx ts-node prisma/destroy-will-photos.ts --all              (dry-run — 아직 R2에 남은 묶음 전부를 세기만)
//   npx ts-node prisma/destroy-will-photos.ts --all --confirm    (실제 삭제: R2 원본 삭제 → purgedAt)
// 끝나면 Cloudflare 대시보드에서 eobom-will-photo 버킷이 비었는지 사람이 확인한다.
//
// 🔴 R2_WILL_ENABLED=false여도 버킷 변수(R2_ENDPOINT·R2_WILL_*)만 있으면 지울 수 있다 — 금지 뒤에 지우는 것이 이 스크립트의 일이다.

import readline from 'readline';
import prisma from '../src/config/prisma';
import { getWillBucket, isWillBucketConfigured } from '../src/config/r2';
import { findAllUnpurgedWillPhotoSets, purgeWillPhotoSet } from '../src/services/willPhotoService';

const confirmed = process.argv.includes('--confirm');
const all = process.argv.includes('--all');

// DATABASE_URL에서 비밀번호를 뺀 host만 뽑는다 — 화면에 자격증명을 찍지 않는다(security.md §1).
const dbHostLabel = (): string => {
  try {
    const u = new URL(process.env.DATABASE_URL || '');
    return `${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}`;
  } catch {
    return '(DATABASE_URL 파싱 실패)';
  }
};

const ask = (question: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
};

async function main(): Promise<void> {
  if (!all) {
    console.log('사용법: destroy-will-photos.ts --all [--confirm]   (--all 없이는 아무것도 하지 않습니다)');
    process.exit(1);
  }
  if (!isWillBucketConfigured()) {
    console.log('R2_ENDPOINT·R2_WILL_ACCESS_KEY_ID·R2_WILL_SECRET_ACCESS_KEY·R2_WILL_BUCKET 중 빠진 변수가 있어 R2에 접근할 수 없습니다.');
    process.exit(1);
  }

  const bucket = getWillBucket();
  console.log('=== 대상 확인 ===');
  console.log(`  DB 호스트   : ${dbHostLabel()}`);
  console.log(`  R2 버킷     : ${bucket}${bucket.endsWith('-dev') ? ' (개발)' : ' (🔴 운영)'}`);
  console.log(`  실행 모드   : ${confirmed ? '실행(--confirm)' : 'dry-run'}`);
  console.log('==================');
  if (confirmed) {
    const answer = await ask('위 대상이 맞으면 "yes"를 입력하세요: ');
    if (answer.trim() !== 'yes') {
      console.log('중단됨 — "yes"가 아닌 입력으로 실행을 취소합니다.');
      process.exit(1);
    }
  }

  const sets = await findAllUnpurgedWillPhotoSets();
  const deleted = sets.filter((s) => s.deletedAt).length;
  console.log(`[유언장 사진 일괄] 대상 ${sets.length}묶음 (그 중 본인이 이미 삭제한 것 ${deleted}묶음)`);
  if (!confirmed) {
    console.log('🔴 --confirm 없이 실행됨 — 아무것도 지우지 않습니다. db-safety.md 게이트(승인·백업·파일확인) 통과 후 --confirm으로 재실행할 것.');
    return;
  }

  let photos = 0;
  for (const s of sets) photos += await purgeWillPhotoSet(s.id);
  console.log(`[유언장 사진 일괄] 완료: ${sets.length}묶음 · 사진 ${photos}장 R2 원본 삭제 + purgedAt 기록`);
  console.log('다음: Cloudflare에서 버킷이 비었는지 확인하세요.');
}

main()
  .catch((e) => {
    console.error('유언장 사진 일괄 파기 실패:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
