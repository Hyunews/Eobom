import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdBadge, RdButton, RdIconButton, RdTextLink } from '../../parts/RdButtons';
import { RdFold } from '../../parts/RdCards';
import { RdConsentGroup, RdField, RdFileRow, RdInput, RdTextarea } from '../../parts/RdInputs';
import { RdPageHead, RdTabs } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdAlertDialog, RdConfirmDialog, RdDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronLeft, IconChevronRight, IconDoc, IconErrorCircle } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { DangerConfirm, DemoBar, sleep, type DemoOption } from './prepCommon';

// 8단계 묶음 4 · /preview/farewell-messages — 1단계 캔버스 1-11~1-15(유족 메시지 보관함 · 편지 쓰기 · 음성 · 상태 · 확인 창).
// 서버·마이크 없이 예시 값으로 움직인다(녹음은 시간만 센다).

interface Letter {
  id: string;
  title: string;
  date: string;
  voice: boolean;
  body: string;
}
interface Person {
  id: string;
  name: string;
  relation: string;
  status: string;
  letters: Letter[];
}

const PEOPLE: Person[] = [
  {
    id: 'kim',
    name: '김OO',
    relation: '자녀',
    status: '가족으로 연결됨',
    letters: [
      { id: 'l1', title: '생일 축하한다', date: '2026.10.12', voice: true, body: '올해 생일에는 같이 밥을 먹지 못할 것 같아서 미리 적어 둔다. 미역국은 네가 끓인 게 제일 맛있었다.' },
      { id: 'l2', title: '김OO에게…', date: '2026.10.03', voice: false, body: '현관 비밀번호는 예전 그대로다. 보일러는 겨울 전에 한 번 점검받아라.' },
      { id: 'l3', title: '못다 한 말', date: '2026.09.21', voice: false, body: '그때 화를 내서 미안했다. 말로는 끝내 못 했다.' },
    ],
  },
  { id: 'lee', name: '이OO', relation: '배우자', status: '수락 대기 중', letters: [{ id: 'l4', title: '고마웠던 날들', date: '2026.09.02', voice: false, body: '함께 걸었던 길이 가장 오래 남는다.' }] },
  { id: 'park', name: '박OO', relation: '자녀', status: '아직 알리지 않음', letters: [] },
  { id: 'choi', name: '최OO', relation: '형제', status: '거절됨', letters: [
    { id: 'l5', title: '건강 챙기거라', date: '2026.08.15', voice: false, body: '끼니 거르지 말고 먹어라.' },
    { id: 'l6', title: '고향집', date: '2026.08.01', voice: false, body: '고향집 열쇠는 둘째 서랍에 있다.' },
  ] },
];

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본' },
  { value: 'login', label: '로그인 전' },
  { value: 'loading', label: '불러오는 중' },
  { value: 'nofamily', label: '지정한 가족이 없을 때' },
  { value: 'noletters', label: '받는 분은 있고 편지가 없을 때' },
  { value: 'loadfail', label: '불러오기 실패' },
  { value: 'save-fail', label: '저장 실패 (저장을 누르면)', group: '편지 쓰기 창' },
  { value: 'voice-format', label: '올리기 실패 ① 형식', group: '편지 쓰기 창' },
  { value: 'voice-size', label: '올리기 실패 ② 용량', group: '편지 쓰기 창' },
  { value: 'voice-stt', label: '올리기 실패 ③ 변환 실패', group: '편지 쓰기 창' },
  { value: 'mic-denied', label: '마이크 권한 없음', group: '편지 쓰기 창' },
  { value: 'mic-unsupported', label: '녹음 미지원 브라우저', group: '편지 쓰기 창' },
  { value: 'stt-off', label: '음성 기능이 꺼져 있을 때', group: '편지 쓰기 창' },
  { value: 'voice-exists', label: '이미 음성이 있을 때', group: '편지 쓰기 창' },
  { value: 'del-fail', label: '삭제 실패 알림 (삭제하면)', group: '편지 쓰기 창' },
];

const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const DownIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
);
const TrashIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6" />
  </svg>
);
const MicIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

/* ───────── 편지 쓰기 창 ───────── */

type Method = 'upload' | 'record' | 'write';
type Rec = 'idle' | 'recording' | 'done';

function WriteDialog({
  person,
  letter,
  demo,
  onClose,
  onSaved,
  onDelete,
}: {
  person: Person;
  letter: Letter | null;
  demo: string;
  onClose: () => void;
  onSaved: (title: string, body: string, voice: boolean) => void;
  onDelete: () => void;
}) {
  const phone = useIsPhone();
  const editing = !!letter;
  const [method, setMethod] = useState<Method>(demo === 'normal' || demo === 'save-fail' ? 'write' : demo.startsWith('mic') || demo === 'stt-off' ? 'record' : 'upload');
  const [title, setTitle] = useState(letter?.title ?? '');
  const [body, setBody] = useState(letter?.body ?? '');
  const [savedVoice, setSavedVoice] = useState(letter?.voice ?? demo === 'voice-exists');
  const [pendingVoice, setPendingVoice] = useState(false);
  const [keepVoice, setKeepVoice] = useState(true);
  const [consent, setConsent] = useState<Record<string, boolean>>({ c: false });
  const [recConsent, setRecConsent] = useState<Record<string, boolean>>({ c: false });
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(demo === 'voice-format' ? 'm4a · mp3 · wav · webm 파일만 올릴 수 있습니다.' : demo === 'voice-size' ? '파일이 너무 큽니다. 최대 20MB까지 올릴 수 있습니다.' : null);
  const [working, setWorking] = useState(false);
  const [workErr, setWorkErr] = useState<string | null>(demo === 'voice-stt' ? '음성 변환에 실패했습니다.\n직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요.' : null);
  const [rec, setRec] = useState<Rec>('idle');
  const [sec, setSec] = useState(0);
  const [recAsk, setRecAsk] = useState(false);
  const [askedOnce, setAskedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [closeAsk, setCloseAsk] = useState(false);
  const [voiceDel, setVoiceDel] = useState<'saved' | 'pending' | null>(null);
  const [letterDel, setLetterDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (rec !== 'recording') return;
    const t = window.setInterval(() => setSec((s) => (s >= 600 ? 600 : s + 1)), 1000);
    return () => window.clearInterval(t);
  }, [rec]);

  const dirty = (!editing && (title.trim() || body.trim())) || pendingVoice || (editing && (title !== letter?.title || body !== letter?.body));
  const tryClose = () => (dirty ? setCloseAsk(true) : onClose());

  const toText = async () => {
    setWorking(true);
    setWorkErr(null);
    await sleep(1800);
    if (!alive.current) return;
    setWorking(false);
    if (demo === 'voice-stt') {
      setWorkErr('음성 변환에 실패했습니다.\n직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요.');
      return;
    }
    setBody((b) => (b ? `${b}\n` : '') + '민수야, 잘 지내고 있니. 이 글은 목소리로 남긴 말을 옮긴 것이다. 밥은 거르지 말고 먹어라.');
    setPendingVoice(true);
    setMethod('write');
    setFile(null);
    setRec('idle');
    setSec(0);
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['m4a', 'mp3', 'wav', 'webm'].includes(ext)) {
      setFile(null);
      setFileErr('m4a · mp3 · wav · webm 파일만 올릴 수 있습니다.');
    } else if (f.size > 20 * 1024 * 1024) {
      setFile(null);
      setFileErr('파일이 너무 큽니다. 최대 20MB까지 올릴 수 있습니다.');
    } else {
      setFileErr(null);
      setFile(f);
    }
  };

  const doSave = async () => {
    setSaving(true);
    setSaveErr(false);
    await sleep(700);
    if (!alive.current) return;
    setSaving(false);
    if (demo === 'save-fail') {
      setSaveErr(true);
      return;
    }
    onSaved(title.trim() || '제목 없음', body, savedVoice || (pendingVoice && keepVoice));
  };

  const voiceBlocked = savedVoice || pendingVoice;
  const consentUpload = [
    {
      id: 'c',
      label: '음성 파일이 네이버 클라우드 CLOVA Speech로 전송됩니다.',
      required: true,
      desc: '음성인식 성능 향상에 활용될 수 있습니다.\n변환된 텍스트는 네이버에 7일간 보관 후 삭제됩니다.\n편지를 저장하면 이 파일도 암호화되어 함께 보관됩니다.',
    },
  ];
  const consentRecord = [
    {
      id: 'c',
      label: "'글로 바꾸기'를 누르면 녹음이 네이버 클라우드 CLOVA Speech로 전송됩니다.",
      required: true,
      desc: '음성인식 성능 향상에 활용될 수 있습니다.\n변환된 텍스트는 네이버에 7일간 보관 후 삭제됩니다.\n편지를 저장하면 녹음 원본도 암호화되어 함께 보관됩니다.',
    },
  ];

  const sttOff = demo === 'stt-off';
  const existsLine = (
    <RdNotice tone="info" title="이미 저장된 음성이 있습니다.">
      위의 '음성 삭제'를 누르면 다시 올리거나 녹음할 수 있습니다.
    </RdNotice>
  );

  let methodBody: React.ReactNode = null;
  if (working) {
    methodBody = (
      <div className="rd-pr-working" role="status">
        <RdState kind="working" title="처리하고 있습니다." desc="최대 2분까지 걸릴 수 있습니다." />
        <p>이 화면을 닫으면 처음부터 다시 해야 합니다.</p>
      </div>
    );
  } else if (method === 'upload') {
    methodBody = voiceBlocked ? existsLine : sttOff ? (
      <RdNotice tone="info" title="지금은 음성 파일 업로드를 사용할 수 없습니다.">"직접 쓰기" 탭을 이용해 주세요.</RdNotice>
    ) : (
      <div className="rd-pr-voice">
        <h4>녹음해 둔 음성 파일 올리기</h4>
        <p className="rd-t-small" style={{ margin: 0 }}>m4a · mp3 · wav · webm, 최대 20MB · 10분 이하.</p>
        <RdNotice tone="info" title={phone ? '본인의 음성만 올려 주세요.' : '본인의 음성만 올려 주세요. 다른 분의 녹음은 올리지 마세요.'}>
          이 녹음으로 만든 편지는 사후에 지정한 가족에게 전달됩니다.
        </RdNotice>
        <RdConsentGroup items={consentUpload} checked={consent} onChange={setConsent} />
        {file && <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}><RdFileRow name={file.name} meta={`${(file.size / 1048576).toFixed(1)}MB`} onRemove={() => setFile(null)} /></ul>}
        {fileErr && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>{fileErr}</span></p>}
        {workErr && <p className="rd-pr-err" role="alert" style={{ whiteSpace: 'pre-line' }}><IconErrorCircle /><span>{workErr}</span></p>}
        <div className="rd-pr-actions">
          <RdButton kind="secondary" place="dialog" onClick={() => fileRef.current?.click()}>파일 선택</RdButton>
          <RdButton place="dialog" disabled={!consent.c || !file} onClick={toText}>업로드</RdButton>
        </div>
        <input ref={fileRef} type="file" accept=".m4a,.mp3,.wav,.webm,audio/*" hidden onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
      </div>
    );
  } else if (method === 'record') {
    methodBody = voiceBlocked ? existsLine : sttOff ? (
      <RdNotice tone="info" title="지금은 음성 녹음을 글로 바꾸는 기능을 사용할 수 없습니다.">"직접 쓰기" 탭을 이용해 주세요.</RdNotice>
    ) : demo === 'mic-unsupported' ? (
      <RdNotice tone="info" title="이 브라우저에서는 음성 입력을 지원하지 않습니다.">아래 입력창에 직접 입력해 주세요.</RdNotice>
    ) : demo === 'mic-denied' ? (
      <RdNotice tone="info" title="마이크를 사용할 수 없습니다.">권한을 확인하거나 아래 입력창에 직접 입력해 주세요.</RdNotice>
    ) : (
      <div className="rd-pr-voice">
        <RdConsentGroup items={consentRecord} checked={recConsent} onChange={setRecConsent} />
        {rec === 'idle' && (
          <div className="rd-pr-actions">
            <RdButton
              place="dialog"
              disabled={!recConsent.c}
              onClick={() => (askedOnce ? (setRec('recording'), setSec(0)) : setRecAsk(true))}
            >
              녹음 시작
            </RdButton>
          </div>
        )}
        {rec === 'recording' && (
          <div className="rd-pr-rec">
            <p className="rd-pr-rec__now" role="status"><span className="rd-pr-rec__dot" aria-hidden="true" />녹음 중 {fmtClock(sec)} <span className="rd-t-small">(최대 10분)</span></p>
            <RdButton kind="secondary" place="dialog" onClick={() => setRec('done')}>녹음 멈춤</RdButton>
          </div>
        )}
        {rec === 'done' && (
          <div className="rd-pr-rec">
            <p className="rd-pr-rec__now">녹음을 마쳤습니다.</p>
            <div className="rd-pr-rec__row">
              <RdButton kind="secondary" place="row" onClick={() => undefined}>먼저 들어보기</RdButton>
            </div>
            <p className="rd-t-small" style={{ margin: 0 }}>취소하면 녹음이 사라집니다.</p>
            <div className="rd-pr-actions">
              <RdButton kind="secondary" place="dialog" onClick={() => { setRec('idle'); setSec(0); }}>취소</RdButton>
              <RdButton place="dialog" onClick={toText}>글로 바꾸기</RdButton>
            </div>
          </div>
        )}
        {workErr && <p className="rd-pr-err" role="alert" style={{ whiteSpace: 'pre-line' }}><IconErrorCircle /><span>{workErr}</span></p>}
      </div>
    );
  } else {
    methodBody = (
      <RdFold title="작성 안내" defaultOpen={!editing && !body}>
        <div className="rd-pr-guide">
          <p>무엇을 남길까 고민된다면</p>
          <div className="rd-pr-guide__chips">
            <span>요즘 근황</span>
            <span>고마웠던 순간</span>
            <span>못다한 말</span>
          </div>
        </div>
      </RdFold>
    );
  }

  const titleField = (
    <RdField label="제목 (선택)">{(p) => <RdInput {...p} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />}</RdField>
  );
  const bodyField = (
    <RdField label="내용">{(p) => <RdTextarea {...p} rows={phone ? 7 : 8} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />}</RdField>
  );

  return (
    <>
      <RdDialog
        form
        eyebrow={`${person.name}님께`}
        title={editing ? '편지 수정' : '새 편지 쓰기'}
        closeX
        onClose={tryClose}
        footer={
          working ? (
            <RdButton kind="secondary" place="dialog" onClick={onClose}>닫기</RdButton>
          ) : (
            <>
              <RdButton kind="secondary" place="dialog" onClick={tryClose}>취소</RdButton>
              <RdButton place="dialog" busy={saving} busyText="저장" onClick={doSave}>저장</RdButton>
            </>
          )
        }
      >
        <div className="rd-pr-write">
          {savedVoice && (
            <div className="rd-pr-saved">
              <b>첨부된 음성</b>
              <RdButton kind="secondary" place="row" onClick={() => undefined}>듣기</RdButton>
              <RdButton kind="secondary" place="row" onClick={() => setVoiceDel('saved')}>음성 삭제</RdButton>
            </div>
          )}
          {pendingVoice && (
            <div className="rd-pr-saved" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>저장 전 음성</b>
                <RdButton kind="secondary" place="row" onClick={() => undefined}>듣기</RdButton>
                <RdButton kind="secondary" place="row" onClick={() => setVoiceDel('pending')}>삭제</RdButton>
              </div>
              <label className="rd-choice"><input type="checkbox" className="rd-checkbox" checked={keepVoice} onChange={(e) => setKeepVoice(e.target.checked)} /><span>목소리도 함께 남기기</span></label>
              <p className="rd-t-small" style={{ margin: 0 }}>저장하면 글과 함께 저장되고, 저장 없이 닫거나 떠나면 사라집니다.</p>
            </div>
          )}
          {!phone && titleField}
          <RdTabs
            label="편지 쓰는 방법"
            tabs={[
              { value: 'upload', label: '음성 파일 업로드' },
              { value: 'record', label: '음성 녹음' },
              { value: 'write', label: '직접 쓰기' },
            ]}
            value={method}
            onChange={(v) => setMethod(v as Method)}
          />
          {methodBody}
          {pendingVoice && method !== 'write' ? null : (
            <>
              {phone && titleField}
              {bodyField}
            </>
          )}
          {pendingVoice && method === 'write' && !working && (
            <p className="rd-t-small" style={{ margin: 0 }}>변환이 끝났습니다. 다른 음성으로 바꾸려면 위의 '삭제'를 누르세요.</p>
          )}
          {pendingVoice && <p className="rd-t-small" style={{ margin: 0 }}>자동으로 바뀐 글. 확인 후 수정하세요.</p>}
          {editing && (
            <div className="rd-pr-textbtns">
              <button type="button" className="rd-pr-textbtn" onClick={() => undefined}>다운로드</button>
              <button type="button" className="rd-pr-textbtn rd-pr-textbtn--danger" onClick={() => setLetterDel(true)}>삭제</button>
            </div>
          )}
          {saveErr && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>저장 중 오류가 발생했습니다.</span></p>}
        </div>
      </RdDialog>

      {recAsk && (
        <RdDialog
          title="목소리를 녹음합니다"
          onClose={() => setRecAsk(false)}
          evenButtons
          footer={
            <>
              <RdButton kind="secondary" place="dialog" onClick={() => setRecAsk(false)}>취소</RdButton>
              <RdButton place="dialog" onClick={() => { setRecAsk(false); setAskedOnce(true); setRec('recording'); setSec(0); }}>확인하고 시작하기</RdButton>
            </>
          }
        >
          <p className="rd-dialog__desc">녹음을 마친 뒤 '글로 바꾸기'를 누르면 음성이 네이버 클라우드 CLOVA Speech로 전송되어 글로 변환되고, 그 글이 편지 내용으로 들어갑니다.</p>
          <p className="rd-dialog__desc">"목소리도 함께 남기기"가 켜져 있으면 편지를 저장할 때 목소리 원본도 암호화되어 함께 보관되며, 유족이 편지를 열람할 때 함께 들을 수 있습니다.</p>
          <p className="rd-dialog__desc">녹음을 마치면 글로 바꾸기 전에 먼저 들어볼 수 있습니다. 이 안내는 처음 한 번만 표시됩니다.</p>
        </RdDialog>
      )}
      {closeAsk && (
        <RdConfirmDialog
          title="저장하지 않은 음성과 글이 있습니다."
          desc="닫으면 사라집니다."
          keepLabel="계속 작성"
          doLabel="닫기"
          onKeep={() => setCloseAsk(false)}
          onDo={() => { setCloseAsk(false); onClose(); }}
        />
      )}
      {voiceDel && (
        <DangerConfirm
          title={voiceDel === 'saved' ? '이 음성을 삭제하시겠어요?' : '저장 전 음성을 삭제하시겠어요?'}
          desc={voiceDel === 'saved' ? '30일 뒤 완전히 삭제됩니다.' : '저장하기 전이라 되돌릴 수 없습니다.\n입력창의 글은 그대로 남습니다.'}
          onCancel={() => setVoiceDel(null)}
          onDo={() => { if (voiceDel === 'saved') setSavedVoice(false); else setPendingVoice(false); setVoiceDel(null); }}
        />
      )}
      {letterDel && (
        <DangerConfirm
          title="이 편지를 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          onCancel={() => setLetterDel(false)}
          onDo={() => { setLetterDel(false); onDelete(); }}
        />
      )}
    </>
  );
}

/* ───────── 쪽 ───────── */

export function FarewellPage() {
  const phone = useIsPhone();
  const navigate = useNavigate();
  const [demo, setDemo] = useState('normal');
  const [people, setPeople] = useState(PEOPLE);
  const [sel, setSel] = useState<string | null>('kim');
  const [writing, setWriting] = useState<{ person: Person; letter: Letter | null } | null>(null);
  const [delAsk, setDelAsk] = useState<{ person: string; letter: string } | null>(null);
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    setSel(demo === 'noletters' ? 'park' : phone ? null : 'kim');
    const writeDemos = ['save-fail', 'voice-format', 'voice-size', 'voice-stt', 'mic-denied', 'mic-unsupported', 'stt-off', 'voice-exists'];
    setWriting(writeDemos.includes(demo) ? { person: PEOPLE[0], letter: demo === 'voice-exists' ? PEOPLE[0].letters[0] : null } : null);
    setAlert(false);
  }, [demo]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = (
    <RdPageHead
      title="유족 메시지 보관함"
      desc={phone ? undefined : '가족 한 분 한 분께 따로 남기는 편지입니다. 생각날 때마다 남기세요.'}
    />
  );
  const demoBar = <DemoBar value={demo} options={DEMOS} onChange={setDemo} />;

  if (demo === 'login') {
    return (
      <div className="rd-container rd-pr-page">
        {head}
        <div style={{ position: 'relative', minHeight: 520 }}><RdLoginGate screenName="유족 메시지 보관함" contained /></div>
        {demoBar}
      </div>
    );
  }
  if (demo === 'loading') {
    return (
      <div className="rd-container rd-pr-page">
        {head}
        <p className="rd-pr-empty" role="status">불러오는 중...</p>
        {demoBar}
      </div>
    );
  }
  if (demo === 'loadfail') {
    return (
      <div className="rd-container rd-pr-page">
        {head}
        <RdState kind="error" title="화면을 불러오지 못했습니다" desc="잠시 뒤 다시 열어 주세요. 계속되면 '카카오톡 문의하기'로 알려 주세요.">
          <RdButton kind="secondary" onClick={() => navigate('/preview')}>홈으로</RdButton>
          <RdButton onClick={() => setDemo('normal')}>새로 고침</RdButton>
        </RdState>
        {demoBar}
      </div>
    );
  }

  const list = demo === 'nofamily' ? [] : people;
  const cur = list.find((p) => p.id === sel) ?? null;

  const removeLetter = (pid: string, lid: string) => {
    if (demo === 'del-fail') {
      setAlert(true);
      return;
    }
    setPeople((ps) => ps.map((p) => (p.id === pid ? { ...p, letters: p.letters.filter((l) => l.id !== lid) } : p)));
  };

  const peopleNav = (
    <ul className="rd-pr-people" aria-label="받는 분">
      {list.map((p) => (
        <li key={p.id}>
          <button type="button" className="rd-pr-person" aria-current={!phone && sel === p.id ? 'true' : undefined} onClick={() => setSel(p.id)}>
            <span className="rd-pr-avatar" aria-hidden="true">{p.name[0]}</span>
            <span className="rd-pr-person__text">
              <b>{p.name}</b>
              <span>{p.relation} · {p.letters.length}통</span>
            </span>
            <span className="rd-pr-person__chev"><IconChevronRight /></span>
          </button>
        </li>
      ))}
    </ul>
  );

  const detail = cur && (
    <section className="rd-pr-mail__main" aria-label={`${cur.name}님께 남기는 글`}>
      <div className="rd-pr-mail__head">
        <div>
          <h2 className="rd-t-section">{cur.name}님께 남기는 글</h2>
          {phone ? (
            <>
              <p>총 {cur.letters.length}통의 편지가 보관되어 있습니다</p>
              <p style={{ marginTop: 6 }}><RdBadge kind={cur.status === '가족으로 연결됨' ? 'done' : 'state'}>{cur.status}</RdBadge></p>
            </>
          ) : (
            <p>총 {cur.letters.length}통의 편지가 보관되어 있습니다 · {cur.status}</p>
          )}
        </div>
        <div className="rd-pr-mail__tools">
          <RdIconButton label="전체 다운로드" bordered={phone} onClick={() => undefined}><DownIcon size={20} /></RdIconButton>
          <RdButton place="row" onClick={() => setWriting({ person: cur, letter: null })}>새 편지 쓰기</RdButton>
        </div>
      </div>
      {cur.letters.length === 0 ? (
        <p className="rd-pr-empty">아직 남긴 편지가 없습니다.</p>
      ) : (
        <ul className="rd-pr-letters">
          {cur.letters.map((l) => (
            <li className="rd-pr-letter" key={l.id}>
              <button type="button" className="rd-pr-letter__open" onClick={() => setWriting({ person: cur, letter: l })}>
                <span className="rd-pr-letter__meta">
                  {l.voice ? (
                    <RdBadge kind="state"><MicIcon /> 음성 첨부</RdBadge>
                  ) : (
                    <RdBadge kind="draft"><IconDoc size={12} /> 텍스트</RdBadge>
                  )}
                  <span>{l.date}</span>
                </span>
                <span className="rd-pr-letter__title">{l.title}</span>
                <span className="rd-pr-letter__peek">{l.body}</span>
              </button>
              <RdIconButton label="다운로드" onClick={() => undefined}><DownIcon /></RdIconButton>
              <RdIconButton label="편지 삭제" className="rd-pr-iconbtn--danger" onClick={() => setDelAsk({ person: cur.id, letter: l.id })}><TrashIcon /></RdIconButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const endingLink = (
    <div className="rd-pr-linkrow">
      <span>장례 희망·연명의료 등 남겨두실 것이 있다면</span>
      <RdTextLink href="/preview/ending-note" onClick={(e) => { e.preventDefault(); navigate('/preview/ending-note'); }}>디지털 엔딩노트</RdTextLink>
    </div>
  );

  return (
    <div className="rd-container rd-pr-page">
      {head}
      {!phone && list.length > 0 && (
        <RdNotice tone="info" title="여기에 남기신 글과 음성은 사망 확인 후 지정하신 분에게 전달됩니다." />
      )}

      {list.length === 0 ? (
        <div className="rd-pr-mailnone">
          {!phone && (
            <div style={{ width: 280, flex: 'none' }}>
              <RdButton kind="secondary" place="row" onClick={() => undefined}>가족 추가</RdButton>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <RdState kind="empty" title="아직 지정된 가족이 없습니다" desc={phone ? '받으실 분을 먼저 가족으로 지정해 주세요.' : '편지를 남기려면 먼저 받으실 분을 가족으로 지정해 주세요. 수신자가 없으면 사후에도 전달되지 않습니다.'}>
              {phone && <RdButton onClick={() => undefined}>가족 추가</RdButton>}
            </RdState>
          </div>
        </div>
      ) : phone ? (
        cur ? (
          <>
            <button type="button" className="rd-pr-back" onClick={() => setSel(null)}><IconChevronLeft />{cur.name}</button>
            {detail}
          </>
        ) : (
          peopleNav
        )
      ) : (
        <div className="rd-pr-mail">
          {peopleNav}
          {detail}
        </div>
      )}
      {list.length > 0 && endingLink}
      {demoBar}

      {writing && (
        <WriteDialog
          key={`${writing.person.id}-${writing.letter?.id ?? 'new'}-${demo}`}
          person={writing.person}
          letter={writing.letter}
          demo={demo}
          onClose={() => setWriting(null)}
          onSaved={(title, body, voice) => {
            const { person, letter } = writing;
            setPeople((ps) =>
              ps.map((p) =>
                p.id !== person.id
                  ? p
                  : {
                      ...p,
                      letters: letter
                        ? p.letters.map((l) => (l.id === letter.id ? { ...l, title, body, voice } : l))
                        : [{ id: `n${Date.now()}`, title, body, voice, date: '2026.10.22' }, ...p.letters],
                    },
              ),
            );
            setWriting(null);
          }}
          onDelete={() => { removeLetter(writing.person.id, writing.letter!.id); setWriting(null); }}
        />
      )}
      {delAsk && (
        <DangerConfirm
          title="이 편지를 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          onCancel={() => setDelAsk(null)}
          onDo={() => { removeLetter(delAsk.person, delAsk.letter); setDelAsk(null); }}
        />
      )}
      {alert && <RdAlertDialog title="삭제 중 오류가 발생했습니다." onOk={() => setAlert(false)} />}
    </div>
  );
}
