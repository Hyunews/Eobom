import React from 'react';
import { Mail, UserPlus, ChevronLeft } from 'lucide-react';
import { FarewellMessageCard, RELATIONSHIP_LABEL } from '../FarewellMessageCard';
import { FarewellNotice } from './FarewellNotice';
import type { FarewellViewProps } from './types';

// 00-38 §8.1-1 ⓑ·ⓒ — 마스터·디테일 2화면 + 리더. 1단계(받는 분 목록) → 2단계(그 사람의
// 편지, [날짜+한 줄 제목]만) → 리더/컴포저는 FarewellMessageCard를 그대로 재사용한다(ⓔ —
// 684줄짜리 카드를 이번에 쪼개지 않는다). 뒤로가기는 history.pushState를 쓰지 않는다(§6.3).
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
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* §8.1-1 ⓒ — 상단 크롬 4단(배지+h1+설명문+안내박스) → 1단(h1+설명문만). 배지는
          h1이 같은 말을 하므로 모바일에서 제거. 아이콘 32px → 24px. 고지 박스는 아래
          2단계(컴포저 직전)로 이동했으므로 여기서는 렌더하지 않는다. */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Mail color="var(--point-color)" size={24} /> 유족 메시지 보관함
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          가족 한 분 한 분께 따로 남기는 편지입니다. 완료해야 할 항목은 없습니다 — 생각날 때마다 남기세요.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>불러오는 중...</div>
      ) : recipients.length === 0 ? (
        <div className="farewell-board-empty">
          <UserPlus color="var(--point-color)" size={36} style={{ marginBottom: 'var(--sp-3)' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>아직 지정된 가족이 없습니다</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            편지를 남기려면 먼저 받으실 분을 가족으로 지정해 주세요. 수신자가 없으면 사후에도 전달되지 않습니다.
          </p>
          <button type="button" onClick={onOpenFamilyDesignation} className="farewell-board-add">
            <UserPlus size={18} /> 가족 추가
          </button>
        </div>
      ) : selectedRecipient === null ? (
        // 1단계 — 받는 분 목록. 아바타+이름+"관계 · N통", 히트 영역 ≥56px(index.css)
        <div className="farewell-mobile-list">
          {recipients.map((r) => {
            const count = messages.filter((m) => m.recipientId === r.id).length;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRecipient(r.id)}
                className="farewell-board-recipient"
              >
                <span className="farewell-board-avatar">{r.name.slice(0, 1)}</span>
                <span className="farewell-board-recipient-info">
                  <span className="farewell-board-recipient-name">{r.name}</span>
                  <span className="farewell-board-recipient-sub">
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
          <button type="button" onClick={() => onSelectRecipient(null)} className="farewell-mobile-back">
            <ChevronLeft size={18} /> {selectedRecipient.name}
          </button>

          {/* §8.1-1 ⓒ — 전달 고지는 목록 위가 아니라 컴포저(새 편지 쓰기) 바로 위가 제자리
              (06-05 §4.3 09-08 정정). "상시 노출"은 항상 그 화면에 있다는 뜻이지 상단에
              있다는 뜻이 아니다. */}
          <FarewellNotice style={{ marginBottom: '1rem' }} />

          <FarewellMessageCard
            key={selectedRecipient.id}
            recipient={selectedRecipient}
            messages={messages.filter((m) => m.recipientId === selectedRecipient.id)}
            token={token}
            onSaved={onSaved}
            onExportAll={onExportAll}
            exportingAll={exportingAll}
          />
        </div>
      )}

      {/* 06-05 §7.2 — 크로스 링크는 양방향. 이쪽은 보관함 → 엔딩노트. */}
      {setActiveTab && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: 'var(--border-radius)',
            fontSize: 'var(--fs-body)',
            color: 'var(--primary-color)',
            textAlign: 'center',
          }}
        >
          장례 희망·연명의료 등 남겨두실 것이 있습니다.{' '}
          <button
            type="button"
            onClick={() => setActiveTab('ending-note')}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
          >
            디지털 엔딩노트 →
          </button>
        </div>
      )}
    </div>
  );
};
