import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { issueInviteToken } from './familyDesignationController';
import { computeDeadlines } from '../utils/operatingHours';
import { normalizePhone, isValidPhoneLength } from '../utils/phone';

// docs 00-41 §4·§8·§9 — 사후 개봉 요청(유족)·요청 취소·본인 배너·사망 뒤 재초대. 인증은 컨트롤러 내부
// verifyBearerToken 패턴(endingNoteController와 같다). 🔴 운영자 쪽은 deathVerificationAdminController.ts —
// 두 쪽이 서로의 select를 공유하지 않는다(운영자 응답에 본문·섹션 제목·편지가 섞이지 않게 파일을 나눴다).
// 🔴 이 파일은 EndingNoteEntry 본문을 읽지 않는다 — 개봉 뒤 가족이 읽는 경로는 endingNoteController.family-view뿐이다.

// 반려 사유 코드 → 화면 문장(§8.2 "코드 → 정해진 문장"). 자유 서술은 받지 않는다.
export const REJECT_REASON_TEXT: Record<string, string> = {
  HALL_NOT_FOUND: '입력하신 장례식장에서 확인되지 않았습니다.',
  NAME_MISMATCH: '고인 성함이 확인한 내용과 맞지 않았습니다.',
  UNREACHABLE: '장례식장과 연락이 닿지 않았습니다.',
  OTHER: '확인하지 못했습니다. 대표번호로 문의해 주세요.',
};
export const REJECT_REASON_CODES = Object.keys(REJECT_REASON_TEXT);

const MAX_NAME_LENGTH = 50;
const MAX_HALL_NAME_LENGTH = 100;

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

// 유족 화면용 요청 모양. 🔴 dueAt(처리 기준 시각, 10-02 내부 기준으로 변경)·targetAt(내부 목표)·장례식장 전화·운영자 id는 내보내지 않는다.
const serializeForFamily = (
  r: {
    id: string;
    status: string;
    deceasedName: string;
    deathDate: Date;
    funeralHallName: string | null;
    requestedAt: Date;
    reviewedAt: Date | null;
    rejectReason: string | null;
    subject: { name: string };
  },
  isMine: boolean
) => ({
  id: r.id,
  status: r.status,
  ownerName: r.subject.name,
  deceasedName: r.deceasedName,
  deathDate: r.deathDate,
  funeralHallName: r.funeralHallName,
  requestedAt: r.requestedAt,
  reviewedAt: r.reviewedAt,
  rejectReason: r.rejectReason,
  rejectReasonText: r.rejectReason ? REJECT_REASON_TEXT[r.rejectReason] ?? REJECT_REASON_TEXT.OTHER : null,
  isMine,
  canCancel: isMine && r.status === 'REQUESTED',
});

const familyRequestSelect = {
  id: true,
  status: true,
  deceasedName: true,
  deathDate: true,
  funeralHallName: true,
  requestedAt: true,
  reviewedAt: true,
  rejectReason: true,
  requestedByDesigId: true,
  subject: { select: { name: true } },
} as const;

// 요청 생성 (`POST /api/ending-note/release-requests`) — §9. 요청자 = 해당 FamilyDesignation의
// acceptedUserId 본인 + ACCEPTED. 🔴 클라이언트가 보낸 상태·시각은 무시하고 dueAt·targetAt은 서버가 계산한다.
export const createReleaseRequest = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  const body = req.body as {
    designationId?: string;
    deceasedName?: string;
    deathDate?: string;
    funeralHallName?: string | null;
    funeralHallPhone?: string | null;
    noFuneralHall?: boolean;
  };

  try {
    const deceasedName = (body.deceasedName ?? '').trim();
    if (!body.designationId) throw new HttpError(400, '요청할 분을 선택해 주세요.');
    if (!deceasedName || deceasedName.length > MAX_NAME_LENGTH) throw new HttpError(400, '고인 성함을 입력해 주세요.');

    const deathDate = body.deathDate ? new Date(body.deathDate) : null;
    // 돌아가신 날은 미래일 수 없다. 시차로 오늘 날짜가 걸리지 않게 하루 여유를 둔다.
    if (!deathDate || Number.isNaN(deathDate.getTime()) || deathDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw new HttpError(400, '돌아가신 날을 확인해 주세요.');
    }

    // 장례식장: 이름·전화 둘 다 받거나(확인용 전화번호), [장례식장 없음]을 명시해야 한다.
    let funeralHallName: string | null = null;
    let funeralHallPhone: string | null = null;
    if (!body.noFuneralHall) {
      funeralHallName = (body.funeralHallName ?? '').trim();
      funeralHallPhone = normalizePhone(body.funeralHallPhone ?? '');
      if (!funeralHallName || funeralHallName.length > MAX_HALL_NAME_LENGTH) throw new HttpError(400, '장례식장 이름을 입력해 주세요.');
      if (!isValidPhoneLength(funeralHallPhone)) throw new HttpError(400, '장례식장 전화번호를 확인해 주세요.');
    }

    // 요청자 검증 — 없는 지정과 남의 지정을 같은 메시지로 응답한다.
    const designation = await prisma.familyDesignation.findUnique({
      where: { id: body.designationId },
      select: {
        id: true,
        userId: true,
        status: true,
        acceptedUserId: true,
        user: { select: { purgedAt: true, endingNote: { select: { id: true, status: true } } } },
      },
    });
    if (!designation || designation.status !== 'ACCEPTED' || designation.acceptedUserId !== decoded.id || designation.user.purgedAt) {
      throw new HttpError(404, '가족 지정을 찾을 수 없습니다.');
    }
    const note = designation.user.endingNote;
    if (!note) throw new HttpError(400, '열어볼 기록이 없습니다.');
    if (note.status === 'RELEASED') throw new HttpError(409, '이미 열려 있습니다.');

    // 🔴 한 회원에 진행 중(REQUESTED)이거나 이미 VERIFIED인 요청은 하나뿐 — 확인과 생성을 한 Serializable
    // 트랜잭션에 묶어 두 유족이 동시에 누르는 경우에도 하나만 남긴다(부분 유니크 인덱스는 Prisma가 표현하지 못한다).
    const now = new Date();
    const { dueAt, targetAt } = computeDeadlines(now);
    const created = await prisma.$transaction(
      async (tx) => {
        const active = await tx.deathVerification.findFirst({
          where: { subjectUserId: designation.userId, status: { in: ['REQUESTED', 'VERIFIED'] } },
          select: { id: true },
        });
        if (active) throw new HttpError(409, '이미 진행 중인 요청이 있습니다.');
        return tx.deathVerification.create({
          data: {
            subjectUserId: designation.userId,
            requestedByDesigId: designation.id,
            deceasedName,
            deathDate,
            funeralHallName,
            funeralHallPhone,
            requestedAt: now,
            dueAt,
            targetAt,
          },
          select: familyRequestSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return res.status(201).json({ status: 'success', data: serializeForFamily(created, true) });
  } catch (error) {
    // 동시 요청이 직렬화 충돌로 밀려난 경우 — 사용자에게는 "이미 진행 중"과 같은 뜻이다.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return res.status(409).json({ status: 'error', message: '이미 진행 중인 요청이 있습니다.' });
    }
    return send(res, error, '사후 개봉 요청 생성 실패:');
  }
};

// 내가 ACCEPTED인 모든 분의 요청 상태 (`GET /api/ending-note/release-requests/mine`) — §9. 분마다 가장 최근 1건.
export const listMyReleaseRequests = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const mine = await prisma.familyDesignation.findMany({
      where: { acceptedUserId: decoded.id, status: 'ACCEPTED' },
      select: { id: true, userId: true },
    });
    if (mine.length === 0) return res.json({ status: 'success', data: [] });

    const myDesignationIds = new Set(mine.map((d) => d.id));
    const rows = await prisma.deathVerification.findMany({
      where: { subjectUserId: { in: mine.map((d) => d.userId) } },
      orderBy: { requestedAt: 'desc' },
      select: { ...familyRequestSelect, subjectUserId: true },
    });

    const latestBySubject = new Map<string, (typeof rows)[number]>();
    for (const r of rows) if (!latestBySubject.has(r.subjectUserId)) latestBySubject.set(r.subjectUserId, r);

    // 화면(FamilySharedPage)은 family-view 항목(designationId)과 짝짓는다 — 회원 id는 내보내지 않는다.
    const myDesignationBySubject = new Map(mine.map((d) => [d.userId, d.id]));
    const data = [...latestBySubject.values()].map(({ subjectUserId, ...r }) => ({
      designationId: myDesignationBySubject.get(subjectUserId)!,
      ...serializeForFamily(r, myDesignationIds.has(r.requestedByDesigId)),
    }));
    return res.json({ status: 'success', data });
  } catch (error) {
    return send(res, error, '사후 개봉 요청 목록 조회 실패:');
  }
};

// 요청 취소 — 요청한 유족만(§9). REQUESTED일 때만.
export const cancelReleaseRequest = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const row = await prisma.deathVerification.findUnique({
      where: { id: req.params.id },
      select: { status: true, requestedBy: { select: { acceptedUserId: true, status: true } } },
    });
    if (!row || row.requestedBy.status !== 'ACCEPTED' || row.requestedBy.acceptedUserId !== decoded.id) {
      throw new HttpError(404, '요청을 찾을 수 없습니다.');
    }
    if (row.status !== 'REQUESTED') throw new HttpError(409, '취소할 수 있는 상태가 아닙니다.');

    // 확인 처리와 겹쳐도 안전하도록 상태 조건을 걸어 갱신한다.
    const r = await prisma.deathVerification.updateMany({
      where: { id: req.params.id, status: 'REQUESTED' },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'REQUESTER' },
    });
    if (r.count !== 1) throw new HttpError(409, '취소할 수 있는 상태가 아닙니다.');
    return res.json({ status: 'success', data: null });
  } catch (error) {
    return send(res, error, '사후 개봉 요청 취소 실패:');
  }
};

// 본인 배너 (`GET /api/ending-note/release-requests/about-me`) — §8.3. 진행 중(REQUESTED)이거나 이미 열린(VERIFIED)
// 요청 하나, 없으면 null. 🔴 로그인만으로 자동 취소하지 않는다 — 취소는 아래 별도 호출뿐.
export const getReleaseRequestAboutMe = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const row = await prisma.deathVerification.findFirst({
      where: { subjectUserId: decoded.id, status: { in: ['REQUESTED', 'VERIFIED'] } },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        reviewedAt: true,
        requestedBy: { select: { name: true, relationship: true, relationshipEtc: true } },
      },
    });
    return res.json({
      status: 'success',
      data: row && {
        id: row.id,
        status: row.status,
        requestedAt: row.requestedAt,
        reviewedAt: row.reviewedAt,
        requesterName: row.requestedBy.name,
        requesterRelationship: row.requestedBy.relationship,
        requesterRelationshipEtc: row.requestedBy.relationshipEtc,
        canCancel: row.status === 'REQUESTED',
      },
    });
  } catch (error) {
    return send(res, error, '본인 배너 조회 실패:');
  }
};

// 본인 취소 (`POST /api/ending-note/release-requests/:id/cancel-by-subject`) — REQUESTED일 때만. 이미 VERIFIED면
// 취소하지 못한다(되돌리기는 개발자 수동 처리, §7.2).
export const cancelReleaseRequestBySubject = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const row = await prisma.deathVerification.findUnique({
      where: { id: req.params.id },
      select: { status: true, subjectUserId: true },
    });
    if (!row || row.subjectUserId !== decoded.id) throw new HttpError(404, '요청을 찾을 수 없습니다.');
    if (row.status !== 'REQUESTED') throw new HttpError(409, '취소할 수 있는 상태가 아닙니다.');

    const r = await prisma.deathVerification.updateMany({
      where: { id: req.params.id, subjectUserId: decoded.id, status: 'REQUESTED' },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'SUBJECT' },
    });
    if (r.count !== 1) throw new HttpError(409, '취소할 수 있는 상태가 아닙니다.');
    return res.json({ status: 'success', data: null });
  } catch (error) {
    return send(res, error, '본인 취소 실패:');
  }
};

// ─────────────────────────────────────────────────────────────────
// §7.3 사망 뒤에 수락하는 가족 — 열린(VERIFIED) 요청에 한해, 이미 수락한 유족만.
// ─────────────────────────────────────────────────────────────────

// 호출자가 그 요청의 회원(subject)에게 ACCEPTED된 유족인지 확인하고 subject id를 돌려준다. 🔴 VERIFIED 이후만.
const assertAcceptedFamilyOfVerified = async (verificationId: string, userId: string): Promise<string> => {
  const dv = await prisma.deathVerification.findUnique({
    where: { id: verificationId },
    select: { status: true, subjectUserId: true },
  });
  if (!dv) throw new HttpError(404, '요청을 찾을 수 없습니다.');
  const me = await prisma.familyDesignation.findFirst({
    where: { userId: dv.subjectUserId, acceptedUserId: userId, status: 'ACCEPTED' },
    select: { id: true },
  });
  if (!me) throw new HttpError(404, '요청을 찾을 수 없습니다.');
  if (dv.status !== 'VERIFIED') throw new HttpError(409, '아직 열리지 않았습니다.');
  return dv.subjectUserId;
};

// 아직 수락하지 않은 가족 (`GET …/release-requests/:id/pending-family`) — 이름·관계만. 🔴 전화번호·이메일·토큰을
// 내보내지 않는다. 생전에 거절(DECLINED)한 가족은 그 가족의 의사이므로 제외한다.
export const listPendingFamily = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const subjectUserId = await assertAcceptedFamilyOfVerified(req.params.id, decoded.id);
    const rows = await prisma.familyDesignation.findMany({
      where: { userId: subjectUserId, status: { in: ['PENDING', 'EXPIRED'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, relationship: true, relationshipEtc: true, status: true, inviteToken: true, tokenExpiresAt: true },
    });
    const now = Date.now();
    return res.json({
      status: 'success',
      data: rows.map((d) => ({
        designationId: d.id,
        name: d.name,
        relationship: d.relationship,
        relationshipEtc: d.relationshipEtc,
        linkExpired: !d.inviteToken || (d.tokenExpiresAt !== null && d.tokenExpiresAt.getTime() < now),
      })),
    });
  } catch (error) {
    return send(res, error, '미수락 가족 조회 실패:');
  }
};

// 초대 링크 다시 만들기 (`POST …/release-requests/:id/pending-family/:desigId/reinvite`) — 토큰 발급은 본인 초대와
// 같은 로직(issueInviteToken), 권한만 "그 회원의 VERIFIED 요청에 속한 ACCEPTED 유족"으로 넓혔다(§7.3).
export const reinvitePendingFamily = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const subjectUserId = await assertAcceptedFamilyOfVerified(req.params.id, decoded.id);
    // 그 회원이 지정한 가족이고, 아직 수락하지 않은 상태(PENDING·EXPIRED)일 때만. DECLINED·ACCEPTED·DRAFT는 대상이 아니다.
    const target = await prisma.familyDesignation.findFirst({
      where: { id: req.params.desigId, userId: subjectUserId, status: { in: ['PENDING', 'EXPIRED'] } },
      select: { id: true },
    });
    if (!target) throw new HttpError(404, '초대를 다시 만들 수 있는 가족이 아닙니다.');

    const updated = await issueInviteToken(target.id);
    return res.json({
      status: 'success',
      data: { inviteToken: updated.inviteToken, tokenExpiresAt: updated.tokenExpiresAt },
    });
  } catch (error) {
    return send(res, error, '사후 재초대 실패:');
  }
};
