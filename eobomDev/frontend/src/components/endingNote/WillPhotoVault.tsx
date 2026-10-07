import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Images, Loader2 } from 'lucide-react';
import { apiFetch, apiFetchRaw, apiUploadForm, ApiError } from '../../lib/api';
import { HEAVY_CLIENT_LIMITS, HEAVY_TIMEOUT_MESSAGE, HEAVY_NETWORK_MESSAGE } from '../../lib/heavyLimits';
import { WorkingView, HeavyNoticeDialog } from '../common/HeavyWork';
import { backdropCloseProps } from '../../utils/backdropClose';
import { formatKstDate } from '../../utils/kstDate';
import type { WillOcrResponse } from './WillPhotoResult';
import type { RecentOcr } from './WillPhotoUploadModal';

// docs 06-06 §5-2-4 — ⑨ `보관한 사진`: 묶음 목록(올린 날짜 · 장수) → 열면 사진만 보임 + 다시 인식 + 삭제.
// 사진 보기는 음성과 같이 인증 fetch → 서버가 복호화 → blob(presigned URL 없음, 06-05 §5.6-2와 같은 방식).
// 🔴 요건·인식 글은 저장하지 않으므로 여기서는 사진만 보인다. 다시 인식은 CLOVA를 다시 부르고(하루 10회에 포함),
//    결과는 지금처럼 결과 화면에서 본다 — 보관한 사진을 내려받아 같은 인식 경로(/api/ocr/recognize)에 다시 올린다(새로 보관하지 않음).

interface VaultSet {
  id: string;
  createdAt: string;
  pageCount: number;
  mimes: string[];
}

interface ViewPage {
  blob: Blob;
  mime: string;
  url: string;
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

interface WillPhotoVaultProps {
  onClose: () => void;
  onRecognized: (recent: RecentOcr) => void; // 다시 인식이 끝나면 부모가 결과 화면을 연다
}

export const WillPhotoVault: React.FC<WillPhotoVaultProps> = ({ onClose, onRecognized }) => {
  const [sets, setSets] = useState<VaultSet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pages, setPages] = useState<ViewPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const loadSets = useCallback(() => {
    apiFetch<VaultSet[]>('/api/will-photos', 'USER')
      .then((d) => { setSets(d); setError(null); })
      .catch((e) => { setSets([]); setError(e instanceof ApiError ? e.baseMessage : '보관한 사진을 불러오지 못했습니다.'); });
  }, []);
  useEffect(loadSets, [loadSets]);

  // 열린 묶음의 object URL은 닫거나 바꿀 때 거둔다 — 복호화된 사진이 메모리에 오래 남지 않게.
  useEffect(() => () => pages.forEach((p) => URL.revokeObjectURL(p.url)), [pages]);

  const openSet = async (set: VaultSet) => {
    setError(null);
    setPages([]);
    setOpenId(set.id);
    setLoadingPages(true);
    try {
      const loaded: ViewPage[] = [];
      for (let i = 0; i < set.pageCount; i++) {
        const res = await apiFetchRaw(`/api/will-photos/${set.id}/pages/${i}`, 'USER');
        if (!res.ok) throw new Error('load');
        const blob = await res.blob();
        loaded.push({ blob, mime: set.mimes[i] ?? blob.type, url: URL.createObjectURL(blob) });
      }
      setPages(loaded);
    } catch {
      setOpenId(null);
      setError('사진을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setLoadingPages(false);
    }
  };

  const closeSet = () => {
    setOpenId(null);
    setPages([]);
  };

  const deleteSet = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/will-photos/${id}`, 'USER', { method: 'DELETE' });
      setConfirmDeleteId(null);
      if (openId === id) closeSet();
      loadSets();
    } catch (e) {
      setConfirmDeleteId(null);
      setError(e instanceof ApiError ? e.baseMessage : '삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const recognizeAgain = async () => {
    if (pages.length === 0) return;
    setError(null);
    const files = pages.map((p, i) => new File([p.blob], `page-${i + 1}.${EXT[p.mime] ?? 'jpg'}`, { type: p.mime })); // 원래 파일 이름은 보관하지 않는다
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f)); // keepPhoto를 보내지 않는다 — 같은 사진을 또 보관하지 않는다

    const ac = new AbortController();
    abortRef.current = ac;
    setProcessing(true);
    try {
      const data = await apiUploadForm<WillOcrResponse>('/api/ocr/recognize', 'USER', formData, {
        deadlineMs: HEAVY_CLIENT_LIMITS.photo.deadlineMs,
        timeoutMessage: HEAVY_TIMEOUT_MESSAGE.photo,
        networkMessage: HEAVY_NETWORK_MESSAGE.photo,
        signal: ac.signal,
      });
      onRecognized({ files, result: data });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ABORTED') return;
      setNotice(e instanceof ApiError ? e.baseMessage : '사진 인식에 실패했습니다. 잠시 뒤 다시 시도해 주세요.');
      setProcessing(false);
    }
  };

  const opened = sets?.find((s) => s.id === openId) ?? null;

  return (
    <>
      <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-label="보관한 사진" {...backdropCloseProps(onClose)}>
        <div className="v2-modal is-scroll" onClick={(e) => e.stopPropagation()}>
          <h3 className="v2-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Images size={20} color="var(--v2-point)" /> 보관한 사진
          </h3>

          <div className="v2-modal-body">
            {processing ? (
              <WorkingView maxMinutes={HEAVY_CLIENT_LIMITS.photo.maxMinutes} />
            ) : (
              <>
                <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                  암호화하여 보관 중이며 본인만 볼 수 있습니다. 사진은 사본이며 효력은 손으로 쓴 원본에만 있습니다.
                </p>

                {error && <p className="v2-notice-warn" style={{ marginBottom: '12px' }}>{error}</p>}

                {sets === null && <p style={{ color: 'var(--v2-text-muted)' }}><Loader2 size={16} className="v2-spin" /> 불러오는 중…</p>}
                {sets !== null && sets.length === 0 && !error && (
                  <p style={{ color: 'var(--v2-text-muted)' }}>보관한 사진이 없습니다.</p>
                )}

                {!opened && sets && sets.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sets.map((s) => (
                      <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          {formatKstDate(s.createdAt, '.')} 보관 · {s.mimes[0] === 'application/pdf' ? 'PDF' : `${s.pageCount}장`}
                        </span>
                        <button type="button" className="v2-btn-outline" onClick={() => openSet(s)}>열기</button>
                        <button type="button" className="v2-btn-outline" onClick={() => setConfirmDeleteId(s.id)}>삭제</button>
                      </li>
                    ))}
                  </ul>
                )}

                {opened && (
                  <div>
                    <p style={{ marginBottom: '8px', fontWeight: 700 }}>
                      {formatKstDate(opened.createdAt, '.')} 보관 · {opened.mimes[0] === 'application/pdf' ? 'PDF' : `${opened.pageCount}장`}
                    </p>
                    {loadingPages && <p style={{ color: 'var(--v2-text-muted)' }}><Loader2 size={16} className="v2-spin" /> 사진을 불러오는 중…</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pages.map((p, i) =>
                        p.mime === 'application/pdf' ? (
                          <a key={i} href={p.url} target="_blank" rel="noreferrer" className="v2-btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            PDF 열기
                          </a>
                        ) : (
                          <img key={i} src={p.url} alt={`보관한 사진 ${i + 1}쪽`} style={{ width: '100%', height: 'auto', border: '1px solid var(--v2-btn-border)', borderRadius: '4px' }} />
                        ),
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                      <button type="button" className="v2-btn-primary" onClick={recognizeAgain} disabled={loadingPages || pages.length === 0}>
                        다시 인식
                      </button>
                      <button type="button" className="v2-btn-outline" onClick={() => setConfirmDeleteId(opened.id)}>삭제</button>
                      <button type="button" className="v2-btn-outline" onClick={closeSet}>목록으로</button>
                    </div>
                    <p style={{ marginTop: '8px', fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', lineHeight: 1.5 }}>
                      다시 인식은 사진을 CLOVA OCR로 다시 보내며 하루 이용 횟수(10회)에 포함됩니다.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <button type="button" className="v2-modal-close" onClick={onClose}>닫기</button>
        </div>
      </div>
      {/* 같은 z-index(2000)의 overlay는 나중에 렌더된 쪽이 위에 온다 — 본창 뒤에 둬야 보인다 */}
      {notice && <HeavyNoticeDialog message={notice} onClose={() => setNotice(null)} />}
      {confirmDeleteId && (
        <div className="v2-modal-overlay" role="alertdialog" aria-modal="true" aria-label="삭제 확인" onClick={(e) => e.stopPropagation()}>
          <div className="v2-modal is-ocr-confirm" onClick={(e) => e.stopPropagation()}>
            <p className="v2-ocr-confirm-text">이 사진 묶음을 삭제하시겠어요? 30일 뒤 완전히 삭제됩니다.</p>
            <div className="v2-ocr-confirm-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setConfirmDeleteId(null)} disabled={busy}>취소</button>
              <button type="button" className="v2-btn-primary" onClick={() => deleteSet(confirmDeleteId)} disabled={busy}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
