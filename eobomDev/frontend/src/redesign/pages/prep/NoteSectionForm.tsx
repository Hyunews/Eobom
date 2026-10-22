import React from 'react';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { RdCheck, RdDate, RdField, RdInput, RdSelect, RdTextarea } from '../../parts/RdInputs';
import { FAMILIES, SELECT_OPTIONS, TIMING_LABEL, type NoteSection, type NoteValues, type Timing } from './noteData';
import { SaveStatus, type SaveState } from './prepCommon';

// 엔딩노트 구간 하나의 입력 폼 — 데스크톱은 펼침 안, 모바일은 아래에서 올라오는 판 안에 같은 내용을 둔다(1-2).

function Pick({ id, label, field, values, set }: { id?: string; label: string; field: string; values: NoteValues; set: (k: string, v: string | boolean) => void }) {
  return (
    <RdField label={label}>
      {(p) => (
        <RdSelect {...p} value={String(values[field])} onChange={(e) => set(field, e.target.value)}>
          {SELECT_OPTIONS[field].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </RdSelect>
      )}
    </RdField>
  );
}

function Memo({ label, field, values, set }: { label: string; field: string; values: NoteValues; set: (k: string, v: string | boolean) => void }) {
  return (
    <RdField label={label}>
      {(p) => <RdTextarea {...p} rows={5} maxLength={2000} value={String(values[field])} onChange={(e) => set(field, e.target.value)} />}
    </RdField>
  );
}

function Insurance({ values, set }: { values: NoteValues; set: (k: string, v: string | boolean) => void }) {
  const rows: [string, string, string | null][] = [
    ['insLife', '생명보험', 'insLifeCo'],
    ['insPension', '연금(개인·퇴직)', 'insPensionCo'],
    ['insMedical', '실손·상해보험', null],
  ];
  return (
    <div>
      {rows.map(([chk, label, co]) => (
        <div className="rd-pr-ins" key={chk}>
          <RdCheck label={label} checked={!!values[chk]} onChange={(e) => set(chk, e.target.checked)} />
          {co && values[chk] ? (
            <RdInput aria-label={`${label} 회사명`} value={String(values[co])} onChange={(e) => set(co, e.target.value)} placeholder="회사명" />
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}

export function NoteSectionForm({
  section,
  values,
  setValue,
  timings,
  setTiming,
  hasFamily,
  save,
  onSave,
  onCancel,
  sheet,
}: {
  section: NoteSection;
  values: NoteValues;
  setValue: (k: string, v: string | boolean) => void;
  timings: Record<string, Timing>;
  setTiming: (family: string, t: Timing) => void;
  hasFamily: boolean;
  save: SaveState;
  onSave: () => void;
  onCancel: () => void;
  /** 모바일 판 안 — 버튼은 판 바닥 줄에 있어 여기선 그리지 않는다 */
  sheet?: boolean;
}) {
  const v = values;
  let body: React.ReactNode = null;
  switch (section.kind) {
    case 'life':
      body = (
        <div className="rd-grid2">
          <Pick label="연명의료 중단 의향" field="lifeStop" values={v} set={setValue} />
          <Pick label="사전연명의료의향서 등록 여부" field="lifeReg" values={v} set={setValue} />
          <RdField label="날짜 (선택)">{(p) => <RdDate {...p} value={String(v.lifeDate)} onChange={(e) => setValue('lifeDate', e.target.value)} />}</RdField>
        </div>
      );
      break;
    case 'funeral':
      body = (
        <div style={{ maxWidth: 400 }}>
          <Pick label="희망하는 장례 방식" field="funeral" values={v} set={setValue} />
        </div>
      );
      break;
    case 'memo-asset':
      body = <Memo label="자산 소재 안내" field="asset" values={v} set={setValue} />;
      break;
    case 'digital':
      body = (
        <div className="rd-pr-grid4">
          <Pick label="이메일" field="email" values={v} set={setValue} />
          <Pick label="SNS" field="sns" values={v} set={setValue} />
          <Pick label="클라우드" field="cloud" values={v} set={setValue} />
          <Pick label="구독 서비스" field="subs" values={v} set={setValue} />
        </div>
      );
      break;
    case 'insurance':
      body = <Insurance values={v} set={setValue} />;
      break;
    case 'memo-contacts':
      body = <Memo label="중요 연락처·반려동물" field="contacts" values={v} set={setValue} />;
      break;
    case 'memo-will':
      body = <Memo label="유언장 소재 안내" field="willloc" values={v} set={setValue} />;
      break;
    case 'donation':
      body = (
        <div style={{ maxWidth: 400 }}>
          <Pick label="기증 등록 여부" field="donation" values={v} set={setValue} />
        </div>
      );
      break;
  }

  return (
    <div className={`rd-pr-form${sheet ? ' rd-pr-form--sheet' : ''}`}>
      {body}
      {hasFamily && (
        <div className="rd-pr-timing">
          <p className="rd-pr-timing__title">가족 공개 시점</p>
          {FAMILIES.map((f) => (
            <div className="rd-pr-timing__row" key={f.id}>
              <span className="rd-pr-timing__who">
                <span>
                  {f.name} ({f.relation})
                  {f.link === 'pending' && <span className="rd-pr-timing__note"> 수락 전</span>}
                  {f.link === 'draft' && <span className="rd-pr-timing__note"> 초대 전</span>}
                </span>
              </span>
              <RdSelect
                aria-label={`${f.name} 공개 시점`}
                value={timings[f.id] ?? 'none'}
                onChange={(e) => setTiming(f.id, e.target.value as Timing)}
              >
                {(Object.keys(TIMING_LABEL) as Timing[]).map((t) => (
                  <option key={t} value={t}>{TIMING_LABEL[t]}</option>
                ))}
              </RdSelect>
              {f.link === 'draft' ? <span className="rd-pr-timing__note">초대를 수락하면 바로 볼 수 있습니다.</span> : <span />}
            </div>
          ))}
        </div>
      )}
      {sheet ? (
        <div className="rd-pr-foot" style={{ borderTop: 0, paddingTop: 0 }}>
          <SaveStatus state={save} />
        </div>
      ) : (
        <div className="rd-pr-foot">
          <SaveStatus state={save} />
          <RdButtonRow place="row">
            <RdButton kind="secondary" place="row" onClick={onCancel}>취소</RdButton>
            <RdButton place="row" busy={save === 'saving'} busyText="저장" onClick={onSave}>저장</RdButton>
          </RdButtonRow>
        </div>
      )}
    </div>
  );
}
