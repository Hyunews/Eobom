import { useEffect, useState } from 'react';

// 00-38 §5 — index.css의 지배적 브레이크포인트(@media (max-width: 768px))와 정확히 맞춘다.
// inclusive이므로 768px 정확히에서 JS와 CSS가 어긋나지 않는다.
export function useIsMobile(maxWidth: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    // 00-38 §5.1 — lazy initializer로 즉시 평가한다. useEffect에서 처음 계산하면
    // 데스크톱 뷰가 한 프레임 그려졌다 모바일로 바뀌는 깜빡임이 생긴다.
    window.matchMedia(`(max-width: ${maxWidth}px)`).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    setIsMobile(mql.matches);

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    // 🟡 00-38 §5.1 — addListener 폴백. 주 페르소나가 6070이라 구형 iOS Safari(≤13) 비중을
    // 0으로 볼 수 없다.
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [maxWidth]);

  return isMobile;
}
