import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import type { NavMode } from '../lib/modeNav';
import { HomeDesktop } from '../components/home/HomeDesktop';
import { HomeMobile } from '../components/home/HomeMobile';

export interface HomePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  onSetMode?: (mode: NavMode) => void;
  // 00-40 §3.3 C6 — /prep·/bereaved가 폐지되면서 그 라우트로 들어온 방문객이 홈의 어느
  // 갈래로 곧장 떨어져야 하는지 App.tsx가 넘겨준다(웹은 섹션2, 모바일은 해당 칸).
  landingMode?: NavMode;
  // 00-40 §3.3 M-10 — 모바일 홈은 헤더가 칸 위에 겹쳐 뜬다. 현재 칸이 바뀔 때마다 App.tsx의
  // Header 렌더에 반영하도록 variant(로고·아이콘 색)를 올려보낸다(배경은 항상 투명 —
  // 2026-09-28 사람 지시, 칸 배경을 헤더에 직접 입히면 스크롤 중 다음 칸 색이 먼저 씌워지는
  // 것처럼 보였다). 데스크톱은 헤더가 그대로라 이 콜백을 쓰지 않는다.
  onMobileHeaderStyleChange?: (style: { variant: 'hero' | 'panel' }) => void;
}

// 00-40 §3.3 — 데스크톱(세로 풀페이지 유지)과 모바일(가로 4칸 넘김)은 구조 자체가 달라
// 같은 컴포넌트 안에서 분기 조건으로 얽어두지 않는다(구 HomePage.tsx가 그렇게 하다 훅
// 하나마다 isMobileLayout() 분기를 또 넣어야 했던 문제, 00-40 §0 "기존 구현을 억지로
// 지키지 않는다"). 768px 경계는 useIsMobile 기본값(00-38 §5)과 index.css 미디어쿼리 그대로.
export const HomePage: React.FC<HomePageProps> = (props) => {
  const isMobile = useIsMobile();
  return isMobile ? <HomeMobile {...props} /> : <HomeDesktop {...props} />;
};
