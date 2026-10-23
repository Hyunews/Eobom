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
import { VisitorRoutes } from './pages/visitor/VisitorRoutes';
import { MyHubPage } from './pages/my/MyHubPage';
import { MyListPage } from './pages/my/MyListPage';
import { MemorialPage } from './pages/my/MemorialPage';
import { MyGuestbookPage } from './pages/my/MyGuestbookPage';
import { MyConsultationsPage } from './pages/my/MyConsultationsPage';
import { SharedPage } from './pages/my/SharedPage';
import { LoginPage } from './pages/auth/LoginPage';
import { TermsPage } from './pages/legal/TermsPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';

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
      <Routes>
        {/* 묶음 6 — 조문객 화면은 껍데기(헤더·메뉴·바닥글)가 없다. 틀 밖에서 연다. */}
        <Route path="/preview/visitor/*" element={<VisitorRoutes />} />
        <Route
          path="*"
          element={
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
                {/* 묶음 7 — 마이페이지 · 추모관. /preview/memorial 은 ?slug= 가 있으면 관리, 없으면 만들기 */}
                <Route path="/preview/mypage" element={<MyHubPage />} />
                <Route path="/preview/my-obituaries-memorials" element={<MyListPage />} />
                <Route path="/preview/memorial" element={<MemorialPage />} />
                <Route path="/preview/my-guestbook" element={<MyGuestbookPage />} />
                <Route path="/preview/my-consultations" element={<MyConsultationsPage />} />
                {/* 묶음 8 — 나에게 공유된 것 · 로그인 창 미리보기. 내 정보 · 가족 지정 · 계정 연동 · 개인정보·동의 · 탈퇴 창과 사후 개봉 띠는 /preview/mypage 에서 열린다 */}
                <Route path="/preview/family-shared" element={<SharedPage />} />
                <Route path="/preview/login" element={<LoginPage />} />
                {/* 묶음 9 — 법적 문서. 지금 /terms · /privacy 는 그대로 두고 미리보기 주소로만 연다 */}
                <Route path="/preview/terms" element={<TermsPage />} />
                <Route path="/preview/privacy" element={<PrivacyPage />} />
                <Route path="*" element={<FoundationPage notFound />} />
              </Routes>
            </RdLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
