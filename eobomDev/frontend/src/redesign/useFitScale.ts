import { useLayoutEffect, type RefObject } from 'react';

// 랜딩 데스크톱 "화면 맞춤 배율" — 00-45 §6-1. 구간의 안쪽 내용(fit)을 슬라이드처럼 통째로 줄이고 늘려 구간 높이(section)에 맞춘다.
// 줄이고 늘리는 방법은 CSS zoom(배치에 반영되므로 빈 높이·겹침이 생기지 않는다).
// 배율 = 쓸 수 있는 높이 ÷ 배율 1일 때 내용 높이, 0.85 ~ 1.15, 폭 한계 (본문 폭 + 여백) × 배율 ≤ 화면 폭.
// 0.85로도 넘치면 구간이 늘어난다(section의 min-height만 있고 height는 없다).

export const FIT_MIN = 0.85;
export const FIT_MAX = 1.15;

/**
 * section: 구간 바탕 띠(min-height가 쓸 수 있는 높이) · fit: 배율을 거는 래퍼(첫 자식 = max-width를 가진 본문).
 * 창 크기가 바뀔 때와 웹 글꼴이 적재된 뒤 다시 잰다.
 */
export function useFitScale(sectionRef: RefObject<HTMLElement>, fitRef: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const sec = sectionRef.current;
    const fit = fitRef.current;
    const inner = fit?.firstElementChild;
    if (!sec || !fit || !inner) return;

    const measure = () => {
      // 배율 1일 때 높이를 재고(같은 동기 구간이라 화면에 그려지지 않는다) 곧바로 배율을 건다.
      fit.style.zoom = '1';
      const natural = fit.getBoundingClientRect().height;
      const cs = getComputedStyle(sec);
      const avail = parseFloat(cs.minHeight) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
      const wide = parseFloat(getComputedStyle(inner).maxWidth);
      const vw = document.documentElement.clientWidth;
      let s = natural > 0 && avail > 0 ? avail / natural : 1;
      const widthCap = Number.isFinite(wide) && wide > 0 ? vw / wide : FIT_MAX;
      s = Math.min(s, FIT_MAX, widthCap);
      s = Math.max(s, FIT_MIN);
      s = Math.floor(s * 1000) / 1000; // 반올림으로 1px 넘치는 것을 막는다
      fit.style.zoom = String(s);
      sec.dataset.fit = String(s);
    };

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('resize', schedule);
    const fonts = document.fonts;
    fonts?.ready.then(schedule).catch(() => undefined);
    fonts?.addEventListener?.('loadingdone', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      fonts?.removeEventListener?.('loadingdone', schedule);
    };
  }, [sectionRef, fitRef]);
}
