import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import {
  findMediaExpired,
  findLetterExpired,
  isStillMediaExpired,
  isStillLetterExpired,
  purgeMediaRow,
  purgeLetterRow,
  listPendingArchivePurge,
} from '../services/farewellPurgeService';

// docs 06-05 §5.6-8-3·§5.6-8-3-1·§5.6-8-3-2·§5.6-8-3-3 D-11 — 어드민 파기 화면.
// 🔴 정상 만료분만 다룬다. 만료 전 데이터에 대한 조작(강제 삭제)은 어디에도 없다 —
// 그건 Cloudflare 대시보드 전용이다(§5.6-8-3-1). 로직은 farewellPurgeService.ts를
// 스크립트(destroy-farewell-media.ts)와 공유한다 — 한쪽만 고쳐지는 날이 오지 않게 한다.

type PurgeItem = { id: string; type: 'MEDIA' | 'LETTER' };

// 만료 대상 목록 (`GET /api/admin/farewell-purge/expired`) — ①②를 구분해서 표시(#54).
export const listFarewellPurgeExpired = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const [media, letter] = await Promise.all([findMediaExpired(), findLetterExpired()]);
    return res.json({
      status: 'success',
      data: {
        media: media.map((r) => ({ id: r.id, title: r.title, mediaDeletedAt: r.mediaDeletedAt })),
        letter: letter.map((r) => ({ id: r.id, title: r.title, deletedAt: r.deletedAt, hasMedia: !!r.mediaKey })),
      },
    });
  } catch (error) {
    console.error('유족 메시지 파기 대상 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 아카이브 2단계 미이행 목록 (`GET /api/admin/farewell-purge/pending-archive`) — purgedAt IS NULL(#59).
export const listFarewellPendingArchive = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const pending = await listPendingArchivePurge();
    return res.json({ status: 'success', data: pending });
  } catch (error) {
    console.error('아카이브 미이행 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 건별 파기 실행 (`POST /api/admin/farewell-purge/execute`) — 일괄 버튼 없음, 건별 선택만(#56).
// 🔴 서버가 만료를 재검증한다(#55) — 화면이 보낸 id를 믿지 않는다. 하나라도 재검증에
// 실패하면 요청 전체를 거부한다(부분 실행하지 않음 — 목록이 낡았다는 뜻이라 새로 불러와야 한다).
// 🟡 파기 화면 한정 재인증 — 비밀번호 재입력(#58).
export const executeFarewellPurge = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { items, expectedCount, password } = req.body as {
    items?: PurgeItem[];
    expectedCount?: number;
    password?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 'error', message: '파기할 항목을 선택해주세요.' });
  }
  if (items.some((it) => !it.id || (it.type !== 'MEDIA' && it.type !== 'LETTER'))) {
    return res.status(400).json({ status: 'error', message: '요청 형식이 올바르지 않습니다.' });
  }
  // 🔴 실행 직전 대상 건수를 사람이 직접 입력해 확인시킨다(#57) — 오클릭 차단.
  if (expectedCount !== items.length) {
    return res.status(400).json({ status: 'error', message: `입력한 건수(${expectedCount})가 선택된 건수(${items.length})와 다릅니다.` });
  }
  if (!password) {
    return res.status(400).json({ status: 'error', message: '비밀번호를 다시 입력해주세요.' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ status: 'error', message: '비밀번호가 올바르지 않습니다.' });
    }

    // 서버 재검증 — 화면이 보낸 id를 그대로 믿지 않는다(§5.6-8-3-1).
    const stillValid = await Promise.all(
      items.map((it) => (it.type === 'MEDIA' ? isStillMediaExpired(it.id) : isStillLetterExpired(it.id))),
    );
    const invalid = items.filter((_, i) => !stillValid[i]);
    if (invalid.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: '선택한 항목 중 이미 처리되었거나 아직 유예기간이 남은 것이 있습니다. 목록을 새로고침해주세요.',
        data: { invalidIds: invalid.map((it) => it.id) },
      });
    }

    const purgedKeys: string[] = [];
    for (const it of items) {
      const row = await prisma.farewellMessage.findUnique({ where: { id: it.id }, select: { id: true, mediaKey: true } });
      if (!row) continue;
      const key = it.type === 'MEDIA' ? await purgeMediaRow(row) : await purgeLetterRow(row);
      if (key) purgedKeys.push(key);
    }

    // 감사 로그 — 누가·언제·몇 건·어떤 키(§5.6-8-3-3 #57).
    await prisma.farewellPurgeAuditLog.create({
      data: {
        adminId: decoded.id,
        adminName: decoded.name,
        targetIds: items.map((it) => it.id).join(','),
        mediaKeys: purgedKeys.join(','),
        count: items.length,
      },
    });

    return res.json({ status: 'success', data: { purgedCount: items.length, archiveKeysQueued: purgedKeys.length } });
  } catch (error) {
    console.error('유족 메시지 파기 실행 실패:', error);
    return res.status(500).json({ status: 'error', message: '파기 처리 중 오류가 발생했습니다.' });
  }
};

// 아카이브 2단계 완료 표시 (`PATCH /api/admin/farewell-purge/pending-archive/:id/complete`) — 화면은
// 아카이브를 지우지 않는다. 사람이 대시보드에서 지운 뒤 완료 표시만 한다(#59).
export const completeArchivePurge = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const row = await prisma.archivePurgeQueue.update({
      where: { id: req.params.id },
      data: { purgedAt: new Date() },
    });
    return res.json({ status: 'success', data: row });
  } catch (error) {
    console.error('아카이브 완료 표시 실패:', error);
    return res.status(500).json({ status: 'error', message: '완료 표시 중 오류가 발생했습니다.' });
  }
};
