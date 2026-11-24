import React, { useState } from 'react';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdList, RdListRow } from '../../parts/RdCards';
import { RdPageHead } from '../../parts/RdNav';
import { MyGate, MySec } from '../my/myShared';
import {
  ConsentRequiredDialog, LinkDialog, LoginDialog, RecoveryDialog, type LoginNotice,
} from './LoginDialogs';
import '../my/mypage.css';
import '../my/account.css';

// 8단계 묶음 8 · /preview/login — 로그인 창 4종(4-16~4-19)과 로그인 가림판(#11, 00-34 §2.2 결정 ②)을 한곳에서 연다.
// 실제 화면에는 이 쪽이 없다. 창은 어느 화면에서나 뜬다(헤더 [로그인] · 가림판 [로그인] · 로그인 직후 상태 조회).
// 4-18·4-19는 바깥·Esc로 닫히지 않는다 — 견본은 창 안 버튼으로만 닫는다.

type Open =
  | { kind: 'login'; tab: 'login' | 'signup'; notice?: LoginNotice }
  | { kind: 'link'; variant?: string }
  | { kind: 'recovery'; variant?: string }
  | { kind: 'consent'; variant?: string };

const DEMOS: DemoOption[] = [
  { value: 'list', label: '창 고르기 (기본)' },
  { value: 'gate', label: '로그인 가림판 (로그인 전 화면)' },
];

interface Item {
  title: string;
  info: string;
  open: Open;
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: '로그인 창 · 4-16',
    items: [
      { title: '로그인 탭', info: '소셜 버튼 3개', open: { kind: 'login', tab: 'login' } },
      { title: '로그인 탭 · 세션 만료 안내', info: '안내 상자 한 줄', open: { kind: 'login', tab: 'login', notice: 'expired' } },
      { title: '회원가입 탭', info: '동의 전에는 소셜 버튼이 흐림', open: { kind: 'login', tab: 'signup' } },
      { title: '회원가입 탭 · 가입되지 않은 계정 안내', info: '로그인 탭에서 신규 계정이면 이 탭으로 다시 열림', open: { kind: 'login', tab: 'signup', notice: 'notfound' } },
    ],
  },
  {
    title: '이미 가입된 이메일 창 · 4-17',
    items: [
      { title: '기본', info: '통합 · 새 계정 · 취소', open: { kind: 'link' } },
      { title: '실패 글 ①', info: '처리 중 오류가 발생했습니다.', open: { kind: 'link', variant: 'err1' } },
      { title: '실패 글 ②', info: '서버와 통신 중 오류가 발생했습니다.', open: { kind: 'link', variant: 'err2' } },
      { title: '처리 중', info: '세 버튼이 흐려지기만 함', open: { kind: 'link', variant: 'busy' } },
    ],
  },
  {
    title: '탈퇴 신청 계정 창 · 4-18',
    items: [
      { title: '기본', info: '바깥·Esc로 닫히지 않음', open: { kind: 'recovery' } },
      { title: '처리 중…', info: '두 버튼 잠김', open: { kind: 'recovery', variant: 'busy' } },
      { title: '실패 글', info: '처리 중 오류가 발생했습니다.', open: { kind: 'recovery', variant: 'fail' } },
    ],
  },
  {
    title: '이용 동의 필요 창 · 4-19',
    items: [
      { title: '기본', info: '동의 전에는 [동의하고 계속하기]가 잠김', open: { kind: 'consent' } },
      { title: '실패 글 (동의한 뒤 눌러 보기)', info: '처리 중 오류가 발생했습니다.', open: { kind: 'consent', variant: 'fail' } },
    ],
  },
];

export function LoginPage() {
  const [view, setView] = useState('list');
  const [open, setOpen] = useState<Open | null>(null);
  const [gateLogin, setGateLogin] = useState(false);
  const close = () => setOpen(null);

  return (
    <div className="rd-container rd-screen">
      {view === 'gate' ? (
        // 로그인이 필요한 화면의 가림판 — 모두 같은 틀. [로그인]이 로그인 창을 연다
        <MyGate title="내 상담 내역" screenName="내 상담 내역" onLogin={() => setGateLogin(true)} />
      ) : (
        <div className="rd-mp-read">
          <RdPageHead title="로그인 창 미리보기" desc="미리보기 전용 쪽입니다. 창은 어느 화면에서나 뜹니다." />
          {GROUPS.map((g) => (
            <MySec key={g.title} title={g.title}>
              <RdList>
                {g.items.map((it) => (
                  <RdListRow key={it.title} title={it.title} info={it.info} onClick={() => setOpen(it.open)} />
                ))}
              </RdList>
            </MySec>
          ))}
        </div>
      )}
      <DemoBar value={view} options={DEMOS} onChange={setView} />

      {open?.kind === 'login' && <LoginDialog key={`${open.tab}-${open.notice}`} initialTab={open.tab} initialNotice={open.notice} onClose={close} />}
      {open?.kind === 'link' && <LinkDialog key={open.variant} variant={open.variant} onClose={close} />}
      {open?.kind === 'recovery' && <RecoveryDialog key={open.variant} variant={open.variant} onClose={close} />}
      {open?.kind === 'consent' && <ConsentRequiredDialog key={open.variant} variant={open.variant} onClose={close} />}
      {gateLogin && <LoginDialog onClose={() => setGateLogin(false)} />}
    </div>
  );
}
