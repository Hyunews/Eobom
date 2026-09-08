import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { verifyPartnerBearerToken } from './partnerController';
import { createLead, ConsentRequiredError, FacilityNotFoundError } from '../services/leadService';
import { resolveApplicantContact, ProfileContactMissingError } from '../utils/applicantContact';
import { normalizePhone } from '../utils/phone';

const safeLead = (lead: { leadNo: string; type: string; status: string; createdAt: Date }) => ({
  leadNo: lead.leadNo,
  type: lead.type,
  status: lead.status,
  createdAt: lead.createdAt,
});

// 견적요청 (`POST /api/facilities/:id/quotes`) — QUOTE 타입 리드.
// 로그인 불필요(§10-2 권장안: 비회원 허용). 로그인 상태면 userId를 함께 남긴다.
// 00-28 §6.4 Phase 2 — useProfileContact(프로필 값 사용)·saveToProfile(신청값을 프로필에 반영)
// 두 플래그를 받는다. 두 값 모두 비회원이면 무시된다(프로필 자체가 없으므로).
export const createQuote = async (req: Request, res: Response) => {
  const { applicantName, applicantPhone, thirdPartyConsent, payload, useProfileContact, saveToProfile } = req.body as {
    applicantName?: string;
    applicantPhone?: string;
    thirdPartyConsent?: boolean;
    payload?: Record<string, unknown>;
    useProfileContact?: boolean;
    saveToProfile?: boolean;
  };

  const decoded = verifyBearerToken(req);
  const usesProfile = !!useProfileContact && !!decoded;

  if (!usesProfile && (!applicantName?.trim() || !applicantPhone?.trim())) {
    return res.status(400).json({ status: 'error', message: '이름과 연락처는 필수입니다.' });
  }
  if (!thirdPartyConsent) {
    return res.status(400).json({ status: 'error', message: '개인정보 제3자 제공에 동의해야 견적요청을 접수할 수 있습니다.' });
  }

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const contact = await resolveApplicantContact(tx, {
        useProfileContact: usesProfile,
        userId: decoded?.id ?? null,
        bodyName: applicantName,
        bodyPhone: applicantPhone,
      });

      const created = await createLead(tx, {
        type: 'QUOTE',
        facilityId: req.params.id,
        userId: decoded?.id ?? null,
        applicantName: contact.applicantName,
        applicantPhone: contact.applicantPhone,
        payload: payload ?? {},
        thirdPartyConsent: true,
      });

      // §8 Phase 2 #6 — 방금 친 값이 최신이므로 기존 프로필 값이 있어도 덮어쓴다.
      // ⚠️ Lead.applicantPhone(스냅샷)은 사용자가 입력한 원문 그대로 저장하지만(기존 동작 유지),
      // User.contactPhone은 프로필 PATCH(profileController.ts)와 같은 규칙으로 숫자만 저장한다
      // (§3.2 ① — 안 그러면 maskPhone이 하이픈 섞인 문자열엔 마스킹을 못 건다).
      if (saveToProfile && decoded) {
        await tx.user.update({
          where: { id: decoded.id },
          data: { contactPhone: normalizePhone(contact.applicantPhone), profileUpdatedAt: new Date() },
        });
      }

      return created;
    });
    return res.status(201).json({ status: 'success', data: safeLead(lead) });
  } catch (error) {
    if (error instanceof ProfileContactMissingError) {
      return res.status(400).json({ status: 'error', message: '프로필에 저장된 연락처가 없습니다. 마이페이지에서 먼저 등록해 주세요.' });
    }
    if (error instanceof FacilityNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof ConsentRequiredError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('견적요청 생성 실패:', error);
    return res.status(500).json({ status: 'error', message: '견적요청 처리 중 오류가 발생했습니다.' });
  }
};

// 전화 문의 클릭 이벤트 (`POST /api/facilities/:id/call-events`) — 익명, 개인정보 없음(§4.1).
// 청구 근거로 쓰지 않는다(§9 — 통화 연결·성사 여부를 우리가 증명할 수 없음). 지표 집계 전용.
export const createCallEvent = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  try {
    const lead = await prisma.$transaction((tx) =>
      createLead(tx, {
        type: 'CALL',
        facilityId: req.params.id,
        userId: decoded?.id ?? null,
        payload: {},
        thirdPartyConsent: false, // CALL은 동의 대상이 아님 — leadService가 무시한다
      })
    );
    return res.status(201).json({ status: 'success', data: safeLead(lead) });
  } catch (error) {
    if (error instanceof FacilityNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    console.error('전화 클릭 이벤트 기록 실패:', error);
    return res.status(500).json({ status: 'error', message: '이벤트 기록 중 오류가 발생했습니다.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// 파트너(사업자)용 리드 조회·상태 신고 화면 (docs 01-05 §11 4단계, §6.1, §4.3).
// 지금까지는 업체 문의가 위 createQuote로 적재만 되고 사업자가 볼 방법이 없었다 —
// 아래가 그 구멍을 메운다.
// ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// §4.3 상태머신 — 파트너가 스스로 바꿀 수 있는 전이만 허용한다. INVALID는 운영자만(§4.3 마지막 줄),
// CONVERTED도 여기선 파트너 "자기신고"일 뿐이다 — 청구 확정(billable)은 별도 운영자 확인 단계(§6.2
// PATCH /api/admin/leads/:id/billable, 이번 범위 밖)에서 한다. 업체가 축소신고할 수는 있어도
// status만으로 청구가 자동 발생하지 않는다.
const PARTNER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['RESPONDED'],
  NOTIFIED: ['RESPONDED'],
  RESPONDED: ['CONVERTED', 'LOST'],
};

const FACILITY_SELECT = { id: true, name: true, location: true } as const;

type LeadWithFacility = Prisma.LeadGetPayload<{ include: { facility: { select: typeof FACILITY_SELECT } } }>;

// §7.3 — "응답 완료 후 연락처를 마스킹 표시". 정산 확정 후 실제 DB 마스킹 배치(같은 절의 표, 7단계
// 미구현)와는 별개로, 그 전이라도 파트너 화면에는 RESPONDED 이상 상태부터 미리 가려서 보여준다.
const MASK_FROM_STATUS = new Set(['RESPONDED', 'CONVERTED', 'LOST']);

const maskName = (name: string): string => {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
};

// utils/phone.ts가 숫자만 정규화해서 저장하므로, 표시용 그룹 구분은 여기서 직접 한다
// (frontend config.ts의 formatPhoneForDisplay와 동일한 그룹 규칙, 가운데 그룹만 마스킹).
const maskPhone = (digits: string): string => {
  if (!digits) return digits;
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) {
    return digits.startsWith('02') ? `${digits.slice(0, 2)}-****-${digits.slice(6)}` : `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return digits.startsWith('02') ? `${digits.slice(0, 2)}-***-${digits.slice(5)}` : digits;
  }
  return digits;
};

const serializePartnerLead = (lead: LeadWithFacility) => {
  const shouldMask = lead.maskedAt !== null || MASK_FROM_STATUS.has(lead.status);
  return {
    leadNo: lead.leadNo,
    type: lead.type,
    status: lead.status,
    facility: lead.facility,
    payload: lead.payload,
    applicantName: shouldMask && lead.applicantName ? maskName(lead.applicantName) : lead.applicantName,
    applicantPhone: shouldMask && lead.applicantPhone ? maskPhone(lead.applicantPhone) : lead.applicantPhone,
    statusHistory: lead.statusHistory,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
};

// 조회 시점에 REQUESTED면 NOTIFIED로 전이(§4.3 "업체전달") — 파트너 화면에 노출된 순간이
// 실제로 "업체에 전달됐다"는 뜻이라 이 시점을 트리거로 쓴다. 이미 NOTIFIED 이후 상태면 손대지 않는다.
const markNotifiedIfNeeded = async (lead: LeadWithFacility): Promise<LeadWithFacility> => {
  if (lead.status !== 'REQUESTED') return lead;
  const history = Array.isArray(lead.statusHistory) ? lead.statusHistory : [];
  return prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: 'NOTIFIED',
      statusHistory: [...history, { status: 'NOTIFIED', at: new Date().toISOString(), by: 'partner' }] as unknown as Prisma.InputJsonValue,
    },
    include: { facility: { select: FACILITY_SELECT } },
  });
};

// 내 시설 리드 목록 (`GET /api/partner/leads?status=&facilityId=&page=&pageSize=`)
export const listMyLeads = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const status = (req.query.status as string) || undefined;
  const facilityId = (req.query.facilityId as string) || undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt((req.query.pageSize as string) || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));

  // §7.1 — 동의 없는 리드는 파트너에게 노출하지 않는다. CALL 유형은 애초에 동의 대상이 아니라
  // thirdPartyConsentAt이 항상 null이므로, 이 조건 하나로 자동 제외된다(§4.1).
  const where: Prisma.LeadWhereInput = {
    partnerId: decoded.id,
    thirdPartyConsentAt: { not: null },
    ...(status ? { status } : {}),
    ...(facilityId ? { facilityId } : {}),
  };

  try {
    const [totalCount, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: { facility: { select: FACILITY_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 목록에 노출된 REQUESTED 리드는 이 시점에 "업체에 전달됨"으로 간주 → NOTIFIED 일괄 전이.
    const settled = await Promise.all(leads.map((lead) => markNotifiedIfNeeded(lead)));

    return res.json({
      status: 'success',
      data: settled.map(serializePartnerLead),
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    });
  } catch (error) {
    console.error('리드 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '리드 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 리드 상세 (`GET /api/partner/leads/:leadNo`) — 본인 시설 리드만. leadNo는 순차 발번이라
// 추측이 쉬우므로(§4.2), partnerId 일치 + 동의 여부를 반드시 함께 확인하고 아니면 404로
// 존재 자체를 숨긴다(있는데 권한이 없다는 걸 알려주면 그 자체로 정보 유출).
export const getMyLeadDetail = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { leadNo: req.params.leadNo, partnerId: decoded.id, thirdPartyConsentAt: { not: null } },
      include: { facility: { select: FACILITY_SELECT } },
    });
    if (!lead) {
      return res.status(404).json({ status: 'error', message: '리드를 찾을 수 없습니다.' });
    }

    const settled = await markNotifiedIfNeeded(lead);
    return res.json({ status: 'success', data: serializePartnerLead(settled) });
  } catch (error) {
    console.error('리드 상세 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '리드 상세 조회 중 오류가 발생했습니다.' });
  }
};

// 응답/성사/무산 신고 (`PATCH /api/partner/leads/:leadNo/status`) — §4.3 상태머신, 파트너 허용 전이만.
export const updateMyLeadStatus = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { status, note } = req.body as { status?: string; note?: string };
  const requestable = new Set(['RESPONDED', 'CONVERTED', 'LOST']);
  if (!status || !requestable.has(status)) {
    return res.status(400).json({ status: 'error', message: "status는 'RESPONDED', 'CONVERTED', 'LOST' 중 하나여야 합니다." });
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { leadNo: req.params.leadNo, partnerId: decoded.id, thirdPartyConsentAt: { not: null } },
      include: { facility: { select: FACILITY_SELECT } },
    });
    if (!lead) {
      return res.status(404).json({ status: 'error', message: '리드를 찾을 수 없습니다.' });
    }

    const allowedNext = PARTNER_ALLOWED_TRANSITIONS[lead.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(409).json({
        status: 'error',
        message: `현재 상태(${lead.status})에서 ${status}로 변경할 수 없습니다.`,
      });
    }

    const history = Array.isArray(lead.statusHistory) ? lead.statusHistory : [];
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status,
        statusHistory: [
          ...history,
          { status, at: new Date().toISOString(), by: 'partner', ...(note?.trim() ? { note: note.trim() } : {}) },
        ] as unknown as Prisma.InputJsonValue,
      },
      include: { facility: { select: FACILITY_SELECT } },
    });

    return res.json({ status: 'success', data: serializePartnerLead(updated) });
  } catch (error) {
    console.error('리드 상태 변경 실패:', error);
    return res.status(500).json({ status: 'error', message: '리드 상태 변경 중 오류가 발생했습니다.' });
  }
};
