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
// 한 배치가 네 만료를 본다(§5.6-8):
//   ① mediaDeletedAt + 30일 — R2 원본 삭제 → mediaKey·mediaMime 정리. 행은 남긴다.
//   ② deletedAt + 30일 — mediaKey가 있으면 ①을 먼저 하고, 그다음 행을 파기한다.
//   ③ 고아 객체 스윕은 이번에 만들지 않는다(⏸ §5.6-8 ③).
//   ⑤ Memorial.purgeAt 경과 — 추모관을 방명록·헌화·사진(로컬 파일 포함)과 함께 삭제(00-20 §8.1-1, memorialPurgeService).
//   ⑥ 운영 기록 보관기간 경과 — 접속기록 1년·운영자 감사 2년·에러 기록 90일(00-42 §5.2 ⑧, opsLogPurgeService).
//   ④ User.deletionScheduledAt 경과(회원 탈퇴 유예 만료) — 그 회원의 ①②를 먼저, 그다음 계정 파기.
//      User 행은 지우지 않고 익명화한다 — 부고장은 삭제, 추모관은 탈퇴 때 닫혀 자기 purgeAt에 파기(00-20 §6.3-2, accountPurgeService.ts).
//   ⑦ 추모관 동결·통지(10-06, 00-20 §8.1-3) — expiresAt 도래 + frozenAt 없음 → frozenAt=지금·purgeAt=+3년.
//      그리고 만료 통지(첫 기일+7일)·파기 30일 전 재확인 통지를 보내고 MemorialNotice에 남긴다(provider는 EMAIL_ENABLED·ALIMTALK_ENABLED, 기본 꺼짐 → 꺼져 있으면 "통지 실패" 기록).
//      🔴 ⑤는 동결 추모관에 한해 "재확인 통지 SENT + 30일 경과"를 요구한다 — 통지 실패 기록이 있거나 안 보냈으면 건너뛰고 동결을 유지한다(§5.2-1).
//   ⑧ SocialAccount.unlinkedAt + 1년 경과 → 행 삭제(00-19 제4조).
//   ⑨ MemorialGuestbook 삭제 표시(deletedByOwnerAt·deletedByAuthorAt) + 3개월 경과 → 행 삭제. 🔴 운영자가 내린 hiddenAt 글은 제외(00-19 제4조·00-20 §6.2).
//   ⑩ DB 원본 마스킹(00-19 제4조·제8조, 00-20 §8.1-5) — Lead(RESPONDED·CONVERTED·LOST·INVALID)·ConsultRequest(COMPLETED·CANCELLED·INVALID)가 끝난 지 90일,
//      끝나지 않은 건(Lead REQUESTED·NOTIFIED·ConsultRequest REQUESTED·ACCEPTED)은 접수일부터 90일 지난 건의(2026-10-08 추가, 상태는 안 바꿈)
//      이름·연락처를 가린 값으로, Lead.payload는 {}로·ConsultRequest.content는 "(보관 기간이 지나 삭제됨)"으로 덮어쓰고 maskedAt 기록. 접수번호·일시·대상·금액은 유지. "끝난 시각" = statusHistory의 현재 상태 마지막 기록(없으면 updatedAt).
//   ⑪ HeavyJobLog(사진 인식·음성 변환 처리 결과 건별 기록, 06-04 §6.4-11-10-1) createdAt + 1년 경과 → 삭제. 개인정보 없는 집계용 기록. 조회는 `npm run report:heavy`.
//   ⑤·⑦~⑪은 --confirm으로 실행한 단계마다 건수를 PurgeRunLog에 남긴다(보관기간 숫자는 config/policy.ts retention).
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
import { POLICY } from '../src/config/policy';
import { getVoiceBucket, isR2Enabled } from '../src/config/r2';
import {
  cutoff,
  isDevEnvironment,
  purgeMediaRow,
  purgeLetterRow,
  purgeRetiredRow,
  findRetiredExpired,
  findMediaExpired,
  findLetterExpired,
  countPendingArchivePurge,
} from '../src/services/farewellPurgeService';
import { findAccountExpired, planAccount, purgeAccount } from '../src/services/accountPurgeService';
import { findWillPhotoExpired, purgeWillPhotoSet } from '../src/services/willPhotoService';
import { findMemorialExpiredWithSkips, planMemorial, purgeMemorial } from '../src/services/memorialPurgeService';
import { countOpsLogExpired, purgeOpsLogExpired, OPS_LOG_RETENTION_DAYS } from '../src/services/opsLogPurgeService';
import { findFreezeTargets, freezeMemorial, findNoticeDue } from '../src/services/memorialLifecycleService';
import { sendMemorialNotice } from '../src/services/memorialNoticeService';
import { isEmailEnabled, isAlimtalkEnabled } from '../src/services/noticeProvider';
import { countHeavyJobLogExpired, purgeHeavyJobLogExpired } from '../src/services/heavyJobLogService';
import {
  countSocialUnlinkedExpired,
  purgeSocialUnlinkedExpired,
  countGuestbookDeletedExpired,
  purgeGuestbookDeletedExpired,
  findLeadMaskTargets,
  findConsultMaskTargets,
  maskLeads,
  maskConsultRequests,
  recordPurgeRun,
} from '../src/services/retentionPurgeService';

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
  console.log(`=== 파기 배치 — 유족 메시지·회원 탈퇴 (${confirmed ? '실행 모드' : 'dry-run — 건수만 출력'}) ===`);
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

  // ①-2 밀려난 음성 — 삭제 유예 중 새 음성이 들어와 FarewellMediaRetired로 옮겨진 것(§5.6-9-4). deletedAt + 30일.
  const retiredExpired = await findRetiredExpired();
  console.log(`[①-2 밀려난 음성 만료] 대상 ${retiredExpired.length}건 (기준: ${cutoff().toISOString()})`);
  if (confirmed) {
    for (const row of retiredExpired) {
      const key = await purgeRetiredRow(row);
      if (key) purgedKeys.push(key);
    }
    console.log(`[①-2 밀려난 음성 만료] 완료: ${retiredExpired.length}건 R2 원본 삭제 + purgedAt 기록`);
  }

  // ①-3 유언장 사진 — 본인이 지운 묶음(WillPhotoSet.deletedAt + 30일). R2 원본 삭제 → purgedAt. 복제가 없어 원장에 올리지 않는다(06-06 §5-2-5).
  const willExpired = await findWillPhotoExpired();
  console.log(`[①-3 유언장 사진 만료] 대상 ${willExpired.length}묶음 (기준: ${cutoff().toISOString()})`);
  if (confirmed) {
    for (const row of willExpired) await purgeWillPhotoSet(row.id);
    console.log(`[①-3 유언장 사진 만료] 완료: ${willExpired.length}묶음 R2 원본 삭제 + purgedAt 기록`);
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

  // ④ 회원 탈퇴 유예 만료 — 그 회원의 편지 ①②를 먼저 돌린 뒤 계정을 익명화한다(§5.6-8 ④, accountPurgeService).
  // 🔴 User 행은 지우지 않는다(tombstone) — Memorial.createdByUserId가 00-20 처리 주체라서다. 부고장은 여기서 삭제, 추모관은 아래 ⑤에서.
  const accountsExpired = await findAccountExpired();
  const plans = [];
  for (const u of accountsExpired) plans.push(await planAccount(u));
  console.log(`[④회원 탈퇴 만료] 대상 ${plans.length}명`);
  for (const p of plans) {
    // 🔴 이메일·이름 등 개인정보는 찍지 않는다 — id 앞 8자리만(security.md §1)
    console.log(
      `   - ${p.user.id.slice(0, 8)}… 만료 ${p.user.deletionScheduledAt?.toISOString()}` +
        ` · 지움: 유언장 사진 ${p.willPhotoSets}묶음 편지 ${p.letters}(첨부 ${p.lettersWithMedia}) 방명록 ${p.guestbookEntries} 리뷰 ${p.facilityReviews} 지정가족 ${p.designations} 부고장 ${p.obituaries}` +
        ` · 철회: 수락한 지정 ${p.acceptedDesignations}` +
        ` · 연결 끊음(건은 남김): 상담 ${p.detached.leads + p.detached.consultRequests} 헌화 ${p.detached.tributes}` +
        ` · 남김: 추모관 ${p.keeps.memorials} 추모사진 ${p.keeps.memorialPhotos}`,
    );
  }
  if (confirmed) {
    let done = 0;
    for (const p of plans) {
      try {
        const r = await purgeAccount(p.user);
        if (r.purged) {
          done++;
          purgedKeys.push(...r.keys);
        } else {
          console.log(`   - ${p.user.id.slice(0, 8)}… 건너뜀: ${r.reason}`);
        }
      } catch (e) {
        // 한 계정의 실패가 나머지를 막지 않는다. purgedAt이 안 찍힌 계정은 다음 실행에서 이어진다.
        console.error(`   - ${p.user.id.slice(0, 8)}… 🔴 실패 — 이 계정은 파기되지 않았다(재실행 가능):`, e);
      }
    }
    console.log(`[④회원 탈퇴 만료] 완료: ${done}명 익명화`);
  }

  // ⑤ purgeAt 경과 추모관 — 방명록·헌화·사진(로컬 디스크 파일 포함)과 함께 삭제(00-20 §8.1-1, memorialPurgeService).
  // 🔴 dry-run이면 대상 id(앞 8자리)와 건수만 찍는다. 부고장은 지우지 않고 memorialId만 끊는다.
  // 순서상 ④ 뒤 — 탈퇴로 닫힌 추모관은 계정 익명화와 무관하게 자기 purgeAt에 지워진다.
  // 🔴 동결 추모관은 파기 전 재확인 통지가 SENT여야 한다(⑦이 보낸다). 막힌 건은 사유와 함께 건너뛴다 — 동결 유지.
  const { targets: memorialsExpired, skipped: memorialsSkipped } = await findMemorialExpiredWithSkips();
  const memorialPlans = [];
  for (const m of memorialsExpired) memorialPlans.push(await planMemorial(m));
  console.log(`[⑤추모관 파기] 대상 ${memorialPlans.length}개 · 통지 관문에 막혀 건너뜀 ${memorialsSkipped.length}개`);
  for (const s of memorialsSkipped) {
    console.log(`   - ${s.id.slice(0, 8)}… purgeAt ${s.purgeAt.toISOString()} 건너뜀(동결 유지): ${s.reason}`);
  }
  for (const p of memorialPlans) {
    console.log(
      `   - ${p.memorial.id.slice(0, 8)}… purgeAt ${p.memorial.purgeAt?.toISOString()}` +
        ` · 지움: 방명록 ${p.guestbook} 헌화 ${p.tributes} 사진 ${p.photos}` +
        ` · 연결 끊음(부고장은 남김): ${p.obituaryLinks}`,
    );
  }
  if (confirmed) {
    let done = 0;
    let fileCount = 0;
    for (const p of memorialPlans) {
      try {
        const r = await purgeMemorial(p.memorial);
        if (r.purged) {
          done++;
          fileCount += r.files;
        } else {
          console.log(`   - ${p.memorial.id.slice(0, 8)}… 건너뜀: ${r.reason}`);
        }
      } catch (e) {
        console.error(`   - ${p.memorial.id.slice(0, 8)}… 🔴 실패 — 이 추모관은 파기되지 않았다(재실행 가능):`, e);
      }
    }
    console.log(`[⑤추모관 파기] 완료: ${done}개 삭제 · 사진 파일 ${fileCount}개 삭제`);
    await recordPurgeRun('MEMORIAL_PURGE', done);
  }

  // ⑥ 운영 기록 보관기간 경과(00-42 §5.2 ⑧) — 접속기록 1년 · 운영자 감사 2년 · 에러 기록 90일. createdAt 기준 단일 조건.
  // 🔴 개인정보가 아니라 기록 자체의 만료다. 건수만 찍는다(내용은 찍지 않는다).
  const logCounts = await countOpsLogExpired();
  console.log(
    `[⑥운영 기록 만료] 대상 접속기록 ${logCounts.accessLog}건(${OPS_LOG_RETENTION_DAYS.accessLog}일) · ` +
      `운영자 감사 ${logCounts.adminAuditLog}건(${OPS_LOG_RETENTION_DAYS.adminAuditLog}일) · 에러 기록 ${logCounts.errorLog}건(${OPS_LOG_RETENTION_DAYS.errorLog}일)`,
  );
  if (confirmed) {
    const r = await purgeOpsLogExpired();
    console.log(`[⑥운영 기록 만료] 완료: 접속기록 ${r.accessLog}건 · 운영자 감사 ${r.adminAuditLog}건 · 에러 기록 ${r.errorLog}건 삭제`);
  }

  // ⑦ 추모관 동결·통지(00-20 §5.2·§8.1-3). 닫힌(closedAt)·운영자가 내린(hiddenAt) 추모관은 대상이 아니다.
  // 🔴 순서: ⑤ 파기 뒤에 둔다 — 방금 동결한 추모관은 purgeAt이 +3년이라 같은 실행에서 ⑤와 엮이지 않는다.
  const freezeTargets = await findFreezeTargets();
  console.log(`[⑦추모관 동결] 대상 ${freezeTargets.length}개 (expiresAt 도래 · 동결 안 됨 · 닫히지 않음)`);
  for (const t of freezeTargets) console.log(`   - ${t.id.slice(0, 8)}… expiresAt ${t.expiresAt.toISOString()}`);
  const noticesDue = await findNoticeDue();
  console.log(
    `[⑦추모관 통지] 대상 ${noticesDue.length}건 (만료 통지 ${noticesDue.filter((n) => n.kind === 'EXPIRY').length} · 재확인 ${noticesDue.filter((n) => n.kind === 'RECONFIRM').length})` +
      ` · 발송 기능: 이메일 ${isEmailEnabled() ? '켜짐' : '꺼짐'} · 알림톡 ${isAlimtalkEnabled() ? '켜짐' : '꺼짐'}`,
  );
  if (!isEmailEnabled() && !isAlimtalkEnabled() && noticesDue.length > 0) {
    console.log('   🟡 발송 기능이 모두 꺼져 있다 — --confirm이면 보내지 않고 "통지 실패"로 기록한다(재확인 실패 건은 파기하지 않고 동결을 유지).');
  }
  if (confirmed) {
    let frozen = 0;
    for (const t of freezeTargets) {
      try {
        if (await freezeMemorial(t.id)) frozen++;
      } catch (e) {
        console.error(`   - ${t.id.slice(0, 8)}… 🔴 동결 실패(재실행 가능):`, e);
      }
    }
    console.log(`[⑦추모관 동결] 완료: ${frozen}개 동결(purgeAt = 지금 + ${POLICY.retention.memorialPurgeAfterFreezeYears}년)`);
    await recordPurgeRun('MEMORIAL_FREEZE', frozen);

    let sent = 0;
    let failed = 0;
    for (const n of noticesDue) {
      try {
        const r = await sendMemorialNotice(n.id, n.kind);
        if (r.result === 'SENT') sent++;
        else failed++;
        // 🔴 연락처·본문은 찍지 않는다 — id 앞 8자리·수단·실패 코드만(security.md §1)
        console.log(`   - ${n.id.slice(0, 8)}… ${n.kind} ${r.result}${r.channel ? ` (${r.channel})` : ''}${r.failReason ? ` · ${r.failReason}` : ''}`);
      } catch (e) {
        failed++;
        console.error(`   - ${n.id.slice(0, 8)}… 🔴 통지 처리 실패:`, e);
      }
    }
    console.log(`[⑦추모관 통지] 완료: 발송 ${sent}건 · 통지 실패 ${failed}건`);
  }

  // ⑧ 소셜 연동 해제 기록 — unlinkedAt + 1년(00-19 제4조). 연동 중인 행(unlinkedAt 없음)은 조건에 걸리지 않는다.
  const socialCount = await countSocialUnlinkedExpired();
  console.log(`[⑧소셜 연동 해제 기록] 대상 ${socialCount}건 (해제 후 ${POLICY.retention.socialUnlinkedYears}년 경과)`);
  if (confirmed) {
    const n = await purgeSocialUnlinkedExpired();
    console.log(`[⑧소셜 연동 해제 기록] 완료: ${n}건 삭제`);
    await recordPurgeRun('SOCIAL_UNLINKED', n);
  }

  // ⑨ 삭제된 방명록 — 상주·작성자가 삭제한 뒤 3개월(00-19 제4조). 🔴 운영자가 내린 hiddenAt 글은 제외.
  const guestbookCount = await countGuestbookDeletedExpired();
  console.log(`[⑨삭제된 방명록] 대상 ${guestbookCount}건 (삭제 후 ${POLICY.retention.deletedGuestbookMonths}개월 경과 · 운영자가 내린 글 제외)`);
  if (confirmed) {
    const n = await purgeGuestbookDeletedExpired();
    console.log(`[⑨삭제된 방명록] 완료: ${n}건 삭제`);
    await recordPurgeRun('GUESTBOOK_DELETED', n);
  }

  // ⑩ DB 원본 마스킹 — 끝난 지 90일 지난 문의·상담의 이름·연락처 + 문의 내용(payload → {})·상담 내용(content → 삭제 문구)(00-19 제4조·제8조, 00-20 §8.1-5).
  // 접수번호·일시·대상·금액은 그대로. 🔴 이름·연락처·내용은 찍지 않는다 — 건수만(security.md §1).
  const leadTargets = await findLeadMaskTargets();
  const consultTargets = await findConsultMaskTargets();
  console.log(
    `[⑩DB 원본 마스킹] 대상 업체 문의 ${leadTargets.length}건 · 상담 신청 ${consultTargets.length}건 (끝난 지 — 끝나지 않은 건은 접수 후 — ${POLICY.retention.contactMaskAfterEndDays}일 경과 · maskedAt 없음)`,
  );
  if (confirmed) {
    const leadDone = await maskLeads(leadTargets);
    const consultDone = await maskConsultRequests(consultTargets);
    console.log(`[⑩DB 원본 마스킹] 완료: 업체 문의 ${leadDone}건 · 상담 신청 ${consultDone}건 마스킹`);
    await recordPurgeRun('CONTACT_MASK_LEAD', leadDone);
    await recordPurgeRun('CONTACT_MASK_CONSULT', consultDone);
  }

  // ⑪ 사진 인식·음성 변환 처리 결과 기록 — 1년 지난 기록 삭제(06-04 §6.4-11-10-1). createdAt 하나뿐인 조건 — 개인정보 없는 집계용 기록이다. 건수만 찍는다.
  const heavyLogCount = await countHeavyJobLogExpired();
  console.log(`[⑪처리 결과 기록] 대상 ${heavyLogCount}건 (${POLICY.retention.heavyJobLogYears}년 경과)`);
  if (confirmed) {
    const n = await purgeHeavyJobLogExpired();
    console.log(`[⑪처리 결과 기록] 완료: ${n}건 삭제`);
    await recordPurgeRun('HEAVY_JOB_LOG', n);
  }

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
