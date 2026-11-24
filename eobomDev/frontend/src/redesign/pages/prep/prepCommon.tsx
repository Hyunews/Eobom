import React from 'react';
import { IconCheck, IconErrorCircle } from '../../parts/icons';
import './prep.css';

// 엔딩노트 공통 조각 — 저장 줄 · 내려받기 · 인쇄.
// 아래 두 줄은 10-3 화면(행정 가이드 등)이 아직 여기서 가져다 쓴다 — 쓰는 곳이 0이 되는 묶음에서 지운다.
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 유언장 초안 인쇄 — 지금 화면(`pages/EndingNotePage.tsx` handlePrintDraft)에서 옮겼다.
 * 인쇄 머리글/바닥글은 `@page { margin: 0 }`로 없애고 날짜·제목을 직접 그린다(2026-09-03). 성명·날인은 화면이 대신 채울 수 없어 최하단에 빈 칸을 둔다(2026-08-31).
 */
export function printWillDraft(text: string, notice: string, large: boolean) {
  const w = window.open('', '_blank');
  if (!w) return;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
  w.document.write(
    `<html><head><title>유언장 초안</title><style>
        @page { margin: 0; }
        body { font-family: 'Malgun Gothic', sans-serif; font-size: ${large ? '22px' : '16px'}; line-height: 1.9; padding: 2.5rem; white-space: pre-wrap; }
        .print-header { margin-bottom: 1.5rem; white-space: normal; }
        .print-date { font-size: 13px; color: #5C6773; margin-bottom: 0.3rem; }
        .print-title { font-size: 22px; font-weight: 700; color: #1F2937; margin: 0; }
        .notice { font-size: 13px; color: #92400E; border: 1px solid #FEF3C7; background: #FEF3C7; border-radius: 8px; padding: 0.7rem 0.9rem; margin-bottom: 1.5rem; white-space: normal; }
        .signature-box { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #94A3B8; white-space: normal; }
        .signature-row { display: flex; align-items: flex-end; justify-content: flex-end; gap: 1rem; }
        .signature-label { font-weight: 700; }
        .signature-blank { display: inline-block; width: 220px; border-bottom: 1px solid #1F2937; height: 1.4em; }
        .signature-seal { display: inline-flex; align-items: center; justify-content: center; width: 2.4em; height: 2.4em; border: 1px solid #1F2937; font-size: 0.8em; }
      </style></head><body><div class="print-header"><div class="print-date">${today}</div><h1 class="print-title">유언장 초안</h1></div><div class="notice">${escapeHtml(notice)}</div>${escapeHtml(text)}<div class="signature-box"><div class="signature-row"><span class="signature-label">성명</span><span class="signature-blank"></span><span class="signature-seal">(인)</span></div></div></body></html>`,
  );
  w.document.close();
  w.focus();
  w.print();
}

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
