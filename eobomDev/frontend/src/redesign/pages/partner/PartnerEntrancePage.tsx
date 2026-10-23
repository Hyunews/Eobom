import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdField, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdNotice } from '../../parts/RdNotices';
import { RdTabs } from '../../parts/RdNav';
import { IconInfo, IconMail, IconSearch } from '../../parts/icons';
import { IconBuilding, IconScale, IconLockSmall, PartnerRoot, PartnerTopBar } from './PartnerShell';
import { EXPERT_CATEGORIES, PARTNER_NAME, PV_PARTNER } from './partnerData';

// 8단계 묶음 10 · /preview/partner/login — 파트너 포털 입구(로그인 · 가입). 정본: 01-05 §14-2 · 판 6-1(로그인) · 6-2(사업자 가입) · 6-3(전문가 가입).
// 데스크톱 = 왼쪽 460 설명 + 오른쪽 종이 카드(최대 600) / 모바일 = 한 열(제목 한 줄, 심사 안내는 카드 아래).
// 전문가 가입 칸 구성은 묶음 11이 서버(전문가 재신청·반려 사유)와 함께 마무리한다 — 입구 카드는 한 장이라 여기서 같이 그린다.

type AccountType = 'FACILITY' | 'EXPERT';
type Mode = 'login' | 'signup';
type Scenario = 'ok' | 'wrong' | 'rejected' | 'pending' | 'suspended' | 'duplicate' | 'network';
type Result = { tone: 'info' | 'caution' | 'success'; title: string; desc?: string } | null;

const DEMOS: DemoOption[] = [
  { value: 'ok', label: '정상 (로그인 성공 · 가입 접수)' },
  { value: 'wrong', label: '로그인 실패 · 이메일 또는 비밀번호 틀림', group: '실패' },
  { value: 'rejected', label: '로그인 거부 · 반려됨 + 반려 사유', group: '실패' },
  { value: 'pending', label: '로그인 거부 · 심사 중', group: '실패' },
  { value: 'suspended', label: '로그인 거부 · 정지됨', group: '실패' },
  { value: 'duplicate', label: '가입 실패 · 이미 가입된 이메일', group: '실패' },
  { value: 'network', label: '서버 통신 오류', group: '실패' },
];

// 서버 문구 그대로(partnerController.ts PARTNER_STATUS_MESSAGE · login)
const SERVER_MSG = {
  wrong: '이메일 또는 비밀번호가 올바르지 않습니다.',
  pending: '가입 심사가 진행 중입니다. 승인 후 로그인하실 수 있습니다.',
  rejected: '가입이 반려되었습니다. 반려 사유를 확인해주세요.',
  suspended: '이용이 정지된 계정입니다. 고객센터로 문의해주세요.',
  duplicate: '이미 가입 신청된 이메일입니다.',
  network: '서버와 통신 중 오류가 발생했습니다.',
  signupOk: '가입 신청이 접수되었습니다. 운영자 심사 후 승인 결과를 안내드립니다.',
  mismatch: '비밀번호가 일치하지 않습니다.',
};
const EXAMPLE_REJECT_REASON = '[예시] 사업자등록번호가 확인되지 않습니다.';
const EXAMPLE_ADDRESS = '서울 중구 세종대로 110';

const EMPTY = {
  email: '', password: '', passwordConfirm: '',
  bizRegNo: '', companyName: '', ownerName: '', contactName: '', facilityPhone: '',
  category: 'LAWYER', expertName: '', licenseNo: '', licenseOrg: '', expertPhone: '', officeAddress: '', bio: '',
};
type Form = typeof EMPTY;

export function PartnerEntrancePage() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario>('ok');
  const [type, setType] = useState<AccountType>('FACILITY');
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setResult(null);
    setErrors({});
  };

  // 칸마다 오류(브라우저 기본 검증 안 씀, 00-44 §8). 비어 있는 칸은 같은 글 "입력해주세요."
  const validate = (): boolean => {
    const need: (keyof Form)[] =
      mode === 'login'
        ? ['email', 'password']
        : type === 'FACILITY'
          ? ['email', 'password', 'passwordConfirm', 'bizRegNo', 'companyName', 'ownerName', 'contactName', 'facilityPhone']
          : ['email', 'password', 'passwordConfirm', 'expertName', 'licenseNo', 'expertPhone'];
    const next: Partial<Record<keyof Form, string>> = {};
    need.forEach((k) => {
      if (!form[k].trim()) next[k] = '입력해주세요.';
    });
    if (mode === 'signup') {
      if (!next.password && form.password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다.';
      if (!next.passwordConfirm && !next.password && form.password !== form.passwordConfirm) next.passwordConfirm = SERVER_MSG.mismatch;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!validate()) return;
    setBusy(true);
    await sleep(700);
    setBusy(false);

    if (scenario === 'network') {
      setResult({ tone: 'caution', title: SERVER_MSG.network });
      return;
    }
    if (mode === 'login') {
      if (scenario === 'wrong') setResult({ tone: 'caution', title: SERVER_MSG.wrong });
      else if (scenario === 'pending') setResult({ tone: 'caution', title: SERVER_MSG.pending });
      else if (scenario === 'suspended') setResult({ tone: 'caution', title: SERVER_MSG.suspended });
      else if (scenario === 'rejected') {
        // 🔴 반려 사유를 로그인 거부 응답에 싣고 결과 상자에 보인다(01-05 §14-2). 판 6-11 "심사 대기"·6-12 "반려됨" 화면은 만들지 않는다.
        setResult({ tone: 'caution', title: SERVER_MSG.rejected, desc: `반려 사유: ${EXAMPLE_REJECT_REASON}` });
      } else {
        // 로그인 성공 문구는 이름 대신 상호(2026-10-19 개발자)
        setResult({ tone: 'success', title: `${type === 'FACILITY' ? PARTNER_NAME : '[예시] 박○○'}님, 로그인되었습니다.` });
        await sleep(900);
        navigate(PV_PARTNER.home);
      }
      return;
    }
    if (scenario === 'duplicate') {
      setResult({ tone: 'caution', title: SERVER_MSG.duplicate });
      return;
    }
    setResult({ tone: 'info', title: SERVER_MSG.signupOk });
    setForm(EMPTY);
    setMode('login');
  };

  const field = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <RdField label={label} error={errors[k]}>
      {(p) => <RdInput {...p} value={form[k]} onChange={set(k)} {...props} />}
    </RdField>
  );

  return (
    <PartnerRoot>
      <PartnerTopBar />
      <div className={`rd-pt-enter${mode === 'signup' ? ' is-signup' : ''}`}>
        <div className="rd-pt-enter__intro">
          <h1 className="rd-pt-enter__title">사업자·전문가 파트너 포털</h1>
          <p className="rd-pt-enter__sub">
            <span>이메일과 비밀번호로 가입·로그인합니다.</span>
            <span>소셜 로그인이 아닙니다.</span>
          </p>
          {/* 심사 안내: 데스크톱은 점선 아래 왼쪽 칸, 모바일은 카드 아래(CSS가 order로 옮김) */}
          <p className="rd-pt-enter__review rd-pt-enter__review--desk">
            <IconInfo size={22} />
            <span>가입 신청 후 운영자 심사를 거쳐 승인되면 로그인하실 수 있습니다.</span>
          </p>
        </div>

        <form className="rd-pt-card" onSubmit={submit} noValidate>
          <div className="rd-pt-types" role="group" aria-label="계정 유형">
            <button type="button" aria-pressed={type === 'FACILITY'} className="rd-pt-type" onClick={() => { setType('FACILITY'); setErrors({}); setResult(null); }}>
              <IconBuilding />
              <span className="rd-pt-type__long">장사시설 사업자</span>
              <span className="rd-pt-type__short">사업자</span>
            </button>
            <button type="button" aria-pressed={type === 'EXPERT'} className="rd-pt-type" onClick={() => { setType('EXPERT'); setErrors({}); setResult(null); }}>
              <IconScale />
              <span>전문가</span>
            </button>
          </div>

          <RdTabs
            label="로그인 또는 회원가입"
            tabs={[{ value: 'login', label: '로그인' }, { value: 'signup', label: '회원가입' }]}
            value={mode}
            onChange={(v) => switchMode(v as Mode)}
          />

          {result && (
            <div role={result.tone === 'caution' ? 'alert' : 'status'}>
              <RdNotice tone={result.tone} title={result.title}>{result.desc}</RdNotice>
            </div>
          )}

          {mode === 'login' ? (
            <div className="rd-pt-fields">
              <RdField label="이메일" error={errors.email}>
                {(p) => (
                  <span className="rd-pt-iconinput">
                    <span className="rd-pt-iconinput__icon"><IconMail size={18} /></span>
                    <RdInput {...p} type="email" placeholder="partner@example.com" autoComplete="username" value={form.email} onChange={set('email')} />
                  </span>
                )}
              </RdField>
              <RdField label="비밀번호" error={errors.password}>
                {(p) => (
                  <span className="rd-pt-iconinput">
                    <span className="rd-pt-iconinput__icon"><IconLockSmall size={18} /></span>
                    <RdInput {...p} type="password" autoComplete="current-password" value={form.password} onChange={set('password')} />
                  </span>
                )}
              </RdField>
            </div>
          ) : (
            <>
              <section className="rd-pt-sec">
                <h2 className="rd-pt-sec__title">계정</h2>
                {field('email', '이메일', { type: 'email', autoComplete: 'username' })}
                <div className="rd-pt-grid2">
                  {field('password', '비밀번호 (8자 이상)', { type: 'password', autoComplete: 'new-password' })}
                  {field('passwordConfirm', '비밀번호 확인', { type: 'password', autoComplete: 'new-password' })}
                </div>
              </section>

              {type === 'FACILITY' ? (
                <section className="rd-pt-sec">
                  <h2 className="rd-pt-sec__title">사업자 정보</h2>
                  <div className="rd-pt-grid2">
                    {field('bizRegNo', '사업자등록번호', { placeholder: '000-00-00000' })}
                    {field('companyName', '상호')}
                    {field('ownerName', '대표자명')}
                    {field('contactName', '담당자명')}
                    {field('facilityPhone', '담당자 연락처', { type: 'tel' })}
                  </div>
                </section>
              ) : (
                <section className="rd-pt-sec">
                  <h2 className="rd-pt-sec__title">자격 정보</h2>
                  <div className="rd-pt-grid2">
                    <RdField label="전문 분야">
                      {(p) => (
                        <RdSelect {...p} value={form.category} onChange={set('category')}>
                          {EXPERT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </RdSelect>
                      )}
                    </RdField>
                    {field('expertName', '성명')}
                    {field('licenseNo', '자격증 등록번호')}
                    {field('expertPhone', '연락처', { type: 'tel' })}
                    <div className="rd-pt-span2">
                      <RdField label="등록 기관" optional>
                        {(p) => <RdInput {...p} placeholder="예: 대한변호사협회" value={form.licenseOrg} onChange={set('licenseOrg')} />}
                      </RdField>
                    </div>
                    <div className="rd-pt-span2">
                      <RdField label="사무실 주소" optional>
                        {(p) => (
                          <div className="rd-pt-addr">
                            <RdInput {...p} placeholder="주소 검색으로 입력하거나 직접 입력 (예: ..., 0층)" value={form.officeAddress} onChange={set('officeAddress')} />
                            {/* 견본: 주소 검색 창 대신 예시 주소를 채운다. 교체 때 AddressSearchModal로 잇는다(00-44 §9-4 묶음 5 판정) */}
                            <RdButton kind="secondary" place="row" onClick={() => setForm((f) => ({ ...f, officeAddress: EXAMPLE_ADDRESS }))}>
                              <span className="rd-pt-addr__btn"><IconSearch size={18} />주소 검색</span>
                            </RdButton>
                          </div>
                        )}
                      </RdField>
                    </div>
                    <div className="rd-pt-span2">
                      <RdField label="소개" optional>
                        {(p) => <textarea {...p} className="rd-input rd-input--area" rows={4} value={form.bio} onChange={set('bio')} />}
                      </RdField>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          <RdButtonRow place="screen">
            <RdButton type="submit" busy={busy} busyText="처리 중…">{mode === 'login' ? '로그인' : '가입 신청'}</RdButton>
          </RdButtonRow>
        </form>

        <p className="rd-pt-enter__review rd-pt-enter__review--mob">
          <IconInfo size={20} />
          <span>가입 신청 후 운영자 심사를 거쳐 승인되면 로그인하실 수 있습니다.</span>
        </p>
      </div>
      <div className="rd-pt-demo">
        <DemoBar value={scenario} options={DEMOS} onChange={(v) => { setScenario(v as Scenario); setResult(null); }} />
      </div>
    </PartnerRoot>
  );
}
