import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatKstDate } from '../../../utils/kstDate';
import { RdButton } from '../../parts/RdButtons';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdList, RdListRow } from '../../parts/RdCards';
import { RdPageHead } from '../../parts/RdNav';
import { RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { CONSULTS, CONSULT_STATUS_BADGE, CONSULT_STATUS_LABEL, PV, monthDay, type ConsultItem } from './myData';
import { MyBadge, MyDl, MyGate, MyLine } from './myShared';
import './mypage.css';

// 8단계 묶음 7 · /preview/my-consultations — 4단계 판 4-8(내 상담 내역 · 상세 창). 정본: 00-36 §4.4 · §4.4-1.
// 줄 = 제목(업체명 + 견적/상담 문의, 또는 전문가 직역) + 둘째 줄("생전 상담 · 전화 · 10월 13일") + 상태 딱지 4종 + ›.
// 🔴 내부 상태(CONVERTED · LOST 등)는 보여주지 않고 서버가 접은 4단계만 쓴다. 상세 창은 [닫기]만이라 주 버튼이다.
// 합치기 · 제목 만들기 규칙은 지금 MyConsultationsPage와 같다(myData.ts의 표를 복사해 둠 — 교체 때 한 곳으로).

type View = 'ready' | 'truncated' | 'empty' | 'login' | 'loading' | 'loadfail';

const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본' },
  { value: 'truncated', label: '100건을 넘어 한도 안내 한 줄' },
  { value: 'empty', label: '빈 목록' },
  { value: 'login', label: '로그인 전', group: '상태' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];

const LIST_LIMIT = 100;

export function MyConsultationsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('ready');
  const [open, setOpen] = useState<ConsultItem | null>(null);
  const bar = <DemoBar value={view} options={DEMOS} onChange={(v) => { setView(v as View); setOpen(null); }} />;

  if (view === 'login') {
    return (
      <div className="rd-container rd-screen">
        <MyGate title="내 상담 내역" screenName="내 상담 내역" />
        {bar}
      </div>
    );
  }

  let body: React.ReactNode;
  if (view === 'loading') body = <MyLine kind="loading">불러오는 중…</MyLine>;
  else if (view === 'loadfail') body = <MyLine kind="error">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</MyLine>;
  else if (view === 'empty') {
    // 빈 목록만 큰 상태 화면 틀 + [상담 신청] 주 버튼(4단계 목록 파일 지시)
    body = (
      <RdState kind="empty" title="아직 신청하신 상담이 없습니다.">
        <RdButton onClick={() => navigate(PV.counseling)}>상담 신청</RdButton>
      </RdState>
    );
  } else {
    body = (
      <>
        <RdList>
          {CONSULTS.map((c) => (
            <RdListRow
              key={c.key}
              title={c.title}
              info={`${c.how} · ${monthDay(formatKstDate(c.createdAt))}`}
              status={<MyBadge kind={CONSULT_STATUS_BADGE[c.statusGroup]} faint={c.statusGroup === 'CLOSED'}>{CONSULT_STATUS_LABEL[c.statusGroup]}</MyBadge>}
              onClick={() => setOpen(c)}
            />
          ))}
        </RdList>
        {view === 'truncated' && <p className="rd-mp-foot-note">최근 {LIST_LIMIT}건까지만 표시됩니다.</p>}
      </>
    );
  }

  return (
    <div className="rd-container rd-screen">
      <div className="rd-mp-read rd-mp-keep">
        <RdPageHead title="내 상담 내역" />
        <div>{body}</div>
      </div>
      {bar}

      {open && (
        <RdDialog
          width={560}
          eyebrow="내 상담 내역"
          title={open.title}
          closeX
          onClose={() => setOpen(null)}
          footer={<RdButton place="dialog" onClick={() => setOpen(null)}>닫기</RdButton>}
        >
          <MyDl
            rows={[
              { name: '접수번호', value: open.no },
              { name: '방식', value: open.how },
              { name: '신청일', value: formatKstDate(open.createdAt) },
              {
                name: '상태',
                value: <MyBadge kind={CONSULT_STATUS_BADGE[open.statusGroup]} faint={open.statusGroup === 'CLOSED'}>{CONSULT_STATUS_LABEL[open.statusGroup]}</MyBadge>,
              },
              ...(open.summary ? [{ name: '내용', value: open.summary, stack: true }] : []),
              // 건별 동의(제3자 제공)는 토글 대상이 아니다 — 이미 제공된 사실이라 시각만 보여준다(00-36 §4.5). 시안은 "동의함"
              ...(open.consentAt ? [{ name: '제3자 제공 동의', value: '동의함' }] : []),
            ]}
          />
        </RdDialog>
      )}
    </div>
  );
}
