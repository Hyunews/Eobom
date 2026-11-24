import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { JWT_SECRET } from '../config/jwt';
import { writeAdminLoginAudit, setAuditTarget } from '../services/opsLogService';
import { scheduleAccountDeletion } from '../services/accountDeletionService';

// 운영자(내부 직원) 인증. Partner/Expert와 같은 패턴(비밀번호 해시, JWT 회전)이지만
// **공개 가입 API가 없다** — 계정은 `prisma/seed-admin.ts`로만 만든다(README 참고).

const ACCESS_TOKEN_TTL = '2h';
// 00-37 §7 #5 — 운영자 세션이 한 달 살아 있을 이유가 없다(10-01 확정, 30d → 1d). access 2h는 그대로.
const REFRESH_TOKEN_TTL = '1d';

// 00-37 §7 #7 로그인 잠금 — 같은 계정 연속 5회 실패 → 15분 잠금.
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
// 🔴 잠금 응답은 이 한 가지뿐 — 계정 존재 여부·남은 횟수를 알려주지 않는다.
const LOCKED_MESSAGE = '잠시 후 다시 시도해 주세요.';

interface AdminAccessPayload extends jwt.JwtPayload {
  id: string;
  name: string;
  aud: 'admin';
}

interface AdminRefreshPayload extends jwt.JwtPayload {
  sub: string;
  purpose: 'admin_refresh';
  aud: 'admin';
}

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const generateAccessToken = (admin: { id: string; name: string }) =>
  jwt.sign({ id: admin.id, name: admin.name, aud: 'admin' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

const generateRefreshToken = (adminId: string) =>
  jwt.sign({ sub: adminId, purpose: 'admin_refresh', aud: 'admin' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

// 헬퍼: Authorization 헤더의 운영자 Bearer 토큰 검증 (실패 시 null). aud !== 'admin'이면 거부 —
// Partner/Expert/B2C 토큰이 관리자 라우트로 들어오는 것을 막는다. moderationController.ts가 이걸 가져다 쓴다.
export const verifyAdminBearerToken = (req: Request): AdminAccessPayload | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as AdminAccessPayload;
    if (decoded.aud !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
};

// 00-37 A-1 #1 — 라우터 레벨 인증 미들웨어. 예전엔 핸들러 20개가 각자
// `verifyAdminBearerToken(req)` + 401 분기를 반복 호출했다(§2.3 "새 엔드포인트에서 한 줄
// 빠지면 그대로 공개"). `adminRoutes.ts`에서 `/login`·`/refresh` 다음에 `router.use()`로
// 한 번만 건다 — 그 아래 모든 라우트는 이 미들웨어를 반드시 통과해야 핸들러에 도달한다.
// 통과한 핸들러가 운영자 신원이 다시 필요하면(예: 감사 로그에 남길 id·name) 검증이 이미
// 끝났으므로 `verifyAdminBearerToken(req)!`로 non-null 단정해 다시 꺼내 쓴다.
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }
  next();
};

// 00-37 §3.3 서버 등급 검사 — SUPERADMIN만 하는 일의 라우트에 건다(requireAdminAuth 다음). 화면이 흐리게 보여 주는 것과 별개로 서버가 막는다.
// 토큰에는 등급을 싣지 않는다(등급을 바꿔도 이미 받은 토큰이 낡은 등급을 들고 있지 않게) — 요청마다 DB에서 읽는다.
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }
  try {
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id }, select: { role: true } });
    if (admin?.role !== 'SUPERADMIN') {
      return res.status(403).json({ status: 'error', message: '최고 관리자(SUPERADMIN)만 할 수 있습니다.' });
    }
    next();
  } catch (error) {
    console.error('운영자 등급 확인 실패:', error);
    return res.status(500).json({ status: 'error', message: '권한 확인 중 오류가 발생했습니다.' });
  }
};

// 로그인 (`POST /api/admin/login`)
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    // 🔴 잠긴 동안은 비밀번호가 맞아도 거부한다 — 비밀번호 비교보다 먼저 본다(잠금 중에는 시도 자체를 세지 않는다).
    const now = new Date();
    const lockExpired = !!admin?.lockedUntil && admin.lockedUntil <= now;
    if (admin?.lockedUntil && !lockExpired) {
      await writeAdminLoginAudit(req, { adminId: admin.id, adminName: admin.name, action: 'LOCKED', result: 'FAIL', reason: '잠금 중 시도 거부' });
      return res.status(429).json({ status: 'error', message: LOCKED_MESSAGE });
    }

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      if (admin) {
        // 원자적 증가 — 동시 요청으로 횟수를 건너뛰며 시도하지 못하게 한다. 잠금이 풀린 뒤 첫 실패는 1부터 다시 센다.
        const updated = await prisma.admin.update({
          where: { id: admin.id },
          data: lockExpired ? { failedLoginCount: 1, lockedUntil: null } : { failedLoginCount: { increment: 1 } },
          select: { failedLoginCount: true },
        });
        if (updated.failedLoginCount >= MAX_FAILED_LOGINS) {
          await prisma.admin.update({ where: { id: admin.id }, data: { lockedUntil: new Date(Date.now() + LOCK_MS) } });
          await writeAdminLoginAudit(req, { adminId: admin.id, adminName: admin.name, action: 'LOCKED', result: 'FAIL', reason: '잠금 시작' });
        }
      }
      // 🔴 없는 계정도 남긴다(대입 공격 탐지) — 단 시도한 이메일은 담지 않는다(00-42 §4.9). 계정을 못 찾으면 id·이름이 빈 값이다.
      await writeAdminLoginAudit(req, { adminId: admin?.id ?? '', adminName: admin?.name ?? '', action: 'LOGIN_FAIL', result: 'FAIL' });
      return res.status(401).json({ status: 'error', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin.id);
    // 성공하면 실패 횟수를 0으로(만료된 잠금 표시도 함께 지운다)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { refreshTokenHash: sha256(refreshToken), failedLoginCount: 0, lockedUntil: null },
    });
    await writeAdminLoginAudit(req, { adminId: admin.id, adminName: admin.name, action: 'LOGIN', result: 'SUCCESS' });

    return res.json({ status: 'success', accessToken, refreshToken, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('운영자 로그인 실패:', error);
    return res.status(500).json({ status: 'error', message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 토큰 갱신 (`POST /api/admin/refresh`) — 회전 방식(Partner/Expert와 동일 원칙)
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ status: 'error', message: 'refreshToken이 필요합니다.' });
  }

  let decoded: AdminRefreshPayload;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET) as AdminRefreshPayload;
    if (decoded.aud !== 'admin' || decoded.purpose !== 'admin_refresh') {
      throw new Error('invalid refresh token purpose');
    }
  } catch {
    return res.status(401).json({ status: 'error', message: '유효하지 않거나 만료된 refreshToken입니다.' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: decoded.sub } });
    if (!admin || admin.refreshTokenHash !== sha256(refreshToken)) {
      return res.status(401).json({ status: 'error', message: 'refreshToken이 더 이상 유효하지 않습니다. 다시 로그인해주세요.' });
    }

    const newAccessToken = generateAccessToken(admin);
    const newRefreshToken = generateRefreshToken(admin.id);
    await prisma.admin.update({ where: { id: admin.id }, data: { refreshTokenHash: sha256(newRefreshToken) } });

    return res.json({ status: 'success', accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('운영자 토큰 갱신 실패:', error);
    return res.status(500).json({ status: 'error', message: '토큰 갱신 처리 중 오류가 발생했습니다.' });
  }
};

// 내 정보 조회 (`GET /api/admin/me`)
export const getMe = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증(00-37 A-1 #1)

  try {
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      return res.status(404).json({ status: 'error', message: '운영자 정보를 찾을 수 없습니다.' });
    }
    return res.json({ status: 'success', data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('운영자 정보 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 조회 중 오류가 발생했습니다.' });
  }
};

// 회원 목록 (`GET /api/admin/users`, 00-37 §6 A-2 #8) — 이름·이메일 부분일치 검색 + 페이지네이션.
// `facilityController.getFacilities`와 같은 응답 형태(count·page·pageSize·totalPages·data)로
// 맞춘다 — AdminPage.tsx의 loadFacilities가 그 형태를 그대로 소비하는 패턴을 재사용하기 위함.
// select는 목록 단계에서 꼭 필요한 것만(§3.1) — 연락처·주소 등은 상세(getUserDetailForAdmin)
// 진입 후에만 보인다.
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const listUsersForAdmin = async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt((req.query.pageSize as string) || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));

  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] }
    : {};

  try {
    const [count, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, createdAt: true, suspendedAt: true, deletionScheduledAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return res.json({
      status: 'success',
      count,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
      data: users,
    });
  } catch (error) {
    console.error('회원 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '회원 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 회원(B2C User) 상세 (`GET /api/admin/users/:id`) — 도메인 데이터 조인 표시(docs 04-01 §5.4 · 05-01 §4.4).
// `03-01` §2가 요구했던 "회원 클릭 시 관련 도메인 데이터 확인"의 실제 구현. 05 도메인(엔딩노트)은
// 열람 범위가 미확정(`05-01` §3)이라 여기 포함하지 않는다 — 이 문서의 결정을 05에 유추 적용하지 말 것.
// 🔴 00-37 §7 #1(10-15 확정) — 열람 사유 필수: `?reason=` 이 비면 400, 있으면 AdminAuditLog.reason에 저장.
export const getUserDetailForAdmin = async (req: Request, res: Response) => {
  const reason = typeof req.query.reason === 'string' ? req.query.reason.trim() : '';
  if (!reason) {
    return res.status(400).json({ status: 'error', message: '회원 상세를 열람하려면 사유를 입력해야 합니다.' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        // 묶음 13 — 정지·탈퇴 대리 접수 창이 쓴다(00-37 §4.1). 🔴 suspendReason(운영자 메모)은 운영자 화면 전용이라 여기서만 내보낸다
        suspendedAt: true,
        suspendReason: true,
        deletionRequestedAt: true,
        deletionScheduledAt: true,
        memorials: {
          select: { id: true, slug: true, deceasedName: true, visibility: true, closedAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        // 정지 창 "이 회원이 연 부고장 n건" + 각 글로 가는 링크 — 건수·링크뿐, 내용은 넣지 않는다(§3.1)
        obituaries: {
          select: { id: true, closedAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { memorialGuestbooks: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: '회원을 찾을 수 없습니다.' });
    }

    // 00-37 §3.2·§6 A-2 #8 — "조회도 기록한다". 기록은 adminAudit 미들웨어가 남긴다(00-42 §7) —
    // 🔴 예전엔 여기서 실패를 삼켰지만 지금은 기록을 못 쓰면 응답이 나가지 않는다(00-42 §5.2 ⑤). 대상 회원 id만 채운다.
    setAuditTarget(res, { targetType: 'User', targetId: user.id, reason });

    const { _count, ...rest } = user;
    return res.json({ status: 'success', data: { ...rest, guestbookCount: _count.memorialGuestbooks } });
  } catch (error) {
    console.error('회원 상세 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '회원 상세 조회 중 오류가 발생했습니다.' });
  }
};

// ───────────── 회원 정지·해제 · 탈퇴 대리 접수 (8단계 묶음 13, 00-37 §4.1 · §3.3) ─────────────
// 🔴 셋 다 SUPERADMIN만(adminRoutes.ts에서 requireSuperAdmin) · 사유 필수 → 감사로그 사유 칸.
const MAX_USER_REASON_LENGTH = 500;

const readReason = (req: Request): { reason: string } | { error: string } => {
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!reason) return { error: '사유를 입력해야 처리할 수 있습니다.' };
  if (reason.length > MAX_USER_REASON_LENGTH) return { error: `사유는 ${MAX_USER_REASON_LENGTH}자 이하여야 합니다.` };
  return { reason };
};

// 회원 정지 (`PATCH /api/admin/users/:id/suspend`) — memorializedAt과 같은 방식으로 막는다(로그인 콜백 거부 + 이미 받은 토큰 403).
// 데이터·추모관·부고장은 건드리지 않는다. 이미 정지된 회원이면 사유·시각을 다시 찍지 않는다(409).
export const suspendUser = async (req: Request, res: Response) => {
  const r = readReason(req);
  if ('error' in r) return res.status(400).json({ status: 'error', message: r.error });
  try {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, purgedAt: null }, select: { id: true, suspendedAt: true } });
    if (!user) return res.status(404).json({ status: 'error', message: '회원을 찾을 수 없습니다.' });
    if (user.suspendedAt) return res.status(409).json({ status: 'error', message: '이미 정지된 회원입니다.' });
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { suspendedAt: new Date(), suspendReason: r.reason },
      select: { id: true, suspendedAt: true },
    });
    setAuditTarget(res, { action: 'SUSPEND', targetType: 'User', targetId: user.id, reason: r.reason });
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('회원 정지 실패:', error);
    return res.status(500).json({ status: 'error', message: '회원 정지 처리 중 오류가 발생했습니다.' });
  }
};

// 회원 정지 해제 (`PATCH /api/admin/users/:id/unsuspend`) — 두 칸을 비우면 바로 복구된다. 해제도 사유 필수(같은 일의 반쪽, 00-37 §4.1).
export const unsuspendUser = async (req: Request, res: Response) => {
  const r = readReason(req);
  if ('error' in r) return res.status(400).json({ status: 'error', message: r.error });
  try {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, purgedAt: null }, select: { id: true, suspendedAt: true } });
    if (!user) return res.status(404).json({ status: 'error', message: '회원을 찾을 수 없습니다.' });
    if (!user.suspendedAt) return res.status(409).json({ status: 'error', message: '정지된 회원이 아닙니다.' });
    await prisma.user.update({ where: { id: user.id }, data: { suspendedAt: null, suspendReason: null } });
    setAuditTarget(res, { action: 'UNSUSPEND', targetType: 'User', targetId: user.id, reason: r.reason });
    return res.json({ status: 'success', data: { id: user.id, suspendedAt: null } });
  } catch (error) {
    console.error('회원 정지 해제 실패:', error);
    return res.status(500).json({ status: 'error', message: '정지 해제 처리 중 오류가 발생했습니다.' });
  }
};

// 탈퇴 대리 접수 (`POST /api/admin/users/:id/deletion-request`) — 메일·서면으로 요청한 회원 본인(또는 위임장을 낸 대리인) 대신 신청을 넣는다.
// 🔴 본인 탈퇴와 **같은 처리**(accountDeletionService) — 유예는 항상 30일(줄이거나 건너뛰지 않음), 접수 뒤 본인이 로그인하면 직접 취소할 수 있다.
// 🔴 운영자가 대신 취소하는 기능은 없다. 이미 유예 중이면 409(버튼도 흐림).
export const requestUserDeletionByAdmin = async (req: Request, res: Response) => {
  const r = readReason(req);
  if ('error' in r) return res.status(400).json({ status: 'error', message: r.error });
  try {
    const result = await scheduleAccountDeletion(req.params.id);
    if (!result) return res.status(404).json({ status: 'error', message: '회원을 찾을 수 없습니다.' });
    if (!result.created) {
      return res.status(409).json({ status: 'error', message: '이미 탈퇴 유예 중인 회원입니다.', data: { deletionScheduledAt: result.deletionScheduledAt } });
    }
    setAuditTarget(res, { action: 'WITHDRAW', targetType: 'User', targetId: req.params.id, reason: r.reason });
    const { created: _created, ...data } = result;
    return res.status(201).json({ status: 'success', data });
  } catch (error) {
    console.error('탈퇴 대리 접수 실패:', error);
    return res.status(500).json({ status: 'error', message: '탈퇴 접수 중 오류가 발생했습니다.' });
  }
};
