import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Trash2, Pencil, Plus, Send, Copy } from 'lucide-react';
import { FAMILY_INVITE_CARD_IMAGE_URL } from '../config';
import { apiFetch, ApiError } from '../lib/api';
import { getToken } from '../lib/storage';
import { ensureKakaoShareReady, shareViaKakao } from '../utils/kakaoShare';

// 00-27 §8.2·§8.3·§10 Phase 1(기록) + §9.1 Phase 2(알리기·공유 버튼). 수락/거절 자체는 받는
// 사람이 여는 /invite/:token(FamilyInvitePage.tsx)에서 일어난다 — 여기서는 링크를 만들어
// 전달할 뿐, status를 이 화면에서 직접 바꾸지 않는다(서버만 바꾼다, 불변식 1).

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: 'SPOUSE', label: '배우자' },
  { value: 'CHILD', label: '자녀' },
  { value: 'PARENT', label: '부모' },
  { value: 'SIBLING', label: '형제자매' },
  { value: 'OTHER', label: '기타' },
];
const RELATIONSHIP_LABEL: Record<string, string> = Object.fromEntries(RELATIONSHIP_OPTIONS.map((o) => [o.value, o.label]));

const SCOPE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'VIEWER', label: '연락 대상', hint: '사망 통지 수신 · 추모관 접근' },
  { value: 'PRIMARY', label: '대표 지정인', hint: '엔딩노트 전달 · 정산 실행 요청' },
];
const SCOPE_LABEL: Record<string, string> = Object.fromEntries(SCOPE_OPTIONS.map((o) => [o.value, o.label]));

interface FamilyDesignationItem {
  id: string;
  name: string;
  phone: string; // 마스킹된 값
  email: string | null; // 마스킹된 값
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
  priority: number;
  status: string;
  tokenExpiresAt: string | null;
  declinedAt: string | null;
}

// §9.1 — status는 서버만 바꾼다. 여기선 표시만 한다. PENDING은 만료 여부를 tokenExpiresAt으로
// 직접 판정한다(서버가 EXPIRED로 상태를 미리 바꿔두지 않는다 — 조회 시점 판정, 07-03 §6.2-4와 같은 사상).
const statusLabel = (item: FamilyDesignationItem): string => {
  if (item.status === 'ACCEPTED') return '✅ 수락 완료';
  if (item.status === 'DECLINED') return '거절됨 · 다시 알리기 가능';
  if (item.status === 'PENDING') {
    const expired = item.tokenExpiresAt && new Date(item.tokenExpiresAt).getTime() < Date.now();
    return expired ? '링크 만료 · 다시 알리기 필요' : '알림 발송됨 · 수락 대기 중';
  }
  return '아직 알리지 않음';
};

interface FormState {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  relationshipEtc: string;
  scope: string;
  priority: string;
}

const emptyForm: FormState = { name: '', phone: '', email: '', relationship: 'CHILD', relationshipEtc: '', scope: 'VIEWER', priority: '1' };

interface MyPageFamilyDesignationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyPageFamilyDesignation: React.FC<MyPageFamilyDesignationProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<FamilyDesignationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  // 00-27 §9.1-4 — 방금 발급한 초대 링크. 카카오 공유 성공 여부와 무관하게 링크 복사 버튼을
  // 항상 같이 보여주기 위해 별도로 들고 있는다(§9.1-4-1 — 자동 분기 뒤에 숨기지 않는다).
  const [lastInviteLink, setLastInviteLink] = useState<{ itemId: string; url: string } | null>(null);

  // 클릭 핸들러 안에서 동기 호출해야 팝업 차단을 피한다(ObituaryPage.tsx와 동일 패턴) — 로드는
  // 모달 마운트 시점에 미리 시작해둔다.
  useEffect(() => {
    ensureKakaoShareReady();
  }, []);

  const fetchList = async () => {
    if (!getToken('USER')) return;
    setIsLoading(true);
    try {
      const data = await apiFetch<FamilyDesignationItem[]>('/api/family-designations', 'USER');
      setItems(data);
    } catch {
      // 조회 실패는 조용히 무시 — 다시 열면 재시도된다
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      fetchList();
    } else {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item: FamilyDesignationItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      phone: '', // 마스킹된 값이라 프리필하지 않는다 — 바꿀 때만 새로 입력
      email: '',
      relationship: item.relationship,
      relationshipEtc: item.relationshipEtc || '',
      scope: item.scope,
      priority: String(item.priority),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getToken('USER')) return;

    if (!editingId && !form.phone.trim()) {
      setMessage({ type: 'error', text: '휴대전화번호를 입력해 주세요.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        relationship: form.relationship,
        relationshipEtc: form.relationship === 'OTHER' ? form.relationshipEtc.trim() : undefined,
        scope: form.scope,
        priority: Number(form.priority) || 1,
      };
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.email.trim()) body.email = form.email.trim();

      await apiFetch(`/api/family-designations${editingId ? `/${editingId}` : ''}`, 'USER', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      setMessage({ type: 'success', text: editingId ? '수정되었습니다.' : '등록되었습니다.' });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchList();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: FamilyDesignationItem) => {
    if (!getToken('USER')) return;
    if (!window.confirm(`${item.name}님 지정을 삭제하시겠어요?`)) return;

    setIsSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/api/family-designations/${item.id}`, 'USER', { method: 'DELETE' });
      await fetchList();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 00-27 §9.1-4(2026-08-26 사장님 확정) — 카카오 SDK 도입. 폴백 사다리는 ①카카오톡 공유 →
  // ②링크 복사(항상 노출)이다. navigator.share는 여기서 쓰지 않는다 — Windows Chrome·Edge에도
  // 존재해서 "공유창은 떴지만 카톡이 없어 스토어로 감" + "shared=true라 아래 복사 폴백이 죽음"
  // 문제를 재현했었다(§9.1-4-1, 데스크톱 경로 0개의 원인). 카카오 성공 여부와 무관하게 방금
  // 발급한 링크를 lastInviteLink로 남겨 복사 버튼을 항상 같이 그린다.
  const handleInvite = async (item: FamilyDesignationItem) => {
    if (!getToken('USER')) return;

    setInvitingId(item.id);
    setMessage(null);
    setLastInviteLink(null);
    try {
      const data = await apiFetch<{ inviteToken: string }>(`/api/family-designations/${item.id}/invite`, 'USER', {
        method: 'POST',
      });

      const link = `${window.location.origin}/invite/${data.inviteToken}`;

      // §9.1-4 카톡 카드 — 실명·관계·"엔딩노트"·"사망 통지" 금지. 단톡방 전원에게 보이는
      // 미리보기라 누가 누구에게인지는 링크를 연 사람만 FamilyInvitePage에서 보게 한다.
      // §9.1-4-3 — 버튼 라벨도 "부고 보기"가 아니라 "가족 확인하기"로(생전 지정을 사망 통지로
      // 오인하지 않도록).
      shareViaKakao({
        title: '이어봄 — 가족 확인 요청',
        description: '가족 확인 요청이 도착했습니다.',
        imageUrl: FAMILY_INVITE_CARD_IMAGE_URL,
        url: link,
        buttonLabel: '가족 확인하기',
      });

      setLastInviteLink({ itemId: item.id, url: link });
      await fetchList();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setInvitingId(null);
    }
  };

  // §9.1-4-1 — "어느 경로든 링크 복사 버튼은 항상 함께 보이게" — 카카오 성공 여부와 무관하게
  // 독립적으로 눌린다(handleInvite가 이미 발급해둔 링크를 재사용, 새 토큰을 또 발급하지 않는다).
  const handleCopyInviteLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ type: 'success', text: '링크가 복사되었습니다. 1:1로 전달해 주세요.' });
    } catch {
      setMessage({ type: 'success', text: `링크: ${url} (복사에 실패해 직접 선택해 복사해 주세요)` });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3100,
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          padding: '1.9rem 1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          margin: '2rem 0',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6B7280',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>가족 지정</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.1rem 0' }}>
          생전 준비를 함께할 가족을 미리 기록해 두세요. 최대 10명까지 등록할 수 있습니다.
        </p>

        {/* 00-27 §9.1-4 — "알리기" 버튼을 누르기 전에 상시 노출. 이유를 감추면 지켜지지 않는다는
            원칙(§9.1-4)에 따라 "단톡방에 보내지 마세요"가 아니라 왜 안 되는지를 그대로 적는다. */}
        {items.some((item) => item.status !== 'ACCEPTED') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: '#92400E',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '0.7rem 0.85rem',
              marginBottom: '1rem',
              lineHeight: 1.6,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <span>이 링크를 받은 분은 누구나 수락할 수 있습니다. 반드시 본인에게만 1:1로 보내주세요.</span>
          </div>
        )}

        {message && (
          <div
            style={{
              backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FDE8E8',
              color: message.type === 'success' ? '#065F46' : '#9B1C1C',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', color: '#9CA3AF' }}>
            <Loader2 size={20} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {items.length === 0 && !showForm && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  아직 지정된 가족이 없습니다.
                </p>
              )}
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '14px',
                  }}
                >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{item.name}</span>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        {RELATIONSHIP_LABEL[item.relationship] || item.relationship}
                        {item.relationship === 'OTHER' && item.relationshipEtc ? `(${item.relationshipEtc})` : ''}
                      </span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          backgroundColor: item.scope === 'PRIMARY' ? '#FEF3C7' : '#F1F5F9',
                          color: item.scope === 'PRIMARY' ? '#92400E' : '#475569',
                        }}
                      >
                        {SCOPE_LABEL[item.scope] || item.scope}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '0.15rem' }}>
                      {item.phone}
                      {item.email ? ` · ${item.email}` : ''} · {statusLabel(item)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {item.status !== 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleInvite(item)}
                        disabled={invitingId === item.id}
                        title="카카오톡으로 전달"
                        style={{ background: 'none', border: '1px solid var(--point-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: invitingId === item.id ? 'not-allowed' : 'pointer', color: 'var(--point-color)' }}
                      >
                        {invitingId === item.id ? <Loader2 size={14} /> : <Send size={14} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={isSaving}
                      style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSaving ? 'not-allowed' : 'pointer', color: '#DC2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* §9.1-4-1 — 카카오 성공 여부와 무관하게 항상 같이 보이는 링크 복사(handleInvite가
                    이미 발급한 링크를 재사용, 새 토큰을 또 만들지 않는다). */}
                {lastInviteLink?.itemId === item.id && (
                  <div
                    style={{
                      marginTop: '0.7rem',
                      paddingTop: '0.7rem',
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF', wordBreak: 'break-all', flex: 1, minWidth: '160px' }}>
                      {lastInviteLink.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink(lastInviteLink.url)}
                      className="btn"
                      style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.85rem', height: '34px', flexShrink: 0 }}
                    >
                      <Copy size={14} /> 링크 복사
                    </button>
                  </div>
                )}
                </div>
              ))}
            </div>

            {!showForm ? (
              items.length < 10 && (
                <button type="button" onClick={openAddForm} className="btn" style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
                  <Plus size={16} /> 가족 추가
                </button>
              )
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">성함 *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input" required />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    가족이 수락할 때 입력할 이름입니다. 평소 부르는 이름과 다르면 수락이 막힐 수 있으니 정확히 입력해 주세요.
                  </p>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">휴대전화번호 {editingId ? '' : '*'}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="form-input"
                    placeholder={editingId ? '바꾸시려면 새 번호를 입력하세요' : '010-0000-0000'}
                    required={!editingId}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">이메일</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="form-input"
                    placeholder={editingId ? '바꾸시려면 새 이메일을 입력하세요 (선택)' : '선택 입력'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">관계 *</label>
                    <select value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} className="form-select">
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.relationship === 'OTHER' && (
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">관계 직접 입력 *</label>
                      <input
                        value={form.relationshipEtc}
                        onChange={(e) => setForm((f) => ({ ...f, relationshipEtc: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">권한 범위 *</label>
                  <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))} className="form-select">
                    {SCOPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.hint}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">연락 순위</label>
                  <input
                    type="number"
                    min={1}
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="form-input"
                    style={{ width: '100px' }}
                  />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>
                    1순위가 응답이 없을 때 다음 순위로 연락합니다. 법정상속순위와는 무관합니다.
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '0.7rem 0.85rem',
                    lineHeight: 1.6,
                  }}
                >
                  여기 입력하신 가족의 성함·연락처는 이어봄에 저장됩니다. 가족에게 알리기 전까지는 어떤 권한도 부여되지 않으며, 이어봄이 먼저 연락하지도 않습니다. 알리기를 누르시면 가족이 직접 수락한 뒤에야 열람 권한이 생깁니다. 언제든 삭제하실 수 있습니다.
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className="btn"
                    style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}
                  >
                    취소
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ flex: 2 }}>
                    {isSaving ? '저장 중...' : editingId ? '수정 저장' : '등록'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
