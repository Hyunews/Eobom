import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { MemorialPage } from './MemorialPage';

// 🆕 09-07 사용자 지시 — 사이드바 "디지털 추모관" 진입점. 등록된 추모관이 있으면 관리
// 화면(/my-obituaries)으로 보내고, 없으면 화면 구성 예시(MemorialPage)를 보여준다.
// GET /api/me/memorials는 이미 배선돼 있는 엔드포인트다(meRoutes.ts) — 새로 만들지 않는다.
// 비로그인이거나 조회 실패면 안전하게 예시 페이지로 떨어진다(기존 /memorial 동작 유지).

interface MemorialEntryPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  // authProps({...authProps} 스프레드)에 setActiveTab이 함께 오지만 이 화면·MemorialPage
  // 어느 쪽도 쓰지 않는다 — 다른 페이지들과 같은 authProps 모양만 맞춰 받는다.
  setActiveTab?: (tab: string) => void;
}

export const MemorialEntryPage: React.FC<MemorialEntryPageProps> = ({ currentUser, onOpenLogin }) => {
  const token = currentUser ? getToken('USER') : null;
  const [checked, setChecked] = useState(!token);
  const [hasMemorial, setHasMemorial] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecked(true);
      setHasMemorial(false);
      return;
    }
    let cancelled = false;
    apiFetch<Array<{ id: string }>>('/api/me/memorials', 'USER')
      .then((data) => {
        if (!cancelled) setHasMemorial(Array.isArray(data) && data.length > 0);
      })
      .catch(() => {
        // 조회 실패 — 예시 페이지로 안전하게 떨어진다.
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!checked) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>불러오는 중...</div>
      </div>
    );
  }

  if (hasMemorial) {
    return <Navigate to="/my-obituaries" replace />;
  }

  return <MemorialPage currentUser={currentUser} onOpenLogin={onOpenLogin} />;
};
