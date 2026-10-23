import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdButton } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdField, RdInput } from '../../parts/RdInputs';
import { RdNotice } from '../../parts/RdNotices';
import { IconMail } from '../../parts/icons';
import { IconLockSmall, IconShield, PartnerRoot } from '../partner/PartnerShell';
import { AdminTopBar, useAdminPreview } from './AdminShell';
import { PV_ADMIN } from './adminData';
import '../partner/partner.css';
import './admin.css';

// 8단계 묶음 12 · /preview/admin/login — 운영자 로그인. 정본: 00-37 §4.1 틀 · 판 6-13 · 00-44 §5-2(이 화면만 좁은 폭).
// 가운데 카드 420: 방패 + "운영자 로그인" · 이메일 · 비밀번호 · [로그인]. 위 바에는 종이 없다. 로그인되면 홈으로(A-3).
// 공개 가입·비밀번호 찾기 없음(계정은 seed-admin.ts로만, 00-37 §2.3).

type Scenario = 'ok' | 'wrong' | 'locked' | 'network';
const DEMOS: DemoOption[] = [
  { value: 'ok', label: '정상 (홈으로)' },
  { value: 'wrong', label: '이메일 또는 비밀번호 틀림', group: '실패' },
  { value: 'locked', label: '연속 5회 실패 · 잠금 중', group: '실패' },
  { value: 'network', label: '서버 통신 오류', group: '실패' },
];

// 서버 문구 그대로(adminController.ts login · LOCKED_MESSAGE)
const SERVER_MSG: Record<Exclude<Scenario, 'ok'>, string> = {
  wrong: '이메일 또는 비밀번호가 올바르지 않습니다.',
  locked: '잠시 후 다시 시도해 주세요.',
  network: '서버와 통신 중 오류가 발생했습니다.',
};

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { search } = useAdminPreview();
  const [scenario, setScenario] = useState<Scenario>('ok');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const next = {
      email: email.trim() ? undefined : '확인이 필요한 항목입니다.',
      password: password ? undefined : '확인이 필요한 항목입니다.',
    };
    setErrors(next);
    if (next.email || next.password) return;
    setBusy(true);
    await sleep(600);
    setBusy(false);
    if (scenario === 'ok') {
      navigate(`${PV_ADMIN.home}${search}`);
      return;
    }
    setServerError(SERVER_MSG[scenario]);
  };

  return (
    <PartnerRoot>
      <AdminTopBar />
      <main className="rd-ad-login">
        <form className="rd-ad-login__card" onSubmit={submit} noValidate>
          <div className="rd-ad-login__head">
            <IconShield size={26} />
            <h1 className="rd-ad-login__title">운영자 로그인</h1>
          </div>
          {serverError && <RdNotice tone="caution" title={serverError} />}
          <div className="rd-pt-fields">
            <RdField label="이메일" error={errors.email}>
              {(p) => (
                <span className="rd-pt-iconinput">
                  <span className="rd-pt-iconinput__icon"><IconMail size={18} /></span>
                  <RdInput {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
                </span>
              )}
            </RdField>
            <RdField label="비밀번호" error={errors.password}>
              {(p) => (
                <span className="rd-pt-iconinput">
                  <span className="rd-pt-iconinput__icon"><IconLockSmall size={18} /></span>
                  <RdInput {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </span>
              )}
            </RdField>
          </div>
          <RdButton type="submit" kind="primary" place="screen" busy={busy} busyText="로그인 중…">로그인</RdButton>
        </form>
        <DemoBar value={scenario} options={DEMOS} onChange={(v) => setScenario(v as Scenario)} />
      </main>
    </PartnerRoot>
  );
}
