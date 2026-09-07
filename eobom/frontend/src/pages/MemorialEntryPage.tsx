import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { MemorialPage } from './MemorialPage';

// 🆕 09-07 사용자 지시 — 사이드바 "디지털 추모관" 진입점. 등록된 추모관이 있으면 관리
// 화면(/my-obituaries)으로 보내고, 없으면 화면 구성 예시(MemorialPage)를 보여준다.
// 🔴 09-07 정정(같은 날, 사용자 리포트) — 판정을 `GET /api/me/memorials`로 했다가 실버그를
// 냈다. 부고장을 지워도 추모관은 안 지워진다(obituaryController.ts deleteObituary 주석 —
// "추모관(목적지)·Deceased는 남긴다", E안 §9 설계). 그래서 부고장을 삭제한 뒤에도
// `/api/me/memorials`엔 그 추모관이 그대로 남아 있어 `hasMemorial`이 true가 되고, 정작
// `/my-obituaries`(`GET /api/me/obituaries` 기반)는 부고장이 0건이라 "아직 만든 부고장이
// 없습니다"만 뜨는 막다른 화면으로 리다이렉트됐다 — 예시 페이지조차 안 보이는 게 이 버그였다.
// ✅ 고침: 리다이렉트 대상(`/my-obituaries`)이 실제로 쓰는 것과 **같은** 소스
// (`GET /api/me/obituaries`)로 판정한다 — "거기 가면 보여줄 게 있는가"를 그 화면의 데이터로
// 직접 묻는 것이라 더 이상 어긋날 수 없다. 부고장 없이 추모관만 남은 계정은 이제 예시
// 페이지로 떨어진다(그 추모관 자체를 보여주는 화면은 아직 없음 — `backlog.md`⑮).

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
  const [hasObituary, setHasObituary] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecked(true);
      setHasObituary(false);
      return;
    }
    let cancelled = false;
    apiFetch<Array<{ id: string }>>('/api/me/obituaries', 'USER')
      .then((data) => {
        if (!cancelled) setHasObituary(Array.isArray(data) && data.length > 0);
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

  if (hasObituary) {
    return <Navigate to="/my-obituaries" replace />;
  }

  return <MemorialPage currentUser={currentUser} onOpenLogin={onOpenLogin} />;
};
