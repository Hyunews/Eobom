import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatKstDate } from '../../../utils/kstDate';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdList } from '../../parts/RdCards';
import { RdPageHead } from '../../parts/RdNav';
import { IconChevronRight } from '../../parts/icons';
import { GUESTBOOK, PV } from './myData';
import { MyGate, MyLine } from './myShared';
import './mypage.css';

// 8단계 묶음 7 · /preview/my-guestbook — 4단계 판 4-7(내가 남긴 방명록). 정본: 00-36 §4.7 · 4단계 확정 ⑨.
// 🔴 이 화면은 연결만 한다 — 줄 오른쪽 [삭제]와 삭제 창이 없다. 내 글 삭제는 추모관 공개 화면(/preview/visitor/memorial)의 내가 쓴 글 줄에서 한다(묶음 6에서 넣음).
// 줄을 누르면 그 추모관 공개 화면으로(예시 한 곳). 글은 데스크톱 최대 두 줄 · 모바일 한 줄로 줄임. 한도 안내는 잘렸을 때만(100건 초과, 서버가 101건째를 내려줌).

type View = 'ready' | 'truncated' | 'empty' | 'login' | 'loading' | 'loadfail';

const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본' },
  { value: 'truncated', label: '100건을 넘어 한도 안내 한 줄' },
  { value: 'empty', label: '빈 목록' },
  { value: 'login', label: '로그인 전', group: '상태' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];

const LIST_LIMIT = 100; // 지금 MyGuestbookPage와 같은 값

export function MyGuestbookPage() {
  const [view, setView] = useState<View>('ready');
  const bar = <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />;

  if (view === 'login') {
    // 이 화면엔 부제가 없다 — 쪽 제목만
    return (
      <div className="rd-container rd-screen">
        <MyGate title="내가 남긴 방명록" screenName="내가 남긴 방명록" />
        {bar}
      </div>
    );
  }

  let body: React.ReactNode;
  if (view === 'loading') body = <MyLine kind="loading">불러오는 중…</MyLine>;
  else if (view === 'loadfail') body = <MyLine kind="error">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</MyLine>;
  else if (view === 'empty') body = <MyLine kind="empty">아직 남기신 글이 없습니다.</MyLine>;
  else {
    body = (
      <>
        <RdList>
          {GUESTBOOK.map((g) => (
            <li className="rd-list__li" key={g.id}>
              <Link className="rd-row" to={PV.openMemorial}>
                <span className="rd-row__main">
                  <span className="rd-row__title">故 {g.deceasedName}</span>
                  <span className="rd-mp-msg">{g.message}</span>
                  <span className="rd-row__info">{formatKstDate(g.createdAt)}</span>
                </span>
                <span className="rd-row__chev"><IconChevronRight /></span>
              </Link>
            </li>
          ))}
        </RdList>
        {view === 'truncated' && <p className="rd-mp-foot-note">최근 {LIST_LIMIT}건까지만 표시됩니다.</p>}
      </>
    );
  }

  return (
    <div className="rd-container rd-screen">
      <div className="rd-mp-read">
        <RdPageHead title="내가 남긴 방명록" />
        <div>{body}</div>
      </div>
      {bar}
    </div>
  );
}
