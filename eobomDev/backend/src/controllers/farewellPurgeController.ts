import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import { findWillPhotoExpired, isStillWillPhotoExpired, purgeWillPhotoSet } from '../services/willPhotoService';
import {
  findMediaExpired,
  findLetterExpired,
  findRetiredExpired,
  isStillMediaExpired,
  isStillLetterExpired,
  isStillRetiredExpired,
  purgeRetiredRow,
  purgeMediaRow,
  purgeLetterRow,
  listPendingArchivePurge,
} from '../services/farewellPurgeService';

// docs 06-05 §5.6-8-3·§5.6-8-3-1·§5.6-8-3-2·§5.6-8-3-3 D-11 — 어드민 파기 화면.
// 🔴 정상 만료분만 다룬다. 만료 전 데이터에 대한 조작(강제 삭제)은 어디에도 없다 —
// 그건 Cloudflare 대시보드 전용이다(§5.6-8-3-1). 로직은 farewellPurgeService.ts를
// 스크립트(destroy-farewell-media.ts)와 공유한다 — 한쪽만 고쳐지는 날이 오지 않게 한다.

// RETIRED = 삭제 유예 중 새 음성이 밀어낸 이전 음성(FarewellMediaRetired, D-12 #71). id는 그 표의 id다.
// WILL = 유언장 사진 묶음(WillPhotoSet) — 06-06 §5-2-5 ④ 유언장 사진 만료. 복제(archive)가 없어 원장에 올리지 않는다.
type PurgeItem = { id: string; type: 'MEDIA' | 'LETTER' | 'RETIRED' | 'WILL' };

// 감사 로그 targetIds 항목 접두(#73) — 06-05 §6.5. 접두 없는 항목은 접두 도입 전의 옛 행이다.
// I = 유언장 사진 묶음(WillPhotoSet.id, 06-06 §5-2-5).
const AUDIT_PREFIX = { MEDIA: 'V', LETTER: 'L', RETIRED: 'R', WILL: 'I' } as const;
type AuditKind = 'V' | 'L' | 'R' | 'I';
const isAuditKind = (v: unknown): v is AuditKind => v === 'V' || v === 'L' || v === 'R' || v === 'I';

// 만료 대상 목록 (`GET /api/admin/farewell-purge/expired`) — ①②와 밀려난 음성을 구분해서 표시(#54·#71).
export const listFarewellPurgeExpired = async (req: Request, res: Response) => {
  try {
    const [media, letter, retired, willPhoto] = await Promise.all([
      findMediaExpired(),
      findLetterExpired(),
      findRetiredExpired(),
      findWillPhotoExpired(),
    ]);
    return res.json({
      status: 'success',
      data: {
        media: media.map((r) => ({ id: r.id, title: r.title, mediaDeletedAt: r.mediaDeletedAt })),
        // 🔴 개인정보 없음 — 밀려난 음성(FarewellMediaRetired) id·삭제 시각뿐(편지 id·R2 키는 내려주지 않는다)
        retired: retired.map((r) => ({ id: r.id, deletedAt: r.deletedAt })),
        letter: letter.map((r) => ({ id: r.id, title: r.title, deletedAt: r.deletedAt, hasMedia: !!r.mediaKey })),
        // 🔴 개인정보 없음 — 묶음 id·삭제 시각·쪽수뿐(올린 회원·R2 키는 내려주지 않는다)
        willPhoto: willPhoto.map((r) => ({ id: r.id, deletedAt: r.deletedAt, pageCount: r.pageCount })),
      },
    });
  } catch (error) {
    console.error('유족 메시지 파기 대상 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 아카이브 2단계 미이행 목록 (`GET /api/admin/farewell-purge/pending-archive`) — purgedAt IS NULL(#59).
export const listFarewellPendingArchive = async (req: Request, res: Response) => {
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
  // 라우터 미들웨어(requireAdminAuth)가 이미 검증을 마쳤으므로 non-null 단정 — 감사로그에
  // 남길 admin id·name이 필요해 여기서만 다시 값을 꺼낸다(00-37 A-1 #1).
  const decoded = verifyAdminBearerToken(req)!;
  const { items, expectedCount, password } = req.body as {
    items?: PurgeItem[];
    expectedCount?: number;
    password?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 'error', message: '파기할 항목을 선택해주세요.' });
  }
  if (items.some((it) => !it.id || (it.type !== 'MEDIA' && it.type !== 'LETTER' && it.type !== 'RETIRED' && it.type !== 'WILL'))) {
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
      items.map((it) =>
        it.type === 'MEDIA'
          ? isStillMediaExpired(it.id)
          : it.type === 'RETIRED'
            ? isStillRetiredExpired(it.id)
            : it.type === 'WILL'
              ? isStillWillPhotoExpired(it.id)
              : isStillLetterExpired(it.id)),
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
      if (it.type === 'WILL') {
        // R2 원본 삭제 → purgedAt. 복제가 없어 원장에 올리지 않고 2단계 안내도 없다(§5-2-5 ②).
        await purgeWillPhotoSet(it.id);
        continue;
      }
      if (it.type === 'RETIRED') {
        // 원장 → R2 원본 삭제 → purgedAt(행은 지우지 않는다). 편지 행과 무관하다.
        const retiredRow = await prisma.farewellMediaRetired.findUnique({ where: { id: it.id }, select: { id: true, mediaKey: true } });
        if (!retiredRow) continue;
        const key = await purgeRetiredRow(retiredRow);
        if (key) purgedKeys.push(key);
        continue;
      }
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
        // 종류 접두(#73) — V:음성만 · L:편지 통째 · R:밀려난 음성(FarewellMediaRetired.id라 편지 id와 섞이지 않게) · I:유언장 사진 묶음.
        targetIds: items.map((it) => `${AUDIT_PREFIX[it.type]}:${it.id}`).join(','),
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

// 파기 기록 보기 (`GET /api/admin/farewell-purge/logs?type=V|L|R|I&page=&pageSize=`) — #74.
// 🔴 읽기 전용 · 편지 제목/본문·R2 키를 붙이지 않는다(대상 id와 건수뿐). 최근 순.
// type 필터 = 해당 접두 항목이 targetIds에 하나라도 있는 행. 접두 없는 옛 행은 type 없이(전체)만 보인다.
export const listFarewellPurgeLogs = async (req: Request, res: Response) => {
  try {
    const rawType = typeof req.query.type === 'string' ? req.query.type : '';
    if (rawType && !isAuditKind(rawType)) {
      return res.status(400).json({ status: 'error', message: 'type은 V, L, R, I 중 하나여야 합니다.' });
    }
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
    // 항목은 `X:<uuid>`를 콤마로 이은 것 — uuid에는 콤마·콜론이 없어 맨 앞(startsWith)·중간(`,X:`)만 보면 된다.
    const where = rawType
      ? { OR: [{ targetIds: { startsWith: `${rawType}:` } }, { targetIds: { contains: `,${rawType}:` } }] }
      : {};
    const [total, rows] = await Promise.all([
      prisma.farewellPurgeAuditLog.count({ where }),
      prisma.farewellPurgeAuditLog.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, adminName: true, targetIds: true, count: true, executedAt: true },
      }),
    ]);
    const logs = rows.map((r) => {
      const targets = r.targetIds ? r.targetIds.split(',') : [];
      const counts = { V: 0, L: 0, R: 0, I: 0, unknown: 0 };
      for (const t of targets) {
        const kind = t.charAt(1) === ':' ? t.charAt(0) : '';
        if (isAuditKind(kind)) counts[kind] += 1;
        else counts.unknown += 1;
      }
      return { id: r.id, executedAt: r.executedAt, adminName: r.adminName, count: r.count, counts, targets };
    });
    return res.json({ status: 'success', data: { logs, total, page, pageSize } });
  } catch (error) {
    console.error('파기 기록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '기록 조회 중 오류가 발생했습니다.' });
  }
};

// 아카이브 2단계 완료 표시 (`PATCH /api/admin/farewell-purge/pending-archive/:id/complete`) — 화면은
// 아카이브를 지우지 않는다. 사람이 대시보드에서 지운 뒤 완료 표시만 한다(#59).
export const completeArchivePurge = async (req: Request, res: Response) => {
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
