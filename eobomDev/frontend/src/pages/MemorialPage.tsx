import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Copy, ChevronRight, LogIn, Plus } from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import { formatKST } from '../utils/obituaryCard';
import { copyObituaryLink } from '../utils/kakaoShare';
import { backdropCloseProps } from '../utils/backdropClose';
import '../styles/design-v2.css';

// 🔄 09-07 사용자 지시 — "추모관은 부고장 생성에 딸리지 않고, 추모관 페이지에서 따로
// 생성/삭제된다." 이 화면이 그 "추모관 페이지"다. 기존엔 MemorialEntryPage가 "부고장이
// 있으면 /my-obituaries로 보낸다"는 리다이렉트였는데, 이제 부고장과 추모관이 서로 독립이라
// 그 판정 자체가 의미를 잃었다 — 여기서 직접 CRUD를 한다. 백엔드는 이미 있던
// `POST /api/memorials`(createMemorial)·`GET /api/me/memorials`(listMyMemorials)에
// `DELETE /api/memorials/:id`(closeMemorial, 소프트 삭제)만 새로 얹었다.
// 🔄 00-39 §9.1(2026-09-22 개발자 지시) — `memorial`이 그룹⑦(미정)에서 그룹①(목록·체크리스트)로
// 편입됐다. 목록은 `my-obituaries`(MyObituaryListPage.tsx)와 같은 행·모달 클래스를 그대로 쓰고,
// 만들기 폼은 §6.8·§6.8-1(그룹② obituary에서 확정된 규칙), 삭제 확인은 `window.confirm` 대신
// §6.4 모달(WithdrawalModal.tsx의 단계형 확인 패턴)로 옮겼다. 기능(만들기·삭제·주소복사·공개
// 범위)은 그대로 — 옛 토큰(`--primary-color` 등)과 인라인 스타일만 걷어냈다.

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

type FieldErrorKey = 'deceased' | 'falseReport';

// 화면 위→아래 순서 — 제출 실패 시 첫 오류 칸으로 포커스를 옮기는 데 쓴다(00-39 규칙 17 ④)
const FIELD_ERROR_ORDER: { key: FieldErrorKey; id: string }[] = [
  { key: 'deceased', id: 'mem-deceased' },
  { key: 'falseReport', id: 'mem-false-report' },
];

type ModalStep = 'detail' | 'confirm-delete';

export const MemorialPage: React.FC<MemorialPageProps> = ({ currentUser, onOpenLogin }) => {
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState<MyMemorial[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<MyMemorial | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('detail');

  const [formOpen, setFormOpen] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedDeathDate, setDeceasedDeathDate] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [visibility, setVisibility] = useState('LINK');
  const [falseReportAgreed, setFalseReportAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearFieldError = (key: FieldErrorKey) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

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
    setFieldErrors({});
    setErrorMsg(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // 00-39 규칙 17 — 브라우저 기본 검증(required) 대신 칸마다 오류를 붙인다.
    const errs: Partial<Record<FieldErrorKey, string>> = {};
    if (!deceasedName.trim()) errs.deceased = '고인 성함을 입력해 주세요.';
    if (!falseReportAgreed) errs.falseReport = '확인이 필요한 항목입니다.';
    const errCount = Object.keys(errs).length;
    if (errCount > 0) {
      setFieldErrors(errs);
      setErrorMsg(`확인이 필요한 항목이 ${errCount}개 있습니다. 붉게 표시된 곳을 확인해 주세요.`);
      const first = FIELD_ERROR_ORDER.find((f) => errs[f.key]);
      if (first) document.getElementById(first.id)?.focus();
      return;
    }
    setFieldErrors({});
    setErrorMsg(null);
    setSubmitting(true);
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
      setErrorMsg(err instanceof ApiError ? err.message : '추모관 개설 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = async (m: MyMemorial) => {
    const url = `${window.location.origin}/m/${m.slug}`;
    const copied = await copyObituaryLink(url);
    setFeedback({ id: m.id, message: copied ? '추모관 주소가 복사되었습니다.' : '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.' });
  };

  const closeModal = () => {
    if (deletingId) return;
    setModalTarget(null);
    setModalStep('detail');
  };

  const openModal = (m: MyMemorial) => {
    setModalTarget(m);
    setModalStep('detail');
  };

  // 소프트 삭제(closedAt) — 방명록·헌화·사진은 남기고 공개 열람만 즉시 막는다
  // (memorialController.closeMemorial 주석 참고). 되돌리는 UI는 두지 않는다.
  const handleDelete = async (m: MyMemorial) => {
    setDeletingId(m.id);
    try {
      await apiFetch(`/api/memorials/${m.id}`, 'USER', { method: 'DELETE' });
      setMemorials((prev) => (prev ? prev.filter((item) => item.id !== m.id) : prev));
      setModalTarget(null);
      setModalStep('detail');
    } catch {
      setFeedback({ id: m.id, message: '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' });
      setModalStep('detail');
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="v2-page">
        <div className="v2-content">
          <h1 className="v2-page-title">디지털 추모관</h1>
          <p className="v2-empty">추모관을 만들고 관리하려면 로그인해 주세요.</p>
          <button type="button" className="v2-btn-primary" onClick={onOpenLogin}>
            <LogIn size={16} /> 로그인 / 회원가입
          </button>
        </div>
      </div>
    );
  }

  const activeMemorials = (memorials ?? []).filter((m) => !m.closedAt);

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">디지털 추모관</h1>
        <p className="v2-page-subtitle">조문객이 헌화·방명록을 남길 수 있는 추모 공간입니다.</p>
      </div>

      <div className="v2-content">
        {!formOpen && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <button type="button" className="v2-btn-primary" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> 새 추모관 만들기
            </button>
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleCreate} className="v2-form" style={{ maxWidth: '560px', marginBottom: '32px' }}>
            <section className="v2-form-section is-plain">
              <div className="v2-field">
                <label htmlFor="mem-deceased">
                  고인 성함
                  <span className="v2-req">필수</span>
                </label>
                <input
                  id="mem-deceased"
                  type="text"
                  className="v2-input"
                  value={deceasedName}
                  placeholder="예: 홍길동"
                  aria-invalid={fieldErrors.deceased ? true : undefined}
                  aria-describedby={fieldErrors.deceased ? 'mem-deceased-err' : undefined}
                  onChange={(e) => { setDeceasedName(e.target.value); clearFieldError('deceased'); }}
                />
                {fieldErrors.deceased && <span id="mem-deceased-err" className="v2-error-text">{fieldErrors.deceased}</span>}
              </div>

              <div className="v2-field">
                <label htmlFor="mem-death-date">
                  사망일
                  <span className="v2-opt">선택</span>
                </label>
                <input
                  id="mem-death-date"
                  type="date"
                  className="v2-input"
                  value={deceasedDeathDate}
                  onChange={(e) => setDeceasedDeathDate(e.target.value)}
                />
              </div>

              <div className="v2-field">
                <label htmlFor="mem-epitaph">
                  추모 문구
                  <span className="v2-opt">선택</span>
                </label>
                <input
                  id="mem-epitaph"
                  type="text"
                  className="v2-input"
                  value={epitaph}
                  placeholder="예: 늘 그리운 모습으로 기억합니다"
                  onChange={(e) => setEpitaph(e.target.value)}
                />
              </div>

              <div className="v2-field">
                <label htmlFor="mem-visibility">공개 범위</label>
                <select id="mem-visibility" className="v2-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="LINK">링크로만 공개 — 주소를 아는 사람만</option>
                  <option value="PUBLIC">전체 공개</option>
                  <option value="PRIVATE">비공개 — 나만 볼 수 있음</option>
                </select>
              </div>

              <div>
                <label className="v2-check" htmlFor="mem-false-report">
                  <input
                    id="mem-false-report"
                    type="checkbox"
                    checked={falseReportAgreed}
                    aria-invalid={fieldErrors.falseReport ? true : undefined}
                    onChange={(e) => { setFalseReportAgreed(e.target.checked); clearFieldError('falseReport'); }}
                  />
                  <span><span className="v2-req">필수</span> 허위로 추모관을 개설할 경우 법적 책임을 질 수 있다는 점에 동의합니다.</span>
                </label>
                {fieldErrors.falseReport && <p className="v2-error-text v2-check-error" style={{ margin: 0 }}>{fieldErrors.falseReport}</p>}
              </div>
            </section>

            <div className="v2-form-submit">
              {errorMsg && <p role="alert" className="v2-error-text" style={{ margin: 0 }}>{errorMsg}</p>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="v2-btn-outline" style={{ flex: 1 }} onClick={resetForm} disabled={submitting}>
                  취소
                </button>
                <button type="submit" className="v2-btn-primary" style={{ flex: 1 }} disabled={submitting} aria-busy={submitting}>
                  {submitting ? '만드는 중…' : '추모관 만들기'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="v2-section-head">
          <h2 className="v2-section-title">내 추모관</h2>
          {memorials !== null && <span className="v2-section-count">({activeMemorials.length})</span>}
        </div>

        {memorials === null && !loadError && <p className="v2-empty">불러오는 중...</p>}
        {loadError && <p className="v2-error-text">목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>}
        {memorials !== null && activeMemorials.length === 0 && <p className="v2-empty">아직 만든 추모관이 없습니다.</p>}

        {activeMemorials.map((m) => (
          <div key={m.id} className="v2-list-row">
            <button type="button" className="v2-list-main" onClick={() => openModal(m)}>
              <span className="v2-list-title">
                故 {m.deceasedName}
                <span className="v2-list-inline-meta"> · {VISIBILITY_LABEL[m.visibility] || m.visibility}</span>
              </span>
            </button>
            <span className="v2-list-meta">
              {m.deceasedDeathDate ? `사망일 ${formatKST(m.deceasedDeathDate)}` : `개설일 ${formatKST(m.createdAt)}`}
            </span>
            <ChevronRight size={16} className="v2-row-chevron" />
          </div>
        ))}
      </div>

      {modalTarget && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(closeModal)}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            {modalStep === 'detail' ? (
              <>
                <h3 className="v2-modal-title">故 {modalTarget.deceasedName}</h3>

                <div className="v2-modal-row">
                  <span className="v2-modal-label">공개 범위</span>
                  <span className="v2-modal-value">{VISIBILITY_LABEL[modalTarget.visibility] || modalTarget.visibility}</span>
                </div>

                <div className="v2-modal-row">
                  <span className="v2-modal-label">일자</span>
                  <span className="v2-modal-value">
                    {modalTarget.deceasedDeathDate
                      ? `사망일 ${formatKST(modalTarget.deceasedDeathDate)}`
                      : `개설일 ${formatKST(modalTarget.createdAt)}`}
                  </span>
                </div>

                <div className="v2-modal-actions">
                  <button type="button" className="v2-btn-outline" onClick={() => navigate(`/m/${modalTarget.slug}`)}>
                    <ExternalLink size={14} /> 열기
                  </button>
                  <button type="button" className="v2-btn-outline" onClick={() => copyAddress(modalTarget)}>
                    <Copy size={14} /> 주소 복사
                  </button>
                  <button type="button" className="v2-btn-outline" onClick={() => setModalStep('confirm-delete')}>
                    삭제
                  </button>
                </div>

                {feedback?.id === modalTarget.id && <p className="v2-notice">{feedback.message}</p>}

                <button type="button" className="v2-modal-close" onClick={closeModal}>
                  닫기
                </button>
              </>
            ) : (
              <>
                <h3 className="v2-modal-title">추모관을 삭제하시겠어요?</h3>
                <p className="v2-modal-value" style={{ margin: '0 0 16px' }}>
                  삭제하면 이 추모관 링크로 더는 들어올 수 없습니다. 방명록·헌화 기록은 보관 기간 동안 남아 있습니다.
                </p>
                <div className="v2-modal-actions">
                  <button type="button" className="v2-btn-outline" onClick={() => setModalStep('detail')} disabled={deletingId === modalTarget.id}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="v2-btn-solid"
                    onClick={() => handleDelete(modalTarget)}
                    disabled={deletingId === modalTarget.id}
                    aria-busy={deletingId === modalTarget.id}
                  >
                    {deletingId === modalTarget.id ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
