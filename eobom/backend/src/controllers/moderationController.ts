import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import { normalizePhone, isValidPhoneLength, MIN_PHONE_DIGITS, MAX_PHONE_DIGITS } from '../utils/phone';

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

// 사업자 담당자 정보 수정 (`PATCH /api/admin/partners/:id`) — 검증된 신원 필드(사업자등록번호 등)는
// 대상에서 뺐다. 그런 필드가 틀렸으면 조용히 고치지 않고 반려 후 재신청을 받아 심사 이력을 보존한다.
export const updatePartnerInfo = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { ownerName, contactName, contactPhone } = req.body as { ownerName?: string; contactName?: string; contactPhone?: string };
  if (ownerName === undefined && contactName === undefined && contactPhone === undefined) {
    return res.status(400).json({ status: 'error', message: '수정할 항목(대표자명, 담당자명, 연락처)이 없습니다.' });
  }
  if (ownerName !== undefined && !ownerName.trim()) {
    return res.status(400).json({ status: 'error', message: '대표자명은 비워둘 수 없습니다.' });
  }
  if (contactName !== undefined && !contactName.trim()) {
    return res.status(400).json({ status: 'error', message: '담당자명은 비워둘 수 없습니다.' });
  }

  let normalizedPhone: string | undefined;
  if (contactPhone !== undefined) {
    normalizedPhone = normalizePhone(contactPhone);
    if (!isValidPhoneLength(normalizedPhone)) {
      return res.status(400).json({ status: 'error', message: `연락처는 숫자 ${MIN_PHONE_DIGITS}~${MAX_PHONE_DIGITS}자리여야 합니다.` });
    }
  }

  try {
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: {
        ...(ownerName !== undefined ? { ownerName: ownerName.trim() } : {}),
        ...(contactName !== undefined ? { contactName: contactName.trim() } : {}),
        ...(normalizedPhone !== undefined ? { contactPhone: normalizedPhone } : {}),
      },
    });
    return res.json({ status: 'success', data: { id: partner.id, ownerName: partner.ownerName, contactName: partner.contactName, contactPhone: partner.contactPhone } });
  } catch (error) {
    console.error('사업자 정보 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 수정 중 오류가 발생했습니다.' });
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
        officeAddress: true,
        bio: true,
        status: true,
        rejectReason: true,
        isPublished: true,
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

// 전문가 연락처·소개 수정 (`PATCH /api/admin/experts/:id`) — 자격증번호 등 검증 필드는 제외
// (updatePartnerInfo와 동일 원칙).
export const updateExpertInfo = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { contactPhone, officeAddress, bio } = req.body as { contactPhone?: string; officeAddress?: string; bio?: string };
  if (contactPhone === undefined && officeAddress === undefined && bio === undefined) {
    return res.status(400).json({ status: 'error', message: '수정할 항목(연락처, 사무실 주소, 소개)이 없습니다.' });
  }

  let normalizedPhone: string | undefined;
  if (contactPhone !== undefined) {
    normalizedPhone = normalizePhone(contactPhone);
    if (!isValidPhoneLength(normalizedPhone)) {
      return res.status(400).json({ status: 'error', message: `연락처는 숫자 ${MIN_PHONE_DIGITS}~${MAX_PHONE_DIGITS}자리여야 합니다.` });
    }
  }

  try {
    const expert = await prisma.expert.update({
      where: { id: req.params.id },
      data: {
        ...(normalizedPhone !== undefined ? { contactPhone: normalizedPhone } : {}),
        ...(officeAddress !== undefined ? { officeAddress } : {}),
        ...(bio !== undefined ? { bio } : {}),
      },
    });
    return res.json({ status: 'success', data: { id: expert.id, contactPhone: expert.contactPhone, officeAddress: expert.officeAddress, bio: expert.bio } });
  } catch (error) {
    console.error('전문가 정보 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '정보 수정 중 오류가 발생했습니다.' });
  }
};

// 전문가 공개 노출 토글 (`PATCH /api/admin/experts/:id/publish`, docs 02-03 §5.4) — 승인(status)과
// 별개 축이다. 미승인 전문가를 공개하면 §4.3 설계 취지가 깨지므로 승인 상태부터 확인한다.
export const updateExpertPublish = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { isPublished } = req.body as { isPublished?: boolean };
  if (typeof isPublished !== 'boolean') {
    return res.status(400).json({ status: 'error', message: 'isPublished는 boolean이어야 합니다.' });
  }

  try {
    const target = await prisma.expert.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!target) {
      return res.status(404).json({ status: 'error', message: '전문가를 찾을 수 없습니다.' });
    }
    if (isPublished && target.status !== 'APPROVED') {
      return res.status(400).json({ status: 'error', message: '승인(APPROVED)된 전문가만 공개할 수 있습니다.' });
    }

    const expert = await prisma.expert.update({ where: { id: req.params.id }, data: { isPublished } });
    return res.json({ status: 'success', data: { id: expert.id, isPublished: expert.isPublished } });
  } catch (error) {
    console.error('전문가 공개 토글 실패:', error);
    return res.status(500).json({ status: 'error', message: '공개 설정 변경 중 오류가 발생했습니다.' });
  }
};

// 전체 상담 신청 조회 (`GET /api/admin/consult-requests`, docs 02-03 §5.4) — 분쟁 대응·품질 모니터링용
export const listConsultRequestsForAdmin = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const status = (req.query.status as string) || undefined;
  try {
    const requests = await prisma.consultRequest.findMany({
      where: status ? { status } : {},
      include: { expert: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: requests });
  } catch (error) {
    console.error('상담 신청 전체 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// 추모관(Memorial) 신고 처리. docs 05-01 §2.3, §4.1, §4.3, §7 4단계.
// "선차단 후 확인" 원칙(§4.3-3) — 신고 접수 시점에 이미 PRIVATE로 전환돼 있으므로, 여기서는
// 그 이후의 운영자 확인·복구만 다룬다.
// ─────────────────────────────────────────────────────────────────

// 신고 접수 (`POST /api/memorials/:slug/report`) — 공개, 인증 불필요. 접수 즉시 PRIVATE 전환(§4.3-3).
// 신고 사유를 저장하는 컬럼은 스키마에 없다(§5.3) — reportedAt/visibility만 갱신한다.
export const reportMemorial = async (req: Request, res: Response) => {
  try {
    const memorial = await prisma.memorial.findUnique({ where: { slug: req.params.slug } });
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }

    const updated = await prisma.memorial.update({
      where: { id: memorial.id },
      data: { reportedAt: new Date(), visibility: 'PRIVATE', reviewedAt: null },
    });
    return res.json({ status: 'success', data: { id: updated.id, visibility: updated.visibility } });
  } catch (error) {
    console.error('추모관 신고 접수 실패:', error);
    return res.status(500).json({ status: 'error', message: '신고 접수 중 오류가 발생했습니다.' });
  }
};

// 추모관 목록 (`GET /api/admin/memorials?reported=true`) — reported=true면 미확인 신고 큐만(§6.3)
export const listMemorialsForAdmin = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const reportedOnly = req.query.reported === 'true';
  try {
    const memorials = await prisma.memorial.findMany({
      where: reportedOnly ? { reportedAt: { not: null }, reviewedAt: null } : {},
      include: { createdByUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: memorials });
  } catch (error) {
    console.error('추모관 목록(운영자) 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 신고 확인 (`PATCH /api/admin/memorials/:id/review`) — 복구 또는 유지 판단(§6.3).
// 신고 이전의 공개범위를 별도로 기억해두는 컬럼이 없으므로(§5.3), 복구 시 운영자가 공개범위를
// 직접 지정한다(미지정 시 안전한 기본값 LINK) — 시스템이 임의로 이전 값을 추정하지 않는다.
const REVIEW_DECISIONS = ['RESTORE', 'CONFIRM'] as const;
export const reviewMemorialReport = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { decision, visibility } = req.body as { decision?: string; visibility?: string };
  if (!decision || !(REVIEW_DECISIONS as readonly string[]).includes(decision)) {
    return res.status(400).json({ status: 'error', message: `decision은 ${REVIEW_DECISIONS.join(', ')} 중 하나여야 합니다.` });
  }
  if (visibility !== undefined && !['LINK', 'PUBLIC'].includes(visibility)) {
    return res.status(400).json({ status: 'error', message: 'visibility는 RESTORE 시 LINK 또는 PUBLIC만 지정할 수 있습니다.' });
  }

  try {
    const memorial = await prisma.memorial.findUnique({ where: { id: req.params.id } });
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }

    const updated = await prisma.memorial.update({
      where: { id: memorial.id },
      data: {
        reviewedAt: new Date(),
        visibility: decision === 'RESTORE' ? visibility || 'LINK' : 'PRIVATE',
      },
    });
    return res.json({ status: 'success', data: { id: updated.id, visibility: updated.visibility, reviewedAt: updated.reviewedAt } });
  } catch (error) {
    console.error('추모관 신고 확인 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '신고 확인 처리 중 오류가 발생했습니다.' });
  }
};

// 방명록 강제 비공개 (`PATCH /api/admin/memorials/:id/guestbook/:gid/hide`) — 소프트 삭제(§4.5, §6.3)
export const hideMemorialGuestbookEntry = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const entry = await prisma.memorialGuestbook.findUnique({ where: { id: req.params.gid } });
    if (!entry || entry.memorialId !== req.params.id) {
      return res.status(404).json({ status: 'error', message: '방명록을 찾을 수 없습니다.' });
    }

    const updated = await prisma.memorialGuestbook.update({ where: { id: entry.id }, data: { hiddenAt: new Date() } });
    return res.json({ status: 'success', data: { id: updated.id, hiddenAt: updated.hiddenAt } });
  } catch (error) {
    console.error('방명록 강제 비공개 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '방명록 비공개 처리 중 오류가 발생했습니다.' });
  }
};
