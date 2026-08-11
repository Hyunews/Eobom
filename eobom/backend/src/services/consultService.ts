import { Prisma } from '@prisma/client';
import { POLICY } from '../config/policy';

// 전문가 상담 신청(ConsultRequest) 생성 공통 로직.
// docs/02_전문가_매칭/02-03_전문가_공개노출_및_상담신청_명세서.md §4·§5.2를 그대로 구현한다.
// leadService.ts(장사시설 리드)와 패턴은 같지만 카운터 테이블을 공유하지 않는다(§4.2) —
// EB-(리드)와 EC-(상담)의 일련번호가 서로를 건너뛰면 대조가 어려워지기 때문.

type TxClient = Prisma.TransactionClient;

export class ConsentRequiredError extends Error {
  constructor() {
    super('개인정보 제3자 제공 동의가 필요합니다.');
    this.name = 'ConsentRequiredError';
  }
}

// 대상 전문가가 없거나, 미승인(status!==APPROVED)이거나, 비공개(isPublished=false)일 때 던진다.
// 컨트롤러에서 404로 매핑해 존재 자체를 숨긴다(§5.2) — 403이 아니다.
export class ExpertNotAvailableError extends Error {
  constructor() {
    super('상담 신청을 받을 수 없는 전문가입니다.');
    this.name = 'ExpertNotAvailableError';
  }
}

const pad = (n: number, len: number) => String(n).padStart(len, '0');

// 'YYMMDD' — leadService.ts와 동일한 날짜 표기(프로젝트 표준)
const dateKeyOf = (d: Date): string => {
  const yy = d.getFullYear() % 100;
  return `${pad(yy, 2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
};

// 일자별 원자적 증가값으로 requestNo 발번. ConsultNumberCounter는 LeadNumberCounter와 별도 테이블 —
// Postgres 행 잠금 기반 upsert increment로 동시 요청에서도 안전, requestNo @unique와 이중 방어.
export const nextConsultRequestNo = async (tx: TxClient, now: Date = new Date()): Promise<string> => {
  const dateKey = dateKeyOf(now);
  const counter = await tx.consultNumberCounter.upsert({
    where: { dateKey },
    create: { dateKey, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return `${POLICY.consult.numberPrefix}-${dateKey}-${pad(counter.seq, 4)}`;
};

interface ConsentNotice {
  noticeVersion: string;
  providedTo: string;
  purpose: string;
  items: string[];
  retention: string;
}

// 동의 시점의 고지 문구를 통째로 스냅샷 저장 — 나중에 문구가 바뀌어도 "그때 무엇에 동의했는지" 증명 가능(§8)
const buildConsultConsentNotice = (expertName: string): ConsentNotice => ({
  noticeVersion: '2026-08-11',
  providedTo: `${expertName} (이어봄 입점 전문가)`,
  purpose: '상담 안내 및 연락',
  items: ['이름', '연락처', '상담 희망 내용'],
  retention: '목적 달성 후 파기 — 일정 기간 경과 후 마스킹 처리(§8)',
});

interface CreateConsultRequestInput {
  expertId: string;
  userId?: string | null;
  applicantName?: string | null;
  applicantPhone?: string | null;
  channel: string;
  preferredAt?: Date | null;
  content: string;
  thirdPartyConsent: boolean;
}

export const createConsultRequest = async (tx: TxClient, input: CreateConsultRequestInput) => {
  if (!input.thirdPartyConsent) {
    throw new ConsentRequiredError();
  }

  const expert = await tx.expert.findUnique({
    where: { id: input.expertId },
    select: { id: true, name: true, category: true, status: true, isPublished: true },
  });
  if (!expert || expert.status !== 'APPROVED' || !expert.isPublished) {
    throw new ExpertNotAvailableError();
  }

  const requestNo = await nextConsultRequestNo(tx);
  const now = new Date();

  return tx.consultRequest.create({
    data: {
      requestNo,
      expertId: expert.id,
      categorySnapshot: expert.category, // 신청 시점 스냅샷 — 전문가가 나중에 카테고리를 바꿔도 당시 기준 보존
      userId: input.userId ?? null,
      applicantName: input.applicantName ?? null,
      applicantPhone: input.applicantPhone ?? null,
      channel: input.channel,
      preferredAt: input.preferredAt ?? null,
      content: input.content,
      thirdPartyConsentAt: now,
      consentSnapshot: buildConsultConsentNotice(expert.name) as unknown as Prisma.InputJsonValue,
      statusHistory: [
        { status: 'REQUESTED', at: now.toISOString(), by: input.userId ? 'user' : 'anonymous' },
      ] as unknown as Prisma.InputJsonValue,
    },
  });
};
