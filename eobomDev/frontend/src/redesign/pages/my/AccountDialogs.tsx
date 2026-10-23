import React, { useState } from 'react';
import { providerLabel } from '../../../config';
import { RdButton } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdField, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdConfirmDialog, RdDialog } from '../../parts/RdModal';
import {
  CONSENT_SAMPLE, CONTACT_TIME_OPTIONS, EXAMPLE_ADDRESS, FAKE_MS, LINKED_SAMPLE, PROFILE_FILLED, PROFILE_FIRST, PROVIDERS, PROVIDER_DOT,
  type ProfileData,
} from './accountData';
import { MyDl, MyLine, MyResult } from './myShared';
import './account.css';

// 8단계 묶음 8 · 내 정보(4-2) · 계정 연동(4-4) · 개인정보·동의(4-9) 창. 마이페이지 허브(/preview/mypage)에서 열린다.
// 정본: 00-36 §4.2 · §4.5 · 4단계 묶음 1·2 캔버스. 저장·연동은 서버를 부르지 않고 짧은 지연 뒤 결과 글만 낸다.

type Msg = { tone: 'ok' | 'err'; text: string } | null;

// ───── 4-2 내 정보 ─────
export function ProfileDialog({ variant, onClose }: { variant?: string; onClose: () => void }) {
  const first = variant === 'first';
  const loading = variant === 'loading';
  const [cur, setCur] = useState<ProfileData>(first ? PROFILE_FIRST : PROFILE_FILLED);

  const [name, setName] = useState(cur.name);
  const [email, setEmail] = useState(cur.email ?? '');
  const [phone, setPhone] = useState(''); // 새 번호 칸 — 현재 값을 채우지 않는다
  const [clearPhone, setClearPhone] = useState(false);
  const [zonecode, setZonecode] = useState(cur.addressZonecode ?? '');
  const [road, setRoad] = useState(cur.addressRoad ?? '');
  const [detail, setDetail] = useState(''); // 새 상세주소 칸
  const [clearDetail, setClearDetail] = useState(false);
  const [timePref, setTimePref] = useState(cur.contactTimePref ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    await sleep(FAKE_MS);
    setSaving(false);
    if (variant === 'saveerr') {
      setMsg({ tone: 'err', text: '서버와 통신 중 오류가 발생했습니다.' });
      return;
    }
    // 서버가 돌려주는 모양을 흉내 낸다 — 연락처·상세주소는 가려진 값으로 돌아온다
    setCur({
      name,
      email: email || null,
      contactPhone: phone.trim() ? `${phone.trim().slice(0, 3)}-****-${phone.trim().slice(-4)}` : clearPhone ? null : cur.contactPhone,
      addressZonecode: zonecode || null,
      addressRoad: road || null,
      addressDetail: detail.trim() ? '***' : clearDetail ? null : cur.addressDetail,
      contactTimePref: timePref || null,
    });
    setPhone('');
    setClearPhone(false);
    setDetail('');
    setClearDetail(false);
    setMsg({ tone: 'ok', text: '저장되었습니다.' });
  };

  if (loading) {
    return (
      <RdDialog form width={560} title="내 정보" onClose={onClose} footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}>
        <MyLine kind="loading">불러오는 중…</MyLine>
      </RdDialog>
    );
  }

  return (
    <RdDialog
      form
      width={560}
      title="내 정보"
      onClose={() => !saving && onClose()}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={saving} onClick={onClose}>닫기</RdButton>
          <RdButton place="dialog" busy={saving} busyText="저장 중..." onClick={save}>저장</RdButton>
        </>
      }
    >
      <p className="rd-ac-intro">
        <span>연락처·주소는 문의·상담을 위해 미리 저장해두는 용도입니다.</span> <span>언제든 지울 수 있습니다.</span>
      </p>
      <div className="rd-mp-editbody">
        <RdField label="이름" required>
          {(p) => <RdInput {...p} value={name} onChange={(e) => setName(e.target.value)} />}
        </RdField>
        <RdField label="이메일" optional>
          {(p) => <RdInput {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </RdField>
        <RdField label="연락처" optional>
          {(p) => (
            <>
              {cur.contactPhone && !clearPhone && <p className="rd-ac-cur">현재 등록된 번호: {cur.contactPhone}</p>}
              <div className="rd-ac-inline">
                <RdInput
                  {...p}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={cur.contactPhone ? '바꾸시려면 새 번호를 입력하세요' : '010-0000-0000'}
                />
                {cur.contactPhone && (
                  <RdButton kind="secondary" place="dialog" className="rd-ac-inline__btn" onClick={() => { setClearPhone((v) => !v); setPhone(''); }}>
                    {clearPhone ? '삭제 취소' : '삭제'}
                  </RdButton>
                )}
              </div>
            </>
          )}
        </RdField>
        <RdField label="주소" optional>
          {(p) => (
            <div className="rd-ac-addr">
              <div className="rd-ac-inline">
                <RdInput {...p} readOnly value={zonecode} placeholder="우편번호" className="rd-ac-zip" />
                <RdButton
                  kind="secondary"
                  place="dialog"
                  className="rd-ac-inline__btn"
                  onClick={() => { setZonecode(EXAMPLE_ADDRESS.zonecode); setRoad(EXAMPLE_ADDRESS.road); }}
                >
                  주소 검색
                </RdButton>
              </div>
              <RdInput readOnly value={road} placeholder="도로명 주소" aria-label="도로명 주소" />
              {cur.addressDetail && !clearDetail && <p className="rd-ac-cur">현재 등록된 상세주소: {cur.addressDetail}</p>}
              <div className="rd-ac-inline">
                <RdInput
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  aria-label="상세주소"
                  placeholder={cur.addressDetail ? '바꾸시려면 새 상세주소를 입력하세요' : '동·호수 (방문 서비스에서만 필요)'}
                />
                {cur.addressDetail && (
                  <RdButton kind="secondary" place="dialog" className="rd-ac-inline__btn" onClick={() => { setClearDetail((v) => !v); setDetail(''); }}>
                    {clearDetail ? '삭제 취소' : '삭제'}
                  </RdButton>
                )}
              </div>
            </div>
          )}
        </RdField>
        <RdField label="연락 가능 시간대" optional>
          {(p) => (
            <RdSelect {...p} value={timePref} onChange={(e) => setTimePref(e.target.value)}>
              {CONTACT_TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </RdSelect>
          )}
        </RdField>
        {msg && <MyResult tone={msg.tone}>{msg.text}</MyResult>}
      </div>
    </RdDialog>
  );
}

// ───── 4-4 계정 연동 ─────
export function AuthLinkDialog({ variant, onClose }: { variant?: string; onClose: () => void }) {
  // variant: only1 = 소셜 계정이 하나뿐 · back = 연동하고 돌아온 직후
  const [linked, setLinked] = useState<Record<string, string>>(
    variant === 'only1' ? { KAKAO: LINKED_SAMPLE.KAKAO } : variant === 'back' ? { ...LINKED_SAMPLE, GOOGLE: 'hong@gmail.com' } : { ...LINKED_SAMPLE },
  );
  const [msg, setMsg] = useState<Msg>(variant === 'back' ? { tone: 'ok', text: '구글 계정이 연동되었습니다.' } : null);
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unlink = (provider: string) => {
    if (Object.keys(linked).length <= 1) {
      setMsg({ tone: 'err', text: '최소 1개의 소셜 계정은 연동되어 있어야 합니다.' });
      return;
    }
    setMsg(null);
    setAsking(provider);
  };

  const doUnlink = async (provider: string) => {
    setAsking(null);
    setBusy(true);
    setMsg(null);
    await sleep(FAKE_MS);
    setLinked((m) => {
      const next = { ...m };
      delete next[provider];
      return next;
    });
    setBusy(false);
    setMsg({ tone: 'ok', text: `${providerLabel(provider)} 연동이 해제되었습니다.` });
  };

  // 실제로는 소셜 로그인 화면으로 나갔다 돌아온다 — 견본은 바로 연동된 모양으로 바꾼다
  const link = async (provider: string) => {
    setBusy(true);
    setMsg(null);
    await sleep(FAKE_MS);
    setLinked((m) => ({ ...m, [provider]: 'hong@example.com' }));
    setBusy(false);
    setMsg({ tone: 'ok', text: `${providerLabel(provider)} 계정이 연동되었습니다.` });
  };

  return (
    <>
      <RdDialog title="연동된 소셜 계정" onClose={() => !asking && onClose()} footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}>
        <div className="rd-mp-editbody">
          {msg && <MyResult tone={msg.tone}>{msg.text}</MyResult>}
          <ul className="rd-ac-prov">
            {PROVIDERS.map((provider) => {
              const email = linked[provider];
              return (
                <li key={provider} className="rd-ac-prov__row">
                  <span className={`rd-ac-prov__dot${provider === 'GOOGLE' ? ' is-ring' : ''}`} style={{ background: PROVIDER_DOT[provider] }} aria-hidden="true" />
                  <span className="rd-ac-prov__main">
                    <span className="rd-ac-prov__name">{providerLabel(provider)}</span>
                    {email && <span className="rd-ac-prov__mail">{email}</span>}
                  </span>
                  {email ? (
                    <RdButton kind="secondary" place="row" disabled={busy} onClick={() => unlink(provider)}>연동 해제</RdButton>
                  ) : (
                    <RdButton kind="secondary" place="row" disabled={busy} onClick={() => link(provider)}>연동하기</RdButton>
                  )}
                </li>
              );
            })}
          </ul>
          {busy && <MyLine kind="loading">처리하는 중…</MyLine>}
        </div>
      </RdDialog>
      {asking && (
        <RdConfirmDialog
          title={`${providerLabel(asking)} 연동을 해제하시겠어요?`}
          keepLabel="취소"
          doLabel="연동 해제"
          onKeep={() => setAsking(null)}
          onDo={() => doUnlink(asking)}
        />
      )}
    </>
  );
}

// ───── 4-9 개인정보·동의 ─────
export function ConsentDialog({ variant, onClose, onGoWithdrawal }: { variant?: string; onClose: () => void; onGoWithdrawal: () => void }) {
  let body: React.ReactNode;
  if (variant === 'loading') body = <MyLine kind="loading">불러오는 중…</MyLine>;
  else if (variant === 'loadfail') body = <MyLine kind="error">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</MyLine>;
  else {
    body = (
      <div className="rd-mp-editbody">
        <MyDl
          rows={[
            { name: '서비스 이용약관 동의', value: CONSENT_SAMPLE.termsAgreedAt },
            { name: '개인정보 수집·이용 동의', value: CONSENT_SAMPLE.privacyAgreedAt },
          ]}
        />
        {/* 동의를 거두는 길은 회원 탈퇴뿐이다(00-36 §4.5) — 허브 맨 아래 [회원 탈퇴]와 같은 모양의 글자 버튼 */}
        <div className="rd-ac-withdrawline">
          <p>동의를 거두시려면 회원 탈퇴가 필요합니다.</p>
          <button type="button" className="rd-ac-textdanger" onClick={onGoWithdrawal}>회원 탈퇴</button>
        </div>
      </div>
    );
  }
  return (
    <RdDialog title="개인정보·동의" onClose={onClose} footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}>
      {body}
    </RdDialog>
  );
}
