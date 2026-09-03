import React from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { SaveState, SectionMeta } from './types';
import { cardStyle } from './styles';

export const saveButtonLabel = (state: SaveState | undefined): string => {
  if (state === 'saving') return '저장 중…';
  if (state === 'saved') return '저장됨';
  if (state === 'error') return '저장 실패 — 다시 시도';
  return '저장';
};

// A1·§6.1-1 — 아코디언 항목. 접혀 있어도 아이콘·제목·완료표시는 항상 보인다(§6.1-1 "빠짐없이").
// 🔴 모듈 최상위에 둔다 — EndingNotePage 렌더 함수 안에서 정의하면 매 렌더마다 새 컴포넌트
// 타입이 생겨, 부모 state가 바뀔 때마다(예: textarea 한 글자 입력) React가 이 서브트리를
// 통째로 언마운트·재마운트해 입력 포커스가 매 키 입력마다 끊긴다.
export const AccordionSection: React.FC<{
  meta: SectionMeta;
  expanded: boolean;
  completed: boolean;
  saveState: SaveState | undefined;
  onToggle: () => void;
  onSave: () => void;
  onReset: () => void;
  children: React.ReactNode;
}> = ({ meta, expanded, completed, saveState, onToggle, onSave, onReset, children }) => (
  <div className="ending-note-accordion-item" style={cardStyle} id={`ending-note-section-${meta.code}`}>
    <button type="button" onClick={onToggle} aria-expanded={expanded} className="ending-note-accordion-header">
      {meta.icon}
      <span style={{ flex: 1, textAlign: 'left' }}>{meta.title}</span>
      {completed && <CheckCircle2 size={18} color="var(--point-color)" />}
      {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
    </button>
    {expanded && (
      <div className="ending-note-accordion-body">
        {children}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onSave} className="btn btn-point" disabled={saveState === 'saving'} style={{ fontSize: '0.9rem' }}>
            {saveButtonLabel(saveState)}
          </button>
          <button type="button" onClick={onReset} disabled={saveState === 'saving'} className="btn" style={{ fontSize: '0.9rem', backgroundColor: '#F1F5F9', color: '#6B7280' }}>
            취소
          </button>
          {saveState === 'saved' && <span style={{ fontSize: '0.85rem', color: 'var(--point-color)' }}>저장되었습니다.</span>}
          {saveState === 'error' && <span style={{ fontSize: '0.85rem', color: '#B91C1C' }}>저장에 실패했습니다. 다시 시도해 주세요.</span>}
        </div>
      </div>
    )}
  </div>
);
