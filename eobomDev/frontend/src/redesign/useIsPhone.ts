import { useEffect, useState } from 'react';
import { MOBILE_MAX } from './nav';

/** 휴대폰 배치(767px 이하) 여부 — 00-44 §5-2. 두 배치의 구조가 다른 화면(랜딩)에서 쓴다. */
export function useIsPhone(): boolean {
  const query = `(max-width: ${MOBILE_MAX}px)`;
  const [phone, setPhone] = useState<boolean>(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setPhone(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return phone;
}
