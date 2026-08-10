import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { encryptField, decryptField } from '../utils/crypto';

// 전문가(변호사·세무사·행정사·장례지도사) 인증 — Partner(장사시설)와 완전 분리된 계정 체계.
// docs/04_상속세_전문가상담/17_전문가_계정_체계_구현_메모.md 근거. 인증 방식(비밀번호 해시,
// JWT 발급, refresh 회전)은 partnerController.ts와 동일 패턴을 재사용하되, aud 클레임으로
// 사업자(Partner)·전문가(Expert)·B2C(User) 3종 토큰이 서로 섞이지 않게 분리한다.

const JWT_SECRET = process.env.JWT_SECRET || 'eobom_jwt_secret_key_2026_well_dying';
const ACCESS_TOKEN_TTL = '2h';
const REFRESH_TOKEN_TTL = '30d';
const MIN_PASSWORD_LENGTH = 8;

// docs/15 §2의 4대 전문가 직역
const EXPERT_CATEGORIES = ['LAWYER', 'TAX_ACCOUNTANT', 'ADMINISTRATIVE_SCRIVENER', 'FUNERAL_DIRECTOR'] as const;
type ExpertCategory = (typeof EXPERT_CATEGORIES)[number];
const isValidCategory = (v: unknown): v is ExpertCategory => EXPERT_CATEGORIES.includes(v as ExpertCategory);

interface ExpertAccessPayload extends jwt.JwtPayload {
  id: string;
  name: string;
  category: string;
  aud: 'expert';
}

interface ExpertRefreshPayload extends jwt.JwtPayload {
  sub: string; // expertId
  purpose: 'expert_refresh';
  aud: 'expert';
}

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const generateAccessToken = (expert: { id: string; name: string; category: string }) =>
  jwt.sign({ id: expert.id, name: expert.name, category: expert.category, aud: 'expert' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const generateRefreshToken = (expertId: string) =>
  jwt.sign({ sub: expertId, purpose: 'expert_refresh', aud: 'expert' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

// 헬퍼: Authorization 헤더의 전문가 Bearer 토큰 검증 (실패 시 null). aud !== 'expert'면 거부해
// B2C·사업자 토큰이 전문가 라우트로 들어오는 것을 막는다(docs 16 §6.4와 동일 원칙).
export const verifyExpertBearerToken = (req: Request): ExpertAccessPayload | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as ExpertAccessPayload;
    if (decoded.aud !== 'expert') return null;
    return decoded;
  } catch {
    return null;
  }
};

const EXPERT_STATUS_MESSAGE: Record<string, string> = {
  PENDING: '가입 심사가 진행 중입니다. 자격 확인 후 승인 결과를 안내드립니다.',
  REJECTED: '가입이 반려되었습니다. 반려 사유를 확인해주세요.',
  SUSPENDED: '이용이 정지된 계정입니다. 고객센터로 문의해주세요.',
};

// 가입 신청 (`POST /api/expert/signup`) — 승인 전까지 로그인 불가. 자동승인 없음(§ 법적 리스크 메모 참고)
export const signup = async (req: Request, res: Response) => {
  const { email, password, category, name, licenseNo, licenseOrg, licenseDocUrl, contactPhone, bio } = req.body as {
    email?: string;
    password?: string;
    category?: string;
    name?: string;
    licenseNo?: string;
    licenseOrg?: string;
    licenseDocUrl?: string;
    contactPhone?: string;
    bio?: string;
  };

  if (!email || !password || !category || !name || !licenseNo || !contactPhone) {
    return res.status(400).json({
      status: 'error',
      message: '이메일, 비밀번호, 전문 분야, 이름, 자격증 등록번호, 연락처는 필수입니다.',
    });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ status: 'error', message: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` });
  }
  if (!isValidCategory(category)) {
    return res.status(400).json({ status: 'error', message: `전문 분야는 ${EXPERT_CATEGORIES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const [existingEmail, existingLicense] = await Promise.all([
      prisma.expert.findUnique({ where: { email } }),
      prisma.expert.findUnique({ where: { category_licenseNo: { category, licenseNo } } }),
    ]);
    if (existingEmail) {
      return res.status(409).json({ status: 'error', message: '이미 가입 신청된 이메일입니다.' });
    }
    if (existingLicense) {
      return res.status(409).json({ status: 'error', message: '이미 등록된 자격증 번호입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const expert = await prisma.expert.create({
      data: {
        email,
        passwordHash,
        category,
        name,
        licenseNo,
        licenseOrg,
        licenseDocUrl,
        contactPhone,
        bio,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      status: 'success',
      message: '가입 신청이 접수되었습니다. 자격 확인 후 승인 결과를 안내드립니다.',
      data: { id: expert.id, status: expert.status },
    });
  } catch (error) {
    console.error('전문가 가입 신청 실패:', error);
    return res.status(500).json({ status: 'error', message: '가입 신청 처리 중 오류가 발생했습니다.' });
  }
};

// 로그인 (`POST /api/expert/login`) — APPROVED 상태만 허용
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const expert = await prisma.expert.findUnique({ where: { email } });
    if (!expert || !(await bcrypt.compare(password, expert.passwordHash))) {
      return res.status(401).json({ status: 'error', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    if (expert.status !== 'APPROVED') {
      return res.status(403).json({
        status: 'error',
        message: EXPERT_STATUS_MESSAGE[expert.status] || '로그인할 수 없는 계정 상태입니다.',
        data: { status: expert.status },
      });
    }

    const accessToken = generateAccessToken(expert);
    const refreshToken = generateRefreshToken(expert.id);
    await prisma.expert.update({ where: { id: expert.id }, data: { refreshTokenHash: sha256(refreshToken) } });

    return res.json({
      status: 'success',
      accessToken,
      refreshToken,
      expert: { id: expert.id, name: expert.name, category: expert.category, email: expert.email, status: expert.status },
    });
  } catch (error) {
    console.error('전문가 로그인 실패:', error);
    return res.status(500).json({ status: 'error', message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 토큰 갱신 (`POST /api/expert/refresh`) — 회전 방식(partnerController.ts와 동일 원칙)
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ status: 'error', message: 'refreshToken이 필요합니다.' });
  }

  let decoded: ExpertRefreshPayload;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET) as ExpertRefreshPayload;
    if (decoded.aud !== 'expert' || decoded.purpose !== 'expert_refresh') {
      throw new Error('invalid refresh token purpose');
    }
  } catch {
    return res.status(401).json({ status: 'error', message: '유효하지 않거나 만료된 refreshToken입니다.' });
  }

  try {
    const expert = await prisma.expert.findUnique({ where: { id: decoded.sub } });
    if (!expert || expert.refreshTokenHash !== sha256(refreshToken)) {
      return res.status(401).json({ status: 'error', message: 'refreshToken이 더 이상 유효하지 않습니다. 다시 로그인해주세요.' });
    }
    if (expert.status !== 'APPROVED') {
      return res.status(403).json({ status: 'error', message: EXPERT_STATUS_MESSAGE[expert.status] || '로그인할 수 없는 계정 상태입니다.' });
    }

    const newAccessToken = generateAccessToken(expert);
    const newRefreshToken = generateRefreshToken(expert.id);
    await prisma.expert.update({ where: { id: expert.id }, data: { refreshTokenHash: sha256(newRefreshToken) } });

    return res.json({ status: 'success', accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('전문가 토큰 갱신 실패:', error);
    return res.status(500).json({ status: 'error', message: '토큰 갱신 처리 중 오류가 발생했습니다.' });
  }
};

const serializeExpert = (expert: {
  id: string;
  email: string;
  category: string;
  name: string;
  licenseNo: string;
  licenseOrg: string | null;
  contactPhone: string;
  bio: string | null;
  specialties: string[];
  status: string;
  rejectReason: string | null;
  settlementBank: string | null;
  settlementAccount: string | null;
}) => ({
  id: expert.id,
  email: expert.email,
  category: expert.category,
  name: expert.name,
  licenseNo: expert.licenseNo,
  licenseOrg: expert.licenseOrg,
  contactPhone: expert.contactPhone,
  bio: expert.bio,
  specialties: expert.specialties,
  status: expert.status,
  rejectReason: expert.rejectReason,
  settlementBank: expert.settlementBank,
  settlementAccount: expert.settlementAccount ? decryptField(expert.settlementAccount) : null,
});

// 내 정보 조회 (`GET /api/expert/me`)
export const getMe = async (req: Request, res: Response) => {
  const decoded = verifyExpertBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const expert = await prisma.expert.findUnique({ where: { id: decoded.id } });
    if (!expert) {
      return res.status(404).json({ status: 'error', message: '전문가 정보를 찾을 수 없습니다.' });
    }
    return res.json({ status: 'success', data: serializeExpert(expert) });
  } catch (error) {
    console.error('전문가 정보 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 조회 중 오류가 발생했습니다.' });
  }
};

// 연락처·소개·정산계좌 수정 (`PATCH /api/expert/me`)
export const updateMe = async (req: Request, res: Response) => {
  const decoded = verifyExpertBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { contactPhone, bio, specialties, settlementBank, settlementAccount } = req.body as {
    contactPhone?: string;
    bio?: string;
    specialties?: string[];
    settlementBank?: string;
    settlementAccount?: string;
  };

  try {
    const expert = await prisma.expert.update({
      where: { id: decoded.id },
      data: {
        ...(contactPhone ? { contactPhone } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(Array.isArray(specialties) ? { specialties } : {}),
        ...(settlementBank ? { settlementBank } : {}),
        ...(settlementAccount ? { settlementAccount: encryptField(settlementAccount) } : {}),
      },
    });
    return res.json({ status: 'success', data: serializeExpert(expert) });
  } catch (error) {
    console.error('전문가 정보 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 수정 중 오류가 발생했습니다.' });
  }
};
