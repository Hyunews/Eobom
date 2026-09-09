import React, { useEffect, useRef, useState } from 'react';
import { Heart, Plus, Loader2, Pencil, X, Volume2, Trash2, Download, Upload, Mic, FileText, ChevronDown } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { VoiceToTextInput, SavedMedia } from './VoiceToTextInput';

// 06-05 §5.4-3-1 D-5 항목23-2 — 건별 반출 파일명. 백엔드 farewellMessageExport.ts의
// sanitizeForFilename·buildExportZipFilename과 규칙을 맞춘다(40자 절단·금지문자 제거).
const sanitizeForFilename = (raw: string): string =>
  raw.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '무제';

const buildExportFilename = (label: string): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `eobom_유족메시지_${sanitizeForFilename(label)}_${y}${m}${d}.zip`;
};

// 🆕 09-08 4차 — reports/farewell_messages_redesign.html 시안 B 포팅. 시간까지 보이던 것을
// 날짜만으로 줄였다("2026. 09. 04." 형식으로 시안과 맞춤).
const formatLetterDate = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${day}.`;
};

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

export const RELATIONSHIP_LABEL: Record<string, string> = {
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
  onExportAll: () => void; // 🆕 전체 반출(zip) — 부모(FarewellMessagePage)가 소유한 전역 액션. 카드마다 같은 줄에 노출한다.
  exportingAll: boolean;
}

export const FarewellMessageCard: React.FC<FarewellMessageCardProps> = ({ recipient, messages, token, onSaved, onExportAll, exportingAll }) => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // 🔄 07-04 §8-9 후속(09-08, 사용자 지시로 기본 탭 A로 재확정) — 제목 아래 A/B/C 탭.
  const [activeMethod, setActiveMethod] = useState<'upload' | 'record' | 'write'>('upload');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 00-38 §8.1-1 ⓑ "컴포저" — 모바일에서만 레일(작성 안내)을 접어 올린다. 기본 접힌 상태.
  // 데스크톱은 index.css가 이 상태와 무관하게 항상 펼쳐서 보여준다(폭 기준 CSS 오버라이드).
  const [railOpen, setRailOpen] = useState(false);

  // 🆕 D-6 — 듣기·삭제(§5.6-3·§5.6-4). mediaInfo는 현재 편집 중인 메시지의 첨부 상태.
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null); // <audio>에 실제로 물릴 blob URL
  const [audioLoading, setAudioLoading] = useState(false);
  const [deletingAudio, setDeletingAudio] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
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
    setActiveMethod('upload');
    setRailOpen(false);
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
    setActiveMethod('upload');
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
        // 🆕 09-08 6차 — 편지를 열 때 A/B/C 탭이 "저장된 기준"(첨부 음성 유무·형식)을
        // 따라가게 한다. 텍스트만 있으면 C(직접 쓰기)로 바로 편집. 음성이 있으면 형식으로
        // Ⓐ업로드/Ⓑ녹음을 추정한다 — 녹음(MediaRecorder)은 거의 항상 webm/opus로 저장되고
        // (VoiceToTextInput.tsx RECORDER_MIME_CANDIDATES), 업로드는 m4a·mp3·wav가 대부분이라
        // mediaMime이 이 둘을 가르는 유일하게 저장된 단서다.
        const hasAudio = !!data.data.hasAudio;
        const mime: string | null = data.data.mediaMime ?? null;
        setActiveMethod(!hasAudio ? 'write' : mime && mime.includes('webm') ? 'record' : 'upload');
        revokeLocalAudio();
        revokeFetchedAudio();
        setMediaInfo({
          hasAudio,
          mediaMime: mime,
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

  // 🔄 D-7(§5.6-7) — 편지 전체 삭제도 소프트 삭제다. 음성 삭제(handleDeleteAudio)와 같은
  // 유예 30일 · 같은 확인 문구. 🆕 목록에서 편집기를 안 열고 바로 지울 수도 있어(개별 반출과
  // 같은 자리) id를 인자로 받는다 — 생략하면 지금 편집 중인 편지를 지운다. 편집기가 닫혀
  // 있으면 error state가 안 보이므로 그때는 alert로 알린다.
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const handleDeleteMessage = async (id?: string) => {
    const targetId = id ?? editingId;
    if (!token || !targetId) return;
    if (!window.confirm('이 편지를 삭제하시겠어요? 30일 뒤 완전히 삭제됩니다.')) return;
    setDeletingMessageId(targetId);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (editingId === targetId) resetComposer();
        onSaved();
      } else {
        const msg = data.message || '삭제에 실패했습니다.';
        if (composerOpen) setError(msg); else window.alert(msg);
      }
    } catch {
      const msg = '삭제 중 오류가 발생했습니다.';
      if (composerOpen) setError(msg); else window.alert(msg);
    } finally {
      setDeletingMessageId(null);
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

  // 🆕 §5.4-3-1 D-5 항목23-1 — 건별 반출(zip). <a href>로 못 받는다(Bearer 못 실음, §5.6-3과
  // 같은 이유) — fetch → blob URL → a.download → revokeObjectURL(전체 반출과 같은 패턴).
  const handleExportMessage = async (id: string, label: string) => {
    if (!token) return;
    setExportingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/${id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildExportFilename(label);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // 실패는 조용히 삼킨다 — 다시 누르면 재시도된다(전체 반출과 같은 태도).
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div>
      {/* 🔄 09-08 4차 — reports/farewell_messages_redesign.html 시안 B(2단 우편함 정제형)
          포팅. "OOO 님께 남기는 글" + 통수 안내 + 액션 2개(원안 그대로: 새 편지 쓰기는
          진한 남색 solid, 전체 다운로드는 아이콘 전용 사각 버튼). 관계는 사이드바에 이미
          나오므로 여기선 뺐고, 대신 통수 옆에 상태를 붙여 정보 손실은 없앴다. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          {/* 🔄 2026-09-09 — 22.4px는 --fs-title(22~28px) 범위라 화면 제목급으로 보고
              명조체를 유지하되, 하드코딩 문자열 대신 .section-title 프리미티브로 옮겼다
              (00-09 §6.3 규칙1·§6.5, 폰트 정리 요청). */}
          <h2 className="section-title" style={{ fontSize: '1.4rem', color: 'var(--primary-color)', margin: '0 0 0.25rem 0' }}>
            {recipient.name}님께 남기는 글
          </h2>
          <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>
            총 {messages.length}통의 편지가 보관되어 있습니다 · {STATUS_LABEL[recipient.status] || recipient.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
          <button type="button" onClick={openNewComposer} className="btn" style={{ backgroundColor: 'var(--primary-color)', color: '#FFFFFF', height: '38px', fontSize: 'var(--fs-body)' }}>
            <Plus size={15} /> 새 편지 쓰기
          </button>
          <button
            type="button"
            onClick={onExportAll}
            disabled={exportingAll}
            aria-label="전체 다운로드"
            title="전체 다운로드"
            className="farewell-message-icon-btn"
            style={{ width: '38px', height: '38px', border: '1px solid var(--border-color)' }}
          >
            {exportingAll ? <Loader2 size={16} /> : <Download size={16} />}
          </button>
        </div>
      </div>

      {/* 저장된 편지 목록 — 시안 B의 "회색 박스 덩어리를 걷어낸" 경계선 리스트: 배지+날짜 →
          제목(클릭 가능) → 미리보기 → 우측 정렬 액션. */}
      {messages.length === 0 && (
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>아직 남긴 편지가 없습니다.</p>
      )}
      {messages.length > 0 && (
        <div className="farewell-message-list" style={{ marginBottom: '1rem' }}>
          {messages.map((m) => (
            <div key={m.id} className="farewell-message-row">
              <div className="farewell-message-row-top">
                {m.hasAudio ? (
                  <span className="farewell-message-badge farewell-message-badge--audio">
                    <Mic size={12} /> 음성 첨부
                  </span>
                ) : (
                  <span className="farewell-message-badge farewell-message-badge--text">
                    <FileText size={12} /> 텍스트
                  </span>
                )}
                <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-hint)' }}>{formatLetterDate(m.updatedAt)}</span>
              </div>
              <button
                type="button"
                onClick={() => openEditComposer(m.id)}
                disabled={loadingDetail}
                className="farewell-message-item"
                style={{ width: '100%', cursor: loadingDetail ? 'wait' : 'pointer' }}
              >
                {m.title || '(제목 없음)'}
              </button>
              <p className="farewell-message-preview">{m.preview}</p>
              <div className="farewell-message-row-actions">
                <button
                  type="button"
                  onClick={() => handleExportMessage(m.id, m.title || `${recipient.name}에게`)}
                  disabled={exportingId === m.id}
                  aria-label="다운로드"
                  title="다운로드"
                  className="farewell-message-icon-btn"
                >
                  {exportingId === m.id ? <Loader2 size={15} /> : <Download size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(m.id)}
                  disabled={deletingMessageId === m.id}
                  aria-label="편지 삭제"
                  title="편지 삭제"
                  className="farewell-message-icon-btn farewell-message-icon-btn--danger"
                >
                  {deletingMessageId === m.id ? <Loader2 size={15} /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-3)', marginBottom: '1.2rem' }}>
              <div>
                {/* 🔄 2026-09-09 — 16px 작은 라벨이라 화면 제목이 아니다. 명조체 제거
                    (00-09 §6.3 규칙1, 폰트 정리 요청). */}
                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--accent-gold)', margin: '0 0 0.15rem 0' }}>{recipient.name}님께</p>
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

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="제목 (선택)"
              style={{ fontSize: '1.15rem', marginBottom: '1rem' }}
            />

            {/* 🆕 09-08 — 이미 첨부된 음성은 탭(작성 방법)과 무관하게 항상 관리할 수 있다. */}
            {mediaInfo?.hasAudio && (
              <div className="farewell-audio-attached">
                <span className="farewell-audio-attached-label"><Volume2 size={16} color="var(--point-color)" /> 첨부된 음성이 있습니다</span>
                <button
                  type="button"
                  onClick={handleListen}
                  disabled={audioLoading}
                  className="btn"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', height: '38px', fontSize: 'var(--fs-body)', padding: '0 0.9rem' }}
                >
                  {audioLoading ? <><Loader2 size={14} /> 불러오는 중…</> : <><Volume2 size={14} /> 듣기</>}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  disabled={deletingAudio}
                  className="btn"
                  style={{ backgroundColor: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)', height: '38px', fontSize: 'var(--fs-body)', padding: '0 0.9rem' }}
                >
                  {deletingAudio ? <><Loader2 size={14} /> 삭제 중…</> : <><Trash2 size={14} /> 음성 삭제</>}
                </button>
                {audioSrc && <audio controls autoPlay src={audioSrc} style={{ width: '100%', marginTop: '0.3rem' }} />}
              </div>
            )}

            {/* 🆕 07-04 §8-9 후속(09-08) — 단계별 화면 대신, 제목 아래 A/B/C 탭으로 작성 방법을 고른다. */}
            <div className="farewell-method-tabs">
              <button type="button" onClick={() => setActiveMethod('upload')} disabled={saving} className={activeMethod === 'upload' ? 'active' : undefined}>
                <Upload size={14} /> A. 음성 파일 업로드
              </button>
              <button type="button" onClick={() => setActiveMethod('record')} disabled={saving} className={activeMethod === 'record' ? 'active' : undefined}>
                <Mic size={14} /> B. 음성 녹음
              </button>
              <button type="button" onClick={() => setActiveMethod('write')} disabled={saving} className={activeMethod === 'write' ? 'active' : undefined}>
                <Pencil size={14} /> C. 직접 쓰기
              </button>
            </div>

            <div className="farewell-composer-body">
              {/* 탭별 설명(특히 STT 안내)을 본문에 끼워 넣지 않고 옆 사이드노트가 맡는다. */}
              <aside className="farewell-composer-rail">
                {/* 00-38 §8.1-1 ⓑ — 모바일 전용 접기 버튼. 데스크톱은 index.css가 폭 기준으로
                    숨기고 아래 콘텐츠를 항상 펼쳐서 보여준다(railOpen 상태와 무관). */}
                <button
                  type="button"
                  className="farewell-composer-rail-toggle"
                  onClick={() => setRailOpen((o) => !o)}
                  aria-expanded={railOpen}
                >
                  <span>작성 안내</span>
                  <ChevronDown size={16} style={{ transform: railOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }} />
                </button>
                <div className={`farewell-composer-rail-content${railOpen ? ' is-open' : ''}`}>
                  {activeMethod === 'upload' && (
                    <>
                      <p className="farewell-rail-label">A. 음성 파일 업로드</p>
                      <p className="farewell-rail-desc">
                        <Mic size={14} />
                        <span><strong>자동으로 글로 바뀝니다.</strong> 음성 파일이 네이버 클라우드 CLOVA Speech로 전송되어 변환되며, 변환된 텍스트는 네이버에 7일간 보관된 뒤 삭제됩니다.</span>
                      </p>
                    </>
                  )}
                  {activeMethod === 'record' && (
                    <>
                      <p className="farewell-rail-label">B. 음성 녹음</p>
                      <p className="farewell-rail-desc">
                        <Mic size={14} />
                        <span><strong>말씀하신 목소리는 글로 바뀌어 편지 내용으로 들어갑니다.</strong> 브라우저가 바로 바꾸지 못하면 네이버 CLOVA Speech로 자동 전송되어 변환됩니다. 녹음을 마치면 저장 여부를 다시 확인합니다.</span>
                      </p>
                    </>
                  )}
                  {activeMethod === 'write' && (
                    <>
                      <p className="farewell-rail-label">무엇을 남길까 고민된다면</p>
                      <ul className="farewell-rail-hints">
                        <li>요즘 근황</li>
                        <li>고마웠던 순간</li>
                        <li>못다한 말</li>
                      </ul>
                    </>
                  )}
                </div>
              </aside>

              <div className="farewell-composer-main">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {activeMethod !== 'write' && (
                    <VoiceToTextInput
                      key={activeMethod}
                      mode={activeMethod}
                      token={token}
                      disabled={saving}
                      onSaveConfirmed={handleVoiceSaveConfirmed}
                    />
                  )}

                  <div>
                    {activeMethod !== 'write' && <p className="farewell-result-label">자동으로 바뀐 글 — 확인하고 고쳐 쓰세요</p>}
                    <textarea
                      rows={activeMethod === 'write' ? 7 : 5}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="form-input farewell-composer-textarea"
                      style={{ height: 'auto', padding: '1rem' }}
                      placeholder={`${recipient.name}님께 남기고 싶은 말을 자유롭게 적어보세요.`}
                    />
                  </div>

                  {error && (
                    <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--state-warn-fg)', backgroundColor: 'var(--state-warn-bg)', border: '1px solid var(--state-warn-bg)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-3) 0.9rem' }}>
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
                        borderRadius: 'var(--r-sm)', border: 'none', cursor: saving ? 'default' : 'pointer',
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
                        borderRadius: 'var(--r-sm)', border: 'none', cursor: saving || !body.trim() ? 'default' : 'pointer',
                        backgroundColor: 'var(--point-color)', color: '#FFFFFF', opacity: !saving && body.trim() ? 1 : 0.5,
                      }}
                    >
                      {saving ? <><Loader2 size={16} /> 저장 중…</> : '저장'}
                    </button>
                  </div>

                  {/* 🎨 위험 구역 — 취소·저장과 같은 줄에 있으면 오탭 위험이 크다. 구분선 + 작은
                  텍스트버튼으로 무게를 낮추고 우측 정렬로 눈에 덜 띄게 뺐다. */}
                  {editingId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--sp-3)' }}>
                      <button
                        type="button"
                        onClick={() => handleExportMessage(editingId, title.trim() || `${recipient.name}에게`)}
                        disabled={exportingId === editingId}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none',
                          padding: '0.3rem 0.2rem', fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--primary-color)',
                          cursor: exportingId === editingId ? 'default' : 'pointer', opacity: exportingId === editingId ? 0.6 : 1,
                        }}
                      >
                        {exportingId === editingId ? <><Loader2 size={14} /> 반출 중…</> : <><Download size={14} /> 다운로드</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage()}
                        disabled={saving || deletingMessageId === editingId}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none',
                          padding: '0.3rem 0.2rem', fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--state-danger-fg)',
                          cursor: saving || deletingMessageId === editingId ? 'default' : 'pointer', opacity: saving || deletingMessageId === editingId ? 0.6 : 1,
                        }}
                      >
                        {deletingMessageId === editingId ? <><Loader2 size={14} /> 삭제 중…</> : <><Trash2 size={14} /> 삭제</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
