// 페이지 스크롤 주체 찾기 — index.css: 641px 이상에서는 `.main-wrapper`가 뷰포트 높이로 캡된 스크롤 패널이라
// window는 움직이지 않는다(window.scrollTo가 무효). 640px 이하에서는 body(window)가 스크롤 주체다(§5.4-1).
// 페이지 맨 위로 보내거나 위치를 읽고 복원할 때는 window를 직접 쓰지 말고 이 함수들을 거친다.

const getScroller = (): HTMLElement | null => {
  const el = document.querySelector<HTMLElement>('.main-wrapper');
  if (!el) return null;
  const oy = window.getComputedStyle(el).overflowY;
  // 패널이 실제로 스크롤 컨테이너일 때만 — 모바일 폭(auto가 아님)이거나 포털 경로(.main-wrapper 없음)면 window.
  return oy === 'auto' || oy === 'scroll' ? el : null;
};

export const getScrollY = (): number => getScroller()?.scrollTop ?? window.scrollY;

export const scrollPageTo = (top: number, behavior: ScrollBehavior = 'instant'): void => {
  const el = getScroller();
  if (el) el.scrollTo({ top, left: 0, behavior });
  else window.scrollTo({ top, left: 0, behavior });
};
