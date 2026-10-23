import React, { useEffect, useMemo, useState } from 'react';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdSelect } from '../../parts/RdInputs';
import { RdAlertDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconCheck, IconChevronLeft, IconChevronRight, IconClose } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { ExpertShellFor, PartnerMain, StatusText } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import {
  CONSULTS, CONSULT_CHANNEL_LABEL, CONSULT_CONTEXT_LABEL, CONSULT_FILTER, CONSULT_STATUS_LABEL, CONSULT_STATUS_TONE,
  type ConsultItem, type ConsultStatus,
} from './partnerData';

// 8단계 묶음 11 · /preview/partner/expert/consults — 받은 상담. 정본: 02-03 §7.3-1 · 판 6-10.
// 데스크톱 = 목록 400 + 고른 건의 상세 카드 / 모바일 = 목록 화면 → 상세 화면(위 되돌아가기 "받은 상담 신청"). 사업자 받은 문의와 같은 짜임.
// 제목 줄 오른쪽 상태 고르기. 목록 줄 = 신청 번호 · 상태 / 신청자 · 전화 / 경로 · 구분(생전 상담·사후 상담). 쪽 넘김 없음(코드에 없다).
// 상세 버튼: 접수 = [거절] 보조 · [수락] 주 / 수락됨 = [상담 완료 처리] 주 / 그 밖엔 없음. 확인 창 없음(2026-10-19 "지금대로").

type View = 'ready' | 'empty' | 'loading' | 'loadfail' | 'actionfail' | 'neterror';
const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본 (4건)' },
  { value: 'empty', label: '빈 목록' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'actionfail', label: '상태 변경 실패 (알림 창)', group: '상태' },
  { value: 'neterror', label: '서버 통신 오류 (알림 창)', group: '상태' },
];

const ALERT_TEXT: Partial<Record<View, string>> = {
  actionfail: '상태 변경에 실패했습니다.',
  neterror: '서버와 통신 중 오류가 발생했습니다.',
};

const rowWhat = (c: ConsultItem) => `${CONSULT_CHANNEL_LABEL[c.channel]} · ${CONSULT_CONTEXT_LABEL[c.context]}`;

export function ExpertConsultsPage() {
  const phone = useIsPhone();
  const [view, setView] = useState<View>('ready');
  const [items, setItems] = useState<ConsultItem[]>(CONSULTS);
  const [filter, setFilter] = useState<'' | ConsultStatus>('');
  const [selected, setSelected] = useState<string | null>(CONSULTS[0].requestNo);
  const [failOpen, setFailOpen] = useState(false);
  const [busyNo, setBusyNo] = useState<string | null>(null);

  const rows = useMemo(() => (filter ? items.filter((c) => c.status === filter) : items), [items, filter]);
  const current = rows.find((c) => c.requestNo === selected) ?? null;
  // 데스크톱은 항상 상세 칸에 한 건이 열려 있다. 모바일은 줄을 눌러야 상세 화면으로 간다.
  const shown = phone ? current : (current ?? rows[0] ?? null);
  const waiting = items.filter((c) => c.status === 'REQUESTED').length;

  useEffect(() => {
    if (phone && selected && !rows.some((c) => c.requestNo === selected)) setSelected(null);
  }, [phone, rows, selected]);

  const changeStatus = async (item: ConsultItem, next: ConsultStatus) => {
    if (view === 'actionfail' || view === 'neterror') {
      setFailOpen(true);
      return;
    }
    setBusyNo(item.requestNo);
    await sleep(500);
    setItems((all) => all.map((c) => (c.requestNo === item.requestNo ? { ...c, status: next } : c)));
    setBusyNo(null);
  };

  const body: React.ReactNode = (() => {
    if (view === 'loading') return <p className="rd-pt-line" role="status">불러오는 중…</p>;
    if (view === 'loadfail') return <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
    if (view === 'empty' || rows.length === 0) {
      return <RdState kind="empty" title="아직 받은 상담 신청이 없습니다." />;
    }
    const detail = shown && (
      <section className="rd-pt-detail" aria-label="고른 상담 상세">
        {phone && (
          <a
            className="rd-pt-back"
            href="#list"
            onClick={(e) => {
              e.preventDefault();
              setSelected(null);
            }}
          >
            <IconChevronLeft size={14} />받은 상담 신청
          </a>
        )}
        <div className="rd-pt-detail__card">
          <div className="rd-pt-detail__head">
            <h2 className="rd-pt-detail__no">{shown.requestNo}</h2>
            <StatusText tone={CONSULT_STATUS_TONE[shown.status]}>{CONSULT_STATUS_LABEL[shown.status]}</StatusText>
          </div>
          <div className="rd-pt-detail__who">
            <span className="rd-pt-detail__what">{rowWhat(shown)}</span>
            <span className="rd-pt-detail__applicant">{shown.applicantName} · {shown.applicantPhone}</span>
          </div>
          <p className="rd-pt-detail__msg">{shown.content}</p>
          {(shown.status === 'REQUESTED' || shown.status === 'ACCEPTED') && (
            <RdButtonRow place="screen">
              {shown.status === 'REQUESTED' ? (
                <>
                  <RdButton kind="secondary" disabled={busyNo === shown.requestNo} onClick={() => changeStatus(shown, 'CANCELLED')}>
                    <span className="rd-pt-btnicon"><IconClose size={16} />거절</span>
                  </RdButton>
                  <RdButton busy={busyNo === shown.requestNo} busyText="처리 중…" onClick={() => changeStatus(shown, 'ACCEPTED')}>
                    <span className="rd-pt-btnicon"><IconCheck size={16} />수락</span>
                  </RdButton>
                </>
              ) : (
                <RdButton busy={busyNo === shown.requestNo} busyText="처리 중…" onClick={() => changeStatus(shown, 'COMPLETED')}>
                  <span className="rd-pt-btnicon"><IconCheck size={16} />상담 완료 처리</span>
                </RdButton>
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
          {rows.map((c) => (
            <li key={c.requestNo}>
              <a
                href={`#${c.requestNo}`}
                className={`rd-pt-row${!phone && shown?.requestNo === c.requestNo ? ' is-on' : ''}`}
                aria-current={!phone && shown?.requestNo === c.requestNo ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setSelected(c.requestNo);
                }}
              >
                <span className="rd-pt-row__text">
                  <span className="rd-pt-row__top">
                    <b>{c.requestNo}</b>
                    <StatusText tone={CONSULT_STATUS_TONE[c.status]}>{CONSULT_STATUS_LABEL[c.status]}</StatusText>
                  </span>
                  <span className="rd-pt-row__who">{c.applicantName} · {c.applicantPhone}</span>
                  <span className="rd-pt-row__what">{rowWhat(c)}</span>
                </span>
                {phone && <span className="rd-pt-row__chev"><IconChevronRight /></span>}
              </a>
            </li>
          ))}
        </ul>
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
    <ExpertShellFor current="consults" waiting={waiting}>
      <PartnerMain>
        {!inDetail && (
          <PartnerTitle
            aside={
              <div className="rd-pt-filter">
                <RdSelect
                  aria-label="상담 상태"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as '' | ConsultStatus);
                    setSelected(null); // 데스크톱은 새 목록의 첫 건이 상세 칸에 열린다(shown 계산)
                  }}
                >
                  {CONSULT_FILTER.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </RdSelect>
              </div>
            }
          >
            받은 상담
          </PartnerTitle>
        )}
        {body}
        <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
      </PartnerMain>
      {failOpen && <RdAlertDialog title={ALERT_TEXT[view] ?? ALERT_TEXT.actionfail!} onOk={() => setFailOpen(false)} />}
    </ExpertShellFor>
  );
}
