import React, { useEffect, useMemo, useState } from 'react';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdField, RdRadioGroup, RdSelect } from '../../parts/RdInputs';
import { RdDialog, RdAlertDialog } from '../../parts/RdModal';
import { RdPager } from '../../parts/RdCards';
import { RdState } from '../../parts/RdState';
import { IconCheck, IconChevronLeft, IconChevronRight, IconClose } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { PartnerMain, PartnerShellFor, StatusText } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import {
  LEADS, LEAD_FILTER, LEAD_STATUS_LABEL, LEAD_STATUS_TONE, LEAD_TOTAL_COUNT, LEAD_TOTAL_PAGES, LEAD_TYPE_LABEL, LOST_REASONS,
  type LeadItem, type LeadStatus,
} from './partnerData';

// 8단계 묶음 10 · /preview/partner/inquiries — 받은 문의. 정본: 01-05 §14-4 · §4.3 · 판 6-5.
// 데스크톱 = 목록 400 + 고른 건의 상세 카드 / 모바일 = 목록 화면 → 상세 화면(위 되돌아가기 "받은 업체 문의"). 줄 안에서 펼치지 않는다.
// 상세 버튼: 접수·전달됨 = [응답 완료로 표시] / 응답완료 = [무산 처리][성사 처리](보조 왼쪽 · 주 오른쪽, 코드의 성사→무산 순과 반대 — 8단계 #3). 확인 창 없음(2026-10-19 "지금대로").

type View = 'ready' | 'empty' | 'loading' | 'loadfail' | 'actionfail';
const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본 (12건, 4줄)' },
  { value: 'empty', label: '빈 목록' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'actionfail', label: '상태 변경 실패 (알림 창)', group: '상태' },
];

/** 응답 전 문의 = 접수·전달됨(아직 [응답 완료로 표시]를 안 누른 것). 메뉴 옆 갈색 숫자와 홈 첫 칸이 같은 뜻 */
const isWaiting = (s: LeadStatus) => s === 'REQUESTED' || s === 'NOTIFIED';

export function PartnerInquiriesPage() {
  const phone = useIsPhone();
  const [view, setView] = useState<View>('ready');
  const [leads, setLeads] = useState<LeadItem[]>(LEADS);
  const [filter, setFilter] = useState<'' | LeadStatus>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(LEADS[0].leadNo);
  const [lostFor, setLostFor] = useState<LeadItem | null>(null);
  const [failOpen, setFailOpen] = useState(false);
  const [busyNo, setBusyNo] = useState<string | null>(null);

  const rows = useMemo(() => (filter ? leads.filter((l) => l.status === filter) : leads), [leads, filter]);
  const current = rows.find((l) => l.leadNo === selected) ?? null;
  // 데스크톱은 항상 상세 칸에 한 건이 열려 있다. 모바일은 줄을 눌러야 상세 화면으로 간다.
  const shown = phone ? current : (current ?? rows[0] ?? null);
  const waiting = leads.filter((l) => isWaiting(l.status)).length;

  useEffect(() => {
    if (phone && selected && !rows.some((l) => l.leadNo === selected)) setSelected(null);
  }, [phone, rows, selected]);

  const changeStatus = async (lead: LeadItem, next: LeadStatus) => {
    if (view === 'actionfail') {
      setFailOpen(true);
      return;
    }
    setBusyNo(lead.leadNo);
    await sleep(500);
    setLeads((all) => all.map((l) => (l.leadNo === lead.leadNo ? { ...l, status: next } : l)));
    setBusyNo(null);
  };

  const body: React.ReactNode = (() => {
    if (view === 'loading') return <p className="rd-pt-line" role="status">불러오는 중…</p>;
    if (view === 'loadfail') return <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
    if (view === 'empty' || rows.length === 0) {
      return <RdState kind="empty" title="아직 받은 업체 문의가 없습니다." />;
    }
    const detail = shown && (
      <section className="rd-pt-detail" aria-label="고른 문의 상세">
        {phone && (
          <a
            className="rd-pt-back"
            href="#list"
            onClick={(e) => {
              e.preventDefault();
              setSelected(null);
            }}
          >
            <IconChevronLeft size={14} />받은 업체 문의
          </a>
        )}
        <div className="rd-pt-detail__card">
          <div className="rd-pt-detail__head">
            <h2 className="rd-pt-detail__no">{shown.leadNo}</h2>
            <StatusText tone={LEAD_STATUS_TONE[shown.status]}>{LEAD_STATUS_LABEL[shown.status]}</StatusText>
          </div>
          <div className="rd-pt-detail__who">
            <span className="rd-pt-detail__what">{LEAD_TYPE_LABEL[shown.type]} · {shown.facilityName}</span>
            <span className="rd-pt-detail__applicant">{shown.applicantName} · {shown.applicantPhone}</span>
          </div>
          {shown.message && <p className="rd-pt-detail__msg">{shown.message}</p>}
          {(isWaiting(shown.status) || shown.status === 'RESPONDED') && (
            <RdButtonRow place="screen">
              {isWaiting(shown.status) ? (
                <RdButton busy={busyNo === shown.leadNo} busyText="처리 중…" onClick={() => changeStatus(shown, 'RESPONDED')}>
                  <span className="rd-pt-btnicon"><IconCheck size={16} />응답 완료로 표시</span>
                </RdButton>
              ) : (
                <>
                  <RdButton kind="secondary" disabled={busyNo === shown.leadNo} onClick={() => setLostFor(shown)}>
                    <span className="rd-pt-btnicon"><IconClose size={16} />무산 처리</span>
                  </RdButton>
                  <RdButton busy={busyNo === shown.leadNo} busyText="처리 중…" onClick={() => changeStatus(shown, 'CONVERTED')}>
                    <span className="rd-pt-btnicon"><IconCheck size={16} />성사 처리</span>
                  </RdButton>
                </>
              )}
            </RdButtonRow>
          )}
        </div>
      </section>
    );

    // 모바일: 고른 줄이 있으면 상세 화면, 없으면 목록 화면
    if (phone && shown) return detail;

    const list = (
      <div className="rd-pt-listcol">
        <ul className="rd-pt-list">
          {rows.map((l) => (
            <li key={l.leadNo}>
              <a
                href={`#${l.leadNo}`}
                className={`rd-pt-row${!phone && shown?.leadNo === l.leadNo ? ' is-on' : ''}`}
                aria-current={!phone && shown?.leadNo === l.leadNo ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setSelected(l.leadNo);
                }}
              >
                <span className="rd-pt-row__text">
                  <span className="rd-pt-row__top">
                    <b>{l.leadNo}</b>
                    <StatusText tone={LEAD_STATUS_TONE[l.status]}>{LEAD_STATUS_LABEL[l.status]}</StatusText>
                  </span>
                  <span className="rd-pt-row__what">{LEAD_TYPE_LABEL[l.type]} · {l.facilityName}</span>
                  <span className="rd-pt-row__who">{l.applicantName} · {l.applicantPhone}</span>
                  {l.message && <span className="rd-pt-row__msg">{l.message}</span>}
                </span>
                {phone && <span className="rd-pt-row__chev"><IconChevronRight /></span>}
              </a>
            </li>
          ))}
        </ul>
        <RdPager page={page} total={LEAD_TOTAL_PAGES} onChange={setPage} />
      </div>
    );
    return phone ? list : (
      <div className="rd-pt-split">
        {list}
        {detail}
      </div>
    );
  })();

  const inDetail = phone && shown && view === 'ready';
  return (
    <PartnerShellFor current="inquiries" waiting={waiting}>
      <PartnerMain>
        {!inDetail && (
          <PartnerTitle
            aside={
              <div className="rd-pt-filter">
                <RdSelect
                  aria-label="문의 상태"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as '' | LeadStatus);
                    setPage(1);
                    setSelected(null); // 데스크톱은 새 목록의 첫 건이 상세 칸에 열린다(shown 계산)
                  }}
                >
                  {LEAD_FILTER.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </RdSelect>
              </div>
            }
          >
            받은 업체 문의 <span className="rd-pt-count">총 {view === 'ready' ? LEAD_TOTAL_COUNT : 0}건</span>
          </PartnerTitle>
        )}
        {body}
        <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
      </PartnerMain>

      {lostFor && (
        <LostDialog
          lead={lostFor}
          onClose={() => setLostFor(null)}
          onDone={() => {
            const target = lostFor;
            setLostFor(null);
            void changeStatus(target, 'LOST');
          }}
        />
      )}
      {failOpen && <RdAlertDialog title="상태 변경에 실패했습니다." onOk={() => setFailOpen(false)} />}
    </PartnerShellFor>
  );
}

/** 무산 처리 창 — 입력 창(00-44 §7-6). 윗글 "#번호 · 시설명" · 제목 "무산 처리" · 사유 고르기 4개(필수) · ④면 글 칸(글 필수) · 주 버튼(위험색 아님). 오류 문구는 구현 때 정한 것. */
function LostDialog({ lead, onClose, onDone }: { lead: LeadItem; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const submit = () => {
    if (!reason) {
      setError('사유를 골라야 처리할 수 있습니다.');
      return;
    }
    if (reason === 'OTHER' && !note.trim()) {
      setNoteError('사유를 입력해야 처리할 수 있습니다.');
      return;
    }
    onDone();
  };

  return (
    <RdDialog
      form
      width={560}
      eyebrow={`${lead.leadNo} · ${lead.facilityName}`}
      title="무산 처리"
      onClose={onClose}
      closeX
      footer={
        <>
          <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
          <RdButton place="dialog" onClick={submit}>무산 처리</RdButton>
        </>
      }
    >
      <div className="rd-pt-dlgbody">
        <RdRadioGroup
          legend="무산 사유"
          name="lost-reason"
          value={reason}
          options={LOST_REASONS}
          onChange={(v) => {
            setReason(v);
            setError(null);
          }}
        />
        {error && <p className="rd-field__error" role="alert">{error}</p>}
        {reason === 'OTHER' && (
          <RdField label="사유" error={noteError ?? undefined}>
            {(p) => (
              <textarea
                {...p}
                className="rd-input rd-input--area"
                rows={4}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setNoteError(null);
                }}
              />
            )}
          </RdField>
        )}
      </div>
    </RdDialog>
  );
}
