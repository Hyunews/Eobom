import React from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { FarewellMessageCard, RELATIONSHIP_LABEL } from './FarewellMessageCard';
import { FarewellNotice } from './FarewellNotice';
import type { FarewellViewProps } from './types';

// 00-38 §6.2 #4 · §8.1-1 ⓓ — 기존 FarewellMessagePage.tsx의 JSX를 그대로 옮겼다. 데스크톱
// 회귀 0이 DoD(§11 #8)라 옮기면서 레이아웃을 고치지 않는다. 유일한 변경은 §8.1-1 ⓒ 정정
// (전달 고지 문구 복원 — FarewellNotice.tsx 참고, 위치는 그대로 상단 유지).
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
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--surface-subtle)', color: 'var(--primary-color)', padding: '0.3rem var(--sp-4)', borderRadius: 'var(--r-lg)', fontSize: 'var(--fs-body)', fontWeight: 700, marginBottom: '0.6rem' }}>
          <Mail size={18} color="var(--primary-color)" /> 하고 싶은 말을 그대로
        </div>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Mail color="var(--point-color)" size={32} /> 유족 메시지 보관함
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          가족 한 분 한 분께 따로 남기는 편지입니다. 완료해야 할 항목은 없습니다 — 생각날 때마다 남기세요.
        </p>
      </div>

      {/* 06-05 §4.3 — 양쪽(엔딩노트 ⑨ / 보관함)에 상반된 고지를 상시 노출한다. 여기는 "간다" 쪽.
          검증은 약속하지 않는다(06-04 §6.4-2-3와 같은 태도) — 무엇을 남겼는지 이어봄은 알 수 없다.
          🔄 09-08 5차(사용자 지시) — 경고(amber) 톤이 아니라 안내(알림) 톤으로. 느낌표 삼각형
          대신 원형 i 아이콘, 배경은 --state-warn-bg 대신 중립 --surface-subtle. */}
      <FarewellNotice style={{ marginBottom: '1.5rem' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>불러오는 중...</div>
      ) : (
        // 🔄 07-04 §8-9 후속(09-08, "사이드바+상세"로 확정) — 왼쪽엔 받는 분 이름만, 오른쪽엔
        // 고른 한 사람의 편지만 폭 전체로. §7.3 — 가족 지정 0명이면 사이드바가 "가족 추가"
        // 버튼 하나로 바뀌고, 그 버튼은 MyPageFamilyDesignation 모달을 그대로 연다.
        <div className="farewell-board-shell">
          <div className="farewell-board-layout">
            <div className="farewell-board-sidebar">
              {recipients.length === 0 ? (
                <button type="button" onClick={onOpenFamilyDesignation} className="farewell-board-add">
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
                      className={`farewell-board-recipient${selectedRecipientId === r.id ? ' active' : ''}`}
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
                })
              )}
            </div>

            <div className="farewell-board-detail">
              {recipients.length === 0 ? (
                <div className="farewell-board-empty">
                  <UserPlus color="var(--point-color)" size={36} style={{ marginBottom: 'var(--sp-3)' }} />
                  <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>아직 지정된 가족이 없습니다</h2>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
