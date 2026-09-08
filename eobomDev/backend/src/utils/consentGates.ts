// 개설 게이트(허위 개설 고지 동의) — 05-01 §2.3을 07(부고장)이 승계한다(07-03 §5.2).
// memorialController와 obituaryController가 각자 검증 로직을 새로 짜면 한쪽이 깜빡하고
// 다르게 구현할 위험이 있다 — 그러면 POST /api/memorials의 동의 게이트를 우회하는 뒷문이
// 생긴다(07-03 §5.2 구현 주의). 그래서 이 파일 하나로 통일해서 두 컨트롤러가 같이 쓴다.

export const validateFalseReportAgreed = (falseReportAgreed: unknown): string | null => {
  if (falseReportAgreed !== true) {
    return '허위 개설 시 법적 책임을 질 수 있다는 고지에 동의해야 합니다.';
  }
  return null;
};

// 재전파 고지 확인(00-13 §8-6) — 07 부고장 개설에만 있는 두 번째 게이트(추모관 단독 개설엔 없음).
export const validateResharedNoticeAck = (resharedNoticeAck: unknown): string | null => {
  if (resharedNoticeAck !== true) {
    return '전달받은 분이 다시 공유할 수 있다는 고지를 확인해야 합니다.';
  }
  return null;
};
