import React, { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RdLayout } from './layout/RdLayout';
import { FoundationPage } from './pages/FoundationPage';
import { PartsPage } from './pages/PartsPage';
import { LandingPage } from './pages/LandingPage';
import { EndingNotePage } from './pages/prep/EndingNotePage';
import { FarewellPage } from './pages/prep/FarewellPage';
import { CounselingPage } from './pages/prep/CounselingPage';
import { GuidePage } from './pages/after/GuidePage';
import { PickupPage } from './pages/after/PickupPage';
import { DigitalPage } from './pages/after/DigitalPage';
import { FacilityPage } from './pages/after/FacilityPage';
import { ObituaryPage } from './pages/after/ObituaryPage';
import { FacilityDetailPage } from './pages/after/FacilityDetailPage';

// 8단계 미리보기 뿌리 — /preview/… 만 연다. 메뉴·링크 어디에도 이 주소를 넣지 않는다(00-44 §9-4 공통 조건).
// 묶음 2가 /preview/parts, 묶음 3부터 화면별 주소를 여기에 더한다.
export function PreviewApp() {
  useLayoutEffect(() => {
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
          <Route path="/preview/parts" element={<PartsPage />} />
          <Route path="/preview/landing" element={<LandingPage />} />
          <Route path="/preview/ending-note" element={<EndingNotePage />} />
          <Route path="/preview/farewell-messages" element={<FarewellPage />} />
          <Route path="/preview/counseling" element={<CounselingPage />} />
          <Route path="/preview/care-guide" element={<GuidePage />} />
          <Route path="/preview/pickup" element={<PickupPage />} />
          <Route path="/preview/digital-estate" element={<DigitalPage />} />
          <Route path="/preview/obituary" element={<ObituaryPage />} />
          <Route path="/preview/facility" element={<FacilityPage />} />
          <Route path="/preview/facility/:id" element={<FacilityDetailPage />} />
          <Route path="*" element={<FoundationPage notFound />} />
        </Routes>
      </RdLayout>
    </BrowserRouter>
  );
}
