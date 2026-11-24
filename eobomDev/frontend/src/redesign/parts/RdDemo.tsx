import React from 'react';
import { RdSelect } from './RdInputs';

// 미리보기 전용 조각 — 실제 화면에는 없다(10단계 교체 때 삭제). 묶음 4 prepCommon에서 묶음 5가 부품으로 올렸다.

export interface DemoOption {
  value: string;
  label: string;
  group?: string;
}

/** 미리보기 전용 "보기 상태" 고르기. */
export function DemoBar({ value, options, onChange }: { value: string; options: DemoOption[]; onChange: (v: string) => void }) {
  const groups = Array.from(new Set(options.map((o) => o.group ?? '')));
  return (
    <div className="rd-demo">
      <label htmlFor="rd-demo-sel">미리보기 전용 · 보기 상태</label>
      <RdSelect id="rd-demo-sel" value={value} onChange={(e) => onChange(e.target.value)}>
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

export const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
