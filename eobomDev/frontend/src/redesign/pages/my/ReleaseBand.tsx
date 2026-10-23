import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdBanner } from '../../parts/RdNotices';
import { FAKE_MS } from './accountData';

// 8단계 묶음 8 · 사후 개봉 요청 띠(4-15). 정본: 00-41 §8.3(10-16 확정 문구) · 4단계 묶음 3 캔버스 · 00-44 §7-5 주의 띠.
// 헤더 바로 아래 사이트 전체 가로 띠(파트너·운영자 화면 제외). 본인이 로그인했는데 자기 앞으로 개봉 요청이 있을 때만 뜬다.
// [취소] = 요청 취소(확인 창 없음) · ✕ = 띠만 닫음(요청은 운영자 확인 그대로, 서버 호출 없음).
// 🔴 로그인만으로 자동 취소하지 않는다. "개봉됨"은 화면에 나올 수 없는 상태(개봉 때 계정이 잠겨 조회가 막힌다)라 그리지 않는다.
// 계속 떠 있는 띠라 role="status"(RdBanner가 가진다 — alert면 화면 읽기 프로그램이 들어올 때마다 끊고 읽는다).

export function ReleaseBand({ requesterName, failFirst }: { requesterName: string; failFirst?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fails, setFails] = useState(!!failFirst);

  if (hidden) return null;

  const cancel = async () => {
    setBusy(true);
    setError('');
    await sleep(FAKE_MS);
    setBusy(false);
    if (fails) {
      setFails(false);
      setError('서버와 통신 중 오류가 발생했습니다.');
      return;
    }
    setHidden(true);
  };

  return (
    <RdBanner
      tone="warn"
      onClose={() => setHidden(true)}
      action={
        <RdButton kind="secondary" place="row" disabled={busy} onClick={cancel}>
          {busy ? '취소하는 중…' : '취소'}
        </RdButton>
      }
    >
      {requesterName} 님이 엔딩노트 개봉을 요청했습니다.
      {error && <span className="rd-banner__err"> {error}</span>}
    </RdBanner>
  );
}
