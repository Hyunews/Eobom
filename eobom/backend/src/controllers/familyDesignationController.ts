import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { normalizePhone, isValidPhoneLength, maskPhone } from '../utils/phone';
import { encryptField, decryptField, hashField } from '../utils/crypto';

// 00-27 §10 Phase 1 — 생전 가족지정. 이번 범위는 "기록"까지다(§2 확정 — 기록과 통지 분리).
// 🔴 구현자가 판단하지 않는 것(§3 불변식):
//  1. status는 항상 DRAFT로 고정 — 클라이언트가 보낸 값은 무시한다. PENDING 이후로 가는 경로 자체가 없다.
//  2. 연락처·이메일은 암호화 저장하고 어떤 응답에도 평문을 넣지 않는다.
//  3. "내가 누군가에게 지정됐는지" 조회하는 API는 만들지 않는다 — 아래 4종 외 라우트를 추가하지 말 것.
//  4. priority는 연락 순서일 뿐 법정상속순위가 아니다 — 계산·표시하지 않는다.
//  5. 본인은 언제든 하드 삭제할 수 있다.

const RELATIONSHIPS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'] as const;
const isValidRelationship = (v: unknown): v is (typeof RELATIONSHIPS)[number] =>
  typeof v === 'string' && (RELATIONSHIPS as readonly string[]).includes(v);

const SCOPES = ['PRIMARY', 'VIEWER'] as const;
const isValidScope = (v: unknown): v is (typeof SCOPES)[number] => typeof v === 'string' && (SCOPES as readonly string[]).includes(v);

const MAX_DESIGNATIONS = 10; // §4.2 — 연락처 수집기로 악용되는 것을 막는 상한

// §4.1 — HMAC 키를 암호화 키와 분리하는 domain 문자열. 새 환경변수를 만들지 않기 위해
// SETTLEMENT_ENCRYPTION_KEY에서 파생한다(hashField 쪽 구현, utils/crypto.ts).
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
