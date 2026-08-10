import { Prisma } from '@prisma/client';
import { POLICY } from '../config/policy';

// 리드(Lead) 생성 공통 로직. docs/01_장례_묘지_매칭/16_...명세서.md §4를 그대로 구현한다.
// 반드시 트랜잭션(tx) 안에서 호출한다 — leadNo 발번(§4.2)과 리드 생성이 원자적이어야 하고,
// BOOKING 타입은 FacilityBooking 생성과도 같은 트랜잭션이어야 한다(§5.3).

type TxClient = Prisma.TransactionClient;

export type LeadType = 'QUOTE' | 'BOOKING' | 'CONSULT' | 'CALL';

// 개인정보를 동반하는 유형만 동의가 필요하다. CALL은 익명 이벤트라 대상이 아니다(§4.1, §7.1).
const PII_LEAD_TYPES: ReadonlySet<LeadType> = new Set(['QUOTE', 'BOOKING', 'CONSULT']);

export class ConsentRequiredError extends Error {
  constructor() {
    super('개인정보 제3자 제공 동의가 필요합니다.');
    this.name = 'ConsentRequiredError';
  }
}

export class FacilityNotFoundError extends Error {
  constructor() {
    super('시설을 찾을 수 없습니다.');
    this.name = 'FacilityNotFoundError';
  }
}

const pad = (n: number, len: number) => String(n).padStart(len, '0');

// 'YYMMDD' — 프로젝트 표준 2자리 연도 표기(다른 문서 날짜 형식과 통일)
const dateKeyOf = (d: Date): string => {
  const yy = d.getFullYear() % 100;
  return `${pad(yy, 2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
};

// 일자별 원자적 증가값으로 leadNo 발번 (§4.2). Prisma upsert의 increment는 Postgres 행 잠금으로
// 컴파일되어 동시 요청에서도 안전하다 — Lead.leadNo @unique 제약과 이중 방어.
export const nextLeadNo = async (tx: TxClient, now: Date = new Date()): Promise<string> => {
  const dateKey = dateKeyOf(now);
  const counter = await tx.leadNumberCounter.upsert({
    where: { dateKey },
    create: { dateKey, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return `${POLICY.lead.numberPrefix}-${dateKey}-${pad(counter.seq, 4)}`;
};

// 개인정보 제3자 제공 동의 고지 (§7.1 4개 항목). 동의 시점의 문구를 통째로 스냅샷 저장해서,
// 나중에 문구가 바뀌어도 "그때 무엇에 동의했는지"를 증명할 수 있게 한다.
interface ConsentNotice {
  noticeVersion: string;
  providedTo: string;
  purpose: string;
  items: string[];
  retention: string;
}

const buildConsentNotice = (facilityName: string, hasPartner: boolean): ConsentNotice => ({
  noticeVersion: '2026-08-10',
  providedTo: hasPartner ? `${facilityName} (이어봄 제휴 사업자)` : '이어봄 상담원 (비제휴 시설 — 사업자에게 직접 전달하지 않음, §7.2)',
  purpose: '견적 안내 및 답사 예약 연락',
  items: ['이름', '연락처', '요청 내용(희망일시·규모 등)'],
  retention: '목적 달성 후 파기 — 정산 확정 시 마스킹 처리(§7.3)',
});

interface CreateLeadInput {
  type: LeadType;
  facilityId: string;
  userId?: string | null;
  applicantName?: string | null;
  applicantPhone?: string | null;
  payload: Record<string, unknown>;
  thirdPartyConsent: boolean;
}

export const createLead = async (tx: TxClient, input: CreateLeadInput) => {
  const requiresConsent = PII_LEAD_TYPES.has(input.type);
  if (requiresConsent && !input.thirdPartyConsent) {
    throw new ConsentRequiredError();
  }

  const facility = await tx.facility.findUnique({
    where: { id: input.facilityId },
    select: { id: true, name: true, partnerId: true },
  });
  if (!facility) {
    throw new FacilityNotFoundError();
  }

  const leadNo = await nextLeadNo(tx);
  const now = new Date();

  return tx.lead.create({
    data: {
      leadNo,
      type: input.type,
      facilityId: facility.id,
      partnerId: facility.partnerId, // §3.4 SSOT — Facility.partnerId를 그대로 따라간다
      userId: input.userId ?? null,
      applicantName: requiresConsent ? input.applicantName ?? null : null,
      applicantPhone: requiresConsent ? input.applicantPhone ?? null : null,
      payload: input.payload as Prisma.InputJsonValue,
      thirdPartyConsentAt: requiresConsent ? now : null,
      consentSnapshot: requiresConsent
        ? (buildConsentNotice(facility.name, Boolean(facility.partnerId)) as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      statusHistory: [
        { status: 'REQUESTED', at: now.toISOString(), by: input.userId ? 'user' : 'anonymous' },
      ] as unknown as Prisma.InputJsonValue,
    },
  });
};
