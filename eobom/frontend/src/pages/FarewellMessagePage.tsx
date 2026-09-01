import React, { useCallback, useEffect, useState } from 'react';
import { Mail, AlertTriangle, LogIn, UserPlus } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { FarewellMessageCard, RecipientItem, MessageItem } from '../components/FarewellMessageCard';

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
  const token = currentUser ? getToken('USER') : null;

  const fetchMessages = useCallback(() => {
    if (!token) return;
    apiFetch<MessageItem[]>('/api/farewell-messages', 'USER')
      .then((data) => setMessages(data))
      .catch(() => {});
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
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container">
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
          <Mail color="var(--point-color)" size={40} style={{ marginBottom: '0.75rem' }} />
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F1F5F9', color: 'var(--primary-color)', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
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
          검증은 약속하지 않는다(06-04 §6.4-2-3와 같은 태도) — 무엇을 남겼는지 이어봄은 알 수 없다. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <span>
          여기에 남기신 글은 <strong>사망 확인 후 지정하신 분에게 전달됩니다.</strong> 재산 분배·상속에
          관한 내용은 <strong>남기지 마세요</strong> — 유언의 효력이 없고 유족 간 다툼의 씨앗이 됩니다.
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>불러오는 중...</div>
      ) : recipients.length === 0 ? (
        // §7.3 — 가족 지정 0명이 이 화면의 기본 상태다. 빈 화면이 아니라 가족 지정으로 유도한다.
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
          <UserPlus color="var(--point-color)" size={40} style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>아직 지정된 가족이 없습니다</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            편지를 남기려면 먼저 받으실 분을 가족으로 지정해 주세요. 수신자가 없으면 사후에도 전달되지 않습니다.
          </p>
          <button onClick={onOpenFamilyDesignation} className="btn btn-point" style={{ width: '100%' }}>
            <UserPlus size={18} /> 가족 지정하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '1.5rem' }}>
          {recipients.map((r) => (
            <FarewellMessageCard
              key={r.id}
              recipient={r}
              messages={messages.filter((m) => m.recipientId === r.id)}
              token={token}
              onSaved={fetchMessages}
            />
          ))}
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
