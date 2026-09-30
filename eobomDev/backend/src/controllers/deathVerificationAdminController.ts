import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import { decryptField } from '../utils/crypto';
import { REJECT_REASON_CODES } from './deathVerificationController';

// docs 00-41 §5.3·§9 — 운영자 「사망 확인」. 라우터 레벨 requireAdminAuth를 이미 통과한 뒤에 온다.
// 🔴 응답 어디에도 엔딩노트 본문·섹션 제목·섹션 작성 여부(sectionState)·편지를 넣지 않는다(06-03 §3.1) —
// 그래서 EndingNote·EndingNoteEntry·FarewellMessage를 select/include 하지 않는다. 필드는 전부 select로 적는다.
// 🔴 감사 로그: 상세 열람 = VIEW, 확인 = APPROVE, 반려 = REJECT (targetType = DeathVerification).

const TARGET_TYPE = 'DeathVerification';
const VERIFY_METHODS = ['FUNERAL_HALL', 'OTHER'];

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const send = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof HttpError) return res.status(error.status).json({ status: 'error', message: error.message });
  console.error(fallback, error);
  return res.status(500).json({ status: 'error', message: '처리 중 오류가 발생했습니다.' });
};

// 목록·상세 공통 필드. 요청자 전화번호는 상세에서만(열람이 VIEW로 기록되는 자리).
const baseSelect = {
  id: true,
  status: true,
  requestedAt: true,
  dueAt: true,
  targetAt: true,
  deceasedName: true,
  deathDate: true,
  funeralHallName: true,
  funeralHallPhone: true,
  subject: { select: { name: true } },
  requestedBy: { select: { name: true, relationship: true, relationshipEtc: true } },
} as const;

// 목록 (`GET /api/admin/death-verifications`) — REQUESTED만, dueAt 오래된 순. 대기 건수 = data.length.
// 지연 표시(§5.1): 내부 목표(targetAt)를 넘으면 overTarget(노랑), 대외 약속(dueAt)을 넘으면 overDue(빨강).
export const listDeathVerifications = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.deathVerification.findMany({
      where: { status: 'REQUESTED' },
      orderBy: { dueAt: 'asc' },
      select: baseSelect,
    });
    const now = new Date();
    return res.json({
      status: 'success',
      data: {
        serverNow: now,
        pendingCount: rows.length,
        items: rows.map((r) => ({
          id: r.id,
          status: r.status,
          requestedAt: r.requestedAt,
          dueAt: r.dueAt,
          targetAt: r.targetAt,
          overTarget: now.getTime() > r.targetAt.getTime(),
          overDue: now.getTime() > r.dueAt.getTime(),
          deceasedName: r.deceasedName,
          deathDate: r.deathDate,
          memberName: r.subject.name,
          funeralHallName: r.funeralHallName,
          funeralHallPhone: r.funeralHallPhone,
          requesterName: r.requestedBy.name,
          requesterRelationship: r.requestedBy.relationship,
          requesterRelationshipEtc: r.requestedBy.relationshipEtc,
        })),
      },
    });
  } catch (error) {
    return send(res, error, '사망 확인 목록 조회 실패:');
  }
};

// 상세 (`GET /api/admin/death-verifications/:id`) — 되걸기용 요청자 전화번호(phoneEnc 복호화)를 여는 자리라 VIEW를 남긴다.
export const getDeathVerification = async (req: Request, res: Response) => {
  try {
    const r = await prisma.deathVerification.findUnique({
      where: { id: req.params.id },
      select: {
        ...baseSelect,
        level: true,
        method: true,
        reviewedAt: true,
        rejectReason: true,
        cancelledAt: true,
        cancelledBy: true,
        requestedBy: { select: { name: true, relationship: true, relationshipEtc: true, phoneEnc: true } },
      },
    });
    if (!r) throw new HttpError(404, '요청을 찾을 수 없습니다.');

    // 기록 실패가 조회를 막지는 않는다(adminController.getUserDetailForAdmin과 같은 선례).
    try {
      const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증
      await prisma.adminAuditLog.create({
        data: { adminId: decoded.id, adminName: decoded.name, action: 'VIEW', targetType: TARGET_TYPE, targetId: r.id },
      });
    } catch (auditError) {
      console.error('사망 확인 상세 열람 감사로그 기록 실패:', auditError);
    }

    let requesterPhone: string | null = null;
    try {
      requesterPhone = decryptField(r.requestedBy.phoneEnc);
    } catch (decryptError) {
      console.error('요청자 전화번호 복호화 실패:', decryptError);
    }

    const now = new Date();
    return res.json({
      status: 'success',
      data: {
        id: r.id,
        status: r.status,
        requestedAt: r.requestedAt,
        dueAt: r.dueAt,
        targetAt: r.targetAt,
        overTarget: r.status === 'REQUESTED' && now.getTime() > r.targetAt.getTime(),
        overDue: r.status === 'REQUESTED' && now.getTime() > r.dueAt.getTime(),
        deceasedName: r.deceasedName,
        deathDate: r.deathDate,
        memberName: r.subject.name,
        funeralHallName: r.funeralHallName,
        funeralHallPhone: r.funeralHallPhone,
        requesterName: r.requestedBy.name,
        requesterRelationship: r.requestedBy.relationship,
        requesterRelationshipEtc: r.requestedBy.relationshipEtc,
        requesterPhone,
        level: r.level,
        method: r.method,
        reviewedAt: r.reviewedAt,
        rejectReason: r.rejectReason,
        cancelledAt: r.cancelledAt,
        cancelledBy: r.cancelledBy,
      },
    });
  } catch (error) {
    return send(res, error, '사망 확인 상세 조회 실패:');
  }
};

// 확인 완료 (`PATCH /api/admin/death-verifications/:id/verify` {method}) — §7.2.
// 🔴 VERIFIED + EndingNote.RELEASED + 감사 로그(APPROVE)를 **한 트랜잭션**에서 기록한다. OTHER는 SUPERADMIN만(§5.2).
export const verifyDeathVerification = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증
  const { method } = req.body as { method?: string };

  try {
    if (!method || !VERIFY_METHODS.includes(method)) throw new HttpError(400, '확인 방법을 선택해 주세요.');
    if (method === 'OTHER') {
      // 등급은 토큰이 아니라 DB에서 읽는다 — 계정 등급이 바뀐 직후에도 옛 토큰으로 넘어가지 못하게.
      const admin = await prisma.admin.findUnique({ where: { id: decoded.id }, select: { role: true } });
      if (admin?.role !== 'SUPERADMIN') throw new HttpError(403, '이 확인 방법은 최고 관리자만 사용할 수 있습니다.');
    }

    await prisma.$transaction(async (tx) => {
      const dv = await tx.deathVerification.findUnique({
        where: { id: req.params.id },
        select: { status: true, subjectUserId: true, funeralHallName: true },
      });
      if (!dv) throw new HttpError(404, '요청을 찾을 수 없습니다.');
      if (dv.status !== 'REQUESTED') throw new HttpError(409, '처리할 수 있는 상태가 아닙니다.');
      if (method === 'FUNERAL_HALL' && !dv.funeralHallName) {
        throw new HttpError(400, '장례식장 정보가 없는 요청입니다. 다른 확인 방법을 사용해 주세요.');
      }

      const note = await tx.endingNote.findUnique({ where: { userId: dv.subjectUserId }, select: { id: true, status: true } });
      if (!note) throw new HttpError(409, '열 엔딩노트가 없습니다.');
      if (note.status === 'FROZEN') throw new HttpError(409, '동결된 엔딩노트입니다.');

      const now = new Date();
      // 상태 조건을 걸어 갱신 — 같은 요청을 두 운영자가 동시에 처리해도 하나만 통과한다.
      const updated = await tx.deathVerification.updateMany({
        where: { id: req.params.id, status: 'REQUESTED' },
        data: { status: 'VERIFIED', level: 'OPERATOR_REVIEWED', method, reviewedByAdminId: decoded.id, reviewedAt: now },
      });
      if (updated.count !== 1) throw new HttpError(409, '처리할 수 있는 상태가 아닙니다.');

      await tx.endingNote.update({
        where: { id: note.id },
        data: { status: 'RELEASED', ...(note.status === 'RELEASED' ? {} : { releasedAt: now }) },
        select: { id: true },
      });
      await tx.adminAuditLog.create({
        data: { adminId: decoded.id, adminName: decoded.name, action: 'APPROVE', targetType: TARGET_TYPE, targetId: req.params.id, reason: method },
      });
    });

    return res.json({ status: 'success', data: null });
  } catch (error) {
    return send(res, error, '사망 확인 처리 실패:');
  }
};

// 반려 (`PATCH /api/admin/death-verifications/:id/reject` {reasonCode}) — 사유는 코드만, 자유 서술 없음. 다시 요청 가능.
export const rejectDeathVerification = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증
  const { reasonCode } = req.body as { reasonCode?: string };

  try {
    if (!reasonCode || !REJECT_REASON_CODES.includes(reasonCode)) throw new HttpError(400, '반려 사유를 선택해 주세요.');

    await prisma.$transaction(async (tx) => {
      const updated = await tx.deathVerification.updateMany({
        where: { id: req.params.id, status: 'REQUESTED' },
        data: { status: 'REJECTED', rejectReason: reasonCode, reviewedByAdminId: decoded.id, reviewedAt: new Date() },
      });
      if (updated.count !== 1) {
        const exists = await tx.deathVerification.findUnique({ where: { id: req.params.id }, select: { id: true } });
        throw exists ? new HttpError(409, '처리할 수 있는 상태가 아닙니다.') : new HttpError(404, '요청을 찾을 수 없습니다.');
      }
      await tx.adminAuditLog.create({
        data: { adminId: decoded.id, adminName: decoded.name, action: 'REJECT', targetType: TARGET_TYPE, targetId: req.params.id, reason: reasonCode },
      });
    });

    return res.json({ status: 'success', data: null });
  } catch (error) {
    return send(res, error, '사망 확인 반려 실패:');
  }
};
