import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { normalizePhone, isValidPhoneLength, maskPhone } from '../utils/phone';

// 00-28 §8 Phase 1 — 회원 프로필(본인 정보) 저장. 연락처·주소·연락 가능 시간대·마케팅 수신
// 동의는 전부 선택이다(§3.1) — 필수 검증을 넣지 않는다. 연락처는 평문 저장 + 응답 마스킹(§5).
// 🔴 프로필은 Lead·ConsultRequest의 신청 스냅샷을 대체하지 않는다(§2) — 이 컨트롤러는 User
// 프로필만 다루고, 과거 스냅샷을 조인해 보여주거나 소급 변경하지 않는다.

const CONTACT_TIME_PREFS = ['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING'] as const;
const isValidContactTimePref = (v: unknown): v is (typeof CONTACT_TIME_PREFS)[number] =>
  typeof v === 'string' && (CONTACT_TIME_PREFS as readonly string[]).includes(v);

// 상세주소는 GET 응답에 평문을 넣지 않는다(§6.1) — leadController.maskName과 같은 방식(첫 글자만 남김).
const maskAddressDetail = (detail: string): string => (detail.length <= 1 ? detail : `${detail[0]}${'*'.repeat(detail.length - 1)}`);

const PROFILE_SELECT = {
  name: true,
  email: true,
  profileImage: true,
  contactPhone: true,
  phoneVerifiedAt: true,
  addressZonecode: true,
  addressRoad: true,
  addressDetail: true,
  contactTimePref: true,
  marketingAgreedAt: true,
  profileUpdatedAt: true,
} as const;

type ProfileRow = {
  name: string;
  email: string | null;
  profileImage: string | null;
  contactPhone: string | null;
  phoneVerifiedAt: Date | null;
  addressZonecode: string | null;
  addressRoad: string | null;
  addressDetail: string | null;
  contactTimePref: string | null;
  marketingAgreedAt: Date | null;
  profileUpdatedAt: Date | null;
};

// 🔴 연락처·상세주소는 마스킹해서 응답한다(§6.1) — 나머지는 민감도가 낮아 평문 그대로 내려도 된다(§3.3).
const serializeProfile = (user: ProfileRow) => ({
  name: user.name,
  email: user.email,
  profileImage: user.profileImage,
  contactPhone: user.contactPhone ? maskPhone(user.contactPhone) : null,
  phoneVerifiedAt: user.phoneVerifiedAt,
  addressZonecode: user.addressZonecode,
  addressRoad: user.addressRoad,
  addressDetail: user.addressDetail ? maskAddressDetail(user.addressDetail) : null,
  contactTimePref: user.contactTimePref,
  marketingAgreedAt: user.marketingAgreedAt,
  profileUpdatedAt: user.profileUpdatedAt,
});

// 내 프로필 조회 (`GET /api/me/profile`)
export const getMyProfile = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: PROFILE_SELECT });
    if (!user) {
      return res.status(404).json({ status: 'error', message: '회원을 찾을 수 없습니다.' });
    }
    return res.json({ status: 'success', data: serializeProfile(user) });
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '프로필 조회 중 오류가 발생했습니다.' });
  }
};

// 내 프로필 부분 수정 (`PATCH /api/me/profile`) — 빈 문자열은 null로 정규화(지움)
export const updateMyProfile = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as {
    name?: string;
    email?: string | null;
    contactPhone?: string | null;
    addressZonecode?: string | null;
    addressRoad?: string | null;
    addressDetail?: string | null;
    contactTimePref?: string | null;
    marketingAgreed?: boolean;
  };

  // name은 §5 확장 대상이 아닌 기존 필수 컬럼(User.name)이라 빈 값으로 지울 수 없다 — §3.1의
  // "전부 선택"은 이번에 새로 받는 항목(연락처·주소·연락시간대·마케팅동의) 얘기다.
  if (body.name !== undefined && !body.name.trim()) {
    return res.status(400).json({ status: 'error', message: '이름은 비울 수 없습니다.' });
  }

  const contactTimePref = body.contactTimePref === '' ? null : body.contactTimePref;
  if (contactTimePref !== undefined && contactTimePref !== null && !isValidContactTimePref(contactTimePref)) {
    return res.status(400).json({ status: 'error', message: `contactTimePref는 ${CONTACT_TIME_PREFS.join(', ')} 중 하나여야 합니다.` });
  }

  let normalizedPhone: string | null | undefined;
  if (body.contactPhone !== undefined) {
    const trimmed = body.contactPhone?.trim();
    if (!trimmed) {
      normalizedPhone = null;
    } else {
      const digits = normalizePhone(trimmed);
      if (!isValidPhoneLength(digits)) {
        return res.status(400).json({ status: 'error', message: '연락처 형식이 올바르지 않습니다.' });
      }
      normalizedPhone = digits;
    }
  }

  // 프로필 항목(연락처·주소·연락시간대·마케팅동의) 중 하나라도 이번 요청에 들어왔으면 채운 시각 갱신(§5)
  const touchesProfileFields = (['contactPhone', 'addressZonecode', 'addressRoad', 'addressDetail', 'contactTimePref', 'marketingAgreed'] as const).some(
    (k) => body[k] !== undefined
  );

  try {
    const updated = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        ...(body.name !== undefined ? { name: body.name!.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email?.trim() || null } : {}),
        ...(normalizedPhone !== undefined ? { contactPhone: normalizedPhone } : {}),
        ...(body.addressZonecode !== undefined ? { addressZonecode: body.addressZonecode?.trim() || null } : {}),
        ...(body.addressRoad !== undefined ? { addressRoad: body.addressRoad?.trim() || null } : {}),
        ...(body.addressDetail !== undefined ? { addressDetail: body.addressDetail?.trim() || null } : {}),
        ...(contactTimePref !== undefined ? { contactTimePref } : {}),
        ...(body.marketingAgreed !== undefined ? { marketingAgreedAt: body.marketingAgreed ? new Date() : null } : {}),
        ...(touchesProfileFields ? { profileUpdatedAt: new Date() } : {}),
        // phoneVerifiedAt은 여기서 절대 받지 않는다 — SMS 본인확인 도입 전까지 항상 null(§5·§8 Phase 3)
      },
      select: PROFILE_SELECT,
    });
    return res.json({ status: 'success', data: serializeProfile(updated) });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: '이미 사용 중인 이메일입니다.' });
    }
    console.error('프로필 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '프로필 수정 중 오류가 발생했습니다.' });
  }
};
