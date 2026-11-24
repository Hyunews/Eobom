import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import { setAuditTarget } from '../services/opsLogService';
import { isAutoExpired } from './obituaryController';
import { normalizePhone, isValidPhoneLength, MIN_PHONE_DIGITS, MAX_PHONE_DIGITS } from '../utils/phone';

// 운영자의 사업자(Partner)·전문가(Expert) 가입 심사. 자동승인 없음(§3.2 원칙) — 이 엔드포인트를
// 거쳐야만 PENDING → APPROVED/REJECTED/SUSPENDED로 바뀐다.

const VALID_STATUSES = ['APPROVED', 'REJECTED', 'SUSPENDED'] as const;

// 사업자 가입 심사 큐 (`GET /api/admin/partners?status=PENDING`)
export const listPartners = async (req: Request, res: Response) => {
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
        suspendReason: true,
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

// 정지 사유 최대 길이 — 추모관 내리기(MAX_REASON_LENGTH)와 같은 값
const MAX_SUSPEND_REASON = 500;

// 정지(SUSPENDED)는 사유 필수(01-05 §14-9 · 02-03 §7.3-2 #7), 해제(정지됨 → 승인됨)는 사유를 지우고 승인 시각을 새로 찍지 않는다.
// 정지·해제는 심사 일이라 OPERATOR도 한다(00-37 §3.3) — 가드를 걸지 않는다. 감사로그에는 SUSPEND·UNSUSPEND로 남긴다.
const suspendFields = (status: string, prevStatus: string | undefined, suspendReason: unknown) => {
  const reason = typeof suspendReason === 'string' ? suspendReason.trim() : '';
  if (status === 'SUSPENDED') {
    if (!reason) return { error: '정지 사유를 입력해야 처리할 수 있습니다.' } as const;
    if (reason.length > MAX_SUSPEND_REASON) return { error: `정지 사유는 ${MAX_SUSPEND_REASON}자 이하여야 합니다.` } as const;
  }
  const isRelease = status === 'APPROVED' && prevStatus === 'SUSPENDED';
  return {
    data: { suspendReason: status === 'SUSPENDED' ? reason : null },
    keepApprovedAt: isRelease,
    audit: status === 'SUSPENDED' ? { action: 'SUSPEND', reason } : isRelease ? { action: 'UNSUSPEND' } : null,
  } as const;
};

// 사업자 승인/반려/정지 (`PATCH /api/admin/partners/:id/status`)
export const updatePartnerStatus = async (req: Request, res: Response) => {
  const { status, rejectReason, suspendReason } = req.body as { status?: string; rejectReason?: string; suspendReason?: string };
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return res.status(400).json({ status: 'error', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const prev = await prisma.partner.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!prev) return res.status(404).json({ status: 'error', message: '사업자를 찾을 수 없습니다.' });
    const sus = suspendFields(status, prev.status, suspendReason);
    if ('error' in sus) return res.status(400).json({ status: 'error', message: sus.error });
    if (sus.audit) setAuditTarget(res, { targetType: 'Partner', targetId: req.params.id, ...sus.audit });

    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
        ...sus.data,
        approvedAt: status === 'APPROVED' && !sus.keepApprovedAt ? new Date() : undefined,
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
        suspendReason: true,
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
  const { status, rejectReason, suspendReason } = req.body as { status?: string; rejectReason?: string; suspendReason?: string };
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return res.status(400).json({ status: 'error', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const prev = await prisma.expert.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!prev) return res.status(404).json({ status: 'error', message: '전문가를 찾을 수 없습니다.' });
    const sus = suspendFields(status, prev.status, suspendReason);
    if ('error' in sus) return res.status(400).json({ status: 'error', message: sus.error });
    if (sus.audit) setAuditTarget(res, { targetType: 'Expert', targetId: req.params.id, ...sus.audit });

    const expert = await prisma.expert.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
        ...sus.data,
        approvedAt: status === 'APPROVED' && !sus.keepApprovedAt ? new Date() : undefined,
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
  const status = (req.query.status as string) || undefined;
  // 8단계 묶음 13(02-03 §7.4 "쪽 넘김 n / m 페이지 (총 n건)") — `page`·`pageSize`를 주면 나눠 받는다. 안 주면 지금처럼 전부(지금 화면이 쓰는 응답 모양을 바꾸지 않는다).
  const paging = req.query.page !== undefined || req.query.pageSize !== undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '20', 10) || 20));
  try {
    // 00-37 §3.1 — 운영자 API 응답도 select 명시. 기존 include(전체 스칼라 필드 암묵 반환)를
    // 지금 실제로 쓰는 필드 그대로 select로 옮긴 것 — 동작은 바뀌지 않는다(화면이 아직 없어
    // 소비처가 없음, 2026-09-07 실측).
    const where = status ? { status } : {};
    const count = paging ? await prisma.consultRequest.count({ where }) : 0;
    const requests = await prisma.consultRequest.findMany({
      where,
      ...(paging ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      select: {
        id: true,
        requestNo: true,
        categorySnapshot: true,
        userId: true,
        applicantName: true,
        applicantPhone: true,
        maskedAt: true,
        channel: true,
        contextType: true,
        preferredAt: true,
        content: true,
        thirdPartyConsentAt: true,
        status: true,
        statusHistory: true,
        createdAt: true,
        updatedAt: true,
        expert: { select: { id: true, name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (paging) {
      return res.json({ status: 'success', count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)), data: requests });
    }
    return res.json({ status: 'success', data: requests });
  } catch (error) {
    console.error('상담 신청 전체 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// 추모관(Memorial) 운영자 조회·방명록 숨김. docs 05-01 §4.1, §4.3.
// 🔄 09-29 — 신고 접수 서버 주소(`POST /api/memorials/:slug/report`)·`reportMemorial` 삭제.
// 🔄 09-30 — 신고 기능 폐지(00-20 §6.2): `reviewMemorialReport`(PATCH .../review)·`reported` 필터 삭제.
// 🔄 10-12 — Memorial.reportedAt·reviewedAt 컬럼 삭제(마이그레이션 20261012150000). 방명록 hide만 유지한다.
// ─────────────────────────────────────────────────────────────────

// 추모관 목록 (`GET /api/admin/memorials`)
export const listMemorialsForAdmin = async (_req: Request, res: Response) => {
  try {
    // 00-37 §3.1 — select 명시. 생년월일(deceasedBirthDate)은 공개 응답에서도 빼는 필드라(§4.2)
    // 운영자 화면에도 넣지 않는다.
    const memorials = await prisma.memorial.findMany({
      select: {
        id: true,
        slug: true,
        deceasedName: true,
        deceasedDeathDate: true,
        visibility: true,
        closedAt: true,
        hiddenAt: true,
        createdAt: true,
        createdByUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: memorials });
  } catch (error) {
    console.error('추모관 목록(운영자) 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 추모관 내리기·되돌리기 (`PATCH /api/admin/memorials/:id/hide|unhide`) — 00-20 §6.2·00-21 제14조 3항(09-30).
// 신고 기능은 없애고 운영자 조치만 남긴다: 전화·카톡으로 알려온 문제(살아 있는 사람의 추모관 등)를 운영자가 판단해 처리한다.
// 🔴 Memorial.hiddenAt — 개설자가 풀 수 없다(visibility와 별개 칸). 공개 열람은 닫힌 추모관과 똑같이 "찾을 수 없음".
// 🔴 사유 메모 필수 — 상태 변경과 AdminAuditLog를 한 트랜잭션에 묶는다(기록 없이 내려가는 경로가 없게).
//    사유에 고인·유족의 개인정보를 적지 말 것(감사 로그가 두 번째 유출 경로가 되지 않게, 00-37 §3.2).
const MAX_REASON_LENGTH = 500;
const setMemorialHidden = (hide: boolean) => async (req: Request, res: Response) => {
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!reason) {
    return res.status(400).json({ status: 'error', message: '사유 메모를 입력해 주세요.' });
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return res.status(400).json({ status: 'error', message: `사유 메모는 ${MAX_REASON_LENGTH}자 이내로 입력해 주세요.` });
  }

  try {
    const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증(00-37 A-1 #1)
    const memorial = await prisma.memorial.findUnique({ where: { id: req.params.id }, select: { id: true, hiddenAt: true } });
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }
    if (hide === !!memorial.hiddenAt) {
      return res.status(409).json({ status: 'error', message: hide ? '이미 내려져 있는 추모관입니다.' : '내려져 있지 않은 추모관입니다.' });
    }

    const [updated] = await prisma.$transaction([
      prisma.memorial.update({ where: { id: memorial.id }, data: { hiddenAt: hide ? new Date() : null }, select: { id: true, hiddenAt: true } }),
      prisma.adminAuditLog.create({
        data: { adminId: decoded.id, adminName: decoded.name, action: hide ? 'HIDE' : 'UNHIDE', targetType: 'Memorial', targetId: memorial.id, reason },
      }),
    ]);
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('추모관 내리기/되돌리기 실패:', error);
    return res.status(500).json({ status: 'error', message: '처리 중 오류가 발생했습니다.' });
  }
};
export const hideMemorial = setMemorialHidden(true);
export const unhideMemorial = setMemorialHidden(false);

// ─────────────────────────────────────────────────────────────────
// 부고장(Obituary) 운영자 목록·종료. docs 07-03 §8-1 (2026-10-08 개발자 결정).
// 추모관 내리기(setMemorialHidden)와 같은 모양 — 사유 필수 + 상태 변경·감사 로그 한 트랜잭션.
// 기존 closedAt을 쓴다(스키마 변경 없음). 되돌리기 없음 — 개설자 종료와 같다(07-03 §9 #9).
// ─────────────────────────────────────────────────────────────────

// 부고장 목록 (`GET /api/admin/obituaries`) — 🔴 계좌·연락처는 select에 넣지 않는다(조치 판단에 필요 없음).
export const listObituariesForAdmin = async (_req: Request, res: Response) => {
  try {
    const obituaries = await prisma.obituary.findMany({
      select: {
        id: true,
        slug: true,
        funeralAt: true,
        closedAt: true,
        createdAt: true,
        deceased: { select: { name: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = obituaries.map((o) => ({
      id: o.id,
      slug: o.slug,
      deceasedName: o.deceased.name,
      funeralAt: o.funeralAt,
      closedAt: o.closedAt,
      // 수동 종료가 우선 — 둘 다 해당하면 CLOSED
      status: o.closedAt ? 'CLOSED' : isAutoExpired(o.funeralAt) ? 'AUTO_CLOSED' : 'ACTIVE',
      createdAt: o.createdAt,
      createdByUser: o.createdByUser,
    }));
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('부고장 목록(운영자) 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 부고장 종료 (`PATCH /api/admin/obituaries/:id/close`) — 사유 필수(500자). 사유에 고인·유족 개인정보를 적지 말 것(00-37 §3.2).
export const closeObituary = async (req: Request, res: Response) => {
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!reason) {
    return res.status(400).json({ status: 'error', message: '사유 메모를 입력해 주세요.' });
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return res.status(400).json({ status: 'error', message: `사유 메모는 ${MAX_REASON_LENGTH}자 이내로 입력해 주세요.` });
  }

  try {
    const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증(00-37 A-1 #1)
    const obituary = await prisma.obituary.findUnique({
      where: { id: req.params.id },
      select: { id: true, closedAt: true, funeralAt: true },
    });
    if (!obituary) {
      return res.status(404).json({ status: 'error', message: '부고장을 찾을 수 없습니다.' });
    }
    // 수동 종료·발인 + 3일 자동 종료 둘 다 이미 닫힌 것
    if (obituary.closedAt || isAutoExpired(obituary.funeralAt)) {
      return res.status(409).json({ status: 'error', message: '이미 종료된 부고장입니다.' });
    }

    const [updated] = await prisma.$transaction([
      prisma.obituary.update({ where: { id: obituary.id }, data: { closedAt: new Date() }, select: { id: true, closedAt: true } }),
      prisma.adminAuditLog.create({
        data: { adminId: decoded.id, adminName: decoded.name, action: 'CLOSE', targetType: 'Obituary', targetId: obituary.id, reason },
      }),
    ]);
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('부고장 종료 실패:', error);
    return res.status(500).json({ status: 'error', message: '처리 중 오류가 발생했습니다.' });
  }
};

// 방명록 목록 (`GET /api/admin/memorials/:id/guestbook`, 00-37 §6 A-2 #5) — 🔵 문서(00-37)엔
// 없던 신규 엔드포인트다. 방명록 숨김(`hideMemorialGuestbookEntry`)이 실제로 쓰이려면 어떤
// gid를 숨길지 봐야 하는데, 그 목록을 볼 방법이 서버에 아예 없었다 — 두 엔드포인트가 세트로
// 있어야 실사용 가능하다고 판단해 최소로 추가(편차, walkthrough 기록).
export const listMemorialGuestbookForAdmin = async (req: Request, res: Response) => {
  try {
    const entries = await prisma.memorialGuestbook.findMany({
      where: { memorialId: req.params.id },
      select: { id: true, authorName: true, relationToDeceased: true, message: true, hiddenAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: entries });
  } catch (error) {
    console.error('방명록 목록(운영자) 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '방명록 조회 중 오류가 발생했습니다.' });
  }
};

// 방명록 강제 비공개 (`PATCH /api/admin/memorials/:id/guestbook/:gid/hide`) — 소프트 삭제(§4.5, §6.3)
export const hideMemorialGuestbookEntry = async (req: Request, res: Response) => {
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
