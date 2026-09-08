import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { normalizePhone, isValidPhoneLength, maskPhone } from '../utils/phone';
import { encryptField, decryptField, hashField } from '../utils/crypto';

// 00-27 §10 Phase 1 — 생전 가족지정 "기록"(§2 확정 — 기록과 통지 분리) + Phase 2(§9.1) —
// 본인 트리거 초대 링크(발급·조회·수락·거절). "내가 지정됐는지" 조회 API는 여전히 없다(불변식 3)
// — 아래 초대 관련 3종은 전부 추측 불가 토큰으로만 접근하지, userId로 역질의하지 않는다.
// 🔴 구현자가 판단하지 않는 것(§3 불변식·§9.1-3):
//  1. status는 서버만 바꾼다 — 클라이언트가 보낸 값은 무시한다. PENDING은 초대 발급 시,
//     ACCEPTED/DECLINED는 아래 accept/decline 안에서만 서버가 정한다.
//  2. 연락처·이메일은 암호화 저장하고 어떤 응답에도 평문을 넣지 않는다. 초대 조회 응답에도
//     지정자 연락처를 넣지 않는다 — 성함·관계·scope 3개뿐(§9.1-3 ②).
//  3. "내가 누군가에게 지정됐는지" 조회하는 API는 만들지 않는다 — 초대는 토큰으로만 접근한다.
//  4. priority는 연락 순서일 뿐 법정상속순위가 아니다 — 계산·표시하지 않는다.
//  5. 본인은 언제든 하드 삭제할 수 있다.
//  6. 수락 판정은 초대 토큰 + JWT로만 한다 — localStorage/sessionStorage는 로그인 복귀 경로
//     기억용일 뿐 권한 근거가 아니다(07-03 §5.3-2 사고와 같은 실수를 반복하지 않는다).

const RELATIONSHIPS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'] as const;
const isValidRelationship = (v: unknown): v is (typeof RELATIONSHIPS)[number] =>
  typeof v === 'string' && (RELATIONSHIPS as readonly string[]).includes(v);

const SCOPES = ['PRIMARY', 'VIEWER'] as const;
const isValidScope = (v: unknown): v is (typeof SCOPES)[number] => typeof v === 'string' && (SCOPES as readonly string[]).includes(v);

const MAX_DESIGNATIONS = 10; // §4.2 — 연락처 수집기로 악용되는 것을 막는 상한

// 00-33 §4.2 — HMAC 키를 암호화 키와 분리하는 domain 문자열. hashField는 전용 env
// HASH_INDEX_KEY를 쓴다(utils/crypto.ts) — 정산 키(SETTLEMENT_ENCRYPTION_KEY) 교체가 이
// 중복방지 해시를 조용히 깨뜨리지 않도록 키 소스를 분리했다(00-27 §4.1의 옛 파생 방식을 대체).
const PHONE_HASH_DOMAIN = 'phone-index';

type FamilyDesignationRow = {
  id: string;
  name: string;
  phoneEnc: string;
  emailEnc: string | null;
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
  priority: number;
  status: string;
  tokenExpiresAt: Date | null;
  declinedAt: Date | null;
  lastConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

// 이메일도 연락처와 같은 이유로 평문을 내려보내지 않는다(불변식 2) — 로컬파트만 마스킹, 도메인은 유지.
const maskEmail = (email: string): string => {
  const at = email.indexOf('@');
  if (at <= 1) return `****${email.slice(at)}`;
  return `${email[0]}${'*'.repeat(at - 1)}${email.slice(at)}`;
};

// 🔴 GET 응답에 평문 연락처를 넣지 않는다(§8.1) — 복호화는 마스킹하기 위해서만 서버 안에서 잠깐 쓴다.
// tokenExpiresAt·declinedAt은 본인만 보는 목록이라 노출해도 무해하다 — 프론트가 "링크 만료"·
// "거절됨" 표시를 만들 때 쓴다(초대 토큰 문자열 자체는 여전히 안 내려간다).
const serialize = (d: FamilyDesignationRow) => ({
  id: d.id,
  name: d.name,
  phone: maskPhone(decryptField(d.phoneEnc)),
  email: d.emailEnc ? maskEmail(decryptField(d.emailEnc)) : null,
  relationship: d.relationship,
  relationshipEtc: d.relationshipEtc,
  scope: d.scope,
  priority: d.priority,
  status: d.status,
  tokenExpiresAt: d.tokenExpiresAt,
  declinedAt: d.declinedAt,
  lastConfirmedAt: d.lastConfirmedAt,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

// 내 가족 지정 목록 (`GET /api/family-designations`) — 본인 것만(불변식 3)
export const listFamilyDesignations = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const list = await prisma.familyDesignation.findMany({
      where: { userId: decoded.id },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    return res.json({ status: 'success', data: list.map(serialize) });
  } catch (error) {
    console.error('가족 지정 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 가족 지정 추가 (`POST /api/family-designations`)
export const createFamilyDesignation = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as {
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    relationshipEtc?: string;
    scope?: string;
    priority?: number;
  };

  const name = body.name?.trim();
  if (!name) {
    return res.status(400).json({ status: 'error', message: '성함을 입력해 주세요.' });
  }
  if (!body.phone?.trim()) {
    return res.status(400).json({ status: 'error', message: '휴대전화번호를 입력해 주세요.' });
  }
  const digits = normalizePhone(body.phone.trim());
  if (!isValidPhoneLength(digits)) {
    return res.status(400).json({ status: 'error', message: '연락처 형식이 올바르지 않습니다.' });
  }
  if (!isValidRelationship(body.relationship)) {
    return res.status(400).json({ status: 'error', message: `relationship은 ${RELATIONSHIPS.join(', ')} 중 하나여야 합니다.` });
  }
  if (body.relationship === 'OTHER' && !body.relationshipEtc?.trim()) {
    return res.status(400).json({ status: 'error', message: '관계가 기타인 경우 직접 입력해야 합니다.' });
  }
  if (!isValidScope(body.scope)) {
    return res.status(400).json({ status: 'error', message: `scope는 ${SCOPES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const count = await prisma.familyDesignation.count({ where: { userId: decoded.id } });
    if (count >= MAX_DESIGNATIONS) {
      return res.status(400).json({ status: 'error', message: `가족 지정은 최대 ${MAX_DESIGNATIONS}명까지 가능합니다.` });
    }

    const created = await prisma.familyDesignation.create({
      data: {
        userId: decoded.id,
        name,
        phoneEnc: encryptField(digits),
        phoneHash: hashField(digits, PHONE_HASH_DOMAIN),
        emailEnc: body.email?.trim() ? encryptField(body.email.trim()) : null,
        relationship: body.relationship,
        relationshipEtc: body.relationship === 'OTHER' ? body.relationshipEtc!.trim() : null,
        scope: body.scope,
        priority: Number.isFinite(body.priority) && body.priority! > 0 ? Math.floor(body.priority!) : undefined,
        // status는 받지 않는다 — 스키마 기본값 DRAFT 그대로(불변식 1)
      },
    });
    return res.status(201).json({ status: 'success', data: serialize(created) });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: '이미 등록된 연락처입니다.' });
    }
    console.error('가족 지정 추가 실패:', error);
    return res.status(500).json({ status: 'error', message: '추가 중 오류가 발생했습니다.' });
  }
};

// 가족 지정 수정 (`PATCH /api/family-designations/:id`) — 소유자 검증 필수
export const updateFamilyDesignation = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as {
    name?: string;
    phone?: string;
    email?: string | null;
    relationship?: string;
    relationshipEtc?: string | null;
    scope?: string;
    priority?: number;
  };

  if (body.name !== undefined && !body.name.trim()) {
    return res.status(400).json({ status: 'error', message: '성함은 비울 수 없습니다.' });
  }
  if (body.relationship !== undefined && !isValidRelationship(body.relationship)) {
    return res.status(400).json({ status: 'error', message: `relationship은 ${RELATIONSHIPS.join(', ')} 중 하나여야 합니다.` });
  }
  if (body.scope !== undefined && !isValidScope(body.scope)) {
    return res.status(400).json({ status: 'error', message: `scope는 ${SCOPES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const existing = await prisma.familyDesignation.findUnique({ where: { id: req.params.id } });
    // 존재하지 않음과 소유권 없음을 동일하게 404로 응답 — 다른 유저의 지정 존재 여부를 노출하지 않는다(불변식 3과 같은 취지)
    if (!existing || existing.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '가족 지정을 찾을 수 없습니다.' });
    }

    let phoneEnc: string | undefined;
    let phoneHash: string | undefined;
    if (body.phone !== undefined) {
      const trimmed = body.phone.trim();
      if (!trimmed) {
        // 휴대전화번호는 필수 항목(§5②) — PATCH로도 지울 수 없다. 지우려면 삭제(DELETE)를 쓴다.
        return res.status(400).json({ status: 'error', message: '휴대전화번호는 비울 수 없습니다.' });
      }
      const digits = normalizePhone(trimmed);
      if (!isValidPhoneLength(digits)) {
        return res.status(400).json({ status: 'error', message: '연락처 형식이 올바르지 않습니다.' });
      }
      phoneEnc = encryptField(digits);
      phoneHash = hashField(digits, PHONE_HASH_DOMAIN);
    }

    const nextRelationship = body.relationship ?? existing.relationship;
    const nextRelationshipEtc = body.relationshipEtc !== undefined ? body.relationshipEtc?.trim() || null : existing.relationshipEtc;
    if (nextRelationship === 'OTHER' && !nextRelationshipEtc) {
      return res.status(400).json({ status: 'error', message: '관계가 기타인 경우 직접 입력해야 합니다.' });
    }

    const updated = await prisma.familyDesignation.update({
      where: { id: existing.id },
      data: {
        ...(body.name !== undefined ? { name: body.name!.trim() } : {}),
        ...(phoneEnc ? { phoneEnc, phoneHash } : {}),
        ...(body.email !== undefined ? { emailEnc: body.email?.trim() ? encryptField(body.email.trim()) : null } : {}),
        ...(body.relationship !== undefined || body.relationshipEtc !== undefined
          ? { relationship: nextRelationship, relationshipEtc: nextRelationship === 'OTHER' ? nextRelationshipEtc : null }
          : {}),
        ...(body.scope !== undefined ? { scope: body.scope } : {}),
        ...(body.priority !== undefined && Number.isFinite(body.priority) && body.priority > 0 ? { priority: Math.floor(body.priority) } : {}),
        lastConfirmedAt: new Date(), // §7 — 본인이 손댔다는 것 자체가 "이 정보가 최신"이라는 재확인 신호
        // status는 여기서 절대 받지 않는다(불변식 1) — PENDING 이후 상태로 가는 경로는 Phase 2·3의 몫이다.
      },
    });
    return res.json({ status: 'success', data: serialize(updated) });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: '이미 등록된 연락처입니다.' });
    }
    console.error('가족 지정 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '수정 중 오류가 발생했습니다.' });
  }
};

// 가족 지정 삭제 (`DELETE /api/family-designations/:id`) — 하드 삭제(불변식 5)
export const deleteFamilyDesignation = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const existing = await prisma.familyDesignation.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '가족 지정을 찾을 수 없습니다.' });
    }
    await prisma.familyDesignation.delete({ where: { id: existing.id } });
    return res.json({ status: 'success' });
  } catch (error) {
    console.error('가족 지정 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '삭제 중 오류가 발생했습니다.' });
  }
};

// §9.1-6 a — 부고장(즉시성 필요)과 달리 급하지 않다. 짧으면 재발급 요청만 잦아진다.
const INVITE_TOKEN_EXPIRY_DAYS = 30;

// §9.1-4-3 — 단톡방 오수락 가드레일. 보안 통제가 아니라 오조작 방지용이라 임계값이 낮을 필요는
// 없다 — 지정자에게 재발급을 요청하는 것보다 몇 번 더 시도해보게 두는 편이 정상 사용자에게 낫다.
const MAX_ACCEPT_NAME_ATTEMPTS = 5;
// 공백을 전부 제거하고 비교한다(§9.1-4-3) — "홍 길동"과 "홍길동" 같은 표기 흔들림을 흡수한다.
const normalizeNameForCompare = (s: string): string => s.replace(/\s+/g, '');

// 초대 링크 발급 (`POST /api/family-designations/:id/invite`) — 개설자만(§9.1).
// 재발급은 같은 컬럼을 새 값으로 덮어쓰는 것만으로 이전 토큰을 무효화한다(§9.1-1 ③ 회수 수단) —
// 별도 폐기 테이블이 필요 없다. DRAFT·PENDING(재발송)·DECLINED·EXPIRED 전부 재발급 가능하고,
// ACCEPTED만 막는다(이미 정보주체 동의가 끝난 건이라 재초대할 이유가 없다).
export const inviteFamilyDesignation = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const existing = await prisma.familyDesignation.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '가족 지정을 찾을 수 없습니다.' });
    }
    if (existing.status === 'ACCEPTED') {
      return res.status(400).json({ status: 'error', message: '이미 수락된 지정입니다.' });
    }

    // obituaryController.generateObituarySlug와 동일 방식(randomBytes(16)) — 추측 불가 토큰.
    const token = crypto.randomBytes(16).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const updated = await prisma.familyDesignation.update({
      where: { id: existing.id },
      data: {
        inviteToken: token,
        tokenExpiresAt,
        notifiedAt: new Date(),
        status: 'PENDING', // 불변식 1 — 서버가 정한다. 링크를 만들었다고 권한이 생기진 않는다(여전히 0)
        acceptAttempts: 0, // §9.1-4-3 — 새 토큰은 새 기회다. 이전 오답 횟수를 이어가지 않는다.
      },
    });

    return res.json({
      status: 'success',
      data: { inviteToken: updated.inviteToken, tokenExpiresAt: updated.tokenExpiresAt, status: updated.status },
    });
  } catch (error) {
    console.error('초대 링크 발급 실패:', error);
    return res.status(500).json({ status: 'error', message: '초대 링크 발급 중 오류가 발생했습니다.' });
  }
};

// 초대 상세 조회 (`GET /api/family-designations/invite/:token`) — 공개. 받는 사람이 아직
// 회원이 아닐 수 있다(§9.1-2). 🔴 지정자 연락처를 넣지 않는다 — 성함·관계·scope 3개뿐(§9.1-3 ②).
export const getFamilyInvite = async (req: Request, res: Response) => {
  try {
    const designation = await prisma.familyDesignation.findUnique({
      where: { inviteToken: req.params.token },
      include: { user: { select: { name: true } } },
    });

    // 존재하지 않음 · 이미 처리됨(수락/거절) · 아직 발급 전(DRAFT)을 전부 동일하게 취급 —
    // PENDING이 아니면 이 토큰으로는 더 이상 아무것도 할 수 없다.
    if (!designation || designation.status !== 'PENDING') {
      return res.status(404).json({ status: 'error', message: '초대 링크를 찾을 수 없습니다.' });
    }
    if (designation.tokenExpiresAt && designation.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ status: 'error', message: '초대 링크가 만료되었습니다.' });
    }

    return res.json({
      status: 'success',
      data: {
        designatorName: designation.user.name,
        relationship: designation.relationship,
        relationshipEtc: designation.relationshipEtc,
        scope: designation.scope,
      },
    });
  } catch (error) {
    console.error('초대 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '초대 조회 중 오류가 발생했습니다.' });
  }
};

// 초대 수락 (`POST /api/family-designations/invite/:token/accept`) — 로그인 필요(누가
// 수락했는지 acceptedUserId에 남겨야 한다). 🔴 판정은 토큰+JWT로만 한다 — sessionStorage는
// 로그인 복귀 경로를 기억하는 용도일 뿐 권한 근거가 아니다(불변식 6, 07-03 §5.3-2와 같은 원칙).
// §9.1-4-3 — 여기에 성함 대조 가드레일을 더한다. User.name(소셜 닉네임)이 아니라
// FamilyDesignation.name과 대조한다 — 보안 통제가 아니라 단톡방 오수락 방지용 가드레일이고,
// §9.1-1의 필수 3종(1회용·만료·재발급 시 폐기)을 대체하지 않는다.
export const acceptFamilyInvite = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    return res.status(400).json({ status: 'error', message: '성함을 입력해 주세요.' });
  }

  try {
    const designation = await prisma.familyDesignation.findUnique({ where: { inviteToken: req.params.token } });
    if (!designation || designation.status !== 'PENDING') {
      return res.status(404).json({ status: 'error', message: '초대 링크를 찾을 수 없습니다.' });
    }
    if (designation.tokenExpiresAt && designation.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ status: 'error', message: '초대 링크가 만료되었습니다.' });
    }

    // 입력받은 이름은 대조에만 쓰고 저장하지 않는다(§9.1-4-3) — DB에 쓰는 것은 acceptAttempts뿐.
    if (normalizeNameForCompare(designation.name) !== normalizeNameForCompare(name)) {
      const attempts = designation.acceptAttempts + 1;
      await prisma.familyDesignation.update({
        where: { id: designation.id },
        data: {
          acceptAttempts: attempts,
          // 5회 초과 — 토큰 잠금(회수 수단은 지정자의 재발급뿐). 응답 문구는 아래와 동일하게
          // 유지한다 — "잠겼다"는 별도 신호를 주면 그 자체가 유추 단서가 된다.
          ...(attempts >= MAX_ACCEPT_NAME_ATTEMPTS ? { inviteToken: null } : {}),
        },
      });
      return res.status(400).json({ status: 'error', message: '성함이 일치하지 않습니다.' });
    }

    const updated = await prisma.familyDesignation.update({
      where: { id: designation.id },
      data: {
        status: 'ACCEPTED',
        acceptedUserId: decoded.id,
        acceptedAt: new Date(),
        inviteToken: null, // §9.1-1 ① 1회용 — 수락 즉시 무효화
        acceptAttempts: 0,
      },
    });

    return res.json({ status: 'success', data: { status: updated.status, acceptedAt: updated.acceptedAt } });
  } catch (error) {
    console.error('초대 수락 실패:', error);
    return res.status(500).json({ status: 'error', message: '수락 처리 중 오류가 발생했습니다.' });
  }
};

// 초대 거절 (`POST /api/family-designations/invite/:token/decline`) — 로그인 불필요. 거절은
// 누가 눌렀는지 저장하지 않는다 — 스키마에 그런 컬럼이 없다(§9.1-6 c "거절 사유는 받지 않는다"와
// 같은 이유 — 제3자가 제3자에 대해 남긴 기록을 늘리지 않는다).
export const declineFamilyInvite = async (req: Request, res: Response) => {
  try {
    const designation = await prisma.familyDesignation.findUnique({ where: { inviteToken: req.params.token } });
    if (!designation || designation.status !== 'PENDING') {
      return res.status(404).json({ status: 'error', message: '초대 링크를 찾을 수 없습니다.' });
    }

    const updated = await prisma.familyDesignation.update({
      where: { id: designation.id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        inviteToken: null, // 1회용 — 거절도 같은 원칙(§9.1-1 ①)
      },
    });

    return res.json({ status: 'success', data: { status: updated.status } });
  } catch (error) {
    console.error('초대 거절 실패:', error);
    return res.status(500).json({ status: 'error', message: '거절 처리 중 오류가 발생했습니다.' });
  }
};
