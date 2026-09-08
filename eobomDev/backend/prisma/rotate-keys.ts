// 00-33 §6.2 — 키 로테이션 도구.
// 🔴 작성만 되어 있다 — 아직 실행하지 않는다. 실행은 db-safety.md 게이트를 통과해야 한다:
//   사람 승인 → 백업(backup-db.ps1 등) → 백업 파일 존재 확인 → 건수 확인(dry-run) → --confirm 실행.
// 00-15 §5.2 0단계에 따라 실행 후에도 이 파일을 지우지 않는다.
//
// 사용법:
//   npx ts-node prisma/rotate-keys.ts --source=SETTLEMENT              (dry-run — 건수만 보고)
//   npx ts-node prisma/rotate-keys.ts --source=SETTLEMENT --confirm    (실제 쓰기)
//   --source: SETTLEMENT | ENDING_NOTE | HASH_INDEX 중 하나. 한 번에 하나만(§6.2 표) —
//             키 소스가 다르면 사고 시 영향 범위도 달라야 한다.
//
// 전제: 회전 대상 키(SETTLEMENT_ENCRYPTION_KEY / ENDING_NOTE_ENCRYPTION_KEY / HASH_INDEX_KEY)가
// 이미 새 값으로 .env에 반영되어 있고, 옛 값은 `${그 이름}_V1`으로 옮겨져 있어야 한다(§6.3).
// 그렇지 않은 상태(키 교체가 실제로 일어나지 않은 평상시)에 돌리면, 옛 값이 곧 지금 값과 같아
// 실질적인 변화 없이 v1(프리픽스 없음) 데이터를 v2(프리픽스 있음) 형식으로만 정규화한다 —
// 그 자체로는 안전하지만 목적(키 교체)을 달성하지 않으므로 혼동하지 말 것.

import prisma from '../src/config/prisma';
import {
  encryptField,
  decryptField,
  encryptNoteField,
  decryptNoteField,
  hashField,
} from '../src/utils/crypto';

type Source = 'SETTLEMENT' | 'ENDING_NOTE' | 'HASH_INDEX';
const VALID_SOURCES: Source[] = ['SETTLEMENT', 'ENDING_NOTE', 'HASH_INDEX'];

const args = process.argv.slice(2);
const source = args.find((a) => a.startsWith('--source='))?.split('=')[1] as Source | undefined;
const confirmed = args.includes('--confirm');

const isV2 = (stored: string): boolean => stored.startsWith('v2:');

// 암호문 컬럼 하나를 처리한다. §3.1대로 점진 허용 — 배치(한 건씩, 트랜잭션 없음)로 돌리며
// 중단 후 재실행해도 안전하다(멱등: 이미 v2인 행은 건너뜀).
async function rotateCiphertextColumn(
  label: string,
  rows: { id: string; stored: string }[],
  decrypt: (stored: string) => string,
  encrypt: (plain: string) => string,
  update: (id: string, next: string) => Promise<unknown>,
): Promise<void> {
  const pending = rows.filter((r) => !isV2(r.stored));
  console.log(
    `[${label}] 대상 ${rows.length}건 · 이미 v2 ${rows.length - pending.length}건 · 처리 필요 ${pending.length}건`,
  );

  if (!confirmed) return;

  let done = 0;
  for (const row of pending) {
    const plain = decrypt(row.stored);
    await update(row.id, encrypt(plain));
    done += 1;
  }
  console.log(`[${label}] 완료: ${done}건 처리`);
}

async function rotateSettlement(): Promise<void> {
  const familyDesignations = await prisma.familyDesignation.findMany({
    select: { id: true, phoneEnc: true, emailEnc: true },
  });
  await rotateCiphertextColumn(
    'FamilyDesignation.phoneEnc',
    familyDesignations.map((r) => ({ id: r.id, stored: r.phoneEnc })),
    decryptField,
    encryptField,
    (id, next) => prisma.familyDesignation.update({ where: { id }, data: { phoneEnc: next } }),
  );
  await rotateCiphertextColumn(
    'FamilyDesignation.emailEnc',
    familyDesignations
      .filter((r): r is typeof r & { emailEnc: string } => r.emailEnc != null)
      .map((r) => ({ id: r.id, stored: r.emailEnc })),
    decryptField,
    encryptField,
    (id, next) => prisma.familyDesignation.update({ where: { id }, data: { emailEnc: next } }),
  );

  const partners = await prisma.partner.findMany({
    where: { settlementAccount: { not: null } },
    select: { id: true, settlementAccount: true },
  });
  await rotateCiphertextColumn(
    'Partner.settlementAccount',
    partners.map((r) => ({ id: r.id, stored: r.settlementAccount as string })),
    decryptField,
    encryptField,
    (id, next) => prisma.partner.update({ where: { id }, data: { settlementAccount: next } }),
  );

  const experts = await prisma.expert.findMany({
    where: { settlementAccount: { not: null } },
    select: { id: true, settlementAccount: true },
  });
  await rotateCiphertextColumn(
    'Expert.settlementAccount',
    experts.map((r) => ({ id: r.id, stored: r.settlementAccount as string })),
    decryptField,
    encryptField,
    (id, next) => prisma.expert.update({ where: { id }, data: { settlementAccount: next } }),
  );

  const obituaries = await prisma.obituary.findMany({
    where: { accountNumberEnc: { not: null } },
    select: { id: true, accountNumberEnc: true },
  });
  await rotateCiphertextColumn(
    'Obituary.accountNumberEnc',
    obituaries.map((r) => ({ id: r.id, stored: r.accountNumberEnc as string })),
    decryptField,
    encryptField,
    (id, next) => prisma.obituary.update({ where: { id }, data: { accountNumberEnc: next } }),
  );

  if (confirmed) {
    const remaining =
      (await prisma.familyDesignation.count({ where: { NOT: { phoneEnc: { startsWith: 'v2:' } } } })) +
      (await prisma.familyDesignation.count({
        where: { emailEnc: { not: null }, NOT: { emailEnc: { startsWith: 'v2:' } } },
      })) +
      (await prisma.partner.count({
        where: { settlementAccount: { not: null }, NOT: { settlementAccount: { startsWith: 'v2:' } } },
      })) +
      (await prisma.expert.count({
        where: { settlementAccount: { not: null }, NOT: { settlementAccount: { startsWith: 'v2:' } } },
      })) +
      (await prisma.obituary.count({
        where: { accountNumberEnc: { not: null }, NOT: { accountNumberEnc: { startsWith: 'v2:' } } },
      }));
    console.log(`[SETTLEMENT] 검증: NOT LIKE 'v2:%' 잔여 ${remaining}건 (0이어야 함)`);
  }
}

async function rotateEndingNote(): Promise<void> {
  const entries = await prisma.endingNoteEntry.findMany({ select: { id: true, bodyEnc: true } });
  await rotateCiphertextColumn(
    'EndingNoteEntry.bodyEnc',
    entries.map((r) => ({ id: r.id, stored: r.bodyEnc })),
    decryptNoteField,
    encryptNoteField,
    (id, next) => prisma.endingNoteEntry.update({ where: { id }, data: { bodyEnc: next } }),
  );

  const messages = await prisma.farewellMessage.findMany({ select: { id: true, bodyEnc: true } });
  await rotateCiphertextColumn(
    'FarewellMessage.bodyEnc',
    messages.map((r) => ({ id: r.id, stored: r.bodyEnc })),
    decryptNoteField,
    encryptNoteField,
    (id, next) => prisma.farewellMessage.update({ where: { id }, data: { bodyEnc: next } }),
  );

  if (confirmed) {
    const remaining =
      (await prisma.endingNoteEntry.count({ where: { NOT: { bodyEnc: { startsWith: 'v2:' } } } })) +
      (await prisma.farewellMessage.count({ where: { NOT: { bodyEnc: { startsWith: 'v2:' } } } }));
    console.log(`[ENDING_NOTE] 검증: NOT LIKE 'v2:%' 잔여 ${remaining}건 (0이어야 함)`);
  }
}

// familyDesignationController.ts의 PHONE_HASH_DOMAIN과 반드시 같은 값이어야 한다 — 다르면
// 새로 계산한 해시가 정상 등록 경로가 만드는 값과 어긋난다.
const PHONE_HASH_DOMAIN = 'phone-index';

// 🔴 해시는 §3.2·§6.2에 따라 배치를 쓰지 않고 단일 트랜잭션으로만 처리한다 — 중간에 멈추면
// @@unique([userId, phoneHash])가 조용히 무효화되는 혼재 상태가 된다. 프리픽스가 없으므로
// 멱등성은 "재계산 결과가 이미 저장값과 같은가"로 판단한다(같으면 이미 새 키로 계산된 것).
async function rotateHashIndex(): Promise<void> {
  const rows = await prisma.familyDesignation.findMany({
    select: { id: true, phoneEnc: true, phoneHash: true },
  });
  const pending = rows
    .map((r) => ({ id: r.id, next: hashField(decryptField(r.phoneEnc), PHONE_HASH_DOMAIN), current: r.phoneHash }))
    .filter((r) => r.next !== r.current);

  console.log(
    `[FamilyDesignation.phoneHash] 대상 ${rows.length}건 · 이미 일치 ${rows.length - pending.length}건 · 처리 필요 ${pending.length}건`,
  );

  if (!confirmed) return;
  if (pending.length === 0) {
    console.log('[FamilyDesignation.phoneHash] 처리할 행이 없습니다.');
    return;
  }

  await prisma.$transaction(
    pending.map((r) => prisma.familyDesignation.update({ where: { id: r.id }, data: { phoneHash: r.next } })),
  );
  console.log(`[FamilyDesignation.phoneHash] 완료: ${pending.length}건 처리 (단일 트랜잭션)`);
}

async function main(): Promise<void> {
  if (!source || !VALID_SOURCES.includes(source)) {
    console.error('사용법: npx ts-node prisma/rotate-keys.ts --source=SETTLEMENT|ENDING_NOTE|HASH_INDEX [--confirm]');
    process.exit(1);
  }

  console.log(`=== 키 로테이션: ${source} (${confirmed ? '실행 모드' : 'dry-run — 건수만 보고'}) ===`);
  if (!confirmed) {
    console.log('🔴 --confirm 없이 실행됨 — 아무것도 쓰지 않습니다. db-safety.md 게이트(승인·백업·파일확인) 통과 후 --confirm으로 재실행할 것.');
  }

  if (source === 'SETTLEMENT') await rotateSettlement();
  if (source === 'ENDING_NOTE') await rotateEndingNote();
  if (source === 'HASH_INDEX') await rotateHashIndex();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
