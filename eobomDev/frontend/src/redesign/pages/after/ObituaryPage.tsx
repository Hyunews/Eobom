import React, { useState } from 'react';
import { OBITUARY_CARD_IMAGE_URL } from '../../../config';
import { formatObituaryCardDescription, formatObituaryCardTitle } from '../../../utils/obituaryCard';
import { RdButton, RdRequired, RdTextLink } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdField, RdInput, RdSaveBar, RdSelect } from '../../parts/RdInputs';
import { RdPageHead } from '../../parts/RdNav';
import { RdConfirmDialog, RdDangerDialog, RdDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronDown, IconChevronRight, IconChevronUp, IconClose, IconErrorCircle, IconPencil, IconWarn } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { ObituaryBody } from '../visitor/ObituaryBody';
import { OBIT_FULL } from '../visitor/visitorData';
import './after.css';

// 8단계 묶음 5 · /preview/obituary — 2단계 캔버스 판 2-12~2-19(만들기 · 선택 정보 · 관리 · 공유 · 종료 · 수정 창 · 미리보기 창 · 확인 창 · 상태).
// 서버·카카오 공유 없이 움직인다(전송은 예시 접수). 카드 제목·설명 만드는 규칙은 지금 코드(utils/obituaryCard)를 읽어 쓴다.

interface Mourner {
  name: string;
  relationship: string;
}
type FieldKey = 'deceased' | 'chief' | 'hall' | 'funeral' | 'bank' | 'holder' | 'accountNo' | 'falseReport' | 'reshared';

const DEMOS: DemoOption[] = [
  { value: 'make', label: '만들기 (진행 중 부고장 없음)' },
  { value: 'manage', label: '관리 (진행 중)' },
  { value: 'closed', label: '종료된 부고장' },
  { value: 'login', label: '로그인 전', group: '상태' },
  { value: 'loading', label: '불러오는 중 (뼈대 화면)', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'edited', label: '관리, 카드 내용을 고친 뒤 경고', group: '관리 변형' },
  { value: 'nomemorial', label: '관리, 추모관 없음', group: '관리 변형' },
  { value: 'shared-fail', label: '관리, 공유 실패 글 (링크 칸이 보임)', group: '관리 변형' },
  { value: 'close-fail', label: '관리, 종료 실패 글', group: '관리 변형' },
  { value: 'edit-fail', label: '관리, 수정 창에서 저장하면 실패 글', group: '관리 변형' },
  { value: 'copy-fail', label: '관리, 복사 실패 글 (링크 칸이 보임)', group: '관리 변형' },
  { value: 'mem-fail', label: '추모관 없음, [추모관 만들기] 확인하면 연결 실패 글', group: '관리 변형' },
  { value: 'memlist-fail', label: '추모관 없음, [내 추모관 잇기] 목록 불러오기 실패 글', group: '관리 변형' },
  { value: 'memlist-empty', label: '추모관 없음, [내 추모관 잇기] 이을 것 없음 글', group: '관리 변형' },
];

const EXAMPLE_URL = 'https://eobom.example/o/hong-gildong-2610';

function Req() {
  return <RdRequired narrow />;
}

/** 확인 사항 한 줄 — 박스 없이 점선 줄(판 2-12 개발자 수정). 필수/선택 딱지는 문장 앞 */
function AgreeRow({ id, kind, checked, onChange, error, children }: { id: string; kind: 'req' | 'opt'; checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode }) {
  return (
    <div className="rd-af-agree">
      <label htmlFor={id} className="rd-af-agree__lab">
        <input id={id} type="checkbox" className="rd-checkbox" checked={checked} aria-invalid={error ? true : undefined} onChange={(e) => onChange(e.target.checked)} />
        <span>
          {kind === 'req' ? <Req /> : <span className="rd-af-opt">선택</span>} {children}
        </span>
      </label>
      {error && (
        <p className="rd-field__error" role="alert">
          <IconErrorCircle />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function ObituaryPage() {
  const phone = useIsPhone();
  const [demo, setDemo] = useState('make');

  // 만들기 칸
  const [deceased, setDeceased] = useState('');
  const [chief, setChief] = useState('');
  const [relation, setRelation] = useState('');
  const [hall, setHall] = useState('');
  const [funeralAt, setFuneralAt] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [account, setAccount] = useState(false);
  const [bank, setBank] = useState('');
  const [holder, setHolder] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [more, setMore] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [hallAddr, setHallAddr] = useState('');
  const [room, setRoom] = useState('');
  const [coffinAt, setCoffinAt] = useState('');
  const [burial, setBurial] = useState('');
  const [mourners, setMourners] = useState<Mourner[]>([]);
  const [falseAgree, setFalseAgree] = useState(false);
  const [reshare, setReshare] = useState(false);
  const [withMemorial, setWithMemorial] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [summary, setSummary] = useState(false);
  const [busy, setBusy] = useState(false);

  // 관리 화면
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmMemorial, setConfirmMemorial] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [memorial, setMemorial] = useState(true);
  const [linking, setLinking] = useState<'idle' | 'making' | 'picker-loading' | 'picker' | 'picker-empty' | 'linking'>('idle');
  const [copyNote, setCopyNote] = useState<{ text: string; kind: 'ok' | 'err'; showLink?: boolean } | null>(null);
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [editFail, setEditFail] = useState(false);

  const MADE = ['manage', 'closed', 'edited', 'nomemorial', 'shared-fail', 'close-fail', 'edit-fail', 'copy-fail', 'mem-fail', 'memlist-fail', 'memlist-empty'];
  const made = MADE.includes(demo);
  const [memErr, setMemErr] = useState<string | null>(null);
  const isClosed = demo === 'closed' || closed;
  const hasMemorial = memorial;

  // 관리 화면의 카드는 예시 값, 만들기 화면의 카드는 입력한 값 (07-03 §6.2)
  const card = made
    ? { deceasedName: '홍길동', funeralHall: '서울 평안 장례식장', mourningRoom: '201호', funeralAt: '2026-10-18T09:00', cardFieldsUpdatedAt: null as string | null }
    : { deceasedName: deceased, funeralHall: hall, mourningRoom: room, funeralAt, cardFieldsUpdatedAt: null as string | null };
  const cardTitle = deceased.trim() || made ? formatObituaryCardTitle(card) : '[부고] 故 ○○○ 님';
  const cardDesc = formatObituaryCardDescription(card) || '빈소·발인 정보를 입력하면 여기에 표시됩니다.';

  // 미리보기: 관리 화면은 서버 값이 없어서, 수정 창을 처음 열 때 예시 값을 채운다
  const openEdit = () => {
    if (!deceased) {
      setDeceased('홍길동');
      setChief('홍상주');
      setRelation('장남');
      setHall('서울 평안 장례식장');
      setFuneralAt('2026-10-18T09:00');
      setPhoneNo('010-1234-5678');
    }
    setEditFail(false);
    setEditOpen(true);
  };

  const clear = (k: FieldKey) => setErrors((e) => ({ ...e, [k]: undefined }));

  const submit = async () => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!deceased.trim()) e.deceased = '고인 성함을 입력해 주세요.';
    if (!chief.trim()) e.chief = '상주 성함을 입력해 주세요.';
    if (!hall.trim()) e.hall = '빈소 위치를 입력해 주세요.';
    if (!funeralAt) e.funeral = '발인 일시를 선택해 주세요.';
    if (account) {
      if (!bank.trim()) e.bank = '은행을 입력해 주세요.';
      if (!holder.trim()) e.holder = '예금주를 입력해 주세요.';
      if (!accountNo.trim()) e.accountNo = '계좌번호를 입력해 주세요.';
    }
    if (!falseAgree) e.falseReport = '확인이 필요한 항목입니다.';
    if (!reshare) e.reshared = '확인이 필요한 항목입니다.';
    const n = Object.keys(e).length;
    setErrors(e);
    setSummary(n > 0);
    if (n > 0) return;
    setBusy(true);
    await sleep(900);
    setBusy(false);
    setMemorial(withMemorial);
    setDemo('manage');
  };

  const bar = <DemoBar value={demo} options={DEMOS} onChange={(v) => {
    setDemo(v);
    setClosed(false);
    setCopyNote(
      v === 'shared-fail'
        ? { text: '공유에 실패했습니다. 아래 링크를 직접 복사해 주세요.', kind: 'err', showLink: true }
        : v === 'copy-fail'
          ? { text: '복사에 실패했습니다. 링크를 직접 선택해 복사해 주세요.', kind: 'err', showLink: true }
          : null,
    );
    setLinking('idle');
    setMemErr(null);
    setMemorial(!['nomemorial', 'mem-fail', 'memlist-fail', 'memlist-empty'].includes(v));
    setEditFail(false);
  }} />;

  const title = made ? '부고장 관리' : '모바일 부고장 작성';
  const desc = made
    ? '입력한 내용은 즉시 부고장 페이지에 반영됩니다. 빈소·발인 등이 바뀌면 아래에서 고쳐주세요.'
    : '고인 성함, 상주, 빈소, 발인 일시만 입력하면 3분 안에 부고장을 만들 수 있습니다.';

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title="모바일 부고장 작성" desc="고인 성함, 상주, 빈소, 발인 일시만 입력하면 3분 안에 부고장을 만들 수 있습니다." />
        <div className="rd-af-gatebox"><RdLoginGate screenName="모바일 부고장 작성" contained /></div>
        {bar}
      </div>
    );
  }
  if (demo === 'loading') {
    return (
      <div className="rd-container rd-screen">
        <div className="rd-af-skel" role="status" aria-busy="true" aria-label="불러오는 중">
          <div className="rd-af-skel__bar rd-af-skel__bar--title" />
          <div className="rd-af-skel__bar rd-af-skel__bar--sub" />
          <div className="rd-af-skel__grid">
            <div className="rd-af-skel__stage"><div className="rd-af-skel__card" /></div>
            <div className="rd-af-skel__panel"><div className="rd-af-skel__bar" /><div className="rd-af-skel__line" /><div className="rd-af-skel__line" /><div className="rd-af-skel__line" /></div>
          </div>
        </div>
        {bar}
      </div>
    );
  }
  if (demo === 'loadfail') {
    return (
      <div className="rd-container rd-screen">
        <RdState kind="error" title="화면을 불러오지 못했습니다" desc="잠시 뒤 다시 열어 주세요. 계속되면 카카오톡으로 알려 주세요.">
          <RdButton kind="secondary" place="row">홈으로</RdButton>
          <RdButton place="row" onClick={() => setDemo('make')}>새로 고침</RdButton>
        </RdState>
        {bar}
      </div>
    );
  }

  const kakaoCard = (
    <div className="rd-af-kcard">
      {made && !isClosed && (
        <button type="button" className="rd-af-kcard__edit" aria-label="부고장 정보 수정" onClick={openEdit}>
          <IconPencil size={16} />
          <span>수정하기</span>
        </button>
      )}
      <div className="rd-af-kcard__img"><img src={OBITUARY_CARD_IMAGE_URL} alt="근조 카드 이미지" /></div>
      <div className="rd-af-kcard__body">
        <p className="rd-af-kcard__title">{cardTitle}</p>
        <p className="rd-af-kcard__desc">{cardDesc}</p>
      </div>
      <div className="rd-af-kcard__cta">부고장 보기</div>
      <div className="rd-af-kcard__foot">이어봄 <IconChevronRight size={14} /></div>
    </div>
  );

  /** 입력 칸 묶음(만들기와 수정 창이 같다). 수정 창은 확인 사항이 없다 */
  const fields = (
    <>
      <section className="rd-af-sec">
        <h3 className="rd-af-sec__title">기본 정보</h3>
        <RdField label="고인 성함" required error={errors.deceased}>
          {(p) => <RdInput {...p} placeholder="예: 홍길동" value={deceased} onChange={(e) => { setDeceased(e.target.value); clear('deceased'); }} />}
        </RdField>
        <div className="rd-af-row2">
          <RdField label="상주 성함" required error={errors.chief}>
            {(p) => <RdInput {...p} placeholder="예: 홍상주" value={chief} onChange={(e) => { setChief(e.target.value); clear('chief'); }} />}
          </RdField>
          <RdField label="고인과의 관계">
            {(p) => <RdInput {...p} placeholder="상주" value={relation} onChange={(e) => setRelation(e.target.value)} />}
          </RdField>
        </div>
      </section>
      <section className="rd-af-sec">
        <h3 className="rd-af-sec__title">빈소와 발인</h3>
        <RdField label="빈소 위치" required error={errors.hall}>
          {(p) => <RdInput {...p} placeholder="예: 서울 평안 장례식장" value={hall} onChange={(e) => { setHall(e.target.value); clear('hall'); }} />}
        </RdField>
        <RdField label="발인 일시" required error={errors.funeral}>
          {(p) => <RdInput {...p} type="datetime-local" value={funeralAt} onChange={(e) => { setFuneralAt(e.target.value); clear('funeral'); }} />}
        </RdField>
      </section>
      <section className="rd-af-sec">
        <h3 className="rd-af-sec__title">연락처와 마음 전하실 곳</h3>
        <RdField label="연락처" help="입력하신 번호는 부고장을 받은 모든 분에게 보입니다.">
          {(p) => <RdInput {...p} type="tel" placeholder="010-0000-0000" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} />}
        </RdField>
        <label className="rd-af-toggle">
          <input type="checkbox" className="rd-checkbox" checked={account} onChange={(e) => setAccount(e.target.checked)} />
          <span>
            <span>마음 전하실 곳 표시</span>
            <span className="rd-af-toggle__sub">조문객에게 계좌번호를 보여줍니다.</span>
          </span>
        </label>
        {account && (
          <>
            <div className="rd-af-warnbox" role="note"><IconWarn size={20} /><b>이 계좌번호는 부고장을 받은 분이 다시 공유할 수 있습니다.</b></div>
            <div className="rd-af-row2 rd-af-row2--even">
              <RdField label="은행" error={errors.bank}>
                {(p) => <RdInput {...p} placeholder="예: 국민은행" value={bank} onChange={(e) => { setBank(e.target.value); clear('bank'); }} />}
              </RdField>
              <RdField label="예금주" error={errors.holder}>
                {(p) => <RdInput {...p} placeholder="예금주" value={holder} onChange={(e) => { setHolder(e.target.value); clear('holder'); }} />}
              </RdField>
            </div>
            <RdField label="계좌번호" error={errors.accountNo}>
              {(p) => <RdInput {...p} placeholder="계좌번호" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); clear('accountNo'); }} />}
            </RdField>
          </>
        )}
      </section>
      <div className="rd-af-more">
        <button type="button" className="rd-af-more__head" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          <span className="rd-af-more__text">
            <span className="rd-af-more__title">선택 정보</span>
            <span className="rd-af-more__sub">별세 일시 · 빈소 주소 · 호실 · 입관 · 장지 · 유족</span>
          </span>
          {more ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </button>
        {more && (
          <div className="rd-af-more__body">
            <RdField label="별세 일시">{(p) => <RdInput {...p} type="datetime-local" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />}</RdField>
            <RdField label="빈소 주소 (길찾기용)">{(p) => <RdInput {...p} placeholder="예: 서울특별시 강남구 ..." value={hallAddr} onChange={(e) => setHallAddr(e.target.value)} />}</RdField>
            <div className="rd-af-row2 rd-af-row2--even">
              <RdField label="호실">{(p) => <RdInput {...p} placeholder="예: 201호" value={room} onChange={(e) => setRoom(e.target.value)} />}</RdField>
              <RdField label="입관">{(p) => <RdInput {...p} type="datetime-local" value={coffinAt} onChange={(e) => setCoffinAt(e.target.value)} />}</RdField>
            </div>
            <RdField label="장지">{(p) => <RdInput {...p} placeholder="예: OO추모공원" value={burial} onChange={(e) => setBurial(e.target.value)} />}</RdField>
            <div className="rd-af-mourners">
              <p className="rd-af-mourners__name">유족 추가</p>
              {mourners.map((m, i) => (
                <div className="rd-af-mourner" key={i}>
                  <RdField label="관계">{(p) => <RdInput {...p} placeholder="예: 장남" value={m.relationship} onChange={(e) => setMourners((l) => l.map((x, j) => (j === i ? { ...x, relationship: e.target.value } : x)))} />}</RdField>
                  <RdField label="성함">{(p) => <RdInput {...p} placeholder="성함" value={m.name} onChange={(e) => setMourners((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />}</RdField>
                  <button type="button" className="rd-af-iconbtn" aria-label="유족 삭제" onClick={() => setMourners((l) => l.filter((_, j) => j !== i))}><IconClose size={18} /></button>
                </div>
              ))}
              <RdButton kind="secondary" place="row" className="rd-af-addbtn" onClick={() => setMourners((l) => [...l, { name: '', relationship: '' }])}>+ 유족 추가</RdButton>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // ───── 만들기 ─────
  if (!made) {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title={title} desc={desc} />
        <div className="rd-af-make">
          <form className="rd-af-make__form" noValidate onSubmit={(e) => e.preventDefault()}>
            {fields}
            {phone && (
              <section className="rd-af-sec" aria-label="카카오톡 카드 미리보기">
                <h3 className="rd-af-sec__title">카드 미리보기</h3>
                <div className="rd-af-stage">{kakaoCard}</div>
              </section>
            )}
            <section className="rd-af-sec">
              <h3 className="rd-af-sec__title">확인 사항</h3>
              <AgreeRow id="ob-false" kind="req" checked={falseAgree} error={errors.falseReport} onChange={(v) => { setFalseAgree(v); if (v) clear('falseReport'); }}>
                허위로 부고장을 개설할 경우 법적 책임을 질 수 있다는 점에 동의합니다.
              </AgreeRow>
              <AgreeRow id="ob-reshare" kind="req" checked={reshare} error={errors.reshared} onChange={(v) => { setReshare(v); if (v) clear('reshared'); }}>
                이 부고장을 전달받은 분이 다시 다른 곳에 공유할 수 있다는 점을 확인했습니다.
              </AgreeRow>
              <AgreeRow id="ob-memorial" kind="opt" checked={withMemorial} onChange={setWithMemorial}>
                추모관도 함께 만들기, 헌화·방명록 공간 (나중에 따로 만들 수 있습니다.)
              </AgreeRow>
            </section>
            <RdSaveBar errorCount={summary ? Object.values(errors).filter(Boolean).length : 0}>
              <RdButton place="bar" busy={busy} busyText="처리 중…" onClick={submit}>부고장 만들기</RdButton>
            </RdSaveBar>
          </form>
          {!phone && (
            <aside className="rd-af-make__side" aria-label="카카오톡 카드 미리보기">
              <h3 className="rd-af-sec__title">카드 미리보기</h3>
              <div className="rd-af-stage">{kakaoCard}</div>
            </aside>
          )}
        </div>
        {bar}
      </div>
    );
  }

  // ───── 관리 ─────
  const shareDesc = copyNote;
  const doCopy = () => setCopyNote({ text: '링크가 복사되었습니다.', kind: 'ok' });
  const memorialControls = (() => {
    if (hasMemorial) {
      return <RdTextLink href="#" onClick={(e) => e.preventDefault()}>{isClosed ? '연결된 추모관은 계속 열람할 수 있습니다' : '연결된 추모관 미리 보기'}</RdTextLink>;
    }
    return (
      <div className="rd-af-memctl">
        <RdButton kind="secondary" busy={linking === 'making'} busyText="만드는 중..." onClick={() => setConfirmMemorial(true)} disabled={linking !== 'idle' && linking !== 'making'}>추모관 만들기</RdButton>
        {linking === 'idle' && (
          <RdButton
            kind="secondary"
            onClick={async () => {
              setMemErr(null);
              setLinking('picker-loading');
              await sleep(600);
              if (demo === 'memlist-fail') {
                setMemErr('추모관 목록을 불러오지 못했습니다.');
                setLinking('idle');
              } else setLinking(demo === 'memlist-empty' ? 'picker-empty' : 'picker');
            }}
          >
            내 추모관 잇기
          </RdButton>
        )}
        {memErr && <p className="rd-field__error" role="alert"><IconErrorCircle /><span>{memErr}</span></p>}
        {linking === 'picker-loading' && <p className="rd-af-memctl__note" role="status">불러오는 중...</p>}
        {(linking === 'picker' || linking === 'linking') && (
          <div className="rd-af-pick">
            <RdField label="이을 추모관">
              {(p) => (
                <RdSelect {...p}>
                  <option>홍길동 · 2026. 10. 15. 개설</option>
                </RdSelect>
              )}
            </RdField>
            <div className="rd-af-pick__btns">
              <RdButton kind="secondary" place="row" disabled={linking === 'linking'} onClick={() => setLinking('idle')}>취소</RdButton>
              <RdButton place="row" busy={linking === 'linking'} busyText="잇는 중..." onClick={async () => { setLinking('linking'); await sleep(800); setMemorial(true); setLinking('idle'); }}>잇기</RdButton>
            </div>
          </div>
        )}
        {linking === 'picker-empty' && (
          <p className="rd-af-memctl__note">이을 수 있는 추모관이 없습니다. 다른 부고장에 이어졌거나 닫힌 추모관은 목록에 나오지 않습니다.</p>
        )}
      </div>
    );
  })();

  const sharePanel = isClosed ? (
    <div className="rd-af-share">
      <div className="rd-af-closednote">
        <p>종료된 부고장입니다. 조문객은 더 이상 이 링크로 볼 수 없습니다</p>
        <p>(2026. 10. 16. 오후 4:10 종료).</p>
      </div>
      <RdButton onClick={() => { setClosed(false); setDemo('make'); }}>+ 새 부고장 작성하기</RdButton>
      <div className="rd-af-share__rule">{memorialControls}</div>
    </div>
  ) : (
    <div className="rd-af-share">
      {demo === 'edited' && (
        <div className="rd-af-warnbox" role="alert"><IconWarn size={20} /><b>이미 보낸 카드에는 반영되지 않습니다. 아래 버튼으로 다시 공유해 주세요.</b></div>
      )}
      <h3 className="rd-af-share__title">부고장 공유</h3>
      <RdButton kind="secondary" className="rd-af-kakao" onClick={() => setCopyNote({ text: '카카오톡 공유를 열 수 없어 링크를 복사했습니다. 대화방에 붙여넣어 전달해 주세요.', kind: 'ok' })}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919" aria-hidden="true"><path d="M12 3.5c-5.2 0-9.5 3.3-9.5 7.5 0 2.7 1.8 5.1 4.5 6.4l-1 3.6c-.1.3.3.6.6.4l4.3-2.9c.4 0 .7.1 1.1.1 5.2 0 9.5-3.3 9.5-7.5S17.2 3.5 12 3.5z" /></svg>
        카카오톡으로 부고 알리기
      </RdButton>
      <RdButton kind="secondary" onClick={() => setPreviewOpen(true)}>조문객 화면 미리보기</RdButton>
      <div className="rd-af-share__two">
        <RdButton kind="secondary" onClick={doCopy}>링크 복사</RdButton>
        {phone && <RdButton kind="secondary">문자로 보내기</RdButton>}
      </div>
      {shareDesc && (
        shareDesc.kind === 'err' ? (
          <p className="rd-field__error" role="alert"><IconErrorCircle /><span>{shareDesc.text}</span></p>
        ) : (
          <p className="rd-af-share__note" role="status">{shareDesc.text}</p>
        )
      )}
      {shareDesc?.showLink && <RdInput aria-label="부고장 링크" readOnly value={EXAMPLE_URL} />}
      <div className="rd-af-share__rule">{memorialControls}</div>
      <p className="rd-af-share__time">최종 수정: 2026. 10. 16. 오후 3:40</p>
      <div className="rd-af-share__close">
        <RdButton busy={closing} busyText="종료 중..." onClick={() => setConfirmClose(true)}>부고장 종료</RdButton>
        {demo === 'close-fail' && (
          <p className="rd-field__error" role="alert"><IconErrorCircle /><span>서버와 통신 중 오류가 발생했습니다.</span></p>
        )}
        <p className="rd-af-share__time">종료하지 않아도 발인 3일 후 자동으로 종료됩니다.</p>
      </div>
    </div>
  );

  return (
    <div className="rd-container rd-screen">
      <RdPageHead title={title} desc={desc} />
      <div className="rd-af-manage">
        <div className="rd-af-manage__card">
          <p className="rd-af-manage__label">카카오톡 카드 미리보기</p>
          <div className="rd-af-stage">{kakaoCard}</div>
        </div>
        {sharePanel}
      </div>
      {bar}

      {editOpen && (
        <RdDialog
          form
          width={560}
          title="부고장 수정"
          closeX
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" disabled={saveBusy} onClick={() => setEditOpen(false)}>취소</RdButton>
              <RdButton
                place="dialog"
                busy={saveBusy}
                busyText="저장 중…"
                onClick={async () => {
                  setSaveBusy(true);
                  await sleep(800);
                  setSaveBusy(false);
                  if (demo === 'edit-fail') setEditFail(true);
                  else setEditOpen(false);
                }}
              >
                수정 사항 저장
              </RdButton>
            </>
          }
        >
          <div className="rd-af-editbody">
            {fields}
            {editFail && (
              <p className="rd-field__error" role="alert"><IconErrorCircle /><span>서버와 통신 중 오류가 발생했습니다.</span></p>
            )}
          </div>
        </RdDialog>
      )}

      {previewOpen && (
        <RdDialog
          width={960}
          title="조문객 화면 미리보기"
          closeX
          onClose={() => setPreviewOpen(false)}
          footer={<RdButton kind="secondary" place="dialog" onClick={() => setPreviewOpen(false)}>닫기</RdButton>}
        >
          <p className="rd-dialog__desc">조문객에게 보이는 화면입니다. 수정하면 이 화면은 바로 바뀌지만, 이미 보낸 카카오톡 카드는 바뀌지 않습니다.</p>
          {/* 묶음 6 — 조문객이 받는 부고장 본문 그대로(링크 복사 없음). 값은 예시이며 10단계 교체 때 이 화면의 입력 값을 넘긴다(07-03 §6.4 ⓑ). */}
          <div className="rd-vs-modalframe">
            <ObituaryBody data={OBIT_FULL} />
          </div>
        </RdDialog>
      )}

      {confirmMemorial && (
        <RdConfirmDialog
          title="추모관을 만들어 이 부고장에 연결합니다."
          desc="허위로 추모관을 개설할 경우 법적 책임을 질 수 있다는 점에 동의하십니까?"
          keepLabel="취소"
          doLabel="확인"
          onKeep={() => setConfirmMemorial(false)}
          onDo={async () => {
            setConfirmMemorial(false);
            setMemErr(null);
            setLinking('making');
            await sleep(900);
            if (demo === 'mem-fail') {
              setMemErr('추모관 연결 중 오류가 발생했습니다.');
            } else setMemorial(true);
            setLinking('idle');
          }}
        />
      )}

      {confirmClose && (
        <RdDangerDialog
          title="부고장을 종료하시겠어요?"
          desc="종료하면 조문객은 더 이상 이 링크로 볼 수 없습니다."
          doLabel="부고장 종료"
          doKind="primary"
          busyText="종료 중..."
          busy={closing}
          onCancel={() => setConfirmClose(false)}
          onDo={async () => {
            setClosing(true);
            await sleep(900);
            setClosing(false);
            setConfirmClose(false);
            setClosed(true);
          }}
        />
      )}
    </div>
  );
}
