import React, { useState } from 'react';
import { Heart, Plus, Loader2, Pencil, X } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { VoiceToTextInput } from './VoiceToTextInput';

// 06-05 §7·§8 Phase B — 수신자 카드 1개. 편지 목록(미리보기) + 작성/수정 편집기를 담당한다.
// §10 항목5 — 수신자 1명에게 여러 통 허용. 카드 안에 편지 목록이 여러 건 쌓일 수 있다.

export interface RecipientItem {
  id: string;
  name: string;
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
  status: string;
}

export interface MessageItem {
  id: string;
  recipientId: string;
  title: string | null;
  preview: string;
  createdAt: string;
  updatedAt: string;
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

interface FarewellMessageCardProps {
  recipient: RecipientItem;
  messages: MessageItem[];
  token: string | null;
  onSaved: () => void; // 저장/수정 성공 시 부모가 목록을 다시 불러온다
}

export const FarewellMessageCard: React.FC<FarewellMessageCardProps> = ({ recipient, messages, token, onSaved }) => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetComposer = () => {
    setComposerOpen(false);
    setEditingId(null);
    setTitle('');
    setBody('');
    setError(null);
  };

  const openNewComposer = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setError(null);
    setComposerOpen(true);
  };

  const openEditComposer = async (id: string) => {
    if (!token) return;
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEditingId(id);
        setTitle(data.data.title || '');
        setBody(data.data.body || '');
        setComposerOpen(true);
      } else {
        setError(data.message || '편지를 불러오지 못했습니다.');
      }
    } catch {
      setError('편지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSave = async () => {
    if (!token || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const isEdit = !!editingId;
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages${isEdit ? `/${editingId}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(isEdit ? { title: title.trim() || null, body } : { recipientId: recipient.id, title: title.trim() || null, body }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        resetComposer();
        onSaved();
      } else {
        setError(data.message || '저장에 실패했습니다.');
      }
    } catch {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
        <Heart size={16} color="var(--point-color)" />
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>{recipient.name}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {RELATIONSHIP_LABEL[recipient.relationship] || recipient.relationship}
          {recipient.relationship === 'OTHER' && recipient.relationshipEtc ? `(${recipient.relationshipEtc})` : ''}
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '0.9rem' }}>{STATUS_LABEL[recipient.status] || recipient.status}</p>

      {/* 저장된 편지 목록 — 미리보기까지만(전문은 편집기를 열어야 보인다) */}
      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => openEditComposer(m.id)}
              disabled={loadingDetail}
              style={{
                textAlign: 'left', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 0.9rem',
                backgroundColor: editingId === m.id && composerOpen ? 'var(--secondary-color)' : 'transparent',
                cursor: loadingDetail ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', gap: '0.2rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                <Pencil size={13} /> {m.title || '(제목 없음)'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.preview}</span>
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{new Date(m.updatedAt).toLocaleString('ko-KR')}</span>
            </button>
          ))}
        </div>
      )}

      {!composerOpen ? (
        <button type="button" onClick={openNewComposer} className="btn" style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
          <Plus size={16} /> 새 편지 쓰기
        </button>
      ) : (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="제목 (선택)"
            style={{ marginBottom: '0.75rem' }}
          />

          <VoiceToTextInput
            token={token}
            disabled={saving}
            onText={(text) => {
              setBody((prev) => (prev ? `${prev.trimEnd()} ${text}` : text));
            }}
          />

          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="form-input"
            style={{ height: 'auto', padding: '1rem', marginTop: '0.75rem', marginBottom: '0.6rem' }}
            placeholder={`${recipient.name}님께 남기고 싶은 말을 자유롭게 적어보세요.`}
          />

          {error && (
            <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '0.75rem' }}>
              {error}
            </div>
          )}

          {/* 06-04 §6.4-5 정정(08-27) — 확인→저장 2단계 대신 명시적 저장 버튼 하나로. 저장을
              누르는 행위 자체가 확인이다. */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={resetComposer} disabled={saving} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
              <X size={16} /> 취소
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !body.trim()} className="btn btn-point" style={{ flex: 1, opacity: !saving && body.trim() ? 1 : 0.5 }}>
              {saving ? <><Loader2 size={16} /> 저장 중…</> : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
