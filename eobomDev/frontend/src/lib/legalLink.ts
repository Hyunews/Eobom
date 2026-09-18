// docs/00_핵심플랫폼/00-39 §6-14 — 모달 "근거" 줄의 표시·링크 규칙 정본.
// 우선순위: ① 기관·서비스가 특정된 3건 → 그 사이트 ② legalBasis에 법령이 있는 13건 →
// 국가법령정보센터 ③ 둘 다 아닌 6건(5가지 사유) → 줄 자체를 생략(null).

export interface LegalLinkInfo {
  baseLabel: string;
  // §6-14 — 웹은 괄호 부연까지 표시, 모바일은 조문까지만(baseLabel만 노출).
  extra?: string;
  // 실제로 열어 확인된 URL만 넣는다(§6-14 §실측 표). 확인 못 한 기관은 라벨만 표시.
  href?: string;
}

// 순위1 — id 7(정부24)·4(e하늘)·9·18(안심상속, 정부24 안의 서비스). id 9·18은 정부24
// 도메인으로 보낸다. e하늘은 정확한 딥링크를 실측하지 못해 href 없이 라벨만 둔다.
const INSTITUTION_LINKS: Record<number, LegalLinkInfo> = {
  7: { baseLabel: '정부24', href: 'https://www.gov.kr' },
  9: { baseLabel: '안심상속 원스톱 서비스', href: 'https://www.gov.kr' },
  18: { baseLabel: '안심상속 원스톱 서비스', href: 'https://www.gov.kr' },
  4: { baseLabel: 'e하늘 장사정보시스템' },
};

// 순위3 — 기관도 법령도 없어 "근거" 줄 자체를 생략하는 6건(5가지 사유, §6-14 표).
const NO_BASIS_IDS = new Set([17, 22, 21, 1, 3, 19]);

function parseLegalBasis(raw: string): { lawName: string; article?: string; extra?: string } {
  const parenMatch = raw.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
  const main = (parenMatch?.[1] ?? raw).trim();
  const extra = parenMatch?.[2];
  // §6-14 — § → 제N조, 항(①②③…)은 떼고 조까지만 건다.
  const articleMatch = main.match(/^(.+?)\s*§(\d+)[①②③④⑤⑥⑦⑧⑨⑩]?$/);
  if (articleMatch) {
    return { lawName: articleMatch[1].trim(), article: `제${articleMatch[2]}조`, extra };
  }
  return { lawName: main, extra };
}

export function getLegalLink(task: { id: number; legalBasis: string }): LegalLinkInfo | null {
  const institution = INSTITUTION_LINKS[task.id];
  if (institution) return institution;
  if (NO_BASIS_IDS.has(task.id)) return null;

  const { lawName, article, extra } = parseLegalBasis(task.legalBasis);
  const baseLabel = article ? `${lawName} ${article}` : lawName;
  const href = `https://www.law.go.kr/법령/${lawName}${article ? `/${article}` : ''}`;
  return { baseLabel, extra, href };
}
