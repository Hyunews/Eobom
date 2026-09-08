import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, Plus, ExternalLink, Copy, Trash2, LogIn, Loader2 } from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import { formatKST } from '../utils/obituaryCard';
import { copyObituaryLink } from '../utils/kakaoShare';

// 🔄 09-07 사용자 지시 — "추모관은 부고장 생성에 딸리지 않고, 추모관 페이지에서 따로
// 생성/삭제된다." 이 화면이 그 "추모관 페이지"다. 기존엔 MemorialEntryPage가 "부고장이
// 있으면 /my-obituaries로 보낸다"는 리다이렉트였는데, 이제 부고장과 추모관이 서로 독립이라
// 그 판정 자체가 의미를 잃었다 — 여기서 직접 CRUD를 한다. 백엔드는 이미 있던
// `POST /api/memorials`(createMemorial)·`GET /api/me/memorials`(listMyMemorials)에
// `DELETE /api/memorials/:id`(closeMemorial, 소프트 삭제)만 새로 얹었다.

interface MemorialPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

interface MyMemorial {
  id: string;
  slug: string;
  deceasedName: string;
  deceasedDeathDate: string | null;
  visibility: string;
  createdAt: string;
  closedAt: string | null;
}

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: '비공개',
  LINK: '링크로만 공개',
  PUBLIC: '전체 공개',
};

export const MemorialPage: React.FC<MemorialPageProps> = ({ currentUser, onOpenLogin }) => {
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState<MyMemorial[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedDeathDate, setDeceasedDeathDate] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [visibility, setVisibility] = useState('LINK');
  const [falseReportAgreed, setFalseReportAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMemorials = () => {
    apiFetch<MyMemorial[]>('/api/me/memorials', 'USER')
      .then(setMemorials)
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchMemorials();
  }, [currentUser]);

  const resetForm = () => {
    setFormOpen(false);
    setDeceasedName('');
    setDeceasedDeathDate('');
    setEpitaph('');
    setVisibility('LINK');
    setFalseReportAgreed(false);
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deceasedName.trim()) {
      setFormError('고인 성함은 필수입니다.');
      return;
    }
    if (!falseReportAgreed) {
      setFormError('허위 개설 시 법적 책임을 질 수 있다는 점에 동의해야 합니다.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/api/memorials', 'USER', {
        method: 'POST',
        body: JSON.stringify({
          deceasedName: deceasedName.trim(),
          deceasedDeathDate: deceasedDeathDate || undefined,
          epitaph: epitaph.trim() || undefined,
          visibility,
          falseReportAgreed,
        }),
      });
      resetForm();
      fetchMemorials();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '추모관 개설 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = async (id: string, slug: string) => {
    const url = `${window.location.origin}/m/${slug}`;
    const copied = await copyObituaryLink(url);
    setFeedback({ id, message: copied ? '추모관 주소가 복사되었습니다.' : '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.' });
  };

  // 소프트 삭제(closedAt) — 방명록·헌화·사진은 남기고 공개 열람만 즉시 막는다
  // (memorialController.closeMemorial 주석 참고). 되돌리는 UI는 두지 않는다.
  const handleDelete = async (m: MyMemorial) => {
    if (!window.confirm(`故 ${m.deceasedName}님의 추모관을 삭제하시겠어요?\n\n삭제하면 이 추모관 링크로 더는 들어올 수 없습니다. 방명록·헌화 기록은 보관 기간 동안 남아 있습니다.`)) return;
    setDeletingId(m.id);
    try {
      await apiFetch(`/api/memorials/${m.id}`, 'USER', { method: 'DELETE' });
      setMemorials((prev) => (prev ? prev.filter((item) => item.id !== m.id) : prev));
    } catch {
      setFeedback({ id: m.id, message: '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
          <Flower2 color="var(--point-color)" size={40} style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>디지털 추모관</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>추모관을 만들고 관리하려면 로그인해 주세요.</p>
          <button onClick={onOpenLogin} className="btn btn-point" style={{ width: '100%' }}>
            <LogIn size={18} /> 로그인 / 회원가입
          </button>
        </div>
      </div>
    );
  }

  const activeMemorials = (memorials ?? []).filter((m) => !m.closedAt);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--surface-subtle)', color: '#6C7A89', padding: '0.3rem 0.8rem', borderRadius: 'var(--r-lg)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            <Flower2 size={18} color="#6C7A89" /> 온라인 추모 공간
          </div>
          <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Flower2 color="var(--point-color)" size={32} /> 디지털 추모관
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            조문객이 온라인으로 헌화·방명록을 남길 수 있는 공간입니다. 부고장과 별개로 여기서 직접 만들고 지웁니다.
          </p>
        </div>
        {!formOpen && (
          <button type="button" onClick={() => setFormOpen(true)} className="btn btn-point" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> 새 추모관 만들기
          </button>
        )}
      </div>

      {formOpen && (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '1.1rem' }}>새 추모관 만들기</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">고인 성함</label>
              <input type="text" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="form-input" placeholder="예: 홍길동" required />
            </div>
            <div className="form-group">
              <label className="form-label">사망일 (선택)</label>
              <input type="date" value={deceasedDeathDate} onChange={(e) => setDeceasedDeathDate(e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">추모 문구 (선택)</label>
              <input type="text" value={epitaph} onChange={(e) => setEpitaph(e.target.value)} className="form-input" placeholder="예: 늘 그리운 모습으로 기억합니다" />
            </div>
            <div className="form-group">
              <label className="form-label">공개 범위</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="form-select">
                <option value="LINK">링크로만 공개 — 주소를 아는 사람만</option>
                <option value="PUBLIC">전체 공개</option>
                <option value="PRIVATE">비공개 — 나만 볼 수 있음</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-sm)', padding: '0.8rem', marginBottom: '1rem' }}>
              <input type="checkbox" checked={falseReportAgreed} onChange={(e) => setFalseReportAgreed(e.target.checked)} style={{ marginTop: '0.2rem' }} />
              <span>[필수] 허위로 추모관을 개설할 경우 법적 책임을 질 수 있다는 점에 동의합니다.</span>
            </label>
            {formError && (
              <div style={{ fontSize: '0.85rem', color: 'var(--state-danger-fg)', backgroundColor: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-bg)', borderRadius: 'var(--r-sm)', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" onClick={resetForm} disabled={submitting} className="btn" style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
                취소
              </button>
              <button type="submit" disabled={submitting} className="btn btn-point" style={{ flex: 1 }}>
                {submitting ? <><Loader2 size={16} /> 만드는 중...</> : '추모관 만들기'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>내 추모관</h4>

        {memorials === null && !loadError && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>불러오는 중...</p>
        )}
        {loadError && (
          <p style={{ color: 'var(--state-warn-fg)', fontSize: '0.9rem' }}>목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
        )}
        {memorials !== null && activeMemorials.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 만든 추모관이 없습니다.</p>
        )}

        {activeMemorials.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {activeMemorials.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '0.9rem 1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-sm)',
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      故 {m.deceasedName}
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                        · {VISIBILITY_LABEL[m.visibility] || m.visibility}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {m.deceasedDeathDate ? `사망일 ${formatKST(m.deceasedDeathDate)}` : `개설일 ${formatKST(m.createdAt)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    disabled={deletingId === m.id}
                    className="btn"
                    style={{
                      height: '36px', padding: '0 0.8rem', fontSize: '0.82rem', backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--state-danger-bg)', color: 'var(--state-danger-fg)', opacity: deletingId === m.id ? 0.6 : 1,
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/m/${m.slug}`)}
                    style={{ height: '32px', padding: '0 0.6rem', fontSize: '0.78rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <ExternalLink size={13} /> 열기
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAddress(m.id, m.slug)}
                    style={{ height: '32px', padding: '0 0.6rem', fontSize: '0.78rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Copy size={13} /> 주소 복사
                  </button>
                </div>

                {feedback?.id === m.id && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{feedback.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
