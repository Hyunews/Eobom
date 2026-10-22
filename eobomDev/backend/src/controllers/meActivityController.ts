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
        contextType: true,
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
      contextType: r.contextType, // PRE_DEATH | POST_DEATH (02-04 §5)
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
// (hiddenAt) 글, 작성자 본인이 지운(deletedByAuthorAt) 글은 더는 어디에도 보이지 않으므로 목록에서도 뺀다.
// 내 글 삭제는 아래 `deleteMyGuestbookEntry`(M-3 마이그레이션의 `deletedByAuthorAt`) — 개설자용
// `DELETE /api/memorials/:id/guestbook/:gid`와 **같은 엔드포인트를 쓰지 않는다**(권한 판정이 섞인다).
export const listMyGuestbookEntries = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const rows = await prisma.memorialGuestbook.findMany({
      where: { userId: decoded.id, deletedByOwnerAt: null, hiddenAt: null, deletedByAuthorAt: null },
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

// 헌화·방명록을 남긴 추모관 (`GET /api/me/visited-memorials`) — 00-36 §4.8-1 세 번째 구간 · 05-01 §4.2. 읽기 전용, 스키마 변경 없음.
// 🔴 where에 로그인한 사용자(userId) 조건이 필수다 — 헌화·방명록 둘 다 비회원 행(userId null)이 섞여 있다. 토큰에서 꺼낸 값만 쓴다.
// 대상 = **로그인한 채** 헌화했거나 방명록을 쓴 **남의** 추모관(내가 만든 추모관은 뺀다) 중 **지금 열리는 것만**:
// 비공개(PRIVATE)·닫힘(closedAt)·운영자 내림(hiddenAt)은 뺀다 — 눌러도 "찾을 수 없음"이 나오는 줄을 만들지 않고, 남의 추모관이
// 닫혔다는 사실도 알리지 않으려는 것(findViewableMemorialBySlug와 같은 판정). 동결(frozenAt)은 열리므로 넣는다. 파기된 추모관은 행이 없다.
// 방명록은 §4.7과 같은 규칙 — 상주 삭제·운영자 숨김·본인 삭제한 글은 "방명록"으로 치지 않는다(헌화만 남은 것으로 본다).
// 🔴 응답 화이트리스트 — slug·고인 성함·남긴 것·마지막 날짜만. 다른 조문객의 글·개설자 정보는 내리지 않는다(05-01 §4.1 취지).
const VISITED_SCAN_LIMIT = 500; // 한 사람이 남긴 헌화·방명록을 합칠 때 읽는 상한(각각) — 지나치게 많은 사람도 한 번에 끝나게
const openMemorialWhere = (userId: string) => ({
  closedAt: null,
  hiddenAt: null,
  visibility: { not: 'PRIVATE' },
  createdByUserId: { not: userId },
});

export const listMyVisitedMemorials = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const userId = decoded.id;
    const [tributes, entries] = await Promise.all([
      prisma.memorialTribute.findMany({
        where: { userId, memorial: openMemorialWhere(userId) },
        orderBy: { createdAt: 'desc' },
        take: VISITED_SCAN_LIMIT,
        select: { createdAt: true, memorial: { select: { id: true, slug: true, deceasedName: true } } },
      }),
      prisma.memorialGuestbook.findMany({
        where: { userId, deletedByOwnerAt: null, hiddenAt: null, deletedByAuthorAt: null, memorial: openMemorialWhere(userId) },
        orderBy: { createdAt: 'desc' },
        take: VISITED_SCAN_LIMIT,
        select: { createdAt: true, memorial: { select: { id: true, slug: true, deceasedName: true } } },
      }),
    ]);

    // 추모관 하나로 합친다 — 남긴 것(헌화·방명록 각각 했는지)과 마지막으로 남긴 날(둘 중 늦은 것).
    const byMemorial = new Map<string, { slug: string; deceasedName: string; tributed: boolean; wrote: boolean; lastAt: Date }>();
    const touch = (m: { id: string; slug: string; deceasedName: string }, at: Date, kind: 'tributed' | 'wrote') => {
      const cur = byMemorial.get(m.id) ?? { slug: m.slug, deceasedName: m.deceasedName, tributed: false, wrote: false, lastAt: at };
      cur[kind] = true;
      if (at > cur.lastAt) cur.lastAt = at;
      byMemorial.set(m.id, cur);
    };
    tributes.forEach((t) => touch(t.memorial, t.createdAt, 'tributed'));
    entries.forEach((e) => touch(e.memorial, e.createdAt, 'wrote'));

    const data = Array.from(byMemorial.values())
      .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
      .slice(0, LIST_LIMIT + 1) // 목록 상한 규칙은 위 세 목록과 같다(한 건 더 내려 프런트가 잘림을 안다)
      .map((v) => ({
        slug: v.slug,
        deceasedName: v.deceasedName,
        tributed: v.tributed,
        wrote: v.wrote,
        lastAt: v.lastAt,
      }));
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('헌화·방명록을 남긴 추모관 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 내 방명록 글 삭제 (`DELETE /api/me/guestbook-entries/:id`) — 00-36 §4.7-1(§6 #8 확정: 허용, **소프트 삭제**).
// 🔴 행을 지우지 않는다: `deletedByAuthorAt`만 찍는다(이 테이블은 deletedByOwnerAt·hiddenAt도 원문을 보존한다 —
// 본인 삭제만 하드 삭제로 두면 혼자 다른 규칙이 된다). deletedByOwnerAt을 재사용하지 않는다("상주가 지웠다"로 오염).
// 🔴 소유 판정은 서버가 토큰에서 꺼낸 userId 일치로만 한다. 없는 글·남의 글·이미 지운 글을 **같은 404**로 답해
// 다른 사람 글의 존재 여부를 알리지 않는다. 갱신은 검증한 id 한 건에만 건다(where: { id }).
export const deleteMyGuestbookEntry = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const entry = await prisma.memorialGuestbook.findFirst({
      where: { id: req.params.id, userId: decoded.id, deletedByAuthorAt: null },
      select: { id: true },
    });
    if (!entry) {
      return res.status(404).json({ status: 'error', message: '삭제할 글을 찾을 수 없습니다.' });
    }
    await prisma.memorialGuestbook.update({ where: { id: entry.id }, data: { deletedByAuthorAt: new Date() } });
    return res.json({ status: 'success', data: { id: entry.id } });
  } catch (error) {
    console.error('내 방명록 글 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '삭제 처리 중 오류가 발생했습니다.' });
  }
};
