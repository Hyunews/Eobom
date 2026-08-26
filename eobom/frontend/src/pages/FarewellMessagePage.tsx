import React, { useEffect, useState } from 'react';
import { Mail, AlertTriangle, LogIn, UserPlus, Copy, Heart } from 'lucide-react';
import { BACKEND_URL } from '../config';

// 00-27 §7·§8 Phase A(골격) — docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md.
// EndingNotePage.tsx의 자유 텍스트 ③(유족에게 남기는 메시지)이 여기로 분리됐다(§3.1).
// 🔴 Phase B(FarewellMessage 모델·컨트롤러)가 아직 없다 — 이 화면은 서버에 아무것도 저장하지
// 않는다. "저장됩니다" 류 문구를 쓰지 않고, 편지는 복사해서 보관하도록 안내한다(§8 Phase A #1).

interface FarewellMessagePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  // 가족이 0명일 때 MyPageFamilyDesignation 모달을 그대로 재사용(§7.3 — 06-04 Phase 2 #6과 같은 진입점).
  onOpenFamilyDesignation?: () => void;
}

interface RecipientItem {
  id: string;
  name: string;
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
  status: string;
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  SPOUSE: '배우자',
  CHILD: '자녀',
  PARENT: '부모',
  SIBLING: '형제자매',
  OTHER: '기타',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '아직 알리지 않음',
  PENDING: '수락 대기 중',
  ACCEPTED: '가족으로 연결됨',
  DECLINED: '거절됨',
};

export const FarewellMessagePage: React.FC<FarewellMessagePageProps> = ({ currentUser, onOpenLogin, setActiveTab, onOpenFamilyDesignation }) => {
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<RecipientItem[]>([]);
  // 수신자별 편지 — Phase B(FarewellMessage 모델)가 없어 화면 상태로만 존재한다. 새로고침하면
  // 사라진다 — 그래서 아래 상시 고지가 복사를 권한다.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const token = sessionStorage.getItem('k_ending_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${BACKEND_URL}/api/family-designations`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.data)) {
          setRecipients(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleCopy = async (id: string, text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // 조용히 무시 — 사용자가 직접 선택해 복사할 수 있다
    }
  };

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
            <div key={r.id} style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <Heart size={16} color="var(--point-color)" />
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>{r.name}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {RELATIONSHIP_LABEL[r.relationship] || r.relationship}
                  {r.relationship === 'OTHER' && r.relationshipEtc ? `(${r.relationshipEtc})` : ''}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '0.9rem' }}>{STATUS_LABEL[r.status] || r.status}</p>

              <textarea
                rows={6}
                value={drafts[r.id] || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                className="form-input"
                style={{ height: 'auto', padding: '1rem', marginBottom: '0.6rem' }}
                placeholder={`${r.name}님께 남기고 싶은 말을 자유롭게 적어보세요.`}
              />

              {/* §8 Phase A — 저장 기능이 없다. "저장됩니다"라고 쓰지 않고, 지금 빼가는 방법을 안내한다. */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                이 편지는 아직 저장되지 않습니다. 새로고침하면 사라지니, 복사해서 따로 보관해 주세요.
              </p>

              <button
                type="button"
                onClick={() => handleCopy(r.id, drafts[r.id] || '')}
                disabled={!(drafts[r.id] || '').trim()}
                className="btn"
                style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', opacity: (drafts[r.id] || '').trim() ? 1 : 0.5 }}
              >
                <Copy size={16} /> {copiedId === r.id ? '복사되었습니다' : '편지 복사'}
              </button>
            </div>
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
