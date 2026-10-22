import React, { useState } from 'react';
import type { DemoOption } from '../../parts/RdDemo';
import { copyObituaryLink } from '../../../utils/kakaoShare';
import { ObituaryBody, ObituarySkeleton } from './ObituaryBody';
import { RdState } from '../../parts/RdState';
import { VisitorShell, VsConnectionFailed } from './visitorParts';
import { OBIT_FULL, OBIT_MIN } from './visitorData';

// 8단계 묶음 6 · /preview/visitor/obituary — 부고장 받은 화면(판 3-1 다 있음 · 3-2 최소 · 3-3 상태).
// 정본: 07-03 §6.3-2 · 3단계 캔버스 묶음 1. 예시 값은 지어낸 값(visitorData.ts).

const DEMOS: DemoOption[] = [
  { value: 'full', label: '다 있음 (3-1)' },
  { value: 'min', label: '최소 — 발인·상주만 (3-2)' },
  { value: 'copied', label: '링크 복사 직후 (3-1)' },
  { value: 'loading', label: '불러오는 중 (3-3)' },
  { value: 'offline', label: '접속 실패 (3-3)' },
  { value: 'missing', label: '없음 (3-3)' },
];

export function VisitorObituaryPage() {
  const [demo, setDemo] = useState('full');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const select = (v: string) => {
    setDemo(v);
    setFeedback(null);
  };

  // 지금 ObituaryView.handleCopyLink와 같은 동작 — 클립보드로 바로 복사하고 결과 글을 버튼 아래에 띄운다.
  const onCopy = async () => {
    const ok = await copyObituaryLink(window.location.href);
    setFeedback(ok ? { ok, text: '링크가 복사되었습니다.' } : { ok, text: '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.' });
  };

  let body: React.ReactNode;
  if (demo === 'loading') {
    body = <ObituarySkeleton />;
  } else if (demo === 'offline') {
    body = <div className="rd-vs-wrap"><VsConnectionFailed onRetry={() => select('full')} /></div>;
  } else if (demo === 'missing') {
    body = (
      <div className="rd-vs-wrap">
        <RdState kind="empty" title="부고장을 찾을 수 없습니다." desc="링크가 만료되었거나 잘못된 주소일 수 있습니다." />
      </div>
    );
  } else {
    const shown = demo === 'copied' ? { ok: true, text: '링크가 복사되었습니다.' } : feedback;
    body = <ObituaryBody data={demo === 'min' ? OBIT_MIN : OBIT_FULL} feedback={shown} onCopy={onCopy} />;
  }

  return (
    <VisitorShell demo={{ value: demo, options: DEMOS, onChange: select }}>
      {body}
    </VisitorShell>
  );
}
