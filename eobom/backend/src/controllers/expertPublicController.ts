import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { createConsultRequest, ConsentRequiredError, ExpertNotAvailableError } from '../services/consultService';

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
export const submitConsultRequest = async (req: Request, res: Response) => {
  const { applicantName, applicantPhone, channel, preferredAt, content, thirdPartyConsent } = req.body as {
    applicantName?: string;
    applicantPhone?: string;
    channel?: string;
    preferredAt?: string;
    content?: string;
    thirdPartyConsent?: boolean;
  };

  if (!applicantName?.trim() || !applicantPhone?.trim()) {
    return res.status(400).json({ status: 'error', message: '이름과 연락처는 필수입니다.' });
  }
  if (!channel?.trim() || !content?.trim()) {
    return res.status(400).json({ status: 'error', message: '희망 상담 방식과 상담 내용은 필수입니다.' });
  }
  if (!thirdPartyConsent) {
    return res.status(400).json({ status: 'error', message: '개인정보 제3자 제공에 동의해야 상담을 신청할 수 있습니다.' });
  }

  const decoded = verifyBearerToken(req);

  try {
    const consultRequest = await prisma.$transaction((tx) =>
      createConsultRequest(tx, {
        expertId: req.params.id,
        userId: decoded?.id ?? null,
        applicantName: applicantName.trim(),
        applicantPhone: applicantPhone.trim(),
        channel: channel.trim(),
        preferredAt: preferredAt ? new Date(preferredAt) : null,
        content: content.trim(),
        thirdPartyConsent: true,
      })
    );
    return res.status(201).json({ status: 'success', data: safeConsultRequest(consultRequest) });
  } catch (error) {
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
