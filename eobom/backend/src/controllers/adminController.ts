import { Request, Response } from 'express';
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
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

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

// 회원(B2C User) 상세 (`GET /api/admin/users/:id`) — 03 도메인 데이터 조인 표시(docs 03-02 §6.4).
// `03-01` §2가 요구했던 "회원 클릭 시 관련 도메인 데이터 확인"의 실제 구현. 05 도메인(엔딩노트)은
// 열람 범위가 미확정(`05-01` §3)이라 여기 포함하지 않는다 — 이 문서의 결정을 05에 유추 적용하지 말 것.
export const getUserDetailForAdmin = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

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

    const { _count, ...rest } = user;
    return res.json({ status: 'success', data: { ...rest, guestbookCount: _count.memorialGuestbooks } });
  } catch (error) {
    console.error('회원 상세 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '회원 상세 조회 중 오류가 발생했습니다.' });
  }
};
