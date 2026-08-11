import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyPartnerBearerToken } from './partnerController';
import { verifyAdminBearerToken } from './adminController';

// 시설 소유권 클레임 — 사업자(Partner)가 자기 시설을 "이게 제 시설입니다"라고 신청하고,
// 운영자가 심사해서 승인하면 Facility.partnerId가 채워진다 (docs 01-05 §3.3, §3.4).
// isPartner는 파생 캐시라 승인/반려 트랜잭션 안에서만 같이 갱신한다 — 동기화 지점을 한 곳으로 제한.

// 클레임 신청 (`POST /api/partner/claims`)
export const submitClaim = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { facilityId, evidenceUrl } = req.body as { facilityId?: string; evidenceUrl?: string };
  if (!facilityId) {
    return res.status(400).json({ status: 'error', message: 'facilityId가 필요합니다.' });
  }

  try {
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }
    if (facility.partnerId && facility.partnerId !== decoded.id) {
      // 이미 다른 사업자에게 승인된 시설 — 신청은 받되 분쟁 건으로 표시(§3.3)
      const claim = await prisma.facilityClaim.create({
        data: { partnerId: decoded.id, facilityId, evidenceUrl, reviewNote: '⚠️ 이미 다른 사업자에게 연동된 시설 — 분쟁 확인 필요' },
      });
      return res.status(201).json({ status: 'success', data: claim, message: '이미 다른 사업자와 연동된 시설이라 분쟁 건으로 접수되었습니다.' });
    }

    const claim = await prisma.facilityClaim.create({
      data: { partnerId: decoded.id, facilityId, evidenceUrl },
    });
    return res.status(201).json({ status: 'success', data: claim });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: '이미 이 시설에 클레임을 신청하셨습니다.' });
    }
    console.error('클레임 신청 실패:', error);
    return res.status(500).json({ status: 'error', message: '클레임 신청 처리 중 오류가 발생했습니다.' });
  }
};

// 내 클레임 목록 (`GET /api/partner/claims`)
export const listMyClaims = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const claims = await prisma.facilityClaim.findMany({
      where: { partnerId: decoded.id },
      include: { facility: { select: { id: true, name: true, location: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: claims });
  } catch (error) {
    console.error('클레임 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '클레임 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 내 시설(연동 승인 완료) 목록 (`GET /api/partner/facilities`)
export const listMyFacilities = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const facilities = await prisma.facility.findMany({
      where: { partnerId: decoded.id },
      select: { id: true, name: true, type: true, location: true, isPartner: true, images: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ status: 'success', data: facilities });
  } catch (error) {
    console.error('내 시설 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '시설 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 클레임 심사 큐 (`GET /api/admin/claims?status=PENDING`)
export const listClaimsForAdmin = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const status = (req.query.status as string) || undefined;
  try {
    const claims = await prisma.facilityClaim.findMany({
      where: status ? { status } : {},
      include: {
        facility: { select: { id: true, name: true, location: true, partnerId: true } },
        partner: { select: { id: true, companyName: true, ownerName: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ status: 'success', data: claims });
  } catch (error) {
    console.error('클레임 심사 큐 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '클레임 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 클레임 승인/반려 (`PATCH /api/admin/claims/:id/status`) — 승인 시 Facility.partnerId + isPartner를
// 같은 트랜잭션에서 갱신한다(§3.4). 이미 다른 파트너에게 연동된 시설이면 승인 자체를 막는다.
export const updateClaimStatus = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { status, reviewNote } = req.body as { status?: string; reviewNote?: string };
  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ status: 'error', message: "status는 'APPROVED' 또는 'REJECTED'여야 합니다." });
  }

  try {
    const claim = await prisma.facilityClaim.findUnique({ where: { id: req.params.id } });
    if (!claim) {
      return res.status(404).json({ status: 'error', message: '클레임을 찾을 수 없습니다.' });
    }

    if (status === 'REJECTED') {
      const updated = await prisma.facilityClaim.update({
        where: { id: claim.id },
        data: { status: 'REJECTED', reviewNote, reviewedAt: new Date() },
      });
      return res.json({ status: 'success', data: updated });
    }

    // APPROVED — 트랜잭션으로 클레임 + Facility.partnerId + isPartner 동시 갱신
    const result = await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.findUnique({ where: { id: claim.facilityId } });
      if (!facility) {
        throw new Error('FACILITY_NOT_FOUND');
      }
      if (facility.partnerId && facility.partnerId !== claim.partnerId) {
        throw new Error('ALREADY_CLAIMED_BY_OTHER');
      }

      await tx.facility.update({ where: { id: claim.facilityId }, data: { partnerId: claim.partnerId, isPartner: true } });
      return tx.facilityClaim.update({
        where: { id: claim.id },
        data: { status: 'APPROVED', reviewNote, reviewedAt: new Date() },
      });
    });

    return res.json({ status: 'success', data: result });
  } catch (error: any) {
    if (error?.message === 'FACILITY_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }
    if (error?.message === 'ALREADY_CLAIMED_BY_OTHER') {
      return res.status(409).json({ status: 'error', message: '이미 다른 사업자에게 연동된 시설입니다. 분쟁을 먼저 해결해주세요.' });
    }
    console.error('클레임 심사 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '클레임 심사 처리 중 오류가 발생했습니다.' });
  }
};
