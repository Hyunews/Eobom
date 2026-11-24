import { useEffect, useState } from 'react';

export const LEAVE_MS = 200;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 닫을 때 0.2초 거꾸로 사라지게 하려고, 켜짐이 꺼져도 그만큼 더 붙여 둔다(00-44 §6-8).
 * mounted = 화면에 두는 동안 · leaving = 사라지는 중. 움직임 줄이기 설정이면 바로 뗀다.
 */
export function useLeave(on: boolean): { mounted: boolean; leaving: boolean } {
  const [mounted, setMounted] = useState(on);
  useEffect(() => {
    if (on) {
      setMounted(true);
      return;
    }
    if (prefersReducedMotion()) {
      setMounted(false);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [on]);
  return { mounted: on || mounted, leaving: !on && mounted };
}
