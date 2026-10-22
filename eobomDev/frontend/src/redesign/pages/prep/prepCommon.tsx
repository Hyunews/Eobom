import React from 'react';
import { RdSelect } from '../../parts/RdInputs';
import { IconCheck, IconErrorCircle } from '../../parts/icons';
import './prep.css';

// 8단계 묶음 4 공통 조각 — 미리보기 전용 상태 고르기 · 저장 줄 · 내려받기.

export interface DemoOption {
  value: string;
  label: string;
  group?: string;
}

/** 미리보기 전용 "보기 상태" 고르기. 실제 화면에는 없다(교체 때 삭제). */
export function DemoBar({ value, options, onChange }: { value: string; options: DemoOption[]; onChange: (v: string) => void }) {
  const groups = Array.from(new Set(options.map((o) => o.group ?? '')));
  return (
    <div className="rd-pr-demo">
      <label htmlFor="rd-pr-demo-sel">미리보기 전용 · 보기 상태</label>
      <RdSelect id="rd-pr-demo-sel" value={value} onChange={(e) => onChange(e.target.value)}>
        {groups.map((g) =>
          g ? (
            <optgroup key={g} label={g}>
              {options.filter((o) => o.group === g).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ) : (
            options.filter((o) => !o.group).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))
          ),
        )}
      </RdSelect>
    </div>
  );
}

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

export const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
