import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { encryptField, decryptField } from '../utils/crypto';

// docs 06-05 §6.2·§8 Phase B — 유족 메시지 보관함(수신자별 1:1 편지). 전부 본인 것만(작업2).
// 🔴 유족이 읽는 라우트는 여기 없다 — 개봉은 06-04 Phase 3이고 엔딩노트와 동시에 열린다(§3.3).
// 🔴 06-03 §7의 select 명시 규칙 — include로 통짜 조인하지 않는다. 소유권 확인은
// FarewellMessage에 없는 userId를 note 관계로 필터링해서 한다(FarewellMessage에는 userId 컬럼이
// 없다 — EndingNote가 유일한 소유자다, 06-05 §3.2).

// §10 항목4 — 두되 넉넉히. 상한이 없으면 암호문 컬럼이 무한정 비대해진다.
const MAX_BODY_LENGTH = 20000;
const PREVIEW_LENGTH = 80;

// 본인의 EndingNote를 가져오거나 없으면 만든다 — 1:1이라 첫 편지 작성 시점에 자동 생성된다.
// status는 항상 스키마 기본값(DRAFT)으로 시작 — 여기서 건드리지 않는다(개봉 상태의 소유자는
// 06-04 Phase 3의 몫).
const getOrCreateEndingNoteId = async (userId: string): Promise<string> => {
  const note = await prisma.endingNote.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  return note.id;
};

// 목록 (`GET /api/farewell-messages`) — 미리보기까지만(§7.1 완료판정). 전문은 단건 조회에서만.
export const listFarewellMessages = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const rows = await prisma.farewellMessage.findMany({
      where: { note: { userId: decoded.id } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        recipientId: true,
        title: true,
        bodyEnc: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const data = rows.map((r) => {
      const body = decryptField(r.bodyEnc);
      return {
        id: r.id,
        recipientId: r.recipientId,
        title: r.title,
        preview: body.length > PREVIEW_LENGTH ? `${body.slice(0, PREVIEW_LENGTH)}…` : body,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('유족 메시지 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 단건 조회 (`GET /api/farewell-messages/:id`) — 본인에게만 전문을 내려준다.
export const getFarewellMessage = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const row = await prisma.farewellMessage.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        recipientId: true,
        title: true,
        bodyEnc: true,
        createdAt: true,
        updatedAt: true,
        note: { select: { userId: true } },
      },
    });
    // 존재하지 않음과 소유권 없음을 동일하게 404로 응답(familyDesignationController와 동일 원칙)
    if (!row || row.note.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '편지를 찾을 수 없습니다.' });
    }

    return res.json({
      status: 'success',
      data: {
        id: row.id,
        recipientId: row.recipientId,
        title: row.title,
        body: decryptField(row.bodyEnc),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  } catch (error) {
    console.error('유족 메시지 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};

// 작성 (`POST /api/farewell-messages`) — 수신자 1명당 여러 통 허용(§10 항목5).
export const createFarewellMessage = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as { recipientId?: string; title?: string; body?: string };
  const text = body.body?.trim();
  if (!body.recipientId) {
    return res.status(400).json({ status: 'error', message: '받으실 분을 선택해 주세요.' });
  }
  if (!text) {
    return res.status(400).json({ status: 'error', message: '편지 내용을 입력해 주세요.' });
  }
  if (text.length > MAX_BODY_LENGTH) {
    return res.status(400).json({ status: 'error', message: `편지는 최대 ${MAX_BODY_LENGTH}자까지 쓰실 수 있습니다.` });
  }

  try {
    // 🔴 수신자가 반드시 본인의 FamilyDesignation인지 확인 — 없는 id와 남의 id를 같은 메시지로 응답한다.
    const recipient = await prisma.familyDesignation.findUnique({
      where: { id: body.recipientId },
      select: { id: true, userId: true },
    });
    if (!recipient || recipient.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '받으실 분을 찾을 수 없습니다.' });
    }

    const noteId = await getOrCreateEndingNoteId(decoded.id);

    const created = await prisma.farewellMessage.create({
      data: {
        noteId,
        recipientId: recipient.id,
        title: body.title?.trim() || null,
        bodyEnc: encryptField(text),
      },
      select: { id: true, recipientId: true, title: true, createdAt: true, updatedAt: true },
    });

    return res.status(201).json({
      status: 'success',
      data: { ...created, preview: text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text },
    });
  } catch (error) {
    console.error('유족 메시지 작성 실패:', error);
    return res.status(500).json({ status: 'error', message: '작성 중 오류가 발생했습니다.' });
  }
};

// 수정 (`PATCH /api/farewell-messages/:id`) — 본인 것만.
export const updateFarewellMessage = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as { title?: string | null; body?: string };

  try {
    const existing = await prisma.farewellMessage.findUnique({
      where: { id: req.params.id },
      select: { id: true, note: { select: { userId: true } } },
    });
    if (!existing || existing.note.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '편지를 찾을 수 없습니다.' });
    }

    let bodyEnc: string | undefined;
    if (body.body !== undefined) {
      const text = body.body.trim();
      if (!text) {
        return res.status(400).json({ status: 'error', message: '편지 내용은 비울 수 없습니다.' });
      }
      if (text.length > MAX_BODY_LENGTH) {
        return res.status(400).json({ status: 'error', message: `편지는 최대 ${MAX_BODY_LENGTH}자까지 쓰실 수 있습니다.` });
      }
      bodyEnc = encryptField(text);
    }

    const updated = await prisma.farewellMessage.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { title: body.title?.trim() || null } : {}),
        ...(bodyEnc ? { bodyEnc } : {}),
      },
      select: { id: true, recipientId: true, title: true, bodyEnc: true, createdAt: true, updatedAt: true },
    });

    const text = decryptField(updated.bodyEnc);
    return res.json({
      status: 'success',
      data: {
        id: updated.id,
        recipientId: updated.recipientId,
        title: updated.title,
        body: text,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('유족 메시지 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '수정 중 오류가 발생했습니다.' });
  }
};
