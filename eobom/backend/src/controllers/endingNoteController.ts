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
