import React from 'react';
import { UserPlus } from 'lucide-react';
import { FarewellMessageCard, RELATIONSHIP_LABEL } from './FarewellMessageCard';
import { FarewellNotice } from './FarewellNotice';
import type { FarewellViewProps } from './types';

// 00-38 §6.2 #4 · §8.1-1 ⓓ — 기존 FarewellMessagePage.tsx의 JSX를 그대로 옮겼다. 데스크톱
// 회귀 0이 DoD(§11 #8)라 옮기면서 레이아웃을 고치지 않는다.
// 🔄 2026-09-23 00-39 그룹② v2 이관 — 마스터·디테일 구조(사이드바+상세)는 그대로, 표현만
// `.v2-mail-*`(design-v2.css 신규, §6.7 미등재)로 옮겼다.
export const FarewellDesktopView: React.FC<FarewellViewProps> = ({
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
        <p className="v2-page-subtitle">가족 한 분 한 분께 따로 남기는 편지입니다. 완료해야 할 항목은 없습니다 — 생각날 때마다 남기세요.</p>
      </div>

      <div className="v2-content">
        {/* 06-05 §4.3 — 양쪽(엔딩노트 ⑨ / 보관함)에 상반된 고지를 상시 노출한다. 여기는 "간다" 쪽.
            검증은 약속하지 않는다(06-04 §6.4-2-3와 같은 태도) — 무엇을 남겼는지 이어봄은 알 수 없다. */}
        <FarewellNotice style={{ marginBottom: '24px' }} />

        {loading ? (
          <p className="v2-empty">불러오는 중...</p>
        ) : (
          // 🔄 07-04 §8-9 후속(09-08, "사이드바+상세"로 확정) — 왼쪽엔 받는 분 이름만, 오른쪽엔
          // 고른 한 사람의 편지만 폭 전체로. §7.3 — 가족 지정 0명이면 사이드바가 "가족 추가"
          // 버튼 하나로 바뀌고, 그 버튼은 MyPageFamilyDesignation 모달을 그대로 연다.
          <div className="v2-mail-shell">
            <div className="v2-mail-sidebar">
              {recipients.length === 0 ? (
                <button type="button" onClick={onOpenFamilyDesignation} className="v2-mail-add">
                  <UserPlus size={18} /> 가족 추가
                </button>
              ) : (
                recipients.map((r) => {
                  const count = messages.filter((m) => m.recipientId === r.id).length;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectRecipient(r.id)}
                      className={`v2-mail-recipient${selectedRecipientId === r.id ? ' is-active' : ''}`}
                    >
                      <span className="v2-mail-avatar">{r.name.slice(0, 1)}</span>
                      <span className="v2-mail-recipient-info">
                        <span className="v2-mail-recipient-name">{r.name}</span>
                        <span className="v2-mail-recipient-sub">
                          {RELATIONSHIP_LABEL[r.relationship] || r.relationship} · {count}통
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="v2-mail-detail">
              {recipients.length === 0 ? (
                <div className="v2-mail-empty">
                  <UserPlus color="var(--v2-point)" size={36} style={{ marginBottom: '12px' }} />
                  <h2 style={{ color: 'var(--v2-text-main)', marginBottom: '8px', fontSize: 'var(--v2-fs-item-title)', fontWeight: 700 }}>아직 지정된 가족이 없습니다</h2>
                  <p style={{ color: 'var(--v2-text-muted)', lineHeight: 1.6, fontSize: 'var(--v2-fs-support)' }}>
                    편지를 남기려면 먼저 받으실 분을 가족으로 지정해 주세요. 수신자가 없으면 사후에도 전달되지 않습니다.
                  </p>
                </div>
              ) : selectedRecipient ? (
                <FarewellMessageCard
                  key={selectedRecipient.id}
                  recipient={selectedRecipient}
                  messages={messages.filter((m) => m.recipientId === selectedRecipient.id)}
                  token={token}
                  onSaved={onSaved}
                  onExportAll={onExportAll}
                  exportingAll={exportingAll}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* 06-05 §7.2 — 크로스 링크는 양방향. 이쪽은 보관함 → 엔딩노트. */}
        {setActiveTab && (
          <p className="v2-notice" style={{ marginTop: '32px', textAlign: 'center' }}>
            장례 희망·연명의료 등 남겨두실 것이 있다면? {' '}
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
