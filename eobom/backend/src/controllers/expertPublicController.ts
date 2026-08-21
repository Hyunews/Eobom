import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { createConsultRequest, ConsentRequiredError, ExpertNotAvailableError } from '../services/consultService';
import { resolveApplicantContact, ProfileContactMissingError } from '../utils/applicantContact';
import { normalizePhone } from '../utils/phone';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// 공개 API 응답 화이트리스트(docs 02-03 §5.1) — 이 select에 없는 필드는 응답에 절대 못 나간다.
// passwordHash/refreshTokenHash/settlementBank/settlementAccount/licenseDocUrl/contactPhone/
// rejectReason/email이 여기 없는 게 핵심 — 정산계좌·자격증 사본·개인 연락처 유출 방지.
const PUBLIC_EXPERT_SELECT = {
  id: true,
  category: true,
  name: true,
  licenseOrg: true,
  bio: true,
  specialties: true,
  createdAt: true,
} satisfies Prisma.ExpertSelect;

// Prisma where절 — 공개 목록은 승인(APPROVED) + 공개(isPublished) 둘 다 참인 것만(§4.3, §5.1)
const buildWhere = (query: Request['query']): Prisma.ExpertWhereInput => {
  const where: Prisma.ExpertWhereInput = {
    status: 'APPROVED',
    isPublished: true,
  };

  const category = query.category as string | undefined;
  if (category && category !== '전체') {
    where.category = category;
  }

  const q = query.q as string | undefined;
  if (q && q.trim()) {
    where.name = { contains: q.trim(), mode: 'insensitive' };
  }

  return where;
};

// 승인+공개 전문가 목록 (`GET /api/experts`) — 인증 불필요
export const getPublicExperts = async (req: Request, res: Response) => {
  try {
    const where = buildWhere(req.query);
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt((req.query.pageSize as string) || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );

    const [totalCount, rows] = await Promise.all([
      prisma.expert.count({ where }),
      prisma.expert.findMany({
        where,
        select: PUBLIC_EXPERT_SELECT,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({
      status: 'success',
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      data: rows,
    });
  } catch (error) {
    console.error('전문가 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '전문가 목록을 불러오지 못했습니다.' });
  }
};

// 승인+공개 전문가 상세 (`GET /api/experts/:id`) — 미승인/미공개면 404(존재를 숨김, §5.1과 동일 원칙)
export const getPublicExpertById = async (req: Request, res: Response) => {
  try {
    const expert = await prisma.expert.findFirst({
      where: { id: req.params.id, status: 'APPROVED', isPublished: true },
      select: PUBLIC_EXPERT_SELECT,
    });
    if (!expert) {
      return res.status(404).json({ status: 'error', message: '전문가를 찾을 수 없습니다.' });
    }
    return res.json({ status: 'success', data: expert });
  } catch (error) {
    console.error('전문가 상세 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '전문가 정보를 불러오지 못했습니다.' });
  }
};

const safeConsultRequest = (r: { requestNo: string; status: string; createdAt: Date }) => ({
  requestNo: r.requestNo,
  status: r.status,
  createdAt: r.createdAt,
});

// 상담 신청 (`POST /api/experts/:id/consult-requests`) — 로그인 불필요(§5.2, 비회원 허용).
// 로그인 상태면 userId를 함께 남긴다(leadController.createQuote와 동일 패턴).
// 00-28 §6.4 Phase 2 — useProfileContact·saveToProfile 플래그. createQuote와 완전히 같은 규칙
// (⚠️ 두 폼의 동작을 다르게 두지 말 것 — §6.4-1).
export const submitConsultRequest = async (req: Request, res: Response) => {
  const { applicantName, applicantPhone, channel, preferredAt, content, thirdPartyConsent, useProfileContact, saveToProfile } = req.body as {
    applicantName?: string;
    applicantPhone?: string;
    channel?: string;
    preferredAt?: string;
    content?: string;
    thirdPartyConsent?: boolean;
    useProfileContact?: boolean;
    saveToProfile?: boolean;
  };

  const decoded = verifyBearerToken(req);
  const usesProfile = !!useProfileContact && !!decoded;

  if (!usesProfile && (!applicantName?.trim() || !applicantPhone?.trim())) {
    return res.status(400).json({ status: 'error', message: '이름과 연락처는 필수입니다.' });
  }
  if (!channel?.trim() || !content?.trim()) {
    return res.status(400).json({ status: 'error', message: '희망 상담 방식과 상담 내용은 필수입니다.' });
  }
  if (!thirdPartyConsent) {
    return res.status(400).json({ status: 'error', message: '개인정보 제3자 제공에 동의해야 상담을 신청할 수 있습니다.' });
  }

  try {
    const consultRequest = await prisma.$transaction(async (tx) => {
      const contact = await resolveApplicantContact(tx, {
        useProfileContact: usesProfile,
        userId: decoded?.id ?? null,
        bodyName: applicantName,
        bodyPhone: applicantPhone,
      });

      const created = await createConsultRequest(tx, {
        expertId: req.params.id,
        userId: decoded?.id ?? null,
        applicantName: contact.applicantName,
        applicantPhone: contact.applicantPhone,
        channel: channel.trim(),
        preferredAt: preferredAt ? new Date(preferredAt) : null,
        content: content.trim(),
        thirdPartyConsent: true,
      });

      // §8 Phase 2 #6 — 방금 친 값이 최신이므로 기존 프로필 값이 있어도 덮어쓴다.
      // ⚠️ ConsultRequest.applicantPhone(스냅샷)은 원문 그대로 저장하지만(기존 동작 유지),
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
    return res.status(201).json({ status: 'success', data: safeConsultRequest(consultRequest) });
  } catch (error) {
    if (error instanceof ProfileContactMissingError) {
      return res.status(400).json({ status: 'error', message: '프로필에 저장된 연락처가 없습니다. 마이페이지에서 먼저 등록해 주세요.' });
    }
    if (error instanceof ExpertNotAvailableError) {
      return res.status(404).json({ status: 'error', message: '전문가를 찾을 수 없습니다.' });
    }
    if (error instanceof ConsentRequiredError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('상담 신청 생성 실패:', error);
    return res.status(500).json({ status: 'error', message: '상담 신청 처리 중 오류가 발생했습니다.' });
  }
};
