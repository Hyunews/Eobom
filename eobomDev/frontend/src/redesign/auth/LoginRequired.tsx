import React from 'react';
import { MyGate } from '../pages/my/myShared';
import { useAuth } from './AuthProvider';

/**
 * 로그인이 필요한 화면의 가림판(00-34 §2.4 · 00-44 §6-3-7). 모든 화면이 같은 모양·같은 문구.
 * 🔴 로그인 전에는 본문(children)을 그리지 않는다 — 비로그인 API 호출 0.
 * title/desc는 가림판 뒤에 보일 쪽 제목(+부제)이다.
 */
export function LoginRequired({
  screenName,
  title,
  desc,
  children,
}: {
  screenName: string;
  title?: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const { currentUser, openLogin } = useAuth();
  if (!currentUser) return <MyGate title={title} desc={desc} screenName={screenName} onLogin={() => openLogin()} />;
  return <>{children}</>;
}
