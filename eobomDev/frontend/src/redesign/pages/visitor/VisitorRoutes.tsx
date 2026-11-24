import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { VisitorObituaryPage } from './VisitorObituaryPage';
import { VisitorMemorialPage } from './VisitorMemorialPage';
import { VisitorExtendPage } from './VisitorExtendPage';
import { VisitorInvitePage } from './VisitorInvitePage';
import './visitor.css';

// 8단계 묶음 6 · 조문객 화면 미리보기 주소 모음. 🔴 껍데기(헤더·메뉴·바닥글)가 없는 화면이라 PreviewApp의 RdLayout 밖에서 연다.
// 메뉴·링크 어디에도 이 주소를 넣지 않는다(00-44 §9-4 공통 조건).

const LIST = [
  ['/preview/visitor/obituary', '부고장 받은 화면 (/o/:slug)'],
  ['/preview/visitor/memorial', '추모관 공개 화면 · 방명록 창 · 내 글 [삭제] (/m/:slug)'],
  ['/preview/visitor/memorial-extend', '추모관 연장 확인 (/memorial-extend/:token)'],
  ['/preview/visitor/invite', '가족 지정 초대 받기 (/invite/:token)'],
];

function VisitorIndex() {
  return (
    <div className="rd-root rd-vs">
      <main className="rd-vs-page">
        <div className="rd-vs-wrap">
          <article className="rd-vs-card">
            <h1 className="rd-vs-name">조문객 화면 미리보기</h1>
            <ul className="rd-vs-index">
              {LIST.map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                  <code>{href}</code>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </main>
    </div>
  );
}

export function VisitorRoutes() {
  return (
    <Routes>
      <Route path="obituary" element={<VisitorObituaryPage />} />
      <Route path="memorial" element={<VisitorMemorialPage />} />
      <Route path="memorial-extend" element={<VisitorExtendPage />} />
      <Route path="invite" element={<VisitorInvitePage />} />
      <Route path="*" element={<VisitorIndex />} />
    </Routes>
  );
}
