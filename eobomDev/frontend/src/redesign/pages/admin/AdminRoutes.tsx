import React from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import { PartnerRoot } from '../partner/PartnerShell';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminHomePage } from './AdminHomePage';
import { AdminShellFor, AdminTitle, AdminTopBar } from './AdminShell';
import { PV_ADMIN, adminMenuGroups, badgesOf } from './adminData';
import '../partner/partner.css';
import './admin.css';

// 8단계 묶음 12 · 운영자 미리보기 주소 모음. 🔴 이용자 헤더·바닥글이 없는 포털 화면이라 PreviewApp의 RdLayout 밖에서 연다(파트너 화면과 같다).
// 메뉴·링크 어디에도 이 주소를 넣지 않는다(00-44 §9-4 공통 조건). 홈 말고 나머지 화면은 묶음 13 — 메뉴를 누르면 자리 쪽으로 간다.

const LIST: [string, string][] = [
  [PV_ADMIN.login, '로그인 — 좁은 폭 카드 (/admin, 로그인 전)'],
  [PV_ADMIN.home, '홈 — 틀(왼쪽 메뉴 260) · 건수 · 알림 종 · 등급 표시 (?role=operator 로 OPERATOR 흐림, ?bell=empty 로 알림 없음)'],
];

function AdminIndex() {
  return (
    <PartnerRoot>
      <AdminTopBar />
      <div className="rd-pt-index">
        <h1 className="rd-pt-title">운영자 미리보기</h1>
        <p className="rd-pt-line">틀 · 홈 · 알림 종 · 등급 표시 · 로그인입니다. 나머지 화면(목록+상세 등)은 묶음 13에서 만듭니다.</p>
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

/** 묶음 13에서 채울 메뉴의 자리 — 틀 안에서 제목(메뉴 이름)만 보인다 */
function AdminTodoPage() {
  const { key = '' } = useParams();
  const item = adminMenuGroups(badgesOf(null)).flatMap((g) => g.items).find((m) => m.key === key);
  return (
    <AdminShellFor current={key} badges={badgesOf(null)}>
      <AdminTitle>{item?.label ?? '찾을 수 없는 화면'}</AdminTitle>
      <p className="rd-pt-line rd-ad-todo">이 화면은 묶음 13에서 만듭니다.</p>
    </AdminShellFor>
  );
}

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route path="home" element={<AdminHomePage />} />
      <Route path=":key" element={<AdminTodoPage />} />
      <Route path="*" element={<AdminIndex />} />
    </Routes>
  );
}
