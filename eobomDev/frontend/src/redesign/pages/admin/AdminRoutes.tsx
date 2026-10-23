import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PartnerRoot } from '../partner/PartnerShell';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminHomePage } from './AdminHomePage';
import { AdminTopBar } from './AdminShell';
import { AdminClaimsPage, AdminExpertsPage, AdminPartnersPage } from './AdminReviewPages';
import { AdminConsultsPage, AdminFacilitiesPage, AdminLeadsPage } from './AdminFacilityPages';
import { AdminMembersPage, AdminMemorialsPage, AdminObituariesPage } from './AdminMemberPages';
import { AdminDeathPage, AdminPurgePage } from './AdminAfterDeathPages';
import { AdminAccountsPage, AdminAuditPage, AdminRatesPage, AdminSettlementPage } from './AdminRecordPages';
import { PV_ADMIN } from './adminData';
import '../partner/partner.css';
import './admin.css';

// 8단계 묶음 12·13 · 운영자 미리보기 주소 모음. 🔴 이용자 헤더·바닥글이 없는 포털 화면이라 PreviewApp의 RdLayout 밖에서 연다(파트너 화면과 같다).
// 메뉴·링크 어디에도 이 주소를 넣지 않는다(00-44 §9-4 공통 조건). 주소 = /preview/admin/<메뉴 key> (adminData.ts adminMenuGroups).

const LIST: [string, string][] = [
  [PV_ADMIN.login, '로그인 — 좁은 폭 카드 (/admin, 로그인 전)'],
  [PV_ADMIN.home, '홈 — 틀(왼쪽 메뉴 260) · 건수 · 알림 종 · 등급 표시 (?role=operator 로 OPERATOR 흐림, ?bell=empty 로 알림 없음)'],
  [`${PV_ADMIN.index}/partners`, '사업자 가입 — 목록 380 + 상세 · 반려·정지 입력 창 · 정지 사유·해제'],
  [`${PV_ADMIN.index}/experts`, '전문가 가입 — 분야 한글 · 소비자 화면 공개 체크 · 정지·해제'],
  [`${PV_ADMIN.index}/claims`, '시설 연동 — 반려(입력 창) · 승인(메모 선택)'],
  [`${PV_ADMIN.index}/facilities`, '전체 시설 — 카드 격자 3열 → 시설을 고르면 목록 + 상세 · 소개 글 숨기기·되돌리기'],
  [`${PV_ADMIN.index}/leads`, '업체 문의 — 무효 처리 · 청구 대상 확정'],
  [`${PV_ADMIN.index}/consults`, '상담 신청 — 조회만 · 경로 한글'],
  [`${PV_ADMIN.index}/members`, '회원 — 상세 열기(사유) · 정지(열쇠) · 해제 · 탈퇴 요청 처리(열쇠)'],
  [`${PV_ADMIN.index}/memorials`, '추모관 — 내리기·되돌리기 · 방명록 숨기기'],
  [`${PV_ADMIN.index}/obituaries`, '부고장 — 종료'],
  [`${PV_ADMIN.index}/death`, '사망 확인 — 확인 완료 · 반려 · 기타(SUPERADMIN만)'],
  [`${PV_ADMIN.index}/purge`, '유족메시지 파기 — 직접 할 일 · 대기/기록 · 선택 파기 · 파기 실행 창'],
  [`${PV_ADMIN.index}/rates`, '요율 등록 — 값은 예시 · 이력은 적용 종료만 고침'],
  [`${PV_ADMIN.index}/settlement`, '정산서 — 준비 중'],
  [`${PV_ADMIN.index}/audit`, '감사로그 — ?result=FAIL 로 거르기 (홈 "최근 오류" 링크)'],
  [`${PV_ADMIN.index}/accounts`, '운영자 계정 — 등급 변경 확인 창(마지막 SUPERADMIN 거부) · 비밀번호 변경'],
];

function AdminIndex() {
  return (
    <PartnerRoot>
      <AdminTopBar />
      <div className="rd-pt-index">
        <h1 className="rd-pt-title">운영자 미리보기</h1>
        <p className="rd-pt-line">틀 · 홈 · 알림 종 · 등급 표시 · 로그인과 메뉴 화면 전부입니다. 값은 모두 예시이고, 화면 아래 "미리보기 전용" 줄에서 상태와 등급을 바꿔 볼 수 있습니다.</p>
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

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route path="home" element={<AdminHomePage />} />
      <Route path="partners" element={<AdminPartnersPage />} />
      <Route path="experts" element={<AdminExpertsPage />} />
      <Route path="claims" element={<AdminClaimsPage />} />
      <Route path="facilities" element={<AdminFacilitiesPage />} />
      <Route path="leads" element={<AdminLeadsPage />} />
      <Route path="consults" element={<AdminConsultsPage />} />
      <Route path="members" element={<AdminMembersPage />} />
      <Route path="memorials" element={<AdminMemorialsPage />} />
      <Route path="obituaries" element={<AdminObituariesPage />} />
      <Route path="death" element={<AdminDeathPage />} />
      <Route path="purge" element={<AdminPurgePage />} />
      <Route path="rates" element={<AdminRatesPage />} />
      <Route path="settlement" element={<AdminSettlementPage />} />
      <Route path="audit" element={<AdminAuditPage />} />
      <Route path="accounts" element={<AdminAccountsPage />} />
      <Route path="*" element={<AdminIndex />} />
    </Routes>
  );
}
