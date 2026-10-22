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
      // 한 번 재는 데 30ms 안팎이 들어(글자·그림 칸이 많다) 이분 탐색으로 횟수를 줄인다: 최대 배율이 되면 1번, 아니면 8번(정밀도 0.0012).
      let s = FIT_MIN;
      if (avail > 0) {
        if (fits(FIT_MAX)) {
          s = FIT_MAX;
        } else {
          let lo = FIT_MIN;
          let hi = FIT_MAX;
          for (let i = 0; i < 8; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) lo = mid;
            else hi = mid;
          }
          s = lo;
        }
      }
      s = Math.max(FIT_MIN, Math.floor(s * 1000) / 1000);
      apply(s);
      sec.dataset.fit = String(s);
    };

    // 창 크기를 끌어당기는 동안에는 재지 않고(그 사이는 지난 배율 그대로 — 본문 폭은 CSS 가 따라가 넘치지 않는다) 멈춘 뒤 한 번 맞춘다.
    let timer = 0;
    let raf = 0;
    const schedule = (delay = 0) => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      timer = window.setTimeout(() => {
        raf = requestAnimationFrame(measure);
      }, delay);
    };
    const onResize = () => schedule(120);
    const onFonts = () => schedule(0);

    // 첫 측정은 대체 글꼴로 하게 되므로, 웹 글꼴이 오거나 800ms 가 지나면(느린 회선 상한) 한 번 더 재고 나서야 구간을 보인다(data-fit-ready).
    // 그 전엔 CSS 가 내용을 투명하게 둔다(자리는 그대로) — 글꼴이 바뀌며 배율·여백이 흔들리는 것이 화면에 비치지 않는다.
    let cancelled = false;
    const fonts = document.fonts;
    measure();
    Promise.race([
      fonts ? fonts.ready.catch(() => undefined) : Promise.resolve(),
      new Promise((resolve) => window.setTimeout(resolve, 800)),
    ]).then(() => {
      if (cancelled) return;
      measure();
      sec.setAttribute('data-fit-ready', '');
    });
    window.addEventListener('resize', onResize);
    fonts?.addEventListener?.('loadingdone', onFonts);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      fonts?.removeEventListener?.('loadingdone', onFonts);
    };
  }, [sectionRef, fitRef]);
}
