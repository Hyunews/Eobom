import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

// 운영자(내부 직원) 인증. Partner/Expert와 같은 패턴(비밀번호 해시, JWT 회전)이지만
// **공개 가입 API가 없다** — 계정은 `prisma/seed-admin.ts`로만 만든다(README 참고).

const JWT_SECRET = process.env.JWT_SECRET || 'eobom_jwt_secret_key_2026_well_dying';
const ACCESS_TOKEN_TTL = '2h';
const REFRESH_TOKEN_TTL = '30d';

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

// 로그인 (`POST /api/admin/login`)
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ status: 'error', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin.id);
    await prisma.admin.update({ where: { id: admin.id }, data: { refreshTokenHash: sha256(refreshToken) } });

    return res.json({ status: 'success', accessToken, refreshToken, admin: { id: admin.id, name: admin.name, email: admin.email } });
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
    return res.json({ status: 'success', data: { id: admin.id, name: admin.name, email: admin.email } });
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
        select: { id: true, name: true, email: true, role: true, createdAt: true },
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
export const getUserDetailForAdmin = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        digitalCleanupItems: {
          select: {
            id: true,
            status: true,
            customName: true,
            createdAt: true,
            platform: { select: { id: true, name: true, category: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        memorials: {
          select: { id: true, slug: true, deceasedName: true, visibility: true, closedAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { memorialGuestbooks: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: '회원을 찾을 수 없습니다.' });
    }

    // 00-37 §3.2·§6 A-2 #8 — "조회도 기록한다". 개인정보를 여는 조회라 성공했을 때만 남긴다.
    // 기록 실패가 조회 자체를 막으면 안 되므로 별도 try/catch로 삼킨다.
    try {
      const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증(00-37 A-1 #1)
      await prisma.adminAuditLog.create({
        data: { adminId: decoded.id, adminName: decoded.name, action: 'VIEW', targetType: 'User', targetId: user.id },
      });
    } catch (auditError) {
      console.error('회원 상세 열람 감사로그 기록 실패:', auditError);
    }

    const { _count, ...rest } = user;
    return res.json({ status: 'success', data: { ...rest, guestbookCount: _count.memorialGuestbooks } });
  } catch (error) {
    console.error('회원 상세 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '회원 상세 조회 중 오류가 발생했습니다.' });
  }
};
