import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Info, LogIn, UserPlus } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { BACKEND_URL } from '../config';
import { FarewellMessageCard, RecipientItem, MessageItem, RELATIONSHIP_LABEL } from '../components/FarewellMessageCard';

// 06-05 §7·§8 Phase B — docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md.
// Phase A(골격)에서 나아가 FarewellMessage 모델·컨트롤러가 배선됐다 — 이제 실제로 저장된다.
// STT(Ⓐ 파일 업로드·Ⓑ 직접 녹음)도 엔딩노트 ⑨에서 이관되어 FarewellMessageCard 안에서 쓰인다
// (06-05 §4.2 정정, 08-26).

interface FarewellMessagePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  // 가족이 0명일 때 MyPageFamilyDesignation 모달을 그대로 재사용(§7.3 — 06-04 Phase 2 #6과 같은 진입점).
  onOpenFamilyDesignation?: () => void;
}

export const FarewellMessagePage: React.FC<FarewellMessagePageProps> = ({ currentUser, onOpenLogin, setActiveTab, onOpenFamilyDesignation }) => {
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<RecipientItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const token = currentUser ? getToken('USER') : null;

  // 🆕 07-04 §8-9 후속(09-08, 사이드바+상세 결정) — 왼쪽에서 고른 한 사람만 오른쪽에 펼친다.
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedRecipientId((prev) => {
      if (recipients.length === 0) return null;
      if (prev && recipients.some((r) => r.id === prev)) return prev;
      return recipients[0].id;
    });
  }, [recipients]);
  const selectedRecipient = recipients.find((r) => r.id === selectedRecipientId) ?? null;

  // 06-05 §5.4-3 D-5 — 전체 반출(zip). presigned URL이 없어(§5.6-1과 같은 이유) 인증 fetch로
  // 받아 blob URL을 만든 뒤 <a download>로 내려받는다. 실패해도 조용히 두고 버튼을 다시 누르면
  // 재시도되는 보조 기능이라 별도 에러 배너를 두지 않는다.
  const handleExport = useCallback(async () => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eobom_유족메시지_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // 실패는 조용히 삼킨다 — 다시 누르면 재시도된다.
    } finally {
      setExporting(false);
    }
  }, [token]);

  const fetchMessages = useCallback(() => {
    if (!token) return;
    apiFetch<MessageItem[]>('/api/farewell-messages', 'USER')
      .then((data) => setMessages(data))
      .catch(() => { });
  }, [token]);

  useEffect(() => {
    if (!currentUser || !token) {
      setLoading(false);
      return;
    }
    Promise.all([
      apiFetch<RecipientItem[]>('/api/family-designations', 'USER'),
      apiFetch<MessageItem[]>('/api/farewell-messages', 'USER'),
    ])
      .then(([designationsData, messagesData]) => {
        setRecipients(designationsData);
        setMessages(messagesData);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container">
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
          <Mail color="var(--point-color)" size={40} style={{ marginBottom: 'var(--fs-caption)' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>유족 메시지 보관함</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>가족에게 남기는 편지는 로그인 후 작성하실 수 있습니다.</p>
          <button onClick={onOpenLogin} className="btn btn-point" style={{ width: '100%' }}>
            <LogIn size={18} /> 로그인 / 회원가입
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--surface-subtle)', color: 'var(--primary-color)', padding: '0.3rem var(--fs-body)', borderRadius: 'var(--r-lg)', fontSize: 'var(--fs-body)', fontWeight: 700, marginBottom: '0.6rem' }}>
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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-sm)', padding: 'var(--fs-body) 1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        <Info size={18} color="var(--point-color)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <span>
          여기에 남기신 글은 사후 <strong style={{ color: 'var(--primary-color)' }}>지정하신 분에게 전달</strong>됩니다.
        </span>
      </div>

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
                      onClick={() => setSelectedRecipientId(r.id)}
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
                  <UserPlus color="var(--point-color)" size={36} style={{ marginBottom: 'var(--fs-caption)' }} />
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
                  onSaved={fetchMessages}
                  onExportAll={handleExport}
                  exportingAll={exporting}
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
            fontSize: '0.9rem',
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
