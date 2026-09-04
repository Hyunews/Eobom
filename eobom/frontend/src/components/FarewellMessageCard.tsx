import React, { useEffect, useRef, useState } from 'react';
import { Heart, Plus, Loader2, Pencil, X, Volume2, Trash2 } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { VoiceToTextInput, SavedMedia } from './VoiceToTextInput';

// 06-05 §7·§8 Phase B — 수신자 카드 1개. 편지 목록(미리보기) + 작성/수정 편집기를 담당한다.
// §10 항목5 — 수신자 1명에게 여러 통 허용. 카드 안에 편지 목록이 여러 건 쌓일 수 있다.
// 🔄 §5.6·§5.6-5 D-6+D-6-1(2026-09-04) — 음성 듣기·삭제 + 저장 흐름을 doSave(bodyOverride,
// mediaOverride) 하나로 통일. 수동 저장 버튼과 음성/파일 업로드 확인이 모두 이 함수를 부른다.

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
  hasAudio: boolean;
  mediaMime: string | null;
  mediaDurationSec: number | null;
  createdAt: string;
  updatedAt: string;
}

interface MediaInfo {
  hasAudio: boolean;
  mediaMime: string | null;
  mediaDurationSec: number | null;
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
  onSaved: () => void; // 저장/수정/삭제 성공 시 부모가 목록을 다시 불러온다
}

export const FarewellMessageCard: React.FC<FarewellMessageCardProps> = ({ recipient, messages, token, onSaved }) => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🆕 D-6 — 듣기·삭제(§5.6-3·§5.6-4). mediaInfo는 현재 편집 중인 메시지의 첨부 상태.
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null); // <audio>에 실제로 물릴 blob URL
  const [audioLoading, setAudioLoading] = useState(false);
  const [deletingAudio, setDeletingAudio] = useState(false);
  const localAudioUrlRef = useRef<string | null>(null); // §5.6-2 — 방금 이 세션에서 저장한 로컬 blob(서버 왕복 없이 재생)
  const fetchedAudioUrlRef = useRef<string | null>(null); // §5.6-2 — 다시 열어서 서버로 받아온 blob

  const revokeLocalAudio = () => {
    if (localAudioUrlRef.current) {
      URL.revokeObjectURL(localAudioUrlRef.current);
      localAudioUrlRef.current = null;
    }
  };
  const revokeFetchedAudio = () => {
    if (fetchedAudioUrlRef.current) {
      URL.revokeObjectURL(fetchedAudioUrlRef.current);
      fetchedAudioUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokeLocalAudio();
      revokeFetchedAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetComposer = () => {
    setComposerOpen(false);
    setEditingId(null);
    setTitle('');
    setBody('');
    setError(null);
    setMediaInfo(null);
    setAudioSrc(null);
    revokeLocalAudio();
    revokeFetchedAudio();
  };

  const openNewComposer = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setError(null);
    setMediaInfo(null);
    setAudioSrc(null);
    revokeLocalAudio();
    revokeFetchedAudio();
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
        setAudioSrc(null);
        revokeLocalAudio();
        revokeFetchedAudio();
        setMediaInfo({
          hasAudio: !!data.data.hasAudio,
          mediaMime: data.data.mediaMime ?? null,
          mediaDurationSec: data.data.mediaDurationSec ?? null,
        });
        setComposerOpen(true);
      } else {
        // 🐛 실패해도 열어야 아래 에러 박스가 보인다 — composerOpen이 false면 에러 UI 자체가
        // 렌더되지 않아 "눌러도 반응 없음"으로 보였다.
        setError(data.message || '편지를 불러오지 못했습니다.');
        setComposerOpen(true);
      }
    } catch {
      setError('편지를 불러오는 중 오류가 발생했습니다.');
      setComposerOpen(true);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 🆕 D-7 — 편지 전체 삭제. 음성 삭제(handleDeleteAudio)와 달리 소프트 삭제가 아니다 —
  // 편지 행 자체가 사라진다(제목·본문 모두).
  const [deletingMessage, setDeletingMessage] = useState(false);
  const handleDeleteMessage = async () => {
    if (!token || !editingId) return;
    if (!window.confirm('이 편지를 삭제하시겠어요? 되돌릴 수 없습니다.')) return;
    setDeletingMessage(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/${editingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        resetComposer();
        onSaved();
      } else {
        setError(data.message || '삭제에 실패했습니다.');
      }
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingMessage(false);
    }
  };

  // 🆕 저장의 실체 — 수동 저장 버튼과 음성/파일 업로드 확인이 모두 이 함수를 부른다.
  // bodyOverride·mediaOverride를 인자로 직접 받는 이유는 방금 만들어진 값을 React state
  // 갱신을 기다리지 않고 그대로 넘기기 위해서다(state는 다음 렌더까지 stale하다).
  const doSave = async (bodyText: string, mediaOverride: SavedMedia | null): Promise<any | null> => {
    if (!token || !bodyText.trim()) return null;
    setSaving(true);
    setError(null);
    try {
      const isEdit = !!editingId;
      const mediaFields = mediaOverride
        ? { mediaKey: mediaOverride.mediaKey, mediaMime: mediaOverride.mediaMime, mediaDurationSec: mediaOverride.mediaDurationSec }
        : {};
      const payload = isEdit
        ? { title: title.trim() || null, body: bodyText, ...mediaFields }
        : { recipientId: recipient.id, title: title.trim() || null, body: bodyText, ...mediaFields };
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages${isEdit ? `/${editingId}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        return data.data;
      }
      setError(data.message || '저장에 실패했습니다.');
      return null;
    } catch {
      setError('저장 중 오류가 발생했습니다.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await doSave(body, null); // 텍스트만 다듬는 저장 — 첨부는 건드리지 않는다
    if (saved) {
      resetComposer();
      onSaved();
    }
  };

  // 🆕 D-6-1 — VoiceToTextInput의 onSaveConfirmed. Ⓐ 업로드·Ⓑ 녹음 확인모달 저장 모두
  // 여기로 들어온다. STT 결과(text)를 본문에 합치고, media가 있으면 즉시 메시지로 저장한다.
  // 저장 뒤에는 편집기를 닫지 않고 그대로 열어 둔다 — 이후 다듬기는 기존 저장 버튼으로 한다.
  const handleVoiceSaveConfirmed = async (text: string, voiceMedia: SavedMedia | null, localUrl: string | null) => {
    const combinedBody = body ? `${body.trimEnd()} ${text}`.trim() : text;
    setBody(combinedBody);

    const saved = await doSave(combinedBody, voiceMedia);
    if (!saved) {
      if (localUrl) URL.revokeObjectURL(localUrl);
      return;
    }

    setEditingId(saved.id);
    onSaved();

    if (voiceMedia) {
      revokeLocalAudio();
      localAudioUrlRef.current = localUrl;
      setAudioSrc(null);
      setMediaInfo({ hasAudio: true, mediaMime: voiceMedia.mediaMime, mediaDurationSec: voiceMedia.mediaDurationSec ?? null });
    } else if (localUrl) {
      URL.revokeObjectURL(localUrl);
    }
  };

  // 🆕 D-6 §5.6-2 — 방금 이 세션에서 저장했으면 로컬 blob으로, 다시 열어서 보는 거라면
  // GET .../audio로 받아온다. presigned URL 없이 인증 fetch → blob → objectURL.
  const handleListen = async () => {
    if (audioSrc) return;
    if (localAudioUrlRef.current) {
      setAudioSrc(localAudioUrlRef.current);
      return;
    }
    if (!token || !editingId) return;
    setAudioLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/${editingId}/audio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError('음성을 불러오지 못했습니다.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      fetchedAudioUrlRef.current = url;
      setAudioSrc(url);
    } catch {
      setError('음성을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setAudioLoading(false);
    }
  };

  // 🆕 D-6 §5.6-4 — 소프트 삭제뿐이다. "즉시 삭제됩니다"가 아니라 유예 기간을 안내한다.
  const handleDeleteAudio = async () => {
    if (!token || !editingId) return;
    if (!window.confirm('이 음성을 삭제하시겠어요? 30일 뒤 완전히 삭제됩니다.')) return;
    setDeletingAudio(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/${editingId}/audio`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        revokeLocalAudio();
        revokeFetchedAudio();
        setAudioSrc(null);
        setMediaInfo((prev) => (prev ? { ...prev, hasAudio: false } : prev));
        onSaved();
      } else {
        setError(data.message || '삭제에 실패했습니다.');
      }
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingAudio(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
        <Heart size={20} color="var(--point-color)" />
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{recipient.name}</span>
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          {RELATIONSHIP_LABEL[recipient.relationship] || recipient.relationship}
          {recipient.relationship === 'OTHER' && recipient.relationshipEtc ? `(${recipient.relationshipEtc})` : ''}
        </span>
      </div>
      <p style={{ fontSize: '0.95rem', color: '#9CA3AF', marginBottom: '0.9rem' }}>{STATUS_LABEL[recipient.status] || recipient.status}</p>

      {/* 저장된 편지 목록 — 미리보기까지만(전문은 편집기를 열어야 보인다) */}
      {messages.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => openEditComposer(m.id)}
              disabled={loadingDetail}
              className="farewell-message-item"
              style={{
                backgroundColor: editingId === m.id && composerOpen ? 'var(--secondary-color)' : 'transparent',
                cursor: loadingDetail ? 'wait' : 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                <Pencil size={14} /> {m.title || '(제목 없음)'}
                {m.hasAudio && <Volume2 size={14} color="var(--point-color)" />}
              </span>
              <span style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{m.preview}</span>
              <span style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>{new Date(m.updatedAt).toLocaleString('ko-KR')}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={openNewComposer} className="btn" style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
        <Plus size={16} /> 새 편지 쓰기
      </button>

      {/* 🎨 09-05 — 카드 안에 접혀 들어가던 편집기를 모달로 뺐다. 뒤에 편지 목록이 남아 있는
          채로 이 하나에만 집중하게 한다(SummaryModal.tsx와 같은 오버레이 언어 재사용). */}
      {composerOpen && (
        <div
          className="farewell-message-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) resetComposer();
          }}
        >
          <div className="farewell-message-panel" role="dialog" aria-modal="true" aria-label={editingId ? '편지 수정' : '새 편지 쓰기'}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.2rem' }}>
              <div>
                <h2 style={{ color: 'var(--primary-color)', fontSize: '1.55rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Heart size={20} color="var(--point-color)" /> {editingId ? '편지 수정' : '새 편지 쓰기'}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetComposer}
                disabled={saving}
                aria-label="닫기"
                style={{
                  background: 'none', border: 'none', cursor: saving ? 'default' : 'pointer', color: 'var(--text-muted)',
                  width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  marginTop: '-0.3rem', marginRight: '-0.35rem',
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

              <VoiceToTextInput
                token={token}
                disabled={saving}
                onSaveConfirmed={handleVoiceSaveConfirmed}
                mediaInfo={mediaInfo}
                audioSrc={audioSrc}
                audioLoading={audioLoading}
                deletingAudio={deletingAudio}
                onListen={handleListen}
                onDeleteAudio={handleDeleteAudio}
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="제목 (선택)"
                style={{ fontSize: '1.15rem' }}
              />
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="form-input"
                style={{ height: 'auto', padding: '1rem', fontSize: '1.15rem', lineHeight: 1.65 }}
                placeholder={`${recipient.name}님께 남기고 싶은 말을 자유롭게 적어보세요.`}
              />

              {error && (
                <div style={{ fontSize: '1rem', lineHeight: 1.6, color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
                  {error}
                </div>
              )}

              {/* 06-04 §6.4-5 정정(08-27) — 확인→저장 2단계 대신 명시적 저장 버튼 하나로. 저장을
              누르는 행위 자체가 확인이다. */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={resetComposer}
                  disabled={saving}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    flex: 1, height: '46px', padding: '0 1rem', fontSize: '1.15rem', fontWeight: 700,
                    borderRadius: '8px', border: 'none', cursor: saving ? 'default' : 'pointer',
                    backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)',
                  }}
                >
                  <X size={16} /> 취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !body.trim()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    flex: 1, height: '46px', padding: '0 1rem', fontSize: '1.15rem', fontWeight: 700,
                    borderRadius: '8px', border: 'none', cursor: saving || !body.trim() ? 'default' : 'pointer',
                    backgroundColor: 'var(--point-color)', color: '#FFFFFF', opacity: !saving && body.trim() ? 1 : 0.5,
                  }}
                >
                  {saving ? <><Loader2 size={16} /> 저장 중…</> : '저장'}
                </button>
              </div>

              {/* 🎨 위험 구역 — 취소·저장과 같은 줄에 있으면 오탭 위험이 크다. 구분선 + 작은
              텍스트버튼으로 무게를 낮추고 우측 정렬로 눈에 덜 띄게 뺐다. */}
              {editingId && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleDeleteMessage}
                    disabled={saving || deletingMessage}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none',
                      padding: '0.3rem 0.2rem', fontSize: '0.95rem', fontWeight: 600, color: '#B91C1C',
                      cursor: saving || deletingMessage ? 'default' : 'pointer', opacity: saving || deletingMessage ? 0.6 : 1,
                    }}
                  >
                    {deletingMessage ? <><Loader2 size={14} /> 삭제 중…</> : <><Trash2 size={14} /> 이 편지 삭제</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
