import { useLayoutEffect, type RefObject } from 'react';

// 랜딩 데스크톱 "화면 맞춤 배율" — 00-45 §6-1. 구간의 안쪽 내용(fit)을 슬라이드처럼 통째로 줄이고 늘려 구간 높이(section)에 맞춘다.
// 줄이고 늘리는 방법은 CSS zoom(배치에 반영되므로 빈 높이·겹침이 생기지 않는다).
// 배율 = 쓸 수 있는 높이 ÷ 내용 높이, 0.85 ~ 1.15. 가로는 화면에서 늘 헤더·바닥글과 같은 폭(본문 1120 + 좌우 여백)이다 —
// 본문 최대 폭·좌우 여백을 CSS 에서 ÷배율로 잡으므로(--rd-fit) 화면 폭을 넘지 않고, 폭 한계를 따로 걸 필요가 없다(00-45 §6-1 폭 한계의 구현).
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
    const inner = fit?.firstElementChild as HTMLElement | null | undefined;
    if (!sec || !fit || !inner) return;

    const apply = (s: number) => {
      fit.style.setProperty('--rd-fit', String(s)); // CSS 가 본문 최대 폭·좌우 여백을 ÷배율로 잡아 화면에서는 늘 헤더·바닥글 폭과 같다
      fit.style.zoom = String(s);
    };

    const measure = () => {
      // 본문 폭이 ÷배율로 바뀌어 줄바꿈이 달라지므로 높이가 배율에 따라 단조롭지 않다. 그래서 "화면 한 장에 들어가고(높이 ≤ 쓸 수 있는 높이)
      // 가로로 넘치지 않는" 가장 큰 배율을 위에서 아래로 찾는다(같은 동기 구간이라 화면에 그려지지 않는다).
      // getBoundingClientRect 높이는 배율이 반영된 화면 크기다.
      const cs = getComputedStyle(sec);
      const avail = parseFloat(cs.minHeight) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
      const fits = (s: number) => {
        apply(s);
        if (fit.getBoundingClientRect().height > avail + 0.5 || inner.scrollWidth > inner.clientWidth + 2) return false;
        // data-fit-guard 칸은 자기 폭을 넘치면 안 된다(칸 사이 간격이 줄어드는 것을 막는다).
        return [...fit.querySelectorAll<HTMLElement>('[data-fit-guard]')].every((g) => g.scrollWidth <= g.clientWidth + 5); // 5 = 버튼의 투명한 눌림 영역(4)이 삐져나온 몫
      };
      let s = FIT_MIN;
      if (avail > 0) {
        let hi = FIT_MAX;
        while (hi > FIT_MIN && !fits(hi)) hi = Math.round((hi - 0.01) * 1000) / 1000;
        s = Math.max(hi, FIT_MIN);
        if (s < FIT_MAX && fits(s)) {
          // 한 칸(0.01) 안에서 이분해 구간을 화면 높이에 바짝 맞춘다.
          let lo = s;
          let up = Math.min(FIT_MAX, s + 0.01);
          for (let i = 0; i < 5; i++) {
            const mid = (lo + up) / 2;
            if (fits(mid)) lo = mid;
            else up = mid;
          }
          s = lo;
        }
      }
      s = Math.max(FIT_MIN, Math.floor(s * 1000) / 1000);
      apply(s);
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
