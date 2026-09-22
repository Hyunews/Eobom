import React from 'react';
import { ListChecks, CheckCircle2 } from 'lucide-react';
import type { SummaryRow } from './types';
import { backdropCloseProps } from '../../utils/backdropClose';

// "한눈에 보기" 요약 모달 — 06-04 §6.1-1 파생(사용자 직접 지시, 2026-08-27). 아코디언이 한 번에
// 한 섹션만 보여줘 생긴 "전체를 훑을 방법이 없다"는 구멍을 메운다. 🔴 새 API를 만들지 않는다 —
// Phase 1·2에서 이미 로드해둔 state(sectionState·grants·각 필드값)만 재구성해서 보여준다.
// 🔴 자유 서술 필드는 전문을 뿌리지 않는다(엔딩노트는 암호화 저장하는 민감 콘텐츠 — 모달에 펼치면
// 어깨너머로 다 보인다). ⑨(WILL_DRAFT)는 본인 전용 원칙이 이 모달에도 그대로 적용돼 내용을
// 절대 표시하지 않고 작성 여부만 보여준다.
// 🔄 2026-09-22 00-39 그룹② — 전용 오버레이 대신 기존 `.v2-modal-overlay`+`.v2-modal.is-scroll`을
// 재사용(제목 고정 + 본문 스크롤, 모바일은 CSS가 자동으로 바텀시트/거의 전체화면으로 바꾼다).
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
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-label="한눈에 보기" {...backdropCloseProps(onClose)}>
      <div className="v2-modal is-scroll" onClick={(e) => e.stopPropagation()}>
        <h3 className="v2-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListChecks size={20} color="var(--v2-point)" /> 한눈에 보기
        </h3>

        <div className="v2-modal-body">
          {!anyCompleted && <p className="v2-empty">아직 작성하신 항목이 없습니다. 아래 목록에서 항목을 눌러 하나씩 채워보세요.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map((row) => (
              <button
                key={row.code}
                type="button"
                onClick={() => onSelectRow(row.code)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'left',
                  padding: '14px 16px', borderRadius: '4px',
                  border: `1px solid ${row.completed ? 'var(--v2-divider-strong)' : 'var(--state-warn-bg)'}`,
                  backgroundColor: row.completed ? 'var(--v2-bg)' : 'var(--state-warn-bg)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--v2-fs-item-title)', fontWeight: 700, color: 'var(--v2-text-main)' }}>{row.title}</span>
                  {row.completed ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--v2-fs-label)', fontWeight: 700, color: 'var(--v2-point)' }}>
                      <CheckCircle2 size={13} /> 작성함
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--v2-fs-label)', fontWeight: 700, color: 'var(--state-warn-fg)' }}>미작성</span>
                  )}
                  {row.timingBadge && <span className="v2-list-inline-meta">{row.timingBadge}</span>}
                </div>
                {row.isWillDraft ? (
                  <span style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)' }}>본인 전용 — 내용은 여기 표시되지 않습니다.</span>
                ) : (
                  row.completed && row.valueText && (
                    <span style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-main)' }}>{row.valueText}</span>
                  )
                )}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="v2-modal-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};
