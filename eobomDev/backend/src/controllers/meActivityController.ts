import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';

// 마이페이지 "내 활동" 목록 — 00-36 §4.4(내 상담 내역 SCR-019)·M-2 #6·#7-1. 전부 읽기 전용이다.
//
// 🔴 세 목록 모두 `where: { userId }`가 **필수**다. Lead·ConsultRequest는 **비회원 문의도 담는 테이블**이라
// 이 조건이 빠지면 남의 문의가 보인다. `userId`는 서버가 토큰에서 꺼낸 값만 쓴다(쿼리스트링·본문 불신).
//
// 🔴 응답 화이트리스트 — `select`로 **내려줄 컬럼만** 고른다(`include`·통째 반환 금지). 절대 내리지 않는 것:
// billable·billedAmount·commissionPolicyId·settlementId·disputeReason·partnerId·applicantName·
// applicantPhone·payload 원문·statusHistory. 정산·연락처는 사용자에게 뜻이 없거나 이미 본인이 아는 값이다.
// 마스킹된 건(maskedAt != null)도 본인 목록에는 남는다 — 스냅샷 필드를 애초에 안 내려서 표시가 달라지지 않는다.

// 화면에 보여주는 최대 건수. 🔴 서버는 **한 건 더**(LIST_LIMIT + 1) 읽어 내려준다 — 프런트가 101건째가 왔는지로
// "잘렸다"를 정확히 알 수 있다(00-36 §6 #9: 100건을 넘으면 목록 끝에 잘렸다는 한 줄). 정확히 100건인 사람에게
// 없는 잘림을 알리지 않기 위해서다. 프런트는 100건까지만 그린다.
const LIST_LIMIT = 100;
const SUMMARY_MAX = 60;

// 🔴 내부 상태를 그대로 보여주지 않는다 — CONVERTED·LOST·billable은 정산용이라 사용자에게 뜻이 통하지 않는다.
// 네 단계로 접는다(00-36 §4.4). 모르는 값은 '접수됨'으로 떨어뜨린다(없는 상태를 지어내지 않는다).
export type StatusGroup = 'RECEIVED' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';

const LEAD_STATUS_GROUP: Record<string, StatusGroup> = {
  REQUESTED: 'RECEIVED',
  NOTIFIED: 'RECEIVED',
  RESPONDED: 'IN_PROGRESS',
  CONVERTED: 'DONE',
  LOST: 'CLOSED',
  INVALID: 'CLOSED',
};

const CONSULT_STATUS_GROUP: Record<string, StatusGroup> = {
  REQUESTED: 'RECEIVED',
  ACCEPTED: 'IN_PROGRESS',
  COMPLETED: 'DONE',
  CANCELLED: 'CLOSED',
  INVALID: 'CLOSED',
};

const clip = (text: string): string => {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > SUMMARY_MAX ? `${t.slice(0, SUMMARY_MAX)}…` : t;
};

// payload는 원문을 내리지 않고 서버가 한 줄 요약으로 만든다(00-36 §4.4). payload에는 신청자가 적은
// 자유 입력이 들어 있을 수 있어 **알려진 키(message)만** 읽는다 — 모르는 키를 훑어 내보내지 않는다.
// (CALL은 목록에서 빼므로 여기 오지 않는다 — §4.4-1)
const summarizeLeadPayload = (payload: unknown): string => {
  const message = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).message : undefined;
  return typeof message === 'string' ? clip(message) : '';
};

// 내 업체 상담 목록 (`GET /api/me/leads`)
// 🔴 00-36 §4.4-1 — `CALL`(전화 버튼 클릭)은 **상담이 아니라 클릭**이라 뺀다. 적재 쪽(createCallEvent)이 이제
// userId를 안 남기지만 **이미 쌓인 행**이 있으므로 이 필터도 필요하다(기존 행은 지우지 않는다 — updateMany는
// 백업+CONFIRM 대상이고 조회 필터로 충분하다). 카카오톡 상담은 Lead에 얹지 않는다(같은 이유, §4.4-1).
export const listMyLeads = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const rows = await prisma.lead.findMany({
      where: { userId: decoded.id, type: { not: 'CALL' } },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT + 1,
      select: {
        leadNo: true,
        type: true,
        status: true,
        payload: true,
        thirdPartyConsentAt: true,
        createdAt: true,
        facility: { select: { name: true } },
      },
    });

    const data = rows.map((r) => ({
      no: r.leadNo,
      type: r.type, // QUOTE | CONSULT (CALL은 위 where에서 제외)
      facilityName: r.facility?.name ?? null, // null이면 화면이 "비제휴 업체"로 표시
      summary: summarizeLeadPayload(r.payload),
      statusGroup: LEAD_STATUS_GROUP[r.status] ?? 'RECEIVED',
      thirdPartyConsentAt: r.thirdPartyConsentAt,
      createdAt: r.createdAt,
    }));
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('내 업체 상담 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 내 전문가 상담 목록 (`GET /api/me/consult-requests`)
export const listMyConsultRequests = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const rows = await prisma.consultRequest.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT + 1,
      select: {
        requestNo: true,
        channel: true,
        categorySnapshot: true,
        status: true,
        content: true,
        thirdPartyConsentAt: true,
        createdAt: true,
        expert: { select: { name: true } },
      },
    });

    const data = rows.map((r) => ({
      no: r.requestNo,
      channel: r.channel, // ALIMTALK | PHONE | VIDEO | VISIT
      expertName: r.expert.name,
      category: r.categorySnapshot, // 신청 시점의 직역 스냅샷
      summary: clip(r.content),
      statusGroup: CONSULT_STATUS_GROUP[r.status] ?? 'RECEIVED',
      thirdPartyConsentAt: r.thirdPartyConsentAt,
      createdAt: r.createdAt,
    }));
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('내 전문가 상담 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 내가 남긴 방명록 (`GET /api/me/guestbook-entries`) — 00-36 M-2 #7-1. **회원으로 쓴 글만**(userId 일치).
// 비회원 글은 `userId`가 null이라 원래 잡히지 않는다. 개설자가 지웠거나(deletedByOwnerAt) 운영자가 숨긴
// (hiddenAt) 글은 더는 어디에도 보이지 않으므로 목록에서도 뺀다.
// 🔴 1차는 읽기 전용이다(00-36 §4.7). 내 글 삭제는 허용으로 확정됐지만(§6 #8) `deletedByAuthorAt` 컬럼이
// 필요한 스키마 변경이라 M-3 마이그레이션에 묶는다 — 그때 `DELETE /api/me/guestbook-entries/:id`를 따로 둔다.
// 기존 개설자용 `DELETE /api/memorials/:id/guestbook/:gid`와 **같은 엔드포인트를 쓰지 않는다**(권한 판정이 섞인다).
export const listMyGuestbookEntries = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const rows = await prisma.memorialGuestbook.findMany({
      where: { userId: decoded.id, deletedByOwnerAt: null, hiddenAt: null },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT + 1,
      select: {
        id: true,
        message: true,
        relationToDeceased: true,
        createdAt: true,
        memorial: { select: { slug: true, deceasedName: true, closedAt: true } },
      },
    });

    const data = rows.map((r) => ({
      id: r.id,
      message: r.message,
      relationToDeceased: r.relationToDeceased,
      createdAt: r.createdAt,
      memorial: { slug: r.memorial.slug, deceasedName: r.memorial.deceasedName, isClosed: r.memorial.closedAt !== null },
    }));
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('내 방명록 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};
