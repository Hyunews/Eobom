import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { encryptNoteField, decryptNoteField } from '../utils/crypto';
import { RELEASED_LOCK_MESSAGE, isEndingNoteReleased } from '../utils/endingNoteLock';
import { SECTION_ALLOWED_TIMINGS, grantDefaultForAllDesignations } from '../utils/endingNoteSections';
import { isR2Enabled } from '../config/r2';
import { sendFarewellAudio } from './farewellMessageController';

// docs 06-04 §4.2·§10 Phase 1 — 엔딩노트 본체(EndingNote 메타데이터 + EndingNoteEntry 본문).
// 전부 본인 것만(farewellMessageController와 같은 패턴 — verifyBearerToken). 🔴 유족이 읽는
// 라우트는 여기 없다 — 개봉은 Phase 3(§8)이고, 06은 그 신호를 받아 처리할 뿐 스스로 열지 않는다.
// 🔴 D5 — 운영자 API는 이 컨트롤러를 쓰지 않는다. 운영자 화면은 EndingNote까지만 조인한다(06-03 §3.1 A안).

const MAX_VALUE_LENGTH = 20000; // §10 항목4와 같은 상한 — 암호문 컬럼 무한 비대화 방지

// §6.1 코드(③ 제외) — ①②④⑤⑥⑦⑧⑨⑩ 9개. 값은 §7.2(응급 열람 Phase 3 연기, §13 #1)에 따라
// 지금은 전부 POSTMORTEM으로 고정한다 — EMERGENCY는 Phase 3 전까지 어디에도 부여하지 않는다.
// 🔴 WILL_DRAFT(⑨)만 null — 어떤 시점도 가질 수 없다(§7.1·§7.4 모델 레벨 차단). Phase 1은 시점
// 선택 UI가 없으므로(Phase 2) 클라이언트가 보낸 값이 있어도 여기서 무시하고 서버가 결정한다.
const SECTION_TIMING: Record<string, string | null> = {
  LIFE_SUPPORT: 'POSTMORTEM',
  FUNERAL: 'POSTMORTEM',
  ASSET: 'POSTMORTEM',
  DIGITAL_ACCOUNTS: 'POSTMORTEM',
  INSURANCE: 'POSTMORTEM',
  CONTACTS: 'POSTMORTEM',
  WILL_LOCATION: 'POSTMORTEM',
  WILL_DRAFT: null,
  ORGAN_DONATION: 'POSTMORTEM',
};

const SECTION_CODES = Object.keys(SECTION_TIMING);

// 06-03 §5 권고 문구 그대로 — 정본을 여기 하나만 두고 GET 응답에 실어 보낸다(화면 쪽에 따로
// 옮겨 적지 않는다. 문구가 두 곳에 흩어지면 한쪽만 고치는 사고가 난다).
export const POLICY_NOTICE_TEXT =
  '이어봄은 회원님이 작성한 내용을 암호화하여 보관하며, 운영자는 내용을 열람하지 않습니다. ' +
  '다만 아래 두 경우에는 예외적으로 열람할 수 있습니다.\n' +
  '① 법원의 영장 등 법령에 따른 적법한 요구가 있는 경우 — 이 경우 이어봄은 거부할 수 없습니다.\n' +
  '② 회원님이 직접 요청하신 경우.\n' +
  '예외 열람은 담당자 2인의 승인을 거치며, 사유가 기록되고, 열람 사실을 회원님(사후에는 지정 유족)께 ' +
  '알려드립니다. 사망 확인 후 지정 유족에게 전달되는 절차는 열람이 아니라 전달이며, 회원님이 정하신 ' +
  '조건에 따라 진행됩니다.';

// 본인의 EndingNote를 가져오거나 없으면 만든다 — farewellMessageController와 같은 패턴.
// 🔄 06-04 §8.3-2 — 🔴 "없어서 만든 그 한 번"에만 그 시점의 지정 전원(DECLINED 제외)에게 기본 "사후에만 공개" 권한을 준다.
// 이미 있던 노트는 그대로 반환한다(소급 없음). 멱등이라 동시에 두 요청이 만들어도 행이 늘지 않는다.
const NOTE_SELECT = {
  id: true,
  status: true,
  policyAgreedAt: true,
  sectionState: true,
  lastConfirmedAt: true,
} as const;

const getOrCreateNote = async (userId: string) => {
  const existing = await prisma.endingNote.findUnique({ where: { userId }, select: NOTE_SELECT });
  if (existing) return existing;
  const created = await prisma.endingNote.upsert({ where: { userId }, create: { userId }, update: {}, select: NOTE_SELECT });
  await grantDefaultForAllDesignations(userId, created.id);
  return created;
};

// 조회 (`GET /api/ending-note`) — 메타데이터 + 본문 전부. 본인 것이므로 복호화해 내려준다
// (운영자 API가 아니다 — D5는 "운영자가 조인하지 않는다"이지 본인 조회를 막는 규칙이 아니다).
export const getEndingNote = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const note = await getOrCreateNote(decoded.id);
    const entries = await prisma.endingNoteEntry.findMany({
      where: { noteId: note.id },
      select: { section: true, title: true, bodyEnc: true, releaseTiming: true, updatedAt: true },
    });

    const data = entries.map((e) => ({
      section: e.section,
      title: e.title,
      value: JSON.parse(decryptNoteField(e.bodyEnc)),
      releaseTiming: e.releaseTiming,
      updatedAt: e.updatedAt,
    }));

    return res.json({
      status: 'success',
      data: {
        status: note.status,
        policyAgreedAt: note.policyAgreedAt,
        sectionState: (note.sectionState as Record<string, boolean> | null) || {},
        policyNotice: POLICY_NOTICE_TEXT,
        entries: data,
      },
    });
  } catch (error) {
    console.error('엔딩노트 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};

// 동의 (`POST /api/ending-note/policy-agree`) — 06-03 §5. 작성 시작 시점에 받는다(가입 시점 아님).
// 이미 동의했으면 시각을 덮어쓰지 않고 그대로 응답한다(재확인 클릭도 같은 요청을 쓴다).
export const agreeEndingNotePolicy = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const note = await getOrCreateNote(decoded.id);
    if (!note.policyAgreedAt) {
      await prisma.endingNote.update({ where: { id: note.id }, data: { policyAgreedAt: new Date() } });
    }
    const updated = await prisma.endingNote.findUniqueOrThrow({
      where: { id: note.id },
      select: { policyAgreedAt: true },
    });
    return res.json({ status: 'success', data: { policyAgreedAt: updated.policyAgreedAt } });
  } catch (error) {
    console.error('엔딩노트 동의 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '처리 중 오류가 발생했습니다.' });
  }
};

// 섹션 저장 (`PUT /api/ending-note/sections/:section`) — §10 Phase 1 본체. 섹션당 upsert 1건.
export const saveEndingNoteSection = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const section = req.params.section;
  if (!SECTION_CODES.includes(section)) {
    return res.status(400).json({ status: 'error', message: '알 수 없는 섹션입니다.' });
  }

  const { title, value } = req.body as { title?: string | null; value?: unknown };
  if (value === undefined || value === null) {
    return res.status(400).json({ status: 'error', message: '저장할 내용이 없습니다.' });
  }

  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_VALUE_LENGTH) {
    return res.status(400).json({ status: 'error', message: '입력이 너무 깁니다.' });
  }

  try {
    const note = await getOrCreateNote(decoded.id);
    if (note.status === 'RELEASED') {
      return res.status(409).json({ status: 'error', message: RELEASED_LOCK_MESSAGE }); // 00-41 §7.2
    }
    // §5 — 작성 시작 시점 동의를 먼저 받는다. 클라이언트가 동의 화면을 건너뛰어도 서버가 막는다.
    if (!note.policyAgreedAt) {
      return res.status(403).json({ status: 'error', message: '먼저 열람 정책에 동의해 주세요.' });
    }

    // 🔴 §7.4 — timing은 클라이언트 입력을 쓰지 않고 서버가 결정한다.
    const releaseTiming = SECTION_TIMING[section];

    const entry = await prisma.endingNoteEntry.upsert({
      where: { noteId_section: { noteId: note.id, section } },
      create: {
        noteId: note.id,
        section,
        title: title?.trim() || null,
        bodyEnc: encryptNoteField(serialized),
        releaseTiming,
      },
      update: {
        title: title?.trim() || null,
        bodyEnc: encryptNoteField(serialized),
        releaseTiming,
      },
      select: { section: true, title: true, releaseTiming: true, updatedAt: true },
    });

    // §6.2 — 저장 성공 시 sectionState를 서버가 갱신한다(클라이언트가 보낸 완료 여부를 믿지 않는다).
    const sectionState = {
      ...((note.sectionState as Record<string, boolean> | null) || {}),
      [section]: true,
    };
    await prisma.endingNote.update({ where: { id: note.id }, data: { sectionState } });

    return res.json({ status: 'success', data: { ...entry, value, sectionState } });
  } catch (error) {
    console.error('엔딩노트 섹션 저장 실패:', error);
    return res.status(500).json({ status: 'error', message: '저장 중 오류가 발생했습니다.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// §10 Phase 2 — EndingNoteGrant(섹션별 공개 시점) + 가족 조회 API
// ─────────────────────────────────────────────────────────────────

// §7.1 + §13 #5 — 섹션별 허용 timing 표(SECTION_ALLOWED_TIMINGS)는 utils/endingNoteSections.ts에 있다 —
// 기본 권한 생성(06-04 §8.3-2)과 같은 표를 쓰려고 옮겼다. 목록에 없는 섹션(WILL_DRAFT)은 여기서 전부 막힌다(§7.4).

// 내 권한 목록 (`GET /api/ending-note/grants`) — 본인 것만. 철회된 것도 함께 내려 UI가 상태를 그린다.
export const listEndingNoteGrants = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const note = await getOrCreateNote(decoded.id);
    const grants = await prisma.endingNoteGrant.findMany({
      where: { noteId: note.id },
      select: { id: true, designationId: true, section: true, timing: true, revokedAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ status: 'success', data: grants });
  } catch (error) {
    console.error('엔딩노트 권한 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};

// 권한 부여/변경 (`PUT /api/ending-note/grants`) — (noteId, designationId, section) 조합당 upsert 1건.
export const upsertEndingNoteGrant = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const { designationId, section, timing } = req.body as { designationId?: string; section?: string; timing?: string };
  if (!designationId || !section || !timing) {
    return res.status(400).json({ status: 'error', message: 'designationId·section·timing이 모두 필요합니다.' });
  }
  const allowed = SECTION_ALLOWED_TIMINGS[section];
  if (!allowed) {
    // 🔴 WILL_DRAFT를 포함해 목록에 없는 섹션은 여기서 전부 막는다 — §7.4 모델 레벨 차단의 실제 강제 지점.
    return res.status(400).json({ status: 'error', message: '이 섹션은 공개 시점을 지정할 수 없습니다.' });
  }
  if (!allowed.includes(timing)) {
    return res.status(400).json({ status: 'error', message: `이 섹션은 ${allowed.join('/')}만 지정할 수 있습니다.` });
  }

  try {
    const note = await getOrCreateNote(decoded.id);
    if (note.status === 'RELEASED') {
      return res.status(409).json({ status: 'error', message: RELEASED_LOCK_MESSAGE }); // 00-41 §7.2
    }

    // 🔴 대상이 본인이 지정한 가족인지 확인. 🔄 00-41 §7.3(09-30) — 수락 전 가족(DRAFT·PENDING·EXPIRED)에게도 미리 줄 수 있다:
    // 사망 뒤에 수락하는 가족이 자기 권한만큼 볼 수 있어야 하기 때문. 미리 줘도 가족 조회 API가 acceptedUserId로만
    // 찾으므로 수락 전엔 아무도 못 읽는다. 🔄 06-04 §8.3-2(09-30) — 지정 때 기본 권한이 DRAFT에도 생기므로 화면에서 바꿀 수 있어야 한다.
    // DECLINED(거절은 그 가족의 의사)는 계속 거부한다. WILL_DRAFT 거부는 위 섹션 검증이 그대로 한다.
    const designation = await prisma.familyDesignation.findUnique({
      where: { id: designationId },
      select: { id: true, userId: true, status: true },
    });
    if (!designation || designation.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '가족 지정을 찾을 수 없습니다.' });
    }
    if (designation.status === 'DECLINED') {
      return res.status(400).json({ status: 'error', message: '초대를 거절한 가족에게는 공개 시점을 지정할 수 없습니다.' });
    }

    const grant = await prisma.endingNoteGrant.upsert({
      where: { noteId_designationId_section: { noteId: note.id, designationId, section } },
      create: { noteId: note.id, designationId, section, timing },
      update: { timing, revokedAt: null }, // 재부여 — 철회 상태였다면 해제
      select: { id: true, designationId: true, section: true, timing: true, revokedAt: true, updatedAt: true },
    });
    return res.json({ status: 'success', data: grant });
  } catch (error) {
    console.error('엔딩노트 권한 부여 실패:', error);
    return res.status(500).json({ status: 'error', message: '처리 중 오류가 발생했습니다.' });
  }
};

// 권한 철회 (`PATCH /api/ending-note/grants/:id/revoke`) — §4.2 "철회 경로 필수". 삭제하지 않고
// revokedAt만 남긴다 — 언제 누구 권한을 거뒀는지 이력이 남아야 한다.
export const revokeEndingNoteGrant = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    if (await isEndingNoteReleased(decoded.id)) {
      return res.status(409).json({ status: 'error', message: RELEASED_LOCK_MESSAGE }); // 00-41 §7.2
    }
    const existing = await prisma.endingNoteGrant.findUnique({
      where: { id: req.params.id },
      select: { id: true, revokedAt: true, note: { select: { userId: true } } },
    });
    if (!existing || existing.note.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '권한을 찾을 수 없습니다.' });
    }
    if (!existing.revokedAt) {
      await prisma.endingNoteGrant.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
    }
    return res.json({ status: 'success' });
  } catch (error) {
    console.error('엔딩노트 권한 철회 실패:', error);
    return res.status(500).json({ status: 'error', message: '처리 중 오류가 발생했습니다.' });
  }
};

// 가족 조회 (`GET /api/ending-note/family-view`) — §10 Phase 2 #7. 개봉 전엔 IMMEDIATE로 부여된 섹션만,
// 🔄 개봉(EndingNote.RELEASED, 00-41 §7) 뒤엔 자기 권한의 POSTMORTEM 섹션 + 자기 앞 편지까지 내려준다.
// 🔴 §7.4 UI 원칙("잠긴 섹션은 제목도 보이지 않는다")을 API에서부터 지킨다 — 응답
// entries 배열에 아예 없는 섹션은 프론트가 그릴 것이 없다(잠금 표시조차 하지 않는다).
//
// 🔴 편차 메모 — familyDesignationController.ts 머리말 불변식 3은 "내가 누군가에게 지정됐는지
// 조회하는 API는 만들지 않는다"고 명시한다. 이 엔드포인트는 acceptedUserId로 FamilyDesignation을
// 역질의하므로 표면적으로 같은 모양이다. 판단: 그 불변식은 §9.1(초대 발급~수락 전) 단계에서
// "추측 불가 토큰으로만 접근"을 지키기 위한 것 — 아직 동의하지 않은 초대의 존재를 무단으로
// 알아내지 못하게 막는 데 목적이 있다. 여기는 이미 acceptedAt으로 동의가 끝난(status=ACCEPTED)
// 관계에서, 부여받은 콘텐츠를 열람하는 것이라 별개 동작으로 보고 진행했다. 이 판단은 walkthrough
// 편차 필드로 올려 Opus 확인을 받는다 — docs/는 고치지 않았다.
//
// 🔄 2026-09-21 00-36 §4.6-1-1·M-2 #7-2 — 응답에 `scope`·`acceptedAt`을 더했다(근거: 00-27 §9.1-6 b 수락
// 화면 표시 항목 · §2.1 본인의 동의 시각). 🔴 그 외 필드는 늘리지 않는다 — 연락처·이메일은 불변식 2,
// `priority`는 불변식 4(연락 순서일 뿐 상속순위가 아니다).
//
// 🔴 왕복 수 = **2회, 지정 건수 n과 무관**. 예전엔 노트·권한·항목을 지정마다 따로 물어 `1 + 3n`번이었다.
// Render(오리건)↔DB(서울) 왕복이 회당 ~1.3초라 지정 2건이면 ~9초였다(summaryController와 같은 이유).
//   ① 지정 + 지정자 이름 + 지정자의 노트 id + 이 지정에 부여된 IMMEDIATE 권한을 **관계 조인 한 번**에
//   ② 필요한 (노트, 섹션) 쌍의 항목을 **OR 조건 한 번**에
export const getFamilyVisibleEndingNotes = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const designations = await prisma.familyDesignation.findMany({
      where: { acceptedUserId: decoded.id, status: 'ACCEPTED' },
      orderBy: { acceptedAt: 'asc' },
      select: {
        id: true,
        relationship: true,
        relationshipEtc: true,
        scope: true,
        acceptedAt: true,
        user: { select: { name: true, endingNote: { select: { id: true, status: true, releasedAt: true } } } },
        // 🔄 00-41 §7 — 개봉 뒤(RELEASED)엔 POSTMORTEM 권한도 열린다. 어느 쪽인지는 아래에서 노트 상태로 가른다.
        endingNoteGrants: {
          where: { timing: { in: ['IMMEDIATE', 'POSTMORTEM'] }, revokedAt: null },
          select: { noteId: true, section: true, timing: true },
        },
      },
    });

    // 지정마다 (노트 id, 열람 가능 섹션) 확정. 노트가 없는 지정은 예전처럼 응답에서 뺀다.
    // 🔴 개봉 전(RELEASED 아님)엔 IMMEDIATE 권한만 — 사후 섹션은 **제목조차** 응답에 없다(00-41 §11).
    // 🔴 개봉 판정은 서버의 EndingNote.status뿐이다. 클라이언트가 보낸 값은 받지 않는다(06-04 §7.4).
    const plans = designations.flatMap((d) => {
      const noteId = d.user.endingNote?.id;
      if (!noteId) return [];
      const released = d.user.endingNote?.status === 'RELEASED';
      // 🔴 §7.4 — WILL_DRAFT는 grant 자체가 생성 불가능하지만, 혹시 모를 오염을 대비해 한 번 더 거른다(개봉 뒤에도 아무에게도 안 열림).
      const sections = [
        ...new Set(
          d.endingNoteGrants
            .filter((g) => g.noteId === noteId && (g.timing === 'IMMEDIATE' || (released && g.timing === 'POSTMORTEM')))
            .map((g) => g.section)
            .filter((s) => s !== 'WILL_DRAFT')
        ),
      ];
      return [{ d, noteId, sections, released }];
    });

    const wanted = plans.filter((p) => p.sections.length > 0);
    const releasedDesignationIds = plans.filter((p) => p.released).map((p) => p.d.id);
    // 두 조회는 서로 의존하지 않는다 — 왕복을 늘리지 않게 한꺼번에 보낸다(왕복 수 = 2회 유지).
    const [rows, letterRows] = await Promise.all([
      wanted.length > 0
        ? prisma.endingNoteEntry.findMany({
            where: { OR: wanted.map((p) => ({ noteId: p.noteId, section: { in: p.sections } })) },
            select: { noteId: true, section: true, title: true, bodyEnc: true, updatedAt: true },
          })
        : Promise.resolve([]),
      // 유족 편지 — 개봉된 노트에서 **자기 앞으로 온 것만**(recipientId), 소프트 삭제분 제외. 섹션과 같은 순간에 열린다(06-05 §3.3).
      releasedDesignationIds.length > 0
        ? prisma.farewellMessage.findMany({
            where: { recipientId: { in: releasedDesignationIds }, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              recipientId: true,
              title: true,
              bodyEnc: true,
              mediaKey: true,
              mediaDeletedAt: true,
              mediaDurationSec: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const results = plans.map(({ d, noteId, sections, released }) => ({
      designationId: d.id,
      ownerName: d.user.name,
      relationship: d.relationship,
      relationshipEtc: d.relationshipEtc,
      scope: d.scope, // PRIMARY | VIEWER
      acceptedAt: d.acceptedAt,
      released, // 00-41 — 화면이 "열림" 상태를 그릴 때 쓴다(판정은 서버가 이미 끝냈다)
      releasedAt: released ? d.user.endingNote?.releasedAt ?? null : null,
      entries: rows
        .filter((r) => r.noteId === noteId && sections.includes(r.section))
        .map((r) => ({
          section: r.section,
          title: r.title,
          value: JSON.parse(decryptNoteField(r.bodyEnc)),
          updatedAt: r.updatedAt,
        })),
      letters: letterRows
        .filter((l) => l.recipientId === d.id)
        .map((l) => ({
          id: l.id,
          title: l.title,
          body: decryptNoteField(l.bodyEnc),
          hasAudio: !!l.mediaKey && l.mediaDeletedAt === null, // 재생은 GET /family-view/letters/:id/audio(getFamilyLetterAudio)
          audioDurationSec: l.mediaDurationSec,
          createdAt: l.createdAt,
        })),
    }));

    return res.json({ status: 'success', data: results });
  } catch (error) {
    console.error('가족 열람용 엔딩노트 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};

// 수신자용 편지 음성 (`GET /api/ending-note/family-view/letters/:id/audio`) — 00-41 §7.1·§9. 본인용
// `GET /api/farewell-messages/:id/audio`와 같은 재생 방식(sendFarewellAudio: R2에서 받아 복호화해 그대로 응답)이다.
// 🔴 요청자 = 그 편지의 recipientId 지정의 acceptedUserId(+ACCEPTED) 본인이고, 노트가 RELEASED이며, 편지·음성이 삭제되지
// 않았을 때만. 어느 하나라도 아니면 이유를 가리지 않고 같은 404 — 편지·음성의 존재 여부를 알려주지 않는다.
export const getFamilyLetterAudio = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }
  const notFound = () => res.status(404).json({ status: 'error', message: '음성을 찾을 수 없습니다.' });

  if (!isR2Enabled()) return notFound();

  try {
    const row = await prisma.farewellMessage.findUnique({
      where: { id: req.params.id },
      select: {
        mediaKey: true,
        mediaMime: true,
        mediaDeletedAt: true,
        deletedAt: true,
        recipient: { select: { acceptedUserId: true, status: true } },
        note: { select: { status: true } },
      },
    });
    if (
      !row ||
      row.recipient.status !== 'ACCEPTED' ||
      row.recipient.acceptedUserId !== decoded.id ||
      row.note.status !== 'RELEASED' ||
      !row.mediaKey ||
      row.mediaDeletedAt !== null ||
      row.deletedAt !== null
    ) {
      return notFound();
    }
    return await sendFarewellAudio(res, row.mediaKey, row.mediaMime);
  } catch (error) {
    console.error('수신자용 편지 음성 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '음성을 불러오는 중 오류가 발생했습니다.' });
  }
};
