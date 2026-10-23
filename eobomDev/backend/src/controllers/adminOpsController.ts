import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import { setAuditTarget } from '../services/opsLogService';
import { INTRO_HIDE_REASONS } from '../utils/facilityIntro';
import { kstIso } from '../utils/kst';

// 디자인 개편 8단계 묶음 13 · 운영자 화면이 쓰는 새 API 모음 — 감사로그 열람 · 운영자 계정 · 요율 등록 틀 · 업체 문의 · 전체 시설(소개 글 숨김).
// 정본: 00-37 §4.1·§3.3 · 01-05 §14-9·§8.2·§14-5. 모두 추가형(지금 화면이 쓰는 응답을 바꾸지 않는다).
// 🔴 SUPERADMIN만 하는 일(요율 저장 · 운영자 계정 관리)은 adminRoutes.ts에서 requireSuperAdmin을 건다(00-37 §3.3).
// 감사 기록은 adminAudit 미들웨어가 요청마다 남기고, 행동 이름을 정해야 하는 곳만 setAuditTarget으로 덮는다.

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_NOTE = 500;

const pageOf = (req: Request, fallback = DEFAULT_PAGE_SIZE) => {
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt((req.query.pageSize as string) || String(fallback), 10) || fallback));
  return { page, pageSize, skip: (page - 1) * pageSize };
};

const paged = <T>(count: number, page: number, pageSize: number, data: T[]) => ({
  status: 'success' as const,
  count,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(count / pageSize)),
  data,
});

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const serverError = (res: Response, label: string, error: unknown) => {
  console.error(`${label}:`, error);
  return res.status(500).json({ status: 'error', message: `${label} 중 오류가 발생했습니다.` });
};

// ───────────── 감사로그 열람 (00-37 §4.1 판 6-24) ─────────────
// 열 = 시각 · 운영자 · 행위 · 대상 종류 · 대상 ID · 사유 · 결과 / 줄을 고르면 IP · 요청 번호. 위 = 대상 ID 검색 + 행위 + 결과.
// 기간·운영자 거르기는 없다(⬜ §4 #10). 홈 "최근 오류"는 `?result=FAIL`로 이 목록을 연다.
export const AUDIT_RESULTS = ['SUCCESS', 'FAIL'] as const;
export const AUDIT_ACTIONS = [
  'LOGIN', 'LOGIN_FAIL', 'LOCKED', 'LIST', 'VIEW', 'CREATE', 'UPDATE', 'DELETE',
  'APPROVE', 'REJECT', 'SUSPEND', 'UNSUSPEND', 'WITHDRAW', 'HIDE', 'UNHIDE', 'CLOSE', 'PURGE', 'MEMORIALIZE',
  'CONFIRM_BILLABLE', 'INVALIDATE',
] as const;

export const listAuditLogs = async (req: Request, res: Response) => {
  const q = str(req.query.q);
  const action = str(req.query.action);
  const result = str(req.query.result);
  if (result && !(AUDIT_RESULTS as readonly string[]).includes(result)) {
    return res.status(400).json({ status: 'error', message: `result는 ${AUDIT_RESULTS.join(', ')} 중 하나여야 합니다.` });
  }
  const { page, pageSize, skip } = pageOf(req);
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(q ? { targetId: { contains: q, mode: 'insensitive' } } : {}),
    ...(action ? { action } : {}),
    ...(result ? { result } : {}),
  };
  try {
    const [count, rows] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        select: { id: true, createdAt: true, adminName: true, action: true, targetType: true, targetId: true, reason: true, result: true, ip: true, requestId: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);
    return res.json({ ...paged(count, page, pageSize, rows), actions: AUDIT_ACTIONS });
  } catch (error) {
    return serverError(res, '감사로그 조회', error);
  }
};

// ───────────── 운영자 계정 (00-37 §4.1 판 6-25) — 메뉴째 SUPERADMIN ─────────────
export const ADMIN_ROLES = ['SUPERADMIN', 'OPERATOR'] as const;
const MIN_ADMIN_PASSWORD = 8;
const MAX_ADMIN_PASSWORD = 72; // bcrypt는 72바이트 뒤를 무시한다

export const listAdminAccounts = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, '운영자 계정 조회', error);
  }
};

// 등급 변경 (`PATCH /api/admin/accounts/:id/role`) — 🔴 마지막 남은 SUPERADMIN은 낮출 수 없다(아무도 운영자 계정을 관리할 수 없게 되는 것을 막음).
// 동시에 두 명이 서로를 낮추는 경합을 막으려고 Serializable 트랜잭션 안에서 센다.
export const changeAdminRole = async (req: Request, res: Response) => {
  const role = str(req.body?.role);
  if (!(ADMIN_ROLES as readonly string[]).includes(role)) {
    return res.status(400).json({ status: 'error', message: `role은 ${ADMIN_ROLES.join(', ')} 중 하나여야 합니다.` });
  }
  try {
    const outcome = await prisma.$transaction(
      async (tx) => {
        const target = await tx.admin.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } });
        if (!target) return { code: 404 as const };
        if (target.role === role) return { code: 409 as const, message: '이미 같은 등급입니다.' };
        if (target.role === 'SUPERADMIN' && role !== 'SUPERADMIN') {
          const supers = await tx.admin.count({ where: { role: 'SUPERADMIN' } });
          if (supers <= 1) return { code: 409 as const, message: '마지막 남은 SUPERADMIN은 낮출 수 없습니다.' };
        }
        await tx.admin.update({ where: { id: target.id }, data: { role } });
        return { code: 200 as const, from: target.role };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (outcome.code === 404) return res.status(404).json({ status: 'error', message: '운영자를 찾을 수 없습니다.' });
    if (outcome.code === 409) return res.status(409).json({ status: 'error', message: outcome.message });
    setAuditTarget(res, { action: 'UPDATE', targetType: 'Admin', targetId: req.params.id, reason: `등급 ${outcome.from} → ${role}` });
    return res.json({ status: 'success', data: { id: req.params.id, role } });
  } catch (error) {
    return serverError(res, '등급 변경', error);
  }
};

// 비밀번호 변경 (`PATCH /api/admin/accounts/:id/password`) — 새 비밀번호는 응답·감사로그 어디에도 담지 않는다.
// 바꾼 계정의 리프레시 토큰을 비워 다른 곳의 세션이 이어지지 않게 하고, 잠금 표시도 푼다.
export const changeAdminPassword = async (req: Request, res: Response) => {
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (newPassword.length < MIN_ADMIN_PASSWORD || newPassword.length > MAX_ADMIN_PASSWORD) {
    return res.status(400).json({ status: 'error', message: `비밀번호는 ${MIN_ADMIN_PASSWORD}자 이상 ${MAX_ADMIN_PASSWORD}자 이하여야 합니다.` });
  }
  try {
    const target = await prisma.admin.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!target) return res.status(404).json({ status: 'error', message: '운영자를 찾을 수 없습니다.' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: target.id },
      data: { passwordHash, refreshTokenHash: null, failedLoginCount: 0, lockedUntil: null },
    });
    setAuditTarget(res, { action: 'UPDATE', targetType: 'Admin', targetId: target.id, reason: '비밀번호 변경' });
    return res.json({ status: 'success', data: { id: target.id } });
  } catch (error) {
    return serverError(res, '비밀번호 변경', error);
  }
};

// ───────────── 요율 등록 틀 (01-05 §14-9 · §8.2) — 값은 예시, 수수료 산정 기준은 결정 대기(pending-approvals) ─────────────
// 🔴 기존 요율 레코드는 고치지 않는다 — 바꿀 때는 이전 레코드의 effectiveTo를 닫고 새 레코드를 추가한다. 삭제 없음.
//    이력 줄에서 고칠 수 있는 칸은 "적용 종료" 하나뿐이다.
export const COMMISSION_BASES = ['PER_CONVERSION', 'PER_LEAD', 'MONTHLY_FLAT'] as const;

const serializePolicy = (p: {
  id: string; basis: string; amount: number | null; rate: Prisma.Decimal | null; partnerId: string | null;
  partner?: { companyName: string } | null; effectiveFrom: Date; effectiveTo: Date | null; memo: string | null; createdAt: Date;
}) => ({
  id: p.id,
  basis: p.basis,
  amount: p.amount,
  rate: p.rate === null ? null : Number(p.rate),
  partnerId: p.partnerId,
  partnerName: p.partner?.companyName ?? null,
  effectiveFrom: p.effectiveFrom,
  effectiveTo: p.effectiveTo,
  memo: p.memo,
  createdAt: p.createdAt,
});

export const listCommissionPolicies = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.commissionPolicy.findMany({
      include: { partner: { select: { companyName: true } } },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ status: 'success', data: rows.map(serializePolicy), bases: COMMISSION_BASES });
  } catch (error) {
    return serverError(res, '요율 조회', error);
  }
};

const parseDate = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// 요율 등록 (`POST /api/admin/commission-policies`) — 금액(원) 또는 정률(%) 중 하나. 같은 범위(파트너·기준)에 열려 있는 이전 요율은 새 적용 시작에 닫는다.
export const createCommissionPolicy = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req)!;
  const basis = str(req.body?.basis);
  if (!(COMMISSION_BASES as readonly string[]).includes(basis)) {
    return res.status(400).json({ status: 'error', message: '수수료 기준을 골라야 합니다.' });
  }
  const hasAmount = req.body?.amount !== undefined && req.body.amount !== null && req.body.amount !== '';
  const hasRate = req.body?.rate !== undefined && req.body.rate !== null && req.body.rate !== '';
  if (hasAmount === hasRate) {
    return res.status(400).json({ status: 'error', message: '금액(원)과 정률(%) 중 하나만 입력해야 합니다.' });
  }
  let amount: number | null = null;
  let rate: number | null = null;
  if (hasAmount) {
    amount = Number(req.body.amount);
    if (!Number.isInteger(amount) || amount < 0 || amount > 1_000_000_000) {
      return res.status(400).json({ status: 'error', message: '금액은 0 이상의 정수(원)여야 합니다.' });
    }
  } else {
    rate = Number(req.body.rate);
    // 화면은 % 로 받고 저장은 0.0500 꼴(Decimal(5,4)) — 호출한 쪽이 이미 비율(0~1)로 바꿔 보낸다
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return res.status(400).json({ status: 'error', message: '정률은 0~100% 사이여야 합니다.' });
    }
    rate = Math.round(rate * 10000) / 10000;
  }
  const effectiveFrom = parseDate(req.body?.effectiveFrom);
  if (!effectiveFrom) return res.status(400).json({ status: 'error', message: '적용 시작일을 입력해야 합니다.' });
  const effectiveTo = req.body?.effectiveTo ? parseDate(req.body.effectiveTo) : null;
  if (req.body?.effectiveTo && !effectiveTo) return res.status(400).json({ status: 'error', message: '적용 종료일 형식이 올바르지 않습니다.' });
  if (effectiveTo && effectiveTo <= effectiveFrom) {
    return res.status(400).json({ status: 'error', message: '적용 종료일은 적용 시작일보다 뒤여야 합니다.' });
  }
  const memo = str(req.body?.memo);
  if (memo.length > MAX_NOTE) return res.status(400).json({ status: 'error', message: `메모는 ${MAX_NOTE}자 이하여야 합니다.` });
  const partnerId = str(req.body?.partnerId) || null;

  try {
    if (partnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId }, select: { id: true } });
      if (!partner) return res.status(404).json({ status: 'error', message: '파트너를 찾을 수 없습니다.' });
    }
    const created = await prisma.$transaction(
      async (tx) => {
        // 같은 범위(파트너·기준)에 새 적용 시작과 같거나 그 뒤에 시작하는 요율이 이미 있으면 겹친다 — 거절
        const later = await tx.commissionPolicy.findFirst({ where: { partnerId, basis, effectiveFrom: { gte: effectiveFrom } }, select: { id: true } });
        if (later) return { conflict: true as const };
        // 열려 있던 이전 요율(effectiveTo가 비었거나 새 시작보다 뒤)을 새 시작일로 닫는다
        await tx.commissionPolicy.updateMany({
          where: { partnerId, basis, effectiveFrom: { lt: effectiveFrom }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveFrom } }] },
          data: { effectiveTo: effectiveFrom },
        });
        const row = await tx.commissionPolicy.create({
          data: { basis, amount, rate, partnerId, effectiveFrom, effectiveTo, memo: memo || null, createdBy: decoded.id },
          include: { partner: { select: { companyName: true } } },
        });
        return { conflict: false as const, row };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (created.conflict) {
      return res.status(409).json({ status: 'error', message: '같은 파트너·기준에 이 적용 시작일 이후로 이미 등록된 요율이 있습니다.' });
    }
    setAuditTarget(res, { action: 'CREATE', targetType: 'CommissionPolicy', targetId: created.row.id });
    return res.status(201).json({ status: 'success', data: serializePolicy(created.row) });
  } catch (error) {
    return serverError(res, '요율 등록', error);
  }
};

// 적용 종료 고치기 (`PATCH /api/admin/commission-policies/:id`) — 이력 줄에서 고칠 수 있는 유일한 칸. 잘못 넣은 요율은 이 칸으로 닫는다(삭제 없음).
export const closeCommissionPolicy = async (req: Request, res: Response) => {
  const effectiveTo = parseDate(req.body?.effectiveTo);
  if (!effectiveTo) return res.status(400).json({ status: 'error', message: '적용 종료일을 입력해야 합니다.' });
  try {
    const row = await prisma.commissionPolicy.findUnique({ where: { id: req.params.id }, select: { id: true, effectiveFrom: true } });
    if (!row) return res.status(404).json({ status: 'error', message: '요율을 찾을 수 없습니다.' });
    if (effectiveTo <= row.effectiveFrom) {
      return res.status(400).json({ status: 'error', message: '적용 종료일은 적용 시작일보다 뒤여야 합니다.' });
    }
    const updated = await prisma.commissionPolicy.update({
      where: { id: row.id },
      data: { effectiveTo },
      include: { partner: { select: { companyName: true } } },
    });
    setAuditTarget(res, { action: 'UPDATE', targetType: 'CommissionPolicy', targetId: row.id, reason: '적용 종료' });
    return res.json({ status: 'success', data: serializePolicy(updated) });
  } catch (error) {
    return serverError(res, '적용 종료 변경', error);
  }
};

// ───────────── 업체 문의 (01-05 §14-9 · §6.2 `GET/PATCH /api/admin/leads`) ─────────────
// 목록 380 + 상세. 상세 칸 = 시설 · 유형 · 신청자 · 문의 내용 · 무산 건은 무산 사유. 버튼 [무효 처리](운영자만 §4.3) · [청구 대상 확정].
// 신청자 이름·연락처는 정산 확정 후 마스킹(maskedAt)된 건이면 그 값 그대로 — 운영자가 원본을 되살리지 않는다.
export const LEAD_STATUSES = ['REQUESTED', 'NOTIFIED', 'RESPONDED', 'CONVERTED', 'LOST', 'INVALID'] as const;

export const listLeadsForAdmin = async (req: Request, res: Response) => {
  const q = str(req.query.q);
  const status = str(req.query.status);
  if (status && !(LEAD_STATUSES as readonly string[]).includes(status)) {
    return res.status(400).json({ status: 'error', message: `status는 ${LEAD_STATUSES.join(', ')} 중 하나여야 합니다.` });
  }
  const { page, pageSize, skip } = pageOf(req);
  const where: Prisma.LeadWhereInput = {
    ...(q ? { leadNo: { contains: q, mode: 'insensitive' } } : {}),
    ...(status ? { status } : {}),
  };
  try {
    const [count, rows] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        select: {
          id: true, leadNo: true, type: true, status: true, billable: true, settlementId: true, lostReason: true,
          applicantName: true, applicantPhone: true, maskedAt: true, payload: true, statusHistory: true, createdAt: true,
          facility: { select: { id: true, name: true } },
          partner: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);
    return res.json(paged(count, page, pageSize, rows.map(({ settlementId, ...r }) => ({ ...r, settled: !!settlementId }))));
  } catch (error) {
    return serverError(res, '업체 문의 조회', error);
  }
};

// 청구 대상 확정 / 무효 처리 (`PATCH /api/admin/leads/:id/billable`) — body { action: 'CONFIRM' | 'INVALID', note? }
//  · CONFIRM: 성사(CONVERTED)된 건만. billable만 켠다 — 금액(billedAmount)은 수수료 산정 기준이 정해진 뒤 정산 단계가 박는다(pending-approvals).
//  · INVALID: 허수·중복·장난(운영자만). 되돌리는 전이 없음. 이미 정산에 들어간 건은 거절.
export const updateLeadBillable = async (req: Request, res: Response) => {
  const action = str(req.body?.action);
  const note = str(req.body?.note);
  if (action !== 'CONFIRM' && action !== 'INVALID') {
    return res.status(400).json({ status: 'error', message: "action은 'CONFIRM', 'INVALID' 중 하나여야 합니다." });
  }
  if (note.length > MAX_NOTE) return res.status(400).json({ status: 'error', message: `메모는 ${MAX_NOTE}자 이하여야 합니다.` });
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, billable: true, settlementId: true, statusHistory: true },
    });
    if (!lead) return res.status(404).json({ status: 'error', message: '문의를 찾을 수 없습니다.' });
    if (lead.settlementId) return res.status(409).json({ status: 'error', message: '이미 정산에 포함된 문의는 바꿀 수 없습니다.' });

    const history = Array.isArray(lead.statusHistory) ? lead.statusHistory : [];
    if (action === 'CONFIRM') {
      if (lead.status !== 'CONVERTED') {
        return res.status(409).json({ status: 'error', message: '성사된 문의만 청구 대상으로 확정할 수 있습니다.' });
      }
      if (lead.billable) return res.status(409).json({ status: 'error', message: '이미 청구 대상으로 확정된 문의입니다.' });
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          billable: true,
          statusHistory: [...history, { status: lead.status, at: kstIso(), by: 'admin', note: note || '청구 대상 확정' }] as unknown as Prisma.InputJsonValue,
        },
      });
      setAuditTarget(res, { action: 'CONFIRM_BILLABLE', targetType: 'Lead', targetId: lead.id, reason: note || undefined });
      return res.json({ status: 'success', data: { id: lead.id, status: lead.status, billable: true } });
    }

    if (lead.status === 'INVALID') return res.status(409).json({ status: 'error', message: '이미 무효 처리된 문의입니다.' });
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'INVALID',
        billable: false,
        statusHistory: [...history, { status: 'INVALID', at: kstIso(), by: 'admin', ...(note ? { note } : {}) }] as unknown as Prisma.InputJsonValue,
      },
    });
    setAuditTarget(res, { action: 'INVALIDATE', targetType: 'Lead', targetId: lead.id, reason: note || undefined });
    return res.json({ status: 'success', data: { id: lead.id, status: 'INVALID', billable: false } });
  } catch (error) {
    return serverError(res, '문의 상태 변경', error);
  }
};

// ───────────── 전체 시설 + 소개 글 숨김 (01-05 §14-9 · §14-5 "운영자 숨김 화면 자리") ─────────────
// 목록 = 카드 격자(시설명 · 연동됨/미연동 · 종류 · 지역) + 쪽 넘김. 상세에서 소개 글과 [숨기기]/[되돌리기].
export const listFacilitiesForAdmin = async (req: Request, res: Response) => {
  const q = str(req.query.q);
  const { page, pageSize, skip } = pageOf(req, 12);
  const where: Prisma.FacilityWhereInput = q ? { name: { contains: q, mode: 'insensitive' } } : {};
  try {
    const [count, rows] = await Promise.all([
      prisma.facility.count({ where }),
      prisma.facility.findMany({
        where,
        select: { id: true, name: true, type: true, location: true, partnerId: true, introHiddenAt: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take: pageSize,
      }),
    ]);
    return res.json(paged(count, page, pageSize, rows.map(({ partnerId, ...r }) => ({ ...r, linked: !!partnerId }))));
  } catch (error) {
    return serverError(res, '시설 목록 조회', error);
  }
};

// 시설 상세 — 운영자에겐 숨긴 뒤에도 소개 글 본문이 보인다(Opus 점검 10-21 채택). 사업자 연락처는 담지 않는다.
export const getFacilityForAdmin = async (req: Request, res: Response) => {
  try {
    const f = await prisma.facility.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, type: true, location: true, partnerId: true, religion: true, guests: true, amenities: true,
        intro: true, introHiddenAt: true, introHiddenReason: true, introHiddenNote: true,
        partner: { select: { companyName: true } },
      },
    });
    if (!f) return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    const { partner, partnerId, ...rest } = f;
    return res.json({ status: 'success', data: { ...rest, linked: !!partnerId, partnerName: partner?.companyName ?? null } });
  } catch (error) {
    return serverError(res, '시설 조회', error);
  }
};

// 소개 글 숨기기 (`PATCH /api/admin/facilities/:id/intro-hide`) — 사유 코드 3개 중 하나 필수(기타 없음) + 덧붙일 말(선택). 반복 정지 판단은 사유별로 센다.
export const hideFacilityIntro = async (req: Request, res: Response) => {
  const reason = str(req.body?.reason);
  const note = str(req.body?.note);
  if (!(INTRO_HIDE_REASONS as readonly string[]).includes(reason)) {
    return res.status(400).json({ status: 'error', message: '사유를 골라야 처리할 수 있습니다.' });
  }
  if (note.length > MAX_NOTE) return res.status(400).json({ status: 'error', message: `덧붙일 말은 ${MAX_NOTE}자 이하여야 합니다.` });
  try {
    const f = await prisma.facility.findUnique({ where: { id: req.params.id }, select: { id: true, intro: true, introHiddenAt: true } });
    if (!f) return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    // 연동하지 않아 소개 글이 없는 시설은 숨길 것이 없다(구현 때 정하기로 한 부분, 01-05 §14-5 ③)
    if (!f.intro) return res.status(409).json({ status: 'error', message: '숨길 소개 글이 없습니다.' });
    if (f.introHiddenAt) return res.status(409).json({ status: 'error', message: '이미 숨긴 소개 글입니다.' });
    await prisma.facility.update({
      where: { id: f.id },
      data: { introHiddenAt: new Date(), introHiddenReason: reason, introHiddenNote: note || null },
    });
    setAuditTarget(res, { action: 'HIDE', targetType: 'Facility', targetId: f.id, reason: note ? `${reason}: ${note}` : reason });
    return res.json({ status: 'success', data: { id: f.id, introHidden: true } });
  } catch (error) {
    return serverError(res, '소개 글 숨기기', error);
  }
};

// 소개 글 되돌리기 (`PATCH /api/admin/facilities/:id/intro-unhide`) — 사유 필수(추모관 내리기/되돌리기와 같은 규칙, 00-37 §4 #3)
export const unhideFacilityIntro = async (req: Request, res: Response) => {
  const reason = str(req.body?.reason);
  if (!reason) return res.status(400).json({ status: 'error', message: '사유를 입력해야 처리할 수 있습니다.' });
  if (reason.length > MAX_NOTE) return res.status(400).json({ status: 'error', message: `사유는 ${MAX_NOTE}자 이하여야 합니다.` });
  try {
    const f = await prisma.facility.findUnique({ where: { id: req.params.id }, select: { id: true, introHiddenAt: true } });
    if (!f) return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    if (!f.introHiddenAt) return res.status(409).json({ status: 'error', message: '숨긴 소개 글이 아닙니다.' });
    await prisma.facility.update({
      where: { id: f.id },
      data: { introHiddenAt: null, introHiddenReason: null, introHiddenNote: null },
    });
    setAuditTarget(res, { action: 'UNHIDE', targetType: 'Facility', targetId: f.id, reason });
    return res.json({ status: 'success', data: { id: f.id, introHidden: false } });
  } catch (error) {
    return serverError(res, '소개 글 되돌리기', error);
  }
};
