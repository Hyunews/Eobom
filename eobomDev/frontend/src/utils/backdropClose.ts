import type { MouseEvent, PointerEvent } from 'react';

// 모달 배경(오버레이) 클릭으로 닫기 — 전 모달 공통(2026-09-21 사용자 지시).
//
// 🔴 `onClick`만 달면 안 되는 이유: 패널 안 입력칸에서 글자를 드래그하다가 **배경에서 마우스를 놓으면**
// 브라우저가 click을 두 지점의 공통 조상(=배경)에 낸다 → 쓰던 내용이 있는 폼 모달이 닫혀 버린다
// (유족 편지 작성기 같은 곳에서 치명적). 그래서 **누른 곳과 뗀 곳이 모두 배경 자신**일 때만 닫는다.
// pointerdown을 쓰는 이유: 마우스·터치 모두 같은 이벤트로 잡히고, 탭에서 mousedown이 안 오는 환경이 있다.
//
// 모듈 변수로 "마지막에 누른 대상"을 들고 있으므로 훅 규칙(조건부 return 앞 호출 등)과 무관하게
// 배경 <div>에 `{...backdropCloseProps(onClose)}`만 펼치면 된다. 포인터는 한 번에 하나라 공유해도 안전하다.
let lastPointerDownTarget: EventTarget | null = null;

export const backdropCloseProps = (onClose: () => void) => ({
  onPointerDown: (e: PointerEvent<HTMLElement>) => {
    lastPointerDownTarget = e.target;
  },
  onClick: (e: MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && lastPointerDownTarget === e.currentTarget) onClose();
    lastPointerDownTarget = null;
  },
});
