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
  consult: {
    numberPrefix: 'EC', // 상담 신청 번호 접두어 (docs 02-03 §4.1) — EC-YYMMDD-NNNN. Lead의 EB-와 구분되는 별도 카운터.
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
  memorial: {
    photoMaxSizeBytes: 5 * 1024 * 1024, // docs 05-01 §2.6, §7.1-7 — 시설 이미지와 동일 기준(5MB)
    photoMaxCountPerMemorial: 20, // docs 05-01 §2.6 — 추모관 1개당 업로드 상한
    // 00-20 §5.2-2·§8.1-2 확정값. 🔴 00-21 제15조("13개월 → 동결")와 같은 값이다 —
    // 여기를 바꾸면 약관 문구도 같이 고쳐야 한다. 어긋나면 약관이 거짓말이 된다.
    activeDays: 395, // MEMORIAL_ACTIVE_DAYS — 활성 기간(13개월). 연장 시에도 이 값으로 재설정(1년 아님)
    noticeAfterAnniversaryDays: 7, // MEMORIAL_NOTICE_AFTER_ANNIVERSARY_DAYS — 만료 통지 = 첫 기일 + 7일
  },
} as const;
