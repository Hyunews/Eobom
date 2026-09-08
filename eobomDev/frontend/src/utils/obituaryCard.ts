// 부고 카드 문구 포맷터 — docs/07_상중_행정_케어/07-03 §3.2(카톡 카드)·§6.2(작성 폼 미리보기)·
// §5.4-2(재공유 카드 ·변경 표기)가 "같은 포맷터를 쓴다"고 못박은 그 함수. 세 곳(카톡 카드,
// 작성 폼 미리보기, 재공유 시 제목)이 여기 하나로만 갈라지면 서로 어긋난다 — 갈라놓지 말 것.

export interface ObituaryCardInput {
  deceasedName: string;
  funeralHall?: string | null;
  mourningRoom?: string | null;
  funeralAt: string | Date | null;
  cardFieldsUpdatedAt?: string | Date | null; // §5.4-2 — null이 아니면 "·변경" 표기
}

export const formatKST = (value: string | Date): string => {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(d);
};

// §3.2 예시: `[부고] 故 ${deceasedName} 님`. §5.4-2 확정: cardFieldsUpdatedAt이 있으면(=카드
// 반영 필드가 개설 이후 한 번이라도 바뀌었으면) "[부고·변경]"으로 영구 표기한다(재공유마다 매번).
export const formatObituaryCardTitle = (input: ObituaryCardInput): string => {
  const changedTag = input.cardFieldsUpdatedAt ? '·변경' : '';
  return `[부고${changedTag}] 故 ${input.deceasedName || ''} 님`;
};

// §6.2-3: 카드 description은 빈소·발인까지만 — 상주·연락처·계좌를 카드에 박으면 단톡방에 남은
// 번호를 회수할 수 없어 "종료 시 404" 완화가 무력화된다(연락처·계좌 둘 다 같은 이유).
// §3.2 예시: `빈소: ${funeralHall} ${mourningRoom}\n발인: ${formatKST(funeralAt)}`
export const formatObituaryCardDescription = (input: ObituaryCardInput): string => {
  const lines: string[] = [];
  if (input.funeralHall) {
    const room = input.mourningRoom ? ` ${input.mourningRoom}` : '';
    lines.push(`빈소: ${input.funeralHall}${room}`);
  }
  if (input.funeralAt) {
    lines.push(`발인: ${formatKST(input.funeralAt)}`);
  }
  return lines.join('\n');
};
