import React, { useState } from 'react';
import { formatKstDate } from '../../../utils/kstDate';
import { sleep, type DemoOption } from '../../parts/RdDemo';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { Chrysanthemum, VisitorShell, VsConnectionFailed, VsFoot, VsLinkButton, VsLoadingText, VsState } from './visitorParts';

// 8단계 묶음 6 · /preview/visitor/memorial-extend — 추모관 연장 확인(판 3-7). 정본: 05-01 §6.1-2 · 3단계 캔버스 묶음 2-나.
// 🔴 링크를 여는 것은 조회뿐이고 버튼을 눌러야 연장된다(00-20 §8.1-4). 예시 값은 지어낸 값.
// 날짜는 지금 MemorialExtendPage와 같은 formatKstDate("2026-11-30")를 쓴다.

type View = 'ready' | 'frozen' | 'busy' | 'error' | 'done' | 'invalid' | 'invalidDefault' | 'loading' | 'offline';

const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본 ① 활성 기간 끝남 예정' },
  { value: 'frozen', label: '기본 ② 삭제 예정(멈춘 추모관)' },
  { value: 'busy', label: '처리 중...' },
  { value: 'error', label: '연장 실패 — 오류 글' },
  { value: 'done', label: '연장됨' },
  { value: 'invalid', label: '연장 불가 — 서버 문구' },
  { value: 'invalidDefault', label: '연장 불가 — 기본 문구' },
  { value: 'loading', label: '불러오는 중' },
  { value: 'offline', label: '접속 실패' },
];

const EXPIRES_AT = '2026-11-30T00:00:00+09:00';
const PURGE_AT = '2026-12-31T00:00:00+09:00';
const EXTENDED_UNTIL = '2027-11-30T00:00:00+09:00';

export function VisitorExtendPage() {
  const [view, setView] = useState<View>('ready');
  const frozen = view === 'frozen';

  const extend = async () => {
    setView('busy');
    await sleep(700);
    setView('done');
  };

  let body: React.ReactNode;
  if (view === 'loading') {
    body = <VsLoadingText />;
  } else if (view === 'offline') {
    body = <VsConnectionFailed onRetry={() => setView('ready')} />;
  } else if (view === 'invalid' || view === 'invalidDefault') {
    body = (
      <VsState
        icon="blocked"
        title="연장할 수 없습니다."
        desc={view === 'invalid' ? '이미 삭제된 추모관입니다.' : '유효하지 않은 링크입니다.'}
      >
        <VsLinkButton kind="secondary">이어봄 홈으로</VsLinkButton>
      </VsState>
    );
  } else if (view === 'done') {
    body = (
      <VsState icon="done" title="보존이 연장되었습니다." desc={`${formatKstDate(EXTENDED_UNTIL)}까지 보존됩니다.`}>
        <VsLinkButton kind="secondary">이어봄 홈으로</VsLinkButton>
      </VsState>
    );
  } else {
    const dateText = formatKstDate(frozen ? PURGE_AT : EXPIRES_AT);
    body = (
      <>
        <article className="rd-vs-card">
          <Chrysanthemum className="rd-vs-flower" />
          <h1 className="rd-vs-name">故 홍길동님 추모관</h1>
          <p className="rd-vs-invite-desc">
            {frozen
              ? `이 추모관이 ${dateText}에 삭제됩니다. 계속 보존하려면 아래 버튼을 누르세요.`
              : `이 추모관의 활성 기간이 ${dateText}에 끝납니다. 이후에는 새 방명록·헌화·사진 등록이 중단되고 열람만 가능합니다. 계속 보존하려면 아래 버튼을 누르세요.`}
          </p>
          <div className="rd-vs-actions">
            {view === 'error' && (
              <p className="rd-vs-actions__error" role="alert">서버와 통신 중 오류가 발생했습니다.</p>
            )}
            <RdButtonRow place="dialog">
              <RdButton place="dialog" busy={view === 'busy'} busyText="처리 중..." onClick={extend}>계속 보존하기</RdButton>
            </RdButtonRow>
          </div>
        </article>
        <VsFoot />
      </>
    );
  }

  return (
    <VisitorShell demo={{ value: view, options: DEMOS, onChange: (v) => setView(v as View) }}>
      <div className="rd-vs-wrap">{body}</div>
    </VisitorShell>
  );
}
