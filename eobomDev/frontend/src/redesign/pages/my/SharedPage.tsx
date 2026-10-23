import React, { useState } from 'react';
import { SECTIONS } from '../../../components/endingNote/constants';
import { entryFields } from '../../../components/familyShared/sectionFields';
import { formatKstMonthDayTime } from '../../../utils/kstDate';
import { RdBadge, RdButton } from '../../parts/RdButtons';
import { RdList, RdListRow } from '../../parts/RdCards';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdCheck, RdDate, RdField, RdInput } from '../../parts/RdInputs';
import { RdPageHead } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdDialog } from '../../parts/RdModal';
import { LoginDialog } from '../auth/LoginDialogs';
import {
  EXAMPLE_INVITE_URL, FAKE_MS, PENDING_PEOPLE, PERSON_FAMILY, PERSON_MINE, PERSON_NONE, PERSON_OPENED, PERSON_OPENED_EMPTY, PERSON_REJECTED,
  designationPhrase, relationOf, type PendingPerson, type SharedEntry, type SharedLetter, type SharedPerson,
} from './accountData';
import { MyDl, MyGate, MyLine, MyResult } from './myShared';
import './mypage.css';
import './account.css';

// 8단계 묶음 8 · /preview/family-shared — 나에게 공유된 것(4-13) · 창 셋(4-14). 정본: 00-36 §4.6 · 00-41 §6~§8 · 4단계 묶음 3 캔버스.
// #9: 더 이상 보지 않은 뒤 결과 글 "철회되었습니다." → "더 이상 보지 않습니다."(00-36 §4.6-2-1 — "철회·거부" 단어를 쓰지 않는다).
// "개봉 요청을 취소하시겠습니까?"는 브라우저 기본 확인 창을 그대로 둔다(4단계 묶음 3 개발자 답 ①).
// 🔴 보이지 않아야 하는 것: 지정자 연락처·이메일 · 같은 노트의 다른 수락자 · 열리지 않은 항목의 존재. 열린 것만 그린다 — 빈 상태에 권유 문구를 붙이지 않는다.
// 이름 · 날짜 · 항목 값 · 주소는 예시다(10단계 교체 때 /api/ending-note/family-view 값으로).

type View = 'before' | 'opened' | 'openedEmpty' | 'empty' | 'withdrawn' | 'login' | 'loading' | 'loadfail';

const DEMOS: DemoOption[] = [
  { value: 'before', label: '열리기 전 (요청 없음 · 요청 중 · 가족 중 한 분이 요청 · 거절)' },
  { value: 'opened', label: '열린 뒤 (항목 · 편지 · 아직 수락하지 않은 가족)' },
  { value: 'openedEmpty', label: '열린 뒤 · 고인이 정해 둔 항목 없음' },
  { value: 'withdrawn', label: '더 이상 보지 않은 직후 (결과 글)' },
  { value: 'empty', label: '빈 목록', group: '상태' },
  { value: 'login', label: '로그인 전', group: '상태' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];

const INITIAL: Record<string, SharedPerson[]> = {
  before: [PERSON_NONE, PERSON_MINE, PERSON_FAMILY, PERSON_REJECTED],
  opened: [PERSON_OPENED],
  openedEmpty: [PERSON_OPENED_EMPTY],
  withdrawn: [PERSON_NONE],
  empty: [],
};

const sectionTitle = (code: string) => SECTIONS.find((s) => s.code === code)?.title ?? code;
const day = (iso: string) => iso.slice(0, 10);

type Open =
  | { kind: 'entry'; entry: SharedEntry }
  | { kind: 'letter'; letter: SharedLetter };

export function SharedPage() {
  const [view, setView] = useState<View>('before');
  return (
    <div className="rd-container rd-screen">
      <Body key={view} view={view} />
      <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
    </div>
  );
}

function Body({ view }: { view: View }) {
  const [people, setPeople] = useState<SharedPerson[]>(INITIAL[view] ?? []);
  const [result, setResult] = useState<string | null>(view === 'withdrawn' ? '더 이상 보지 않습니다.' : null);
  const [open, setOpen] = useState<Open | null>(null);
  const [requestFor, setRequestFor] = useState<SharedPerson | null>(null);
  const [withdrawFor, setWithdrawFor] = useState<SharedPerson | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; tone: 'ok' | 'err'; text: string } | null>(null);

  const patch = (id: string, fn: (p: SharedPerson) => SharedPerson) => setPeople((l) => l.map((p) => (p.id === id ? fn(p) : p)));

  const cancelRequest = async (p: SharedPerson) => {
    if (!window.confirm('개봉 요청을 취소하시겠습니까?')) return;
    setBusyId(p.id);
    await sleep(FAKE_MS);
    patch(p.id, (x) => ({ ...x, request: { status: 'NONE' } }));
    setBusyId(null);
  };

  // 이어봄은 보내지 않는다(00-41 §6) — 안내 문구와 링크를 복사해 줄 뿐이다
  const shareToFamily = async (p: SharedPerson) => {
    try {
      await navigator.clipboard.writeText(`${p.ownerName} 님의 기록을 이어봄에서 보실 수 있습니다.`);
    } catch {
      /* 견본: 복사가 막혀 있어도 결과 글은 그대로 보인다 */
    }
    setNotice({ id: p.id, tone: 'ok', text: '안내 문구와 링크를 복사했습니다. 가족에게 붙여넣어 보내 주세요.' });
  };

  if (view === 'login') {
    return (
      <>
        <MyGate title="나에게 공유된 것" screenName="나에게 공유된 것" onLogin={() => setLoginOpen(true)} />
        {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} />}
      </>
    );
  }

  let content: React.ReactNode;
  if (view === 'loading') content = <MyLine kind="loading">불러오는 중…</MyLine>;
  else if (view === 'loadfail') content = <MyLine kind="error">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</MyLine>;
  else if (people.length === 0) content = <MyLine kind="empty">아직 공유받은 것이 없습니다.</MyLine>;
  else {
    content = people.map((p) => {
      const req = p.request;
      const note = notice?.id === p.id ? notice : null;
      return (
        <section key={p.id} className="rd-mp-sec">
          <div className="rd-ac-who">
            <h2 className="rd-t-section">{p.ownerName} 님</h2>
            <span className="rd-ac-who__meta">{designationPhrase(p)}</span>
          </div>

          {p.entries.length === 0 && p.letters.length === 0 ? (
            <MyLine kind="empty">{p.released ? '고인이 정해 둔 항목이 없습니다.' : '지금 볼 수 있는 항목이 없습니다.'}</MyLine>
          ) : (
            <RdList>
              {p.entries.map((e) => (
                <RdListRow key={e.section} title={sectionTitle(e.section)} info={day(e.updatedAt)} onClick={() => setOpen({ kind: 'entry', entry: e })} />
              ))}
              {p.letters.map((l) => (
                <RdListRow key={l.id} title={`편지${l.title ? ` · ${l.title}` : ''}`} info={day(l.createdAt)} onClick={() => setOpen({ kind: 'letter', letter: l })} />
              ))}
            </RdList>
          )}

          {/* 00-41 §8.2 요청 상태 — 열리기 전(released=false)에만 */}
          {!p.released && req.status === 'NONE' && (
            <div className="rd-ac-reqrow">
              <RdButton kind="secondary" onClick={() => setRequestFor(p)}>돌아가셨음을 알리고 열람 요청</RdButton>
            </div>
          )}
          {!p.released && req.status === 'REQUESTED' && (
            <div className="rd-ac-reqrow rd-ac-reqrow--text">
              <p className="rd-ac-reqtext">
                {req.isMine ? '요청했습니다.' : '가족 중 한 분이 요청했습니다.'} {formatKstMonthDayTime(req.requestedAt)} 접수
              </p>
              <RdButton kind="secondary" disabled={busyId === p.id} onClick={() => cancelRequest(p)}>요청 취소</RdButton>
            </div>
          )}
          {!p.released && req.status === 'REJECTED' && (
            <div className="rd-ac-reqrow rd-ac-reqrow--text">
              <p className="rd-ac-reqtext">{req.reason}</p>
              <RdButton kind="secondary" onClick={() => setRequestFor(p)}>다시 요청</RdButton>
            </div>
          )}

          {/* 개봉 뒤 — 가족에게 알리기 · 아직 수락하지 않은 가족 */}
          {p.released && (
            <>
              <div className="rd-ac-reqrow">
                <RdButton kind="secondary" onClick={() => shareToFamily(p)}>가족에게 알리기</RdButton>
              </div>
              {note && <MyResult tone={note.tone}>{note.text}</MyResult>}
              <PendingPanel />
            </>
          )}

          <div className="rd-ac-who-foot">
            <span>{p.acceptedAt} 수락함</span>
            <button type="button" className="rd-ac-textdanger" onClick={() => setWithdrawFor(p)}>더 이상 보지 않기</button>
          </div>
        </section>
      );
    });
  }

  return (
    <div className="rd-mp-read rd-ac-shared">
      <RdPageHead title="나에게 공유된 것" />
      {result && <MyResult tone="ok">{result}</MyResult>}
      {content}

      {open?.kind === 'entry' && <EntryDialog entry={open.entry} onClose={() => setOpen(null)} />}
      {open?.kind === 'letter' && <LetterDialog letter={open.letter} onClose={() => setOpen(null)} />}
      {requestFor && (
        <ReleaseRequestDialog
          ownerName={requestFor.ownerName}
          onClose={() => setRequestFor(null)}
          onDone={() => {
            patch(requestFor.id, (x) => ({ ...x, request: { status: 'REQUESTED', isMine: true, requestedAt: new Date().toISOString() } }));
            setRequestFor(null);
          }}
        />
      )}
      {withdrawFor && (
        <WithdrawSharedDialog
          ownerName={withdrawFor.ownerName}
          onClose={() => setWithdrawFor(null)}
          onDone={() => {
            setPeople((l) => l.filter((x) => x.id !== withdrawFor.id));
            setWithdrawFor(null);
            setResult('더 이상 보지 않습니다.');
          }}
        />
      )}
    </div>
  );
}

// ───── 아직 수락하지 않은 가족(00-41 §7.3) — 이름·관계만. 전화번호·이메일은 서버가 내려주지 않는다 ─────
function PendingPanel() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);

  const reinvite = async (p: PendingPerson) => {
    setBusyId(p.id);
    setMsg(null);
    await sleep(FAKE_MS);
    setLink({ id: p.id, url: EXAMPLE_INVITE_URL });
    setBusyId(null);
  };
  const copy = async (p: PendingPerson, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMsg({ id: p.id, text: '링크를 복사했습니다.' });
    } catch {
      setMsg({ id: p.id, text: '복사하지 못했습니다. 아래 주소를 직접 복사해 주세요.' });
    }
  };

  return (
    <div className="rd-ac-pending">
      <h3 className="rd-ac-sub">아직 수락하지 않은 가족</h3>
      <p className="rd-dialog__desc">초대를 수락하면 그 가족도 고인이 정해 둔 항목을 볼 수 있습니다. 새 링크를 만들면 이전 링크는 쓸 수 없습니다.</p>
      <ul className="rd-ac-pend">
        {PENDING_PEOPLE.map((p) => (
          <li key={p.id} className="rd-ac-pend__row">
            <div className="rd-ac-pend__top">
              <span className="rd-ac-pend__name">{p.name} ({relationOf(p.relationship)})</span>
              <RdBadge kind={p.linkExpired ? 'faint' : 'done'}>{p.linkExpired ? '링크 만료' : '링크 유효'}</RdBadge>
              {/* 유효·만료 둘 다 [초대 링크 다시 만들기]만 있다 — 서버가 기존 링크 주소를 주지 않는다 */}
              <RdButton kind="secondary" place="row" className="rd-ac-pend__btn" disabled={busyId === p.id} onClick={() => reinvite(p)}>
                {busyId === p.id ? '만드는 중…' : '초대 링크 다시 만들기'}
              </RdButton>
            </div>
            {link?.id === p.id && (
              <div className="rd-ac-pend__link">
                {msg?.id === p.id && <p className="rd-ac-pend__msg">{msg.text}</p>}
                <div className="rd-ac-inline">
                  <RdInput readOnly value={link.url} aria-label={`${p.name} 초대 링크`} onFocus={(e) => e.currentTarget.select()} />
                  <RdButton kind="secondary" place="dialog" className="rd-ac-inline__btn" onClick={() => copy(p, link.url)}>링크 복사</RdButton>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───── 4-14 기록 열기 요청 창 ─────
function ReleaseRequestDialog({ ownerName, onClose, onDone }: { ownerName: string; onClose: () => void; onDone: () => void }) {
  const [deceased, setDeceased] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [hall, setHall] = useState('');
  const [phone, setPhone] = useState('');
  const [noHall, setNoHall] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const E = '확인이 필요한 항목입니다.';

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!deceased.trim()) next.deceased = E;
    if (!deathDate) next.date = E;
    if (!noHall && !hall.trim()) next.hall = E;
    if (!noHall && !phone.trim()) next.phone = E;
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    await sleep(FAKE_MS);
    setBusy(false);
    onDone();
  };

  const count = Object.keys(errs).length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <RdDialog
      form
      width={560}
      title={`${ownerName} 님의 기록 열기`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
          <RdButton place="dialog" busy={busy} busyText="요청하는 중…" onClick={submit}>열어 달라고 요청</RdButton>
        </>
      }
    >
      <p className="rd-ac-intro">
        운영자가 장례식장에 확인한 뒤 열립니다. 확인은 영업시간(평일 9시~17시, 주말·공휴일 제외) 기준 6시간 안에 마칩니다. 결과는 이 화면에서 보실 수 있습니다.
      </p>
      <div className="rd-mp-editbody">
        <div className="rd-ac-pair">
          <RdField label="고인 성함" required error={errs.deceased}>
            {(p) => <RdInput {...p} maxLength={50} value={deceased} onChange={(e) => setDeceased(e.target.value)} />}
          </RdField>
          <RdField label="돌아가신 날" required error={errs.date}>
            {(p) => <RdDate {...p} max={today} value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />}
          </RdField>
        </div>
        <div className="rd-ac-pair">
          <RdField label="장례식장 이름" required={!noHall} error={errs.hall}>
            {(p) => <RdInput {...p} maxLength={100} disabled={noHall} value={hall} onChange={(e) => setHall(e.target.value)} />}
          </RdField>
          <RdField label="장례식장 전화번호" required={!noHall} help="운영자가 이 번호로 전화해 확인합니다." error={errs.phone}>
            {(p) => <RdInput {...p} type="tel" inputMode="tel" disabled={noHall} value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </RdField>
        </div>
        <RdCheck
          label="장례식장 없음"
          checked={noHall}
          onChange={(e) => {
            setNoHall(e.target.checked);
            if (e.target.checked) {
              setErrs((x) => {
                const n = { ...x };
                delete n.hall;
                delete n.phone;
                return n;
              });
            }
          }}
        />
        {noHall && <RdNotice>운영자가 전화드려 화장장·장지 등 확인할 곳을 여쭙니다.</RdNotice>}
        {count > 0 && <MyResult tone="err">확인이 필요한 항목이 {count}개 있습니다.</MyResult>}
      </div>
    </RdDialog>
  );
}

// ───── 4-14 항목 보기 창 · 편지 창 ─────
function EntryDialog({ entry, onClose }: { entry: SharedEntry; onClose: () => void }) {
  const fields = entryFields(entry.section, entry.value);
  return (
    <RdDialog width={560} title={sectionTitle(entry.section)} closeX onClose={onClose} footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}>
      {fields.length === 0 && <p className="rd-dialog__desc">작성된 내용이 없습니다.</p>}
      <MyDl
        rows={[
          ...fields.map((f) => ({ name: f.label, value: f.text, stack: f.text.length > 18 })),
          { name: '최종 수정', value: day(entry.updatedAt) },
        ]}
      />
    </RdDialog>
  );
}

function LetterDialog({ letter, onClose }: { letter: SharedLetter; onClose: () => void }) {
  const [listening, setListening] = useState(false);
  // 견본에는 음성 파일이 없다 — 눌렀을 때 불러오는 중 표시만 잠깐 보인다
  const listen = async () => {
    setListening(true);
    await sleep(FAKE_MS);
    setListening(false);
  };
  return (
    <RdDialog
      width={560}
      title={letter.title || '편지'}
      closeX
      onClose={onClose}
      footer={
        <>
          {letter.hasAudio && (
            <RdButton kind="secondary" place="dialog" busy={listening} busyText="불러오는 중…" onClick={listen}>음성 듣기</RdButton>
          )}
          <RdButton place="dialog" onClick={onClose}>닫기</RdButton>
        </>
      }
    >
      <div className="rd-mp-editbody">
        <p className="rd-dialog__desc rd-ac-letter">{letter.body}</p>
        <MyDl rows={[{ name: '작성일', value: day(letter.createdAt) }]} />
      </div>
    </RdDialog>
  );
}

// ───── 4-14 더 이상 보지 않기 창 — 위험 확인 창(붉은 테두리). 사유를 묻지 않고 새 글을 넣지 않는다 ─────
function WithdrawSharedDialog({ ownerName, onClose, onDone }: { ownerName: string; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    await sleep(FAKE_MS);
    setBusy(false);
    onDone();
  };
  return (
    <RdDialog
      danger
      evenButtons
      title="더 이상 보지 않기"
      onClose={() => !busy && onClose()}
      initialFocus="[data-rd-cancel]"
      footer={
        <>
          <RdButton kind="secondary" place="dialog" data-rd-cancel="" disabled={busy} onClick={onClose}>취소</RdButton>
          <RdButton kind="danger" place="dialog" busy={busy} busyText="처리 중…" onClick={go}>더 이상 보지 않기</RdButton>
        </>
      }
    >
      <p className="rd-dialog__desc">
        {ownerName}님이 공유하신 내용을 더 이상 보지 않습니다. 다시 보시려면 {ownerName}님께 다시 요청하셔야 합니다.
      </p>
    </RdDialog>
  );
}
