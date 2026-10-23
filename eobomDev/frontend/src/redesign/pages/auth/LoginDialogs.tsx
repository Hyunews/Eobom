import React, { useState } from 'react';
import { RdButton, RdTextLink } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdConsentGroup, type RdConsentItem } from '../../parts/RdInputs';
import { RdDialog } from '../../parts/RdModal';
import { RdNotice } from '../../parts/RdNotices';
import { RdTabs } from '../../parts/RdNav';
import { FAKE_MS } from '../my/accountData';
import { MyResult } from '../my/myShared';
import { PrivacyPage } from '../../../pages/PrivacyPage';
import { TermsPage } from '../../../pages/TermsPage';
import '../my/account.css';

// 8단계 묶음 8 · 로그인 창 4종(4-16~4-19). 정본: 00-27 §8.2 · 00-34 §2.2 · 00-36 §4.5-1 · 4단계 묶음 4 캔버스.
// 소셜 버튼을 누르면 실제로는 각 회사 로그인 화면으로 나간다 — 견본은 창만 닫는다. 데모 로그인 칸은 그리지 않는다(확정 ③).
// 4-18·4-19는 바깥을 눌러도 Esc로도 닫히지 않는다(결정 없이 지나가면 안 되는 화면) — onClose를 비워 둔다.

const NOTICE_TEXT = {
  expired: '세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.',
  notfound: '가입되지 않은 계정입니다. 아래에서 약관 동의 후 회원가입을 진행해주세요.',
} as const;
export type LoginNotice = keyof typeof NOTICE_TEXT;

const noop = () => {};

// ───── 소셜 버튼 3개 — 각 회사 지침 색은 그대로(네이버 흰 글자 대비 2.2:1 예외, 4단계 묶음 4 점검) ─────
function SocialButtons({ disabled, onSelect }: { disabled?: boolean; onSelect: () => void }) {
  return (
    <div className={`rd-ac-social${disabled ? ' is-off' : ''}`}>
      <button type="button" className="rd-ac-social__btn rd-ac-social__btn--kakao" disabled={disabled} onClick={onSelect}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.484 2 10.782C2 13.567 3.791 16.002 6.5 17.388L5.59 20.738C5.474 21.164 5.952 21.492 6.31 21.254L10.378 18.55C10.906 18.625 11.446 18.665 12 18.665C17.523 18.665 22 15.181 22 10.883C22 6.584 17.523 3 12 3Z" fill="#191919" />
        </svg>
        <span>카카오로 시작하기</span>
      </button>
      <button type="button" className="rd-ac-social__btn rd-ac-social__btn--naver" disabled={disabled} onClick={onSelect}>
        <span className="rd-ac-social__n" aria-hidden="true">N</span>
        <span>네이버로 시작하기</span>
      </button>
      <button type="button" className="rd-ac-social__btn rd-ac-social__btn--google" disabled={disabled} onClick={onSelect}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
        <span>구글 계정으로 시작하기</span>
      </button>
    </div>
  );
}

// ───── 만 14세 확인 + 필수 동의 둘 — 회원가입 탭(4-16)과 이용 동의 필요 창(4-19)이 같은 규칙을 쓴다 ─────
// 만 14세 확인은 [모두 동의]에 넣지 않고 따로 둔다(00-19 §9-2-1). 어디에도 저장하지 않는 로컬 게이트다. 마케팅 수신 동의는 받지 않는다(00-28 §9 #2).
const AGE_ITEM: RdConsentItem = { id: 'age', label: '본인은 만 14세 이상입니다.', desc: '이어봄은 만 14세 미만 아동의 가입을 받지 않습니다.' };
const AGREE_ITEMS: RdConsentItem[] = [
  { id: 'terms', label: '서비스 이용약관 동의', required: true },
  { id: 'privacy', label: '개인정보 수집 및 이용 동의', required: true },
];

function useConsent() {
  const [age, setAge] = useState<Record<string, boolean>>({});
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [viewing, setViewing] = useState<'terms' | 'privacy' | null>(null);
  const ready = !!age.age && !!agree.terms && !!agree.privacy;
  const node = (
    <div className="rd-ac-consent">
      <RdConsentGroup items={[AGE_ITEM]} checked={age} onChange={setAge} />
      <RdConsentGroup items={AGREE_ITEMS} checked={agree} onChange={setAgree} onView={(id) => setViewing(id === 'terms' ? 'terms' : 'privacy')} />
    </div>
  );
  // [보기]는 새 탭도 창 위의 창도 아니다 — 같은 창 안에서 본문을 갈아끼운다(00-44 §7-6 ⑥). 체크 상태는 이 훅에 있어 돌아와도 그대로.
  // 본문은 지금 /terms · /privacy 쪽 컴포넌트를 그대로 넣는다(법적 문서 틀은 묶음 9에서 새로 만든다).
  const viewer = viewing && (
    <RdDialog
      footLine
      width={560}
      title={viewing === 'terms' ? '서비스 이용약관' : '개인정보처리방침'}
      onClose={() => setViewing(null)}
      footer={<RdButton place="dialog" onClick={() => setViewing(null)}>뒤로가기</RdButton>}
    >
      {viewing === 'terms' ? <TermsPage /> : <PrivacyPage />}
    </RdDialog>
  );
  return { ready, node, viewer };
}

// ───── 4-16 로그인 창 ─────
export function LoginDialog({
  initialTab = 'login',
  initialNotice,
  onClose,
}: {
  initialTab?: 'login' | 'signup';
  initialNotice?: LoginNotice;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [notice, setNotice] = useState<LoginNotice | undefined>(initialNotice);
  const consent = useConsent();

  if (consent.viewer) return consent.viewer;
  return (
    <RdDialog
      form
      closeX
      width={560}
      title="이어봄 시작하기"
      onClose={onClose}
      footer={
        <div className="rd-ac-partner">
          {/* 사업자·전문가는 따로 쓰는 로그인으로 보낸다(00-06 §7.3 ①) */}
          <RdTextLink href="/partner" onClick={(e) => e.preventDefault()}>파트너 로그인</RdTextLink>
        </div>
      }
    >
      <p className="rd-ac-intro">
        <span>소셜 계정으로 로그인하고</span> <span>엔딩노트 및 웰다잉 토탈 케어 서비스를 이용해보세요.</span>
      </p>
      <div className="rd-mp-editbody">
        <RdTabs
          label="로그인 방식"
          tabs={[{ value: 'login', label: '로그인' }, { value: 'signup', label: '회원가입' }]}
          value={tab}
          onChange={(v) => { setTab(v as 'login' | 'signup'); setNotice(undefined); }}
        />
        {notice && <RdNotice>{NOTICE_TEXT[notice]}</RdNotice>}
        {tab === 'login' ? (
          <SocialButtons onSelect={onClose} />
        ) : (
          <>
            {consent.node}
            {/* 필수 동의 전에는 세 버튼 모두 흐리다 */}
            <SocialButtons disabled={!consent.ready} onSelect={onClose} />
          </>
        )}
      </div>
    </RdDialog>
  );
}

// ───── 4-17 이미 가입된 이메일 창 ─────
const IconChain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
);
const IconPersonPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M19 8v6M16 11h6" />
  </svg>
);

export function LinkDialog({ variant, onClose }: { variant?: string; onClose: () => void }) {
  // variant: err1 / err2 = 실패 글 둘 · busy = 처리 중(세 버튼이 흐려지기만 하고 글자는 그대로)
  const [busy, setBusy] = useState(variant === 'busy');
  const [error, setError] = useState(variant === 'err1' ? '처리 중 오류가 발생했습니다. 다시 시도해주세요.' : variant === 'err2' ? '서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' : '');

  const choose = async () => {
    setBusy(true);
    setError('');
    await sleep(FAKE_MS);
    setBusy(false);
    onClose();
  };

  return (
    <RdDialog
      width={420}
      title="이미 가입된 이메일이에요"
      onClose={() => !busy && onClose()}
      footer={
        <div className="rd-ac-stackfoot">
          <RdButton place="dialog" disabled={busy} onClick={choose}>
            <span className="rd-ac-btnicon"><IconChain />기존 계정에 통합하기 (추천)</span>
          </RdButton>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={choose}>
            <span className="rd-ac-btnicon"><IconPersonPlus />독립된 새 계정으로 가입하기</span>
          </RdButton>
          <button type="button" className="rd-ac-textbtn" disabled={busy} onClick={onClose}>취소</button>
        </div>
      }
    >
      <p className="rd-dialog__desc">
        <strong>hong@example.com</strong>로 이미 <strong>카카오</strong> 계정이 가입되어 있어요.
        <br />
        지금 로그인하신 <strong>네이버</strong> 계정을 어떻게 처리할까요?
      </p>
      {error && <div className="rd-ac-errline"><MyResult tone="err">{error}</MyResult></div>}
    </RdDialog>
  );
}

// ───── 4-18 탈퇴 신청 계정 창 ─────
export function RecoveryDialog({ variant, onClose }: { variant?: string; onClose: () => void }) {
  // variant: busy = 처리 중(두 버튼 잠김) · fail = 실패 글
  const [busy, setBusy] = useState(variant === 'busy');
  const [error, setError] = useState(variant === 'fail' ? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' : '');

  const keepUsing = async () => {
    setBusy(true);
    setError('');
    await sleep(FAKE_MS);
    setBusy(false);
    onClose();
  };

  return (
    <RdDialog
      width={420}
      title="탈퇴가 신청된 계정입니다"
      onClose={noop}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>로그아웃</RdButton>
          <RdButton place="dialog" busy={busy} busyText="처리 중…" onClick={keepUsing}>계속 이용</RdButton>
        </>
      }
    >
      <p className="rd-dialog__desc">
        2026-11-15에 삭제될 예정입니다. 계속 이용하시려면 아래 “계속 이용”을 눌러 탈퇴 신청을 취소해 주세요. 누르지 않고 로그아웃하면 탈퇴 신청이 그대로 유지됩니다.
      </p>
      {error && <div className="rd-ac-errline"><MyResult tone="err">{error}</MyResult></div>}
    </RdDialog>
  );
}

// ───── 4-19 이용 동의 필요 창 ─────
export function ConsentRequiredDialog({ variant, onClose }: { variant?: string; onClose: () => void }) {
  // variant: fail = 실패 글
  const consent = useConsent();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const agree = async () => {
    if (!consent.ready || busy) return;
    setBusy(true);
    setError('');
    await sleep(FAKE_MS);
    setBusy(false);
    if (variant === 'fail') {
      setError('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    onClose();
  };

  if (consent.viewer) return consent.viewer;
  return (
    <RdDialog
      form
      width={560}
      title="이용 동의가 필요합니다"
      onClose={noop}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" className="rd-ac-fit" disabled={busy} onClick={onClose}>동의하지 않고 로그아웃</RdButton>
          <RdButton place="dialog" className="rd-ac-fit" disabled={!consent.ready} busy={busy} busyText="처리 중…" onClick={agree}>동의하고 계속하기</RdButton>
        </>
      }
    >
      <p className="rd-ac-intro">이어봄 이용약관과 개인정보 수집·이용에 대한 동의 기록이 없습니다. 계속 이용하시려면 동의해 주세요.</p>
      <div className="rd-mp-editbody">
        {consent.node}
        {error && <MyResult tone="err">{error}</MyResult>}
      </div>
    </RdDialog>
  );
}
