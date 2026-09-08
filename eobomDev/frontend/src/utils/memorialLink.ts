// 추모관 링크 파싱 — EntryBoxes.tsx(홈 박스③)와 MyObituaryListPage.tsx가 같은 규칙을 쓴다.
// 받은 값이 전체 URL이든 "/m/slug"든 slug만이든 전부 받아 "/m/slug" 경로로 정규화한다.

export interface ParsedMemorialLink {
  path: string;
  isCrossOrigin: boolean;
}

export const parseMemorialLink = (raw: string): ParsedMemorialLink | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let path: string;
  let isCrossOrigin = false;
  try {
    const url = new URL(trimmed);
    path = url.pathname;
    isCrossOrigin = url.origin !== window.location.origin;
  } catch {
    path = trimmed.startsWith('/') ? trimmed : `/m/${trimmed}`;
  }

  if (!/^\/m\/[^/]+/.test(path)) return null;
  return { path, isCrossOrigin };
};
