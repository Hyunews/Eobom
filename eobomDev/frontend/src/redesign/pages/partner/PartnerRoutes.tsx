import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PartnerRoot, PartnerTopBar } from './PartnerShell';
import { PartnerEntrancePage } from './PartnerEntrancePage';
import { PartnerHomePage } from './PartnerHomePage';
import { PartnerInquiriesPage } from './PartnerInquiriesPage';
import { PartnerFacilityPage } from './PartnerFacilityPage';
import { PartnerLinkPage } from './PartnerLinkPage';
import { PartnerAccountPage, PartnerSettlementPage } from './PartnerAccountPage';
import { ExpertHomePage } from './ExpertHomePage';
import { ExpertConsultsPage } from './ExpertConsultsPage';
import { ExpertProfilePage, ExpertAdsPage } from './ExpertProfilePage';
import { PV_PARTNER } from './partnerData';

// 8단계 묶음 10·11 · 파트너(장사시설 · 전문가) 미리보기 주소 모음. 🔴 이용자 헤더·바닥글이 없는 포털 화면이라 PreviewApp의 RdLayout 밖에서 연다(조문객 화면과 같다).
// 메뉴·링크 어디에도 이 주소를 넣지 않는다(00-44 §9-4 공통 조건).

const LIST: [string, string][] = [
  [PV_PARTNER.login, '입구 — 로그인 · 가입 · 반려 사유 (/partner, 로그인 전)'],
  [PV_PARTNER.home, '홈 — 숫자 칸 3칸'],
  [PV_PARTNER.inquiries, '받은 문의 — 목록 + 상세 · 무산 처리 창'],
  [PV_PARTNER.facility, '내 시설 — 소개 글 · 종교 · 수용 규모 · 부대시설'],
  [PV_PARTNER.link, '시설 연동 — 검색 · 연동 신청 현황'],
  [PV_PARTNER.account, '계정 정보 — 담당자 · 정산 계좌'],
  [PV_PARTNER.settlement, '정산 — 준비 중'],
  [PV_PARTNER.expertHome, '전문가 홈 — 숫자 칸 3칸'],
  [PV_PARTNER.expertConsults, '전문가 받은 상담 — 목록 + 상세'],
  [PV_PARTNER.expertProfile, '전문가 내 프로필 — 보기만 · 연락처 · 주소 · 소개 · 공개'],
  [PV_PARTNER.expertAds, '전문가 유료 상담·광고 — 준비 중'],
];

function PartnerIndex() {
  return (
    <PartnerRoot>
      <PartnerTopBar />
      <div className="rd-pt-index">
        <h1 className="rd-pt-title">파트너 포털 미리보기</h1>
        <p className="rd-pt-line">장사시설 사업자 화면과 전문가 화면입니다. 입구(로그인·가입)는 둘이 한 장입니다.</p>
        <ul className="rd-pt-index__list">
          {LIST.map(([href, label]) => (
            <li key={href}>
              <a href={href}>{label}</a>
              <code>{href}</code>
            </li>
          ))}
        </ul>
      </div>
    </PartnerRoot>
  );
}

export function PartnerRoutes() {
  return (
    <Routes>
      <Route path="login" element={<PartnerEntrancePage />} />
      <Route path="home" element={<PartnerHomePage />} />
      <Route path="inquiries" element={<PartnerInquiriesPage />} />
      <Route path="facility" element={<PartnerFacilityPage />} />
      <Route path="link" element={<PartnerLinkPage />} />
      <Route path="account" element={<PartnerAccountPage />} />
      <Route path="settlement" element={<PartnerSettlementPage />} />
      <Route path="expert/home" element={<ExpertHomePage />} />
      <Route path="expert/consults" element={<ExpertConsultsPage />} />
      <Route path="expert/profile" element={<ExpertProfilePage />} />
      <Route path="expert/ads" element={<ExpertAdsPage />} />
      <Route path="*" element={<PartnerIndex />} />
    </Routes>
  );
}
