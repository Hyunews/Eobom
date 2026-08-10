import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { encryptField, decryptField } from '../utils/crypto';
import { normalizePhone, isValidPhoneLength, MIN_PHONE_DIGITS, MAX_PHONE_DIGITS } from '../utils/phone';

// 사업자(Partner) 인증 — B2C User와 완전히 분리된 토큰 체계 (docs 16 §3, §6.1, §6.4)
// aud: 'partner' 클레임으로 B2C 토큰과 교차 사용을 막는다. B2C authController.ts와 시크릿은
// 공유하되(별도 키를 새로 관리하는 비용을 피함) payload 목적으로 구분한다.

const JWT_SECRET = process.env.JWT_SECRET || 'eobom_jwt_secret_key_2026_well_dying';
const ACCESS_TOKEN_TTL = '2h';
const REFRESH_TOKEN_TTL = '30d';
const BIZ_REG_NO_LENGTH = 10;
const MIN_PASSWORD_LENGTH = 8;

interface PartnerAccessPayload extends jwt.JwtPayload {
  id: string;
  companyName: string;
  aud: 'partner';
}

interface PartnerRefreshPayload extends jwt.JwtPayload {
  sub: string; // partnerId
  purpose: 'partner_refresh';
  aud: 'partner';
}

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const normalizeBizRegNo = (raw: string) => raw.replace(/[^0-9]/g, '');

const generateAccessToken = (partner: { id: string; companyName: string }) =>
  jwt.sign({ id: partner.id, companyName: partner.companyName, aud: 'partner' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const generateRefreshToken = (partnerId: string) =>
  jwt.sign({ sub: partnerId, purpose: 'partner_refresh', aud: 'partner' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

// 헬퍼: Authorization 헤더의 사업자 Bearer 토큰 검증 (실패 시 null). B2C verifyBearerToken과
// 대칭되는 함수 — aud !== 'partner'면 거부해 B2C 토큰이 사업자 라우트로 들어오는 것을 막는다.
export const verifyPartnerBearerToken = (req: Request): PartnerAccessPayload | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as PartnerAccessPayload;
    if (decoded.aud !== 'partner') return null;
    return decoded;
  } catch {
    return null;
  }
};

const PARTNER_STATUS_MESSAGE: Record<string, string> = {
  PENDING: '가입 심사가 진행 중입니다. 승인 후 로그인하실 수 있습니다.',
  REJECTED: '가입이 반려되었습니다. 반려 사유를 확인해주세요.',
  SUSPENDED: '이용이 정지된 계정입니다. 고객센터로 문의해주세요.',
};

// 가입 신청 (`POST /api/partner/signup`) — 승인 전까지 로그인 불가 (docs 16 §3.2)
export const signup = async (req: Request, res: Response) => {
  const {
    email,
    password,
    bizRegNo,
    companyName,
    ownerName,
    contactName,
    contactPhone,
    bizLicenseUrl,
  } = req.body as {
    email?: string;
    password?: string;
    bizRegNo?: string;
    companyName?: string;
    ownerName?: string;
    contactName?: string;
    contactPhone?: string;
    bizLicenseUrl?: string;
  };

  if (!email || !password || !bizRegNo || !companyName || !ownerName || !contactName || !contactPhone) {
    return res.status(400).json({
      status: 'error',
      message: '이메일, 비밀번호, 사업자등록번호, 상호, 대표자명, 담당자명, 담당자 연락처는 필수입니다.',
    });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ status: 'error', message: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` });
  }

  const normalizedBizRegNo = normalizeBizRegNo(bizRegNo);
  if (normalizedBizRegNo.length !== BIZ_REG_NO_LENGTH) {
    return res.status(400).json({ status: 'error', message: `사업자등록번호는 숫자 ${BIZ_REG_NO_LENGTH}자리여야 합니다.` });
  }

  // 연락처도 사업자등록번호와 같은 원칙 — 하이픈 유무로 다른 값이 되지 않도록 숫자만 저장한다.
  const normalizedPhone = normalizePhone(contactPhone);
  if (!isValidPhoneLength(normalizedPhone)) {
    return res.status(400).json({ status: 'error', message: `담당자 연락처는 숫자 ${MIN_PHONE_DIGITS}~${MAX_PHONE_DIGITS}자리여야 합니다.` });
  }

  try {
    const [existingEmail, existingBizRegNo] = await Promise.all([
      prisma.partner.findUnique({ where: { email } }),
      prisma.partner.findUnique({ where: { bizRegNo: normalizedBizRegNo } }),
    ]);
    if (existingEmail) {
      return res.status(409).json({ status: 'error', message: '이미 가입 신청된 이메일입니다.' });
    }
    if (existingBizRegNo) {
      return res.status(409).json({ status: 'error', message: '이미 등록된 사업자등록번호입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // 자동승인 분기를 두지 않고 status를 항상 PENDING으로 못박는다 — 자동승인은
    // 개인정보 사고 경로다(§3.2, POLICY.partner.autoApprove도 항상 false).
    const partner = await prisma.partner.create({
      data: {
        email,
        passwordHash,
        bizRegNo: normalizedBizRegNo,
        companyName,
        ownerName,
        contactName,
        contactPhone: normalizedPhone,
        bizLicenseUrl,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      status: 'success',
      message: '가입 신청이 접수되었습니다. 운영자 심사 후 승인 결과를 안내드립니다.',
      data: { id: partner.id, status: partner.status },
    });
  } catch (error) {
    console.error('사업자 가입 신청 실패:', error);
    return res.status(500).json({ status: 'error', message: '가입 신청 처리 중 오류가 발생했습니다.' });
  }
};

// 로그인 (`POST /api/partner/login`) — APPROVED 상태만 허용
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const partner = await prisma.partner.findUnique({ where: { email } });
    if (!partner || !(await bcrypt.compare(password, partner.passwordHash))) {
      return res.status(401).json({ status: 'error', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    if (partner.status !== 'APPROVED') {
      return res.status(403).json({
        status: 'error',
        message: PARTNER_STATUS_MESSAGE[partner.status] || '로그인할 수 없는 계정 상태입니다.',
        data: { status: partner.status },
      });
    }

    const accessToken = generateAccessToken(partner);
    const refreshToken = generateRefreshToken(partner.id);
    await prisma.partner.update({ where: { id: partner.id }, data: { refreshTokenHash: sha256(refreshToken) } });

    return res.json({
      status: 'success',
      accessToken,
      refreshToken,
      partner: { id: partner.id, companyName: partner.companyName, email: partner.email, status: partner.status },
    });
  } catch (error) {
    console.error('사업자 로그인 실패:', error);
    return res.status(500).json({ status: 'error', message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 토큰 갱신 (`POST /api/partner/refresh`) — 회전(rotation) 방식: 갱신할 때마다 refreshToken도 새로 발급하고
// 이전 것은 해시 비교에서 즉시 탈락시켜, 탈취된 refreshToken이 재사용되면 다음 정상 갱신 때 감지되게 한다.
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ status: 'error', message: 'refreshToken이 필요합니다.' });
  }

  let decoded: PartnerRefreshPayload;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET) as PartnerRefreshPayload;
    if (decoded.aud !== 'partner' || decoded.purpose !== 'partner_refresh') {
      throw new Error('invalid refresh token purpose');
    }
  } catch {
    return res.status(401).json({ status: 'error', message: '유효하지 않거나 만료된 refreshToken입니다.' });
  }

  try {
    const partner = await prisma.partner.findUnique({ where: { id: decoded.sub } });
    if (!partner || partner.refreshTokenHash !== sha256(refreshToken)) {
      // 저장된 해시와 다르면 이미 회전되었거나(재사용 시도) 로그아웃/정지된 것 — 재로그인 요구
      return res.status(401).json({ status: 'error', message: 'refreshToken이 더 이상 유효하지 않습니다. 다시 로그인해주세요.' });
    }
    if (partner.status !== 'APPROVED') {
      return res.status(403).json({ status: 'error', message: PARTNER_STATUS_MESSAGE[partner.status] || '로그인할 수 없는 계정 상태입니다.' });
    }

    const newAccessToken = generateAccessToken(partner);
    const newRefreshToken = generateRefreshToken(partner.id);
    await prisma.partner.update({ where: { id: partner.id }, data: { refreshTokenHash: sha256(newRefreshToken) } });

    return res.json({ status: 'success', accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('사업자 토큰 갱신 실패:', error);
    return res.status(500).json({ status: 'error', message: '토큰 갱신 처리 중 오류가 발생했습니다.' });
  }
};

const serializePartner = (partner: {
  id: string;
  email: string;
  companyName: string;
  ownerName: string;
  contactName: string;
  contactPhone: string;
  status: string;
  rejectReason: string | null;
  settlementBank: string | null;
  settlementAccount: string | null;
}) => ({
  id: partner.id,
  email: partner.email,
  companyName: partner.companyName,
  ownerName: partner.ownerName,
  contactName: partner.contactName,
  contactPhone: partner.contactPhone,
  status: partner.status,
  rejectReason: partner.rejectReason,
  settlementBank: partner.settlementBank,
  // 정산 계좌는 암호화 저장돼 있으므로(§7.4) 조회 시에만 복호화해서 내려준다.
  settlementAccount: partner.settlementAccount ? decryptField(partner.settlementAccount) : null,
});

// 내 정보 조회 (`GET /api/partner/me`)
export const getMe = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const partner = await prisma.partner.findUnique({ where: { id: decoded.id } });
    if (!partner) {
      return res.status(404).json({ status: 'error', message: '사업자 정보를 찾을 수 없습니다.' });
    }
    return res.json({ status: 'success', data: serializePartner(partner) });
  } catch (error) {
    console.error('사업자 정보 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 조회 중 오류가 발생했습니다.' });
  }
};

// 담당자·연락처·정산계좌 수정 (`PATCH /api/partner/me`)
export const updateMe = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { contactName, contactPhone, settlementBank, settlementAccount } = req.body as {
    contactName?: string;
    contactPhone?: string;
    settlementBank?: string;
    settlementAccount?: string;
  };

  if (contactPhone && !isValidPhoneLength(normalizePhone(contactPhone))) {
    return res.status(400).json({ status: 'error', message: `연락처는 숫자 ${MIN_PHONE_DIGITS}~${MAX_PHONE_DIGITS}자리여야 합니다.` });
  }

  try {
    const partner = await prisma.partner.update({
      where: { id: decoded.id },
      data: {
        ...(contactName ? { contactName } : {}),
        ...(contactPhone ? { contactPhone: normalizePhone(contactPhone) } : {}),
        ...(settlementBank ? { settlementBank } : {}),
        ...(settlementAccount ? { settlementAccount: encryptField(settlementAccount) } : {}),
      },
    });
    return res.json({ status: 'success', data: serializePartner(partner) });
  } catch (error) {
    console.error('사업자 정보 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 수정 중 오류가 발생했습니다.' });
  }
};
