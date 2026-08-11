// 운영 정책 단일 정본 (docs/01_장사시설_매칭/01-05_...명세서.md §12).
// 이 파일 밖에서 같은 값을 다시 쓰지 않는다. 값을 바꿀 때는 여기만 고치고,
// 왜 바꿨는지 커밋 메시지에 남긴다. 요율(돈)은 여기 두지 않는다 — CommissionPolicy 테이블이 정본(§8.2).
// 시크릿은 이 파일에 절대 넣지 않는다 — 이 파일은 git에 커밋된다(§12.4). 시크릿은 .env로.

export const POLICY = {
  lead: {
    numberPrefix: 'EB', // 견적요청 번호 접두어 (§4.2) — EB-YYMMDD-NNNN
    requireLogin: false, // §10-2 — 대표 확정 시 여기만 수정
    requirePhoneVerification: true, // §10-2 — SMS 인증 연동은 별도 구현 전까지 미시행(정책값만 존재)
    acceptForNonPartner: true, // §10-4
  },
  settlement: {
    cycleMonths: 1, // §10-3
    disputeWindowDays: 7, // §10-3 — 이의제기 기간
  },
  partner: {
    autoApprove: false, // §3.2 — 자동승인 금지(개인정보 사고 경로). true로 바꾸지 않는다.
  },
  privacy: {
    maskAfterSettlement: true, // §7.3
  },
} as const;
