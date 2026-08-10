import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';

// 운영자의 사업자(Partner)·전문가(Expert) 가입 심사. 자동승인 없음(§3.2 원칙) — 이 엔드포인트를
// 거쳐야만 PENDING → APPROVED/REJECTED/SUSPENDED로 바뀐다.

const VALID_STATUSES = ['APPROVED', 'REJECTED', 'SUSPENDED'] as const;

// 사업자 가입 심사 큐 (`GET /api/admin/partners?status=PENDING`)
export const listPartners = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const status = (req.query.status as string) || undefined;
  try {
    const partners = await prisma.partner.findMany({
      where: status ? { status } : {},
      select: {
        id: true,
        email: true,
        companyName: true,
        ownerName: true,
        contactName: true,
        contactPhone: true,
        bizRegNo: true,
        bizLicenseUrl: true,
        status: true,
        rejectReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ status: 'success', data: partners });
  } catch (error) {
    console.error('사업자 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 사업자 승인/반려/정지 (`PATCH /api/admin/partners/:id/status`)
export const updatePartnerStatus = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { status, rejectReason } = req.body as { status?: string; rejectReason?: string };
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return res.status(400).json({ status: 'error', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
    });
    return res.json({ status: 'success', data: { id: partner.id, status: partner.status } });
  } catch (error) {
    console.error('사업자 상태 변경 실패:', error);
    return res.status(500).json({ status: 'error', message: '상태 변경 중 오류가 발생했습니다.' });
  }
};

// 전문가 가입 심사 큐 (`GET /api/admin/experts?status=PENDING`)
export const listExperts = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const status = (req.query.status as string) || undefined;
  try {
    const experts = await prisma.expert.findMany({
      where: status ? { status } : {},
      select: {
        id: true,
        email: true,
        category: true,
        name: true,
        licenseNo: true,
        licenseOrg: true,
        licenseDocUrl: true,
        contactPhone: true,
        status: true,
        rejectReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ status: 'success', data: experts });
  } catch (error) {
    console.error('전문가 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 전문가 승인/반려/정지 (`PATCH /api/admin/experts/:id/status`)
export const updateExpertStatus = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { status, rejectReason } = req.body as { status?: string; rejectReason?: string };
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return res.status(400).json({ status: 'error', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const expert = await prisma.expert.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
    });
    return res.json({ status: 'success', data: { id: expert.id, status: expert.status } });
  } catch (error) {
    console.error('전문가 상태 변경 실패:', error);
    return res.status(500).json({ status: 'error', message: '상태 변경 중 오류가 발생했습니다.' });
  }
};
