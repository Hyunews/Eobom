import React from 'react';
import { IconCheck, IconErrorCircle } from '../../parts/icons';
import './prep.css';

// 8단계 묶음 4 공통 조각 — 저장 줄 · 내려받기. 미리보기 상태 고르기(DemoBar)·sleep은 묶음 5에서 parts/RdDemo로 올렸다.
export { DemoBar, sleep } from '../../parts/RdDemo';
export type { DemoOption } from '../../parts/RdDemo';

export type SaveState = 'idle' | 'saving' | 'ok' | 'fail';

/** 저장 상태 한 줄 — 저장 중… / 저장되었습니다. / 저장에 실패했습니다. 다시 시도해 주세요. */
export function SaveStatus({ state, failText = '저장에 실패했습니다. 다시 시도해 주세요.' }: { state: SaveState; failText?: string }) {
  if (state === 'idle') return <span />;
  if (state === 'saving') return <p className="rd-pr-status" role="status">저장 중…</p>;
  if (state === 'ok') {
    return (
      <p className="rd-pr-status rd-pr-status--ok" role="status">
        <IconCheck size={16} />저장되었습니다.
      </p>
    );
  }
  return (
    <p className="rd-pr-status rd-pr-status--err" role="alert">
      <IconErrorCircle size={16} />{failText}
    </p>
  );
}

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
