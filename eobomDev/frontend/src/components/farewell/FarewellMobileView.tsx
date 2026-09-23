import React from 'react';
import { UserPlus, ChevronLeft } from 'lucide-react';
import { FarewellMessageCard, RELATIONSHIP_LABEL } from './FarewellMessageCard';
import type { FarewellViewProps } from './types';

// 00-38 §8.1-1 ⓑ·ⓒ — 마스터·디테일 2화면 + 리더. 1단계(받는 분 목록) → 2단계(그 사람의
// 편지, [날짜+한 줄 제목]만) → 리더/컴포저는 FarewellMessageCard를 그대로 재사용한다(ⓔ —
// 684줄짜리 카드를 이번에 쪼개지 않는다). 뒤로가기는 history.pushState를 쓰지 않는다(§6.3).
// 🔄 2026-09-23 00-39 그룹② v2 이관 — 표현만 `.v2-mail-*`(design-v2.css)로 옮겼다.
export const FarewellMobileView: React.FC<FarewellViewProps> = ({
  loading,
  recipients,
  messages,
  selectedRecipientId,
  onSelectRecipient,
  onOpenFamilyDesignation,
  setActiveTab,
  token,
  onSaved,
  onExportAll,
  exportingAll,
}) => {
  const selectedRecipient = recipients.find((r) => r.id === selectedRecipientId) ?? null;

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">유족 메시지 보관함</h1>
      </div>

      <div className="v2-content">
        {loading ? (
          <p className="v2-empty">불러오는 중...</p>
        ) : recipients.length === 0 ? (
          <div className="v2-mail-empty">
            <UserPlus color="var(--v2-point)" size={36} style={{ marginBottom: '12px' }} />
            <h2 style={{ color: 'var(--v2-text-main)', marginBottom: '8px', fontSize: 'var(--v2-fs-item-title)', fontWeight: 700 }}>아직 지정된 가족이 없습니다</h2>
            <p style={{ color: 'var(--v2-text-muted)', lineHeight: 1.6, marginBottom: '20px', fontSize: 'var(--v2-fs-support)' }}>
              받으실 분을 먼저 가족으로 지정해 주세요.
            </p>
            <button type="button" onClick={onOpenFamilyDesignation} className="v2-mail-add">
              <UserPlus size={18} /> 가족 추가
            </button>
          </div>
        ) : selectedRecipient === null ? (
          // 1단계 — 받는 분 목록. 아바타+이름+"관계 · N통", 히트 영역 ≥56px(design-v2.css)
          <div className="v2-mail-mobile-list">
            {recipients.map((r) => {
              const count = messages.filter((m) => m.recipientId === r.id).length;
              return (
                <button key={r.id} type="button" onClick={() => onSelectRecipient(r.id)} className="v2-mail-recipient">
                  <span className="v2-mail-avatar">{r.name.slice(0, 1)}</span>
                  <span className="v2-mail-recipient-info">
                    <span className="v2-mail-recipient-name">{r.name}</span>
                    <span className="v2-mail-recipient-sub">
                      {RELATIONSHIP_LABEL[r.relationship] || r.relationship} · {count}통
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          // 2단계 — 상단 "← 이름" 뒤로가기 + 그 사람의 편지(카드가 목록·리더·컴포저를 전부 가짐)
          <div>
            <button type="button" onClick={() => onSelectRecipient(null)} className="v2-mail-back">
              <ChevronLeft size={18} /> {selectedRecipient.name}
            </button>

            {/* 🔄 2026-09-23 사람 지시 — 모바일에서 전달 고지 박스("여기에 남기신 글과…
                전달됩니다.") 삭제. 데스크톱(FarewellDesktopView.tsx)에는 그대로 둔다. */}

            <FarewellMessageCard
              key={selectedRecipient.id}
              recipient={selectedRecipient}
              messages={messages.filter((m) => m.recipientId === selectedRecipient.id)}
              token={token}
              onSaved={onSaved}
              onExportAll={onExportAll}
              exportingAll={exportingAll}
              isMobile
            />
          </div>
        )}

        {/* 06-05 §7.2 — 크로스 링크는 양방향. 이쪽은 보관함 → 엔딩노트.
            🔄 2026-09-23 사람 지시 — 받는 분 목록과 더 떨어지도록 여백 확대(32px→56px). */}
        {setActiveTab && (
          <p className="v2-notice" style={{ marginTop: '56px', textAlign: 'center' }}>
            장례 희망·연명의료 등 남겨두실 것이 있다면{' '}
            <button
              type="button"
              onClick={() => setActiveTab('ending-note')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--v2-point)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
            >
              디지털 엔딩노트 →
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
