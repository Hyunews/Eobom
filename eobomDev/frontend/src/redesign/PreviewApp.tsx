import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RdLayout } from './layout/RdLayout';
import { FoundationPage } from './pages/FoundationPage';

// 8단계 미리보기 뿌리 — /preview/… 만 연다. 메뉴·링크 어디에도 이 주소를 넣지 않는다(00-44 §9-4 공통 조건).
// 묶음 2가 /preview/parts, 묶음 3부터 화면별 주소를 여기에 더한다.
export function PreviewApp() {
  useEffect(() => {
    document.body.classList.add('rd-body');
    document.title = '디자인 개편 미리보기 — 이어봄';
    // 검색에 잡히지 않게 한다(교체 전까지 공개 화면이 아니다).
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.body.classList.remove('rd-body');
      meta.remove();
    };
  }, []);

  return (
    <BrowserRouter>
      <RdLayout>
        <Routes>
          <Route path="/preview" element={<FoundationPage />} />
          <Route path="*" element={<FoundationPage notFound />} />
        </Routes>
      </RdLayout>
    </BrowserRouter>
  );
}
