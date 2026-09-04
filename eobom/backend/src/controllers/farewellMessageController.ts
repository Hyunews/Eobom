import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { encryptNoteField, decryptNoteField } from '../utils/crypto';
import { isR2Enabled } from '../config/r2';
import { downloadVoiceObject } from '../services/r2Storage';
// 06-04 §13 #4(2026-08-27) — 정산 계좌 키(SETTLEMENT_ENCRYPTION_KEY)와 분리된 06 전용 키로 전환.
// 🔴 운영 DB는 개발자가 이미 FarewellMessage 레코드를 삭제해 0건 확인 완료 — 재암호화 불필요.

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
        mediaKey: true,
        mediaMime: true,
        mediaDurationSec: true,
        mediaDeletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const data = rows.map((r) => {
      const body = decryptNoteField(r.bodyEnc);
      // 06-05 §5.6 D-6 — mediaKey 원값은 내려주지 않는다(GET .../:id/audio는 메시지 id로만 연다).
      const hasAudio = !!r.mediaKey && !r.mediaDeletedAt;
      return {
        id: r.id,
        recipientId: r.recipientId,
        title: r.title,
        preview: body.length > PREVIEW_LENGTH ? `${body.slice(0, PREVIEW_LENGTH)}…` : body,
        hasAudio,
        mediaMime: hasAudio ? r.mediaMime : null,
        mediaDurationSec: hasAudio ? r.mediaDurationSec : null,
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
        mediaKey: true,
        mediaMime: true,
        mediaDurationSec: true,
        mediaDeletedAt: true,
        createdAt: true,
        updatedAt: true,
        note: { select: { userId: true } },
      },
    });
    // 존재하지 않음과 소유권 없음을 동일하게 404로 응답(familyDesignationController와 동일 원칙)
    if (!row || row.note.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '편지를 찾을 수 없습니다.' });
    }

    const hasAudio = !!row.mediaKey && !row.mediaDeletedAt;
    return res.json({
      status: 'success',
      data: {
        id: row.id,
        recipientId: row.recipientId,
        title: row.title,
        body: decryptNoteField(row.bodyEnc),
        hasAudio,
        mediaMime: hasAudio ? row.mediaMime : null,
        mediaDurationSec: hasAudio ? row.mediaDurationSec : null,
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

  const body = req.body as {
    recipientId?: string;
    title?: string;
    body?: string;
    mediaKey?: string;
    mediaMime?: string;
    mediaDurationSec?: number;
  };
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

    // 06-05 §8 D-2 — mediaKey는 /api/stt/transcribe·/api/stt/store-audio가 이미 R2에 올려
    // 발급한 키를 그대로 받아 적을 뿐이다. 여기서 새로 업로드하지 않는다.
    const created = await prisma.farewellMessage.create({
      data: {
        noteId,
        recipientId: recipient.id,
        title: body.title?.trim() || null,
        bodyEnc: encryptNoteField(text),
        ...(body.mediaKey ? { mediaKey: body.mediaKey, mediaMime: body.mediaMime || null } : {}),
        ...(body.mediaDurationSec !== undefined ? { mediaDurationSec: body.mediaDurationSec } : {}),
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

  const body = req.body as {
    title?: string | null;
    body?: string;
    mediaKey?: string;
    mediaMime?: string;
    mediaDurationSec?: number;
  };

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
      bodyEnc = encryptNoteField(text);
    }

    // 06-05 §8 D-2 — mediaKey가 실려 오지 않으면 기존 첨부를 그대로 둔다(텍스트만 고치는
    // 수정에서 첨부가 조용히 지워지면 안 된다).
    const updated = await prisma.farewellMessage.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { title: body.title?.trim() || null } : {}),
        ...(bodyEnc ? { bodyEnc } : {}),
        ...(body.mediaKey ? { mediaKey: body.mediaKey, mediaMime: body.mediaMime || null } : {}),
        ...(body.mediaDurationSec !== undefined ? { mediaDurationSec: body.mediaDurationSec } : {}),
      },
      select: { id: true, recipientId: true, title: true, bodyEnc: true, createdAt: true, updatedAt: true },
    });

    const text = decryptNoteField(updated.bodyEnc);
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

// 음성 듣기 (`GET /api/farewell-messages/:id/audio`) — 06-05 §5.6-3 D-6. 소유권은 메시지
// 기준(verifyBearerToken). 🔴 mediaKey를 파라미터로 받지 않는다 — 키만 알면 남의 음성이 열린다.
// 🔴 presigned URL 금지(§5.6-1) — R2엔 선암호화된 바이트만 있어 브라우저가 직접 재생 못 한다.
// downloadVoiceObject(복호화 포함)로 받아 응답 본문으로 그대로 내보낸다.
export const getFarewellMessageAudio = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  if (!isR2Enabled()) {
    return res.status(404).json({ status: 'error', message: '음성을 찾을 수 없습니다.' });
  }

  try {
    const row = await prisma.farewellMessage.findUnique({
      where: { id: req.params.id },
      select: {
        mediaKey: true,
        mediaMime: true,
        mediaDeletedAt: true,
        note: { select: { userId: true } },
      },
    });
    if (
      !row ||
      row.note.userId !== decoded.id ||
      !row.mediaKey ||
      row.mediaDeletedAt !== null
    ) {
      return res.status(404).json({ status: 'error', message: '음성을 찾을 수 없습니다.' });
    }

    const buffer = await downloadVoiceObject(row.mediaKey);
    res.set('Content-Type', row.mediaMime || 'application/octet-stream');
    res.set('Content-Disposition', 'inline');
    // 🔴 §5.6-3 — 유언 성격의 음성이 디스크 캐시에 남지 않게 한다.
    res.set('Cache-Control', 'no-store');
    return res.send(buffer);
  } catch (error) {
    console.error('유족 메시지 음성 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '음성을 불러오는 중 오류가 발생했습니다.' });
  }
};

// 음성 삭제 (`DELETE /api/farewell-messages/:id/audio`) — 06-05 §5.6-4 D-6. 소프트 삭제만 한다.
// 🔴 mediaKey를 null로 만들지 않는다 — R2 객체를 가리키는 유일한 실마리다. 🔴 런타임 요청
// 경로에서 DeleteObject를 호출하지 않는다 — 실삭제는 유예 30일 뒤 사람 승인 배치의 몫이다.
export const deleteFarewellMessageAudio = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const row = await prisma.farewellMessage.findUnique({
      where: { id: req.params.id },
      select: { mediaKey: true, mediaDeletedAt: true, note: { select: { userId: true } } },
    });
    if (!row || row.note.userId !== decoded.id || !row.mediaKey || row.mediaDeletedAt !== null) {
      return res.status(404).json({ status: 'error', message: '삭제할 음성이 없습니다.' });
    }

    await prisma.farewellMessage.update({
      where: { id: req.params.id },
      data: { mediaDeletedAt: new Date() },
      select: { id: true },
    });

    return res.json({ status: 'success', data: null });
  } catch (error) {
    console.error('유족 메시지 음성 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '삭제 중 오류가 발생했습니다.' });
  }
};
