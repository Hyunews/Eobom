// 운영 정책 단일 정본 (docs/01_장사시설_매칭/01-05_...명세서.md §12).
// 이 파일 밖에서 같은 값을 다시 쓰지 않는다. 값을 바꿀 때는 여기만 고치고,
// 왜 바꿨는지 커밋 메시지에 남긴다. 요율(돈)은 여기 두지 않는다 — CommissionPolicy 테이블이 정본(§8.2).
// 시크릿은 이 파일에 절대 넣지 않는다 — 이 파일은 git에 커밋된다(§12.4). 시크릿은 .env로.

export const POLICY = {
  lead: {
    numberPrefix: 'EB', // 업체 문의 번호 접두어 (§4.2) — EB-YYMMDD-NNNN
    acceptForNonPartner: false, // §10-4 · §7.2 — 비제휴 시설은 업체 문의를 받지 않는다(10-08 결정). createQuote가 거절
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
  // 파기·마스킹 보관기간 — 수동 파기 스크립트(prisma/destroy-farewell-media.ts)가 읽는다.
  // 🔴 각 값은 개인정보처리방침(docs 00-19)·추모관 정책(00-20)의 문구와 같은 값이다 — 여기를 바꾸면 해당 조항도 같이 고쳐야 한다.
  retention: {
    memorialPurgeAfterFreezeYears: 3, // 00-20 §5.2-1·§8.1-3 · 00-19 제4조 "추모관 … 동결 후 3년이 지나면 파기"
    memorialReconfirmDaysBeforePurge: 30, // 00-20 §5.2-1 · 00-19 제4조 "파기 30일 전에 개설자에게 다시 확인"
    socialUnlinkedYears: 1, // 00-19 제4조 "소셜 계정 연동 해제 시 … 1년 경과 시 파기"
    deletedGuestbookMonths: 3, // 00-19 제4조 "방명록 등 삭제된 게시물 … 3개월 후 완전 삭제"
    contactMaskAfterEndDays: 90, // 00-19 제4조·제8조 "끝난 날부터 90일이 지나면 … 원본도 마스킹"
    heavyJobLogYears: 1, // 06-04 §6.4-11-10-1 "1년 지난 기록은 지웁니다" — 사진 인식·음성 변환 처리 결과 기록(개인정보 없음, 처리방침 대상 아님)
  },
} as const;
