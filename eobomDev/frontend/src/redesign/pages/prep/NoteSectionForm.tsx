import React from 'react';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { RdCheck, RdDate, RdField, RdInput, RdSelect, RdTextarea } from '../../parts/RdInputs';
import { RdNotice } from '../../parts/RdNotices';
import {
  DIGITAL_CATEGORIES,
  DIGITAL_CHOICES,
  FUNERAL_CHOICES,
  INSURANCE_ITEMS,
  LIFE_SUPPORT_CHOICES,
  REG_CHOICES,
  relationLabel,
  SECTION_ALLOWED_TIMINGS,
  TIMING_LABEL,
  type Choice,
  type FamilyItem,
  type NoteSection,
  type NoteValues,
  type Timing,
} from './noteData';
import { SaveStatus, type SaveState } from './prepCommon';

// 엔딩노트 항목 하나의 입력 폼 — 데스크톱은 펼침 안, 모바일은 아래에서 올라오는 판 안에 같은 내용을 둔다(1-2).
// 고르기 목록·안내 글은 지금 화면(`pages/EndingNotePage.tsx`)에서 옮겼다(10-2).

type Patch = (p: Partial<NoteValues>) => void;

function Pick({ label, value, choices, onChange }: { label: string; value: string; choices: Choice[]; onChange: (v: string) => void }) {
  return (
    <RdField label={label}>
      {(p) => (
        <RdSelect {...p} value={value} onChange={(e) => onChange(e.target.value)}>
          {choices.map((c) => (
            <option key={c.value || 'none'} value={c.value}>{c.label}</option>
          ))}
        </RdSelect>
      )}
    </RdField>
  );
}

function Memo({ label, value, onChange, placeholder, rows = 5 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <RdField label={label}>
      {(p) => <RdTextarea {...p} rows={rows} maxLength={2000} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </RdField>
  );
}

function Insurance({ values, patch }: { values: NoteValues; patch: Patch }) {
  const ins = values.insurance;
  return (
    <div>
      {INSURANCE_ITEMS.map((item) => {
        const cur = ins[item.key];
        return (
          <div className="rd-pr-ins" key={item.key}>
            <RdCheck
              label={`${item.label} 가입`}
              checked={!!cur?.checked}
              onChange={(e) => patch({ insurance: { ...ins, [item.key]: { checked: e.target.checked, company: cur?.company || '' } } })}
            />
            {cur?.checked ? (
              <RdInput
                aria-label={`${item.label} 회사명`}
                value={cur.company || ''}
                onChange={(e) => patch({ insurance: { ...ins, [item.key]: { checked: true, company: e.target.value } } })}
                placeholder="가입 회사명만 (예: OO생명)"
              />
            ) : (
              <span />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function NoteSectionForm({
  section,
  values,
  patch,
  family,
  timingOf,
  setTiming,
  photoStorageEnabled,
  save,
  onSave,
  onCancel,
  sheet,
}: {
  section: NoteSection;
  values: NoteValues;
  patch: Patch;
  family: FamilyItem[];
  timingOf: (familyId: string) => Timing;
  setTiming: (familyId: string, t: Timing) => void;
  /** 06-06 §5-2-1 — 사진 보관 스위치. 유언장 소재 안내 글이 바뀐다 */
  photoStorageEnabled: boolean;
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
        <>
          <RdNotice tone="caution" title="이 메모는 법적 효력이 없습니다. 「사전연명의료의향서」는 보건복지부 지정 등록기관에서 본인이 직접 작성·등록해야 합니다." />
          <div className="rd-grid2">
            <Pick label="연명의료 중단 의향" value={v.lifeSupport} choices={LIFE_SUPPORT_CHOICES} onChange={(x) => patch({ lifeSupport: x })} />
            <Pick label="사전연명의료의향서 등록 여부" value={v.lifeSupportRegStatus} choices={REG_CHOICES} onChange={(x) => patch({ lifeSupportRegStatus: x })} />
            {v.lifeSupportRegStatus === '등록함' && (
              <RdField label="등록일 (선택)">{(p) => <RdDate {...p} value={v.lifeSupportRegDate} onChange={(e) => patch({ lifeSupportRegDate: e.target.value })} />}</RdField>
            )}
          </div>
        </>
      );
      break;
    case 'funeral':
      body = (
        <div style={{ maxWidth: 400 }}>
          <Pick label="희망하는 장례 방식" value={v.funeralType} choices={FUNERAL_CHOICES} onChange={(x) => patch({ funeralType: x })} />
        </div>
      );
      break;
    case 'memo-asset':
      body = (
        <>
          <RdNotice tone="caution" title="은행·증권사 이름까지만 적습니다. 계좌번호·잔액·비밀번호는 적지 마세요." />
          <Memo label="거래 중인 은행·증권사" rows={3} value={v.assetNote} onChange={(x) => patch({ assetNote: x })} placeholder="예: 국민은행 주거래 계좌, 통장은 안방 서랍 두 번째 칸" />
        </>
      );
      break;
    case 'digital':
      body = (
        <>
          <RdNotice tone="info" title="자주 쓰시는 디지털 서비스를 사후에 어떻게 처리하고 싶으신지 남겨두세요. 가족이 이 내용을 보고 각 서비스에 직접 요청합니다." />
          <div className="rd-pr-grid4">
            {DIGITAL_CATEGORIES.map((c) => (
              <Pick
                key={c}
                label={c}
                value={v.digitalPrefs[c] || ''}
                choices={DIGITAL_CHOICES}
                onChange={(x) => patch({ digitalPrefs: { ...v.digitalPrefs, [c]: x } })}
              />
            ))}
          </div>
          <RdField label="구독 메모" help="카드번호·비밀번호는 적지 마세요.">
            {(p) => (
              <RdTextarea
                {...p}
                rows={3}
                maxLength={2000}
                value={v.subscriptionNote}
                placeholder="예: 넷플릭스(아이폰 앱스토어 결제), 유튜브 프리미엄(국민카드), 네이버 멤버십(통신요금)"
                onChange={(e) => patch({ subscriptionNote: e.target.value })}
              />
            )}
          </RdField>
        </>
      );
      break;
    case 'insurance':
      body = (
        <>
          <RdNotice tone="info" title="유족이 존재를 몰라 청구를 못 하는 경우가 가장 흔한 손실입니다. 회사명만 남겨두세요 — 증권번호·보장 내역은 받지 않습니다." />
          <Insurance values={v} patch={patch} />
        </>
      );
      break;
    case 'memo-contacts':
      body = (
        <>
          <Memo label="부고를 꼭 알려야 할 사람" rows={3} value={v.contactsNote} onChange={(x) => patch({ contactsNote: x })} placeholder="예: 김OO - 대학 동창 - 010-0000-0000 (한 분씩 한 줄로 적어주세요)" />
          <RdField label="반려동물을 부탁하고 싶은 분">
            {(p) => <RdInput {...p} value={v.petCaretaker} placeholder="예: 막내 여동생 김OO" onChange={(e) => patch({ petCaretaker: e.target.value })} />}
          </RdField>
        </>
      );
      break;
    case 'memo-will':
      body = (
        <RdField
          label="자필증서를 어디에 보관했는지 한 줄로"
          help={
            photoStorageEnabled
              ? '손으로 쓴 원본을 어디에 두셨는지 남겨두세요. 올린 사진은 사본입니다.'
              : '이어봄은 유언장 원본·사본을 보관하지 않습니다. 보관 장소만 남겨두세요.'
          }
        >
          {(p) => <RdInput {...p} value={v.willLocation} placeholder="예: 안방 화장대 서랍 안쪽 서류 봉투" onChange={(e) => patch({ willLocation: e.target.value })} />}
        </RdField>
      );
      break;
    case 'donation':
      body = (
        <>
          <RdNotice tone="caution" title="등록 여부와 등록일만 보관합니다. 실제 등록은 국립장기조직혈액관리원 등 등록기관에서 본인이 직접 해야 하며, 이어봄은 대행하지 않습니다. 시신 기증은 별도 제도입니다." />
          <div className="rd-grid2">
            <Pick label="장기·조직 기증 등록 여부" value={v.donationStatus} choices={REG_CHOICES} onChange={(x) => patch({ donationStatus: x })} />
            {v.donationStatus === '등록함' && (
              <RdField label="등록일 (선택)">{(p) => <RdDate {...p} value={v.donationDate} onChange={(e) => patch({ donationDate: e.target.value })} />}</RdField>
            )}
          </div>
        </>
      );
      break;
  }

  const allowed = SECTION_ALLOWED_TIMINGS[section.id];

  return (
    <div className={`rd-pr-form${sheet ? ' rd-pr-form--sheet' : ''}`}>
      {body}
      {allowed && family.length > 0 && (
        <div className="rd-pr-timing">
          <p className="rd-pr-timing__title">가족 공개 시점</p>
          {family.map((f) => {
            const cur = timingOf(f.id);
            return (
              <div className="rd-pr-timing__row" key={f.id}>
                <span className="rd-pr-timing__who">
                  <span>
                    {f.name} ({relationLabel(f)})
                    {f.status === 'DRAFT' && <span className="rd-pr-timing__note"> 초대 전</span>}
                    {f.status !== 'DRAFT' && f.status !== 'ACCEPTED' && <span className="rd-pr-timing__note"> 수락 전</span>}
                  </span>
                </span>
                <RdSelect aria-label={`${f.name} 공개 시점`} value={cur} onChange={(e) => setTiming(f.id, e.target.value as Timing)}>
                  <option value="none">{TIMING_LABEL.none}</option>
                  {allowed.map((t) => (
                    <option key={t} value={t}>{TIMING_LABEL[t]}</option>
                  ))}
                </RdSelect>
                {/* 00-41 §7.3 — 수락 전(초대 전 포함) 가족에게 즉시 공개를 고르면 수락하는 순간부터 보인다. 막지 않고 사실만 적는다. */}
                {f.status !== 'ACCEPTED' && cur === 'IMMEDIATE' ? <span className="rd-pr-timing__note">초대를 수락하면 바로 볼 수 있습니다.</span> : <span />}
              </div>
            );
          })}
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
