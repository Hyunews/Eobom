import { useEffect } from 'react';

// 00-34 §2.2 결정 ② (09-29) — 주소창 직접 입력·즐겨찾기로 로그인 필요 화면(장사시설·유품 정리·
// 디지털 정산)에 들어온 비로그인 방문자에게, 화면은 그대로 보여주고 로그인 창만 한 번 띄운다.
// 블러·안내 화면으로 막지 않고, 창을 닫으면 그대로 계속 볼 수 있다.
//
// 탭 간 로그인 공유 대기(최대 300ms)는 App.tsx가 sessionPending 동안 화면 자체를 그리지 않으므로,
// 이 화면이 마운트된 시점의 currentUser는 이미 확정된 값이다(= "대기가 끝나고도 비로그인일 때만").
// deps를 비워 마운트 1회만 실행 — 닫은 뒤 다시 뜨지 않는다.
export function useLoginPromptOnEntry(currentUser?: string | null, onOpenLogin?: () => void): void {
  useEffect(() => {
    if (!currentUser) onOpenLogin?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
