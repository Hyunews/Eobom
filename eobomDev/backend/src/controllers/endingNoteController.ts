import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { encryptNoteField, decryptNoteField } from '../utils/crypto';

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
const getOrCreateNote = async (userId: string) => {
  return prisma.endingNote.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: {
      id: true,
      status: true,
      policyAgreedAt: true,
      sectionState: true,
      lastConfirmedAt: true,
    },
  });
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

// §7.1 + §13 #5 — 섹션별로 허용되는 timing. 목록에 없는 값(WILL_DRAFT)은 절대 허용하지 않는다
// (§7.4 모델 레벨 차단). EMERGENCY는 어느 섹션에도 없다 — Phase 3(응급 열람 확정) 전까지는
// 화면에서도 걷어낸다(§13 #1). §7.1 표는 ①②⑦ 모두 즉시 공유가 "🟡 선택"이라 하지만, §13 #5가
// 1차 범위를 "②⑦만"으로 더 좁게 확정했으므로 그 확정을 따른다 — ①은 POSTMORTEM만 허용.
const SECTION_ALLOWED_TIMINGS: Record<string, string[]> = {
  LIFE_SUPPORT: ['POSTMORTEM'],
  FUNERAL: ['IMMEDIATE', 'POSTMORTEM'],
  ASSET: ['POSTMORTEM'],
  DIGITAL_ACCOUNTS: ['POSTMORTEM'],
  INSURANCE: ['POSTMORTEM'],
  CONTACTS: ['IMMEDIATE', 'POSTMORTEM'],
  WILL_LOCATION: ['POSTMORTEM'],
  ORGAN_DONATION: ['POSTMORTEM'],
};

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

    // 🔴 대상이 본인이 지정한 가족이고, 이미 수락(ACCEPTED)됐는지 확인 — 대기중인 초대에 미리
    // 권한을 줘봐야 acceptedUserId가 없어 아무도 못 읽는다(가족 조회 API가 acceptedUserId로만 찾는다).
    const designation = await prisma.familyDesignation.findUnique({
      where: { id: designationId },
      select: { id: true, userId: true, status: true },
    });
    if (!designation || designation.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '가족 지정을 찾을 수 없습니다.' });
    }
    if (designation.status !== 'ACCEPTED') {
      return res.status(400).json({ status: 'error', message: '아직 수락하지 않은 가족에게는 공개 시점을 지정할 수 없습니다.' });
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

// 가족 조회 (`GET /api/ending-note/family-view`) — §10 Phase 2 #7. IMMEDIATE로 부여된 섹션만
// 내려준다. 🔴 §7.4 UI 원칙("잠긴 섹션은 제목도 보이지 않는다")을 API에서부터 지킨다 — 응답
// entries 배열에 아예 없는 섹션은 프론트가 그릴 것이 없다(잠금 표시조차 하지 않는다).
//
// 🔴 편차 메모 — familyDesignationController.ts 머리말 불변식 3은 "내가 누군가에게 지정됐는지
// 조회하는 API는 만들지 않는다"고 명시한다. 이 엔드포인트는 acceptedUserId로 FamilyDesignation을
// 역질의하므로 표면적으로 같은 모양이다. 판단: 그 불변식은 §9.1(초대 발급~수락 전) 단계에서
// "추측 불가 토큰으로만 접근"을 지키기 위한 것 — 아직 동의하지 않은 초대의 존재를 무단으로
// 알아내지 못하게 막는 데 목적이 있다. 여기는 이미 acceptedAt으로 동의가 끝난(status=ACCEPTED)
// 관계에서, 부여받은 콘텐츠를 열람하는 것이라 별개 동작으로 보고 진행했다. 이 판단은 walkthrough
// 편차 필드로 올려 Opus 확인을 받는다 — docs/는 고치지 않았다.
export const getFamilyVisibleEndingNotes = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const designations = await prisma.familyDesignation.findMany({
      where: { acceptedUserId: decoded.id, status: 'ACCEPTED' },
      select: {
        id: true,
        userId: true,
        relationship: true,
        relationshipEtc: true,
        user: { select: { name: true } },
      },
    });

    const results = [];
    for (const d of designations) {
      const note = await prisma.endingNote.findUnique({ where: { userId: d.userId }, select: { id: true } });
      if (!note) continue;

      const grants = await prisma.endingNoteGrant.findMany({
        where: { noteId: note.id, designationId: d.id, timing: 'IMMEDIATE', revokedAt: null },
        select: { section: true },
      });
      // 🔴 §7.4 — WILL_DRAFT는 grant 자체가 생성 불가능하지만, 혹시 모를 오염을 대비해 한 번 더 거른다.
      const sections = grants.map((g) => g.section).filter((s) => s !== 'WILL_DRAFT');

      let entries: Array<{ section: string; title: string | null; value: unknown; updatedAt: Date }> = [];
      if (sections.length > 0) {
        const rows = await prisma.endingNoteEntry.findMany({
          where: { noteId: note.id, section: { in: sections } },
          select: { section: true, title: true, bodyEnc: true, updatedAt: true },
        });
        entries = rows.map((r) => ({
          section: r.section,
          title: r.title,
          value: JSON.parse(decryptNoteField(r.bodyEnc)),
          updatedAt: r.updatedAt,
        }));
      }

      results.push({
        designationId: d.id,
        ownerName: d.user.name,
        relationship: d.relationship,
        relationshipEtc: d.relationshipEtc,
        entries,
      });
    }

    return res.json({ status: 'success', data: results });
  } catch (error) {
    console.error('가족 열람용 엔딩노트 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};
