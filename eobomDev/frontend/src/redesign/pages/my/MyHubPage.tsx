import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KAKAO_CHANNEL_CHAT_URL } from '../../../config';
import { ReleaseBand } from './ReleaseBand';
import { AuthLinkDialog, ConsentDialog, ProfileDialog } from './AccountDialogs';
import { FamilyDialog } from './FamilyDialog';
import { WithdrawDialog } from './WithdrawDialog';
import { LoginDialog } from '../auth/LoginDialogs';
import { RdBadge } from '../../parts/RdButtons';
import { RdButton } from '../../parts/RdButtons';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdList } from '../../parts/RdCards';
import { useRdToast } from '../../parts/RdModal';
import { IconChevronRight, IconMail, IconSend, IconUser, IconUsers } from '../../parts/icons';
import {
  IconBook, IconBubble, IconExternal, IconFlower, IconGear, IconInbox, IconPhoneHeart, IconQuill, IconShield, MyGate, MySec,
} from './myShared';
import { PV } from './myData';
import './mypage.css';

// 8단계 묶음 7·8 · /preview/mypage — 4단계 판 4-1(마이페이지 허브). 정본: 00-36 §4.1 · §4.9 · 4단계 묶음 1 캔버스.
// 줄을 누르면 미리보기 안의 화면으로 이어진다. 묶음 8에서 내 정보 · 가족 지정 · 계정 연동 · 개인정보·동의 · 회원 탈퇴 창이 열리고,
// "나를 가족으로 지정한 분"은 /preview/family-shared 로 간다. 사후 개봉 요청 띠(4-15)는 보기 상태에서 고르면 헤더 아래에 붙는다.
// 숫자(상담 · 부고장)와 이름·이메일은 예시 값이다(10단계 교체 때 /api/me/summary · /api/auth/me 값으로).

type View = 'in' | 'noemail' | 'admin' | 'out' | 'band';
type DlgKind = 'profile' | 'family' | 'auth' | 'consent' | 'withdraw';
interface Dlg {
  kind: DlgKind;
  variant?: string;
}

// 창 상태 — 고르면 그 창이 바로 열린다(창이 열려 있으면 이 줄을 가리므로 닫은 뒤 다시 고른다)
const DEMOS: DemoOption[] = [
  { value: 'in', label: '로그인 후 (기본)' },
  { value: 'noemail', label: '이메일 정보 없음' },
  { value: 'admin', label: '운영자 계정 (ADMIN 딱지)' },
  { value: 'out', label: '로그인 전' },
  { value: 'band', label: '사후 개봉 요청 띠 (요청 중)', group: '사후 개봉 요청 띠 4-15' },
  { value: 'dlg:profile:first', label: '내 정보 · 처음(빈 칸)', group: '창 상태' },
  { value: 'dlg:profile:loading', label: '내 정보 · 불러오는 중', group: '창 상태' },
  { value: 'dlg:profile:saveerr', label: '내 정보 · 저장 실패(저장을 눌러 보기)', group: '창 상태' },
  { value: 'dlg:family:empty', label: '가족 지정 · 빈 목록', group: '창 상태' },
  { value: 'dlg:family:form', label: '가족 지정 · 추가 칸 열림', group: '창 상태' },
  { value: 'dlg:family:full', label: '가족 지정 · 10명(추가 버튼 없음)', group: '창 상태' },
  { value: 'dlg:family:loading', label: '가족 지정 · 불러오는 중', group: '창 상태' },
  { value: 'dlg:auth:only1', label: '계정 연동 · 하나뿐(해제 눌러 보기)', group: '창 상태' },
  { value: 'dlg:auth:back', label: '계정 연동 · 연동하고 돌아온 직후', group: '창 상태' },
  { value: 'dlg:consent:loading', label: '개인정보·동의 · 불러오는 중', group: '창 상태' },
  { value: 'dlg:consent:loadfail', label: '개인정보·동의 · 불러오기 실패', group: '창 상태' },
  { value: 'dlg:withdraw:empty', label: '회원 탈퇴 · 지워질 기록 없음', group: '창 상태' },
  { value: 'dlg:withdraw:done', label: '회원 탈퇴 · 이미 신청된 계정(5장)', group: '창 상태' },
  { value: 'dlg:withdraw:submitfail', label: '회원 탈퇴 · 신청 실패(4장에서 눌러 보기)', group: '창 상태' },
  { value: 'dlg:withdraw:loading', label: '회원 탈퇴 · 불러오는 중', group: '창 상태' },
  { value: 'dlg:withdraw:loadfail', label: '회원 탈퇴 · 불러오기 실패', group: '창 상태' },
];

interface Row {
  icon: React.ReactNode;
  name: string;
  /** 미리보기 안의 화면 */
  to?: string;
  /** 바깥 링크(새 창) */
  external?: string;
  /** 누르면 여는 창 */
  dialog?: DlgKind;
}

const SECTION_ME: Row[] = [
  { icon: <IconUser size={22} />, name: '내 정보', dialog: 'profile' },
  { icon: <IconUsers size={22} />, name: '가족 지정', dialog: 'family' },
];
const SECTION_LEFT: Row[] = [
  { icon: <IconBook />, name: '디지털 엔딩노트', to: PV.endingNote },
  { icon: <IconMail size={22} />, name: '유족 메시지 보관함', to: PV.farewell },
  { icon: <IconPhoneHeart />, name: '디지털 정산', to: PV.digital },
  { icon: <IconFlower />, name: '내 부고장 · 추모관', to: PV.list },
  { icon: <IconQuill />, name: '내가 남긴 방명록', to: PV.guestbook },
];
const SECTION_SHARED: Row[] = [{ icon: <IconInbox />, name: '나를 가족으로 지정한 분', to: PV.familyShared }];
const SECTION_ACTIVITY: Row[] = [
  { icon: <IconSend size={22} />, name: '내 상담 내역', to: PV.consult },
  { icon: <IconBubble />, name: '카카오톡으로 문의하기', external: KAKAO_CHANNEL_CHAT_URL },
  { icon: <IconShield />, name: '개인정보·동의', dialog: 'consent' },
];

function NavRows({ rows, onOpen }: { rows: Row[]; onOpen: (kind: DlgKind) => void }) {
  return (
    <RdList>
      {rows.map((r) => {
        const inner = (
          <>
            <span className="rd-navrow__icon">{r.icon}</span>
            <span className="rd-row__main">
              <span className="rd-navrow__name">{r.name}</span>
            </span>
            <span className="rd-row__chev">{r.external ? <IconExternal /> : <IconChevronRight />}</span>
          </>
        );
        return (
          <li className="rd-list__li" key={r.name}>
            {r.to ? (
              <Link className="rd-row rd-row--nav rd-mp-navrow" to={r.to}>{inner}</Link>
            ) : r.external ? (
              <a className="rd-row rd-row--nav rd-mp-navrow" href={r.external} target="_blank" rel="noopener noreferrer">{inner}</a>
            ) : (
              <button type="button" className="rd-row rd-row--nav rd-mp-navrow" onClick={() => r.dialog && onOpen(r.dialog)}>{inner}</button>
            )}
          </li>
        );
      })}
    </RdList>
  );
}

export function MyHubPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('in');
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const toast = useRdToast();

  // 창 상태를 고르면 그 창이 바로 열린다. 창을 닫으면 보기 상태는 그대로다.
  const pick = (v: string) => {
    if (v.startsWith('dlg:')) {
      const [, kind, variant] = v.split(':');
      setView('in');
      setDlg({ kind: kind as DlgKind, variant });
    } else {
      setDlg(null);
      setView(v as View);
    }
  };
  const bar = <DemoBar value={dlg?.variant ? `dlg:${dlg.kind}:${dlg.variant}` : view} options={DEMOS} onChange={pick} />;
  const open = (kind: DlgKind) => setDlg({ kind });
  const close = () => setDlg(null);

  if (view === 'out') {
    // 4-1 로그인 전: 이 화면엔 쪽 제목이 없다 — 공통 틀 "마이페이지는 로그인 후 이용 가능합니다."
    return (
      <div className="rd-container rd-screen">
        <MyGate screenName="마이페이지" onLogin={() => setLoginOpen(true)} />
        {bar}
        {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} />}
      </div>
    );
  }

  const name = '홍길동';
  const email = view === 'noemail' ? '이메일 정보 없음' : 'hong@example.com';

  return (
    <>
    {/* 4-15 사후 개봉 요청 띠 — 헤더 바로 아래 사이트 전체 가로 띠. 뒤 화면은 허브 */}
    {view === 'band' && <ReleaseBand requesterName="김영희" />}
    <div className="rd-container rd-screen">
      <div className="rd-mp-read">
        {/* 머리 */}
        <div className="rd-mp-head">
          <div className="rd-mp-avatar" role="img" aria-label="프로필 사진 자리">{name.charAt(0)}</div>
          <div className="rd-mp-head__body">
            <div className="rd-mp-head__name">
              <h1 className="rd-t-title">{name} 님</h1>
              <span className="rd-mp-head__badge"><RdBadge kind="draft">{view === 'admin' ? 'ADMIN' : 'MEMBER'}</RdBadge></span>
            </div>
            <p className="rd-mp-head__email">{email}</p>
          </div>
          {/* 계정 연동 창(4-4). 데스크톱 = 아이콘 + 글자, 모바일 = 아이콘만 */}
          <RdButton kind="secondary" aria-label="계정 연동" onClick={() => open('auth')}>
            <IconGear />
            <span className="rd-mp-desk">계정 연동</span>
          </RdButton>
        </div>

        {/* 숫자 줄 — 상담은 누를 수 없고, 부고장은 "내 부고장 · 추모관 줄"과 같은 곳으로 가는 두 번째 입구 */}
        <div className="rd-mp-statwrap">
          <dl className="rd-stats rd-mp-stats">
            <div className="rd-stats__cell">
              <dt><IconSend size={16} />상담</dt>
              <dd>3</dd>
            </div>
            <div className="rd-stats__cell">
              <dt><IconFlower size={16} />부고장</dt>
              <dd>1</dd>
            </div>
          </dl>
          {/* 부고장 칸(오른쪽 절반)을 덮는 링크 — dt·dd를 링크로 감싸지 않으려고 dl 밖에 둔다 */}
          <Link className="rd-mp-stat__link" to={PV.list} aria-label="부고장 1건, 내 부고장·추모관으로">
            <span aria-hidden="true"><IconChevronRight /></span>
          </Link>
        </div>

        {/* 나 — 구간 제목 없음(4단계 확정) */}
        <section className="rd-mp-sec"><NavRows rows={SECTION_ME} onOpen={open} /></section>
        <MySec title="내가 남긴 것"><NavRows rows={SECTION_LEFT} onOpen={open} /></MySec>
        <MySec title="나에게 공유된 것"><NavRows rows={SECTION_SHARED} onOpen={open} /></MySec>
        <MySec title="내 활동과 계정"><NavRows rows={SECTION_ACTIVITY} onOpen={open} /></MySec>

        <div className="rd-mp-bottom">
          <button type="button" onClick={() => toast.show('로그아웃 되었습니다.')}>로그아웃</button>
          <button type="button" className="rd-mp-bottom__danger" onClick={() => open('withdraw')}>회원 탈퇴</button>
        </div>
      </div>
      {bar}
      {toast.node}

      {dlg?.kind === 'profile' && <ProfileDialog key={dlg.variant} variant={dlg.variant} onClose={close} />}
      {dlg?.kind === 'family' && <FamilyDialog key={dlg.variant} variant={dlg.variant} onClose={close} />}
      {dlg?.kind === 'auth' && <AuthLinkDialog key={dlg.variant} variant={dlg.variant} onClose={close} />}
      {dlg?.kind === 'consent' && (
        <ConsentDialog key={dlg.variant} variant={dlg.variant} onClose={close} onGoWithdrawal={() => open('withdraw')} />
      )}
      {dlg?.kind === 'withdraw' && (
        <WithdrawDialog
          key={dlg.variant}
          variant={dlg.variant}
          onClose={close}
          onGoExport={() => navigate(PV.farewell)}
          onDone={() => {
            close();
            toast.show('로그아웃 되었습니다.');
          }}
        />
      )}
    </div>
    </>
  );
}
