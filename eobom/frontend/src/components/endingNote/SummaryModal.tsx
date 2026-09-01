import React from 'react';
import { ListChecks, CheckCircle2, X } from 'lucide-react';
import type { SummaryRow } from './types';

// "한눈에 보기" 요약 모달 — 06-04 §6.1-1 파생(사용자 직접 지시, 2026-08-27). 아코디언이 한 번에
// 한 섹션만 보여줘 생긴 "전체를 훑을 방법이 없다"는 구멍을 메운다. 🔴 새 API를 만들지 않는다 —
// Phase 1·2에서 이미 로드해둔 state(sectionState·grants·각 필드값)만 재구성해서 보여준다.
// 🔴 자유 서술 필드는 전문을 뿌리지 않는다(엔딩노트는 암호화 저장하는 민감 콘텐츠 — 모달에 펼치면
// 어깨너머로 다 보인다). ⑨(WILL_DRAFT)는 본인 전용 원칙이 이 모달에도 그대로 적용돼 내용을
// 절대 표시하지 않고 작성 여부만 보여준다.
export const summarizeFreeText = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const lines = trimmed.split('\n').filter((l) => l.trim());
  const preview = lines.slice(0, 2).join(' ');
  const truncatedByLines = lines.length > 2;
  const CAP = 90;
  const truncatedByLength = preview.length > CAP;
  const shown = truncatedByLength ? preview.slice(0, CAP) : preview;
  return `${shown}${truncatedByLines || truncatedByLength ? '…' : ''}`;
};

export const SummaryModal: React.FC<{
  rows: SummaryRow[];
  onClose: () => void;
  onSelectRow: (code: string) => void;
}> = ({ rows, onClose, onSelectRow }) => {
  const anyCompleted = rows.some((r) => r.completed);
  return (
    <div
      className="ending-note-summary-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ending-note-summary-panel" role="dialog" aria-modal="true" aria-label="한눈에 보기">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListChecks color="var(--point-color)" /> 한눈에 보기
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              width: 'var(--min-touch-target)', height: 'var(--min-touch-target)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <X size={24} />
          </button>
        </div>

        {!anyCompleted && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', backgroundColor: 'var(--secondary-color)', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            아직 작성하신 항목이 없습니다. 아래 목록에서 항목을 눌러 하나씩 채워보세요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {rows.map((row) => (
            <button
              key={row.code}
              type="button"
              onClick={() => onSelectRow(row.code)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', textAlign: 'left',
                minHeight: 'var(--min-touch-target)', padding: '0.8rem 1rem', borderRadius: '10px',
                border: '1px solid var(--border-color)', backgroundColor: row.completed ? 'var(--card-bg)' : '#FEF3C7',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>{row.title}</span>
                {row.completed ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#03543F', backgroundColor: '#DEF7EC', borderRadius: '999px', padding: '0.15rem 0.6rem' }}>
                    <CheckCircle2 size={13} /> 작성함
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '999px', padding: '0.15rem 0.6rem' }}>
                    미작성
                  </span>
                )}
                {row.timingBadge && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: '#F1F5F9', borderRadius: '999px', padding: '0.15rem 0.6rem' }}>
                    {row.timingBadge}
                  </span>
                )}
              </div>
              {row.isWillDraft ? (
                <span style={{ fontSize: '18px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                  본인 전용 — 내용은 여기 표시되지 않습니다.
                </span>
              ) : (
                row.completed && row.valueText && (
                  <span style={{ fontSize: '18px', lineHeight: 1.7, color: 'var(--text-main)' }}>{row.valueText}</span>
                )
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
