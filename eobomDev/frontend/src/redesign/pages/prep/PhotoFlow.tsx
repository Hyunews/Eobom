import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, apiFetch, apiFetchRaw, apiUploadForm } from '../../../lib/api';
import { HEAVY_CLIENT_LIMITS, HEAVY_NETWORK_MESSAGE, HEAVY_TIMEOUT_MESSAGE } from '../../../lib/heavyLimits';
import { formatKstDate } from '../../../utils/kstDate';
import { RdButton, RdIconButton, RdRequired } from '../../parts/RdButtons';
import { RdTabs } from '../../parts/RdNav';
import { RdTextarea } from '../../parts/RdInputs';
import { RdAlertDialog, RdConfirmDialog, RdDangerDialog, RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp, IconClose, IconErrorCircle } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import {
  MAX_FILES,
  MAX_PDF_SIZE_MB,
  MAX_PHOTO_SIZE_MB,
  MIME_EXT,
  OCR_ERR,
  REQUIREMENT_LABEL,
  REQUIREMENT_STATE_LABEL,
  resizeImageIfNeeded,
  sameFile,
  validateOcrFiles,
  type RecentOcr,
  type VaultSet,
  type WillOcrResponse,
  type WillRequirement,
} from './photoOcr';

// 사진 읽기 창 묶음(1-6 올리기 · 1-7 읽는 중 · 1-8 결과 · 1-9 보관한 사진 · 1-10 상태).
// 10-2: 서버에 연결 — 올리기 `POST /api/ocr/recognize` · 보관한 사진 `/api/will-photos`. 규칙·문구는 지금 화면(`components/endingNote/WillPhoto*.tsx`)에서 옮겼다(06-06 §4.1·§5-2·§6).

type Screen = 'upload' | 'working' | 'result' | 'vault' | 'bundle';
export type PhotoMode = 'upload' | 'result' | 'vault';

interface ViewPage {
  blob: Blob;
  mime: string;
  url: string;
}

const HL_PAD = 8; // 사진 테두리 사방 여백(px)

/** 올린 사진 한 쪽. 위치 표시(box)는 서버가 준 픽셀 좌표를 퍼센트로 바꿔 그린다 */
function PhotoPage({ src, n, hit, width, height }: { src: string; n: number; hit?: WillRequirement['box']; width?: number; height?: number }) {
  const hlRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (hit) hlRef.current?.scrollIntoView({ block: 'center' });
  }, [hit]);
  return (
    <div className="rd-pr-photo__page rd-pr-photo__page--img">
      <img className="rd-pr-photo__img" src={src} alt={`올린 사진 ${n}쪽`} />
      {hit && width && height && (
        <span
          ref={hlRef}
          className="rd-pr-photo__hit"
          aria-hidden="true"
          style={{
            left: `calc(${(hit.x / width) * 100}% - ${HL_PAD}px)`,
            top: `calc(${(hit.y / height) * 100}% - ${HL_PAD}px)`,
            width: `calc(${(hit.width / width) * 100}% + ${HL_PAD * 2}px)`,
            height: `calc(${(hit.height / height) * 100}% + ${HL_PAD * 2}px)`,
          }}
        />
      )}
    </div>
  );
}

function PagerRow({ page, total, setPage }: { page: number; total: number; setPage: (n: number) => void }) {
  return (
    <div className="rd-pr-photo__nav">
      <RdIconButton label="이전 쪽" disabled={page <= 0} onClick={() => setPage(page - 1)}><IconChevronLeft /></RdIconButton>
      <span aria-live="polite">{page + 1} / {total}</span>
      <RdIconButton label="다음 쪽" disabled={page >= total - 1} onClick={() => setPage(page + 1)}><IconChevronRight /></RdIconButton>
    </div>
  );
}

export function PhotoFlow({
  mode,
  photoStorageEnabled,
  recent,
  draftEmpty,
  onRecognized,
  onApply,
  onClose,
}: {
  mode: PhotoMode;
  /** 06-06 §5-2-1 — 서버 스위치. 꺼짐이면 "보관하지 않습니다" 문구·보관 체크 없음 */
  photoStorageEnabled: boolean;
  /** 마지막 인식 결과(메모리에만). `mode='result'`로 열 때 쓴다 */
  recent: RecentOcr | null;
  draftEmpty: boolean;
  onRecognized: (recent: RecentOcr) => void;
  onApply: (text: string, how: 'put' | 'append' | 'replace') => void;
  onClose: () => void;
}) {
  const phone = useIsPhone();
  const startRecent = mode === 'result' ? recent : null;
  const [screen, setScreen] = useState<Screen>(startRecent ? 'result' : mode === 'vault' ? 'vault' : 'upload');
  const [files, setFiles] = useState<File[]>([]);
  const [agreeOcr, setAgreeOcr] = useState(false);
  const [agreeKeep, setAgreeKeep] = useState(true); // §5-2-4 `사진도 보관하기` — 기본 켬
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [alertBox, setAlertBox] = useState<{ title: string; desc?: string } | null>(null);
  // 결과
  const [result, setResult] = useState<WillOcrResponse | null>(startRecent?.result ?? null);
  const [resultFiles, setResultFiles] = useState<File[]>(startRecent?.files ?? []);
  const [pageTexts, setPageTexts] = useState<string[]>(() =>
    startRecent ? (startRecent.pageTexts && startRecent.pageTexts.length === startRecent.result.pages.length ? startRecent.pageTexts : startRecent.result.pages.map((p) => p.text)) : [],
  );
  const [tab, setTab] = useState(phone ? 'photo' : 'req');
  const [selKey, setSelKey] = useState<string | null>(null);
  const [fromReq, setFromReq] = useState(false); // 모바일 — 요건 행을 눌러 넘어왔을 때만 위치 테두리
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState<'append' | 'replace' | null>(null);
  // 보관한 사진
  const [sets, setSets] = useState<VaultSet[] | null>(null);
  const [vaultError, setVaultError] = useState(false);
  const [bundle, setBundle] = useState<VaultSet | null>(null);
  const [bundlePages, setBundlePages] = useState<ViewPage[]>([]);
  const [bundleState, setBundleState] = useState<'loading' | 'ready' | 'openfail' | 'delfail'>('loading');
  const [delAsk, setDelAsk] = useState<VaultSet | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; abortRef.current?.abort(); }; }, []);

  // 쪽별 글은 닫을 때 한 번 부모에 넘긴다(글자 칠 때마다 부모가 다시 그려지지 않게). 다시 열면 고친 글로 열린다.
  const latest = useRef({ result, resultFiles, pageTexts, onRecognized });
  latest.current = { result, resultFiles, pageTexts, onRecognized };
  useEffect(() => () => {
    const l = latest.current;
    if (l.result) l.onRecognized({ files: l.resultFiles, result: l.result, pageTexts: l.pageTexts });
  }, []);

  // 올린 사진을 보여 주는 object URL — jpg·png만(heic는 브라우저가 못 그리고 pdf는 쪽 이미지가 없다, §6-1)
  const [urls, setUrls] = useState<(string | null)[]>([]);
  useEffect(() => {
    const created = resultFiles.map((f) => (f.type === 'image/jpeg' || f.type === 'image/png' ? URL.createObjectURL(f) : null));
    setUrls(created);
    return () => created.forEach((u) => u && URL.revokeObjectURL(u));
  }, [resultFiles]);

  // 보관한 사진 목록 — 열 때 불러온다
  const loadSets = () => {
    setSets(null);
    setVaultError(false);
    apiFetch<VaultSet[]>('/api/will-photos', 'USER')
      .then((d) => { if (alive.current) setSets(d); })
      .catch(() => { if (alive.current) { setSets([]); setVaultError(true); } });
  };
  useEffect(() => {
    if (screen === 'vault' && sets === null && !vaultError) loadSets();
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 열린 묶음의 object URL은 바꾸거나 닫을 때 거둔다 — 복호화된 사진이 메모리에 오래 남지 않게
  useEffect(() => () => bundlePages.forEach((p) => URL.revokeObjectURL(p.url)), [bundlePages]);

  const canUpload = agreeOcr && files.length > 0 && !error && !uploading;

  const pickFiles = async (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    setError(null);
    // 이미 고른 파일은 그대로 두고 새로 고른 것을 뒤에 더한다(같은 파일을 다시 고르면 건너뜀)
    const added = picked.filter((p) => !files.some((f) => sameFile(f, p)));
    if (added.length === 0) return;
    if (files.length + added.length > MAX_FILES) {
      setError(OCR_ERR.count);
      return;
    }
    // 사진은 줄인 뒤 크기로 잰다(고화소 폰 사진이 줄이기 전 크기로 막히지 않게). 이미 담긴 파일은 줄여 둔 것
    const next = [...files, ...(await Promise.all(added.map(resizeImageIfNeeded)))];
    if (!alive.current) return;
    const err = validateOcrFiles(next);
    if (err) {
      setError(err);
      return;
    }
    setFiles(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...files];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setFiles(next);
  };
  const remove = (i: number) => {
    setError(null);
    setFiles(files.filter((_, k) => k !== i));
  };

  const showResult = (data: WillOcrResponse, used: File[]) => {
    setResult(data);
    setResultFiles(used);
    setPageTexts(data.pages.map((p) => p.text));
    setPage(0);
    setSelKey(null);
    setFromReq(false);
    setTab(phone ? 'photo' : 'req');
    setScreen('result');
    // §5-2-2 — 인식은 됐지만 보관은 못 한 경우(10묶음 초과·저장 실패) 결과 화면 위에 이유를 알린다.
    if (data.photo && !data.photo.stored && data.photo.message) setAlertBox({ title: data.photo.message });
  };

  // 올리기 → 읽는 중 → 결과. 마감은 업로드가 끝난 뒤 65초(서버 55초 + 여유 10). 창을 닫으면 요청을 끊는다("처음부터 다시").
  const recognize = async (used: File[], keep: boolean, back: Screen) => {
    const formData = new FormData();
    used.forEach((f) => formData.append('photos', f));
    if (keep) formData.append('keepPhoto', 'true');
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const data = await apiUploadForm<WillOcrResponse>('/api/ocr/recognize', 'USER', formData, {
        deadlineMs: HEAVY_CLIENT_LIMITS.photo.deadlineMs,
        timeoutMessage: HEAVY_TIMEOUT_MESSAGE.photo,
        networkMessage: HEAVY_NETWORK_MESSAGE.photo,
        onUploaded: () => { if (alive.current) { setUploading(false); setScreen('working'); } },
        signal: ac.signal,
      });
      if (!alive.current) return;
      setUploading(false);
      showResult(data, used);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ABORTED') return; // 닫아서 끊음 — 화면이 이미 없다
      if (!alive.current) return;
      // 서버가 이유별로 보낸 문구(대기·처리·연결)는 알림 창으로, 그 밖의 오류(형식·용량 등)는 기존 줄로.
      // 502(인식 실패·연결 오류)는 코드가 없어도 알림 창으로 — 줄 문구만으로는 진행창이 사라진 이유가 안 보인다.
      const known = e instanceof ApiError && (e.code === 'BUSY' || e.code === 'SLOW' || e.code === 'UPSTREAM' || e.code === 'NO_TEXT' || e.status === 502);
      const message = e instanceof ApiError ? e.baseMessage : OCR_ERR.fail;
      setUploading(false);
      setScreen(back);
      if (known) setAlertBox({ title: message });
      else if (back === 'upload') setError(message);
      else setAlertBox({ title: message });
    }
  };

  const run = () => {
    if (!canUpload) return;
    setError(null);
    setUploading(true);
    void recognize(files, photoStorageEnabled && agreeKeep, 'upload');
  };

  const openVault = () => {
    setScreen('vault');
    loadSets();
  };

  const openBundle = async (set: VaultSet) => {
    setBundle(set);
    setBundlePages([]);
    setBundleState('loading');
    setScreen('bundle');
    try {
      const loaded: ViewPage[] = [];
      for (let i = 0; i < set.pageCount; i++) {
        const res = await apiFetchRaw(`/api/will-photos/${set.id}/pages/${i}`, 'USER');
        if (!res.ok) throw new Error('load');
        const blob = await res.blob();
        loaded.push({ blob, mime: set.mimes[i] ?? blob.type, url: URL.createObjectURL(blob) });
      }
      if (!alive.current) {
        loaded.forEach((p) => URL.revokeObjectURL(p.url));
        return;
      }
      setBundlePages(loaded);
      setBundleState('ready');
    } catch {
      if (alive.current) setBundleState('openfail');
    }
  };

  const reOcr = () => {
    if (bundlePages.length === 0) return;
    // 원래 파일 이름은 보관하지 않는다. keepPhoto를 보내지 않는다 — 같은 사진을 또 보관하지 않는다
    const used = bundlePages.map((p, i) => new File([p.blob], `page-${i + 1}.${MIME_EXT[p.mime] ?? 'jpg'}`, { type: p.mime }));
    setScreen('working');
    void recognize(used, false, 'bundle');
  };

  const deleteSet = async (set: VaultSet) => {
    setDelAsk(null);
    try {
      await apiFetch(`/api/will-photos/${set.id}`, 'USER', { method: 'DELETE' });
      if (!alive.current) return;
      setBundlePages([]);
      setBundle(null);
      setScreen('vault');
      loadSets();
    } catch {
      if (alive.current) {
        setScreen('bundle');
        setBundleState('delfail');
      }
    }
  };

  const pages = result?.pages ?? [];
  const requirements = result?.requirements ?? [];
  const sel = requirements.find((r) => r.key === selKey) ?? null;
  const photoOf = (i: number): string | null => {
    const p = pages[i];
    if (!p || !p.width || !p.height) return null;
    return urls[p.fileIndex] ?? null;
  };
  const hasAnyPhoto = pages.some((_, i) => photoOf(i) !== null);
  const showHighlight = tab === 'req' || (tab === 'photo' && fromReq);
  const hl = showHighlight && sel && sel.box && sel.page === page ? sel.box : undefined;
  const foundOthers = useMemo(
    () => requirements.filter((r) => r.state === 'found' && r.key !== selKey).map((r) => REQUIREMENT_LABEL[r.key]),
    [requirements, selKey],
  );

  const onSelectReq = (r: WillRequirement) => {
    setSelKey(r.key);
    if (r.page !== undefined && r.page < pages.length) setPage(r.page);
    if (phone) {
      setFromReq(true);
      setTab('photo');
    }
  };
  const pickTab = (t: string) => {
    setTab(t);
    if (phone) setFromReq(false);
  };

  // ───────── 화면별 본문·버튼 ─────────
  let title = '사진으로 불러오기';
  let body: React.ReactNode = null;
  let footer: React.ReactNode = <RdButton kind="secondary" place="dialog" onClick={onClose}>닫기</RdButton>;
  let width: 420 | 560 | 960 = 560;
  let even = false;

  if (screen === 'upload') {
    body = (
      <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="rd-pr-lines">
          <p>{phone ? '본인이 쓴 유언장만. 한자·외국어는 직접 입력.' : '본인이 쓴 유언장만 올려 주세요. 한글·숫자·기호만 인식하며, 한자나 외국어는 직접 입력해 주세요.'}</p>
          <p>jpg·png·heic {MAX_FILES}장({MAX_PHOTO_SIZE_MB}MB씩) 또는 PDF 1개({MAX_PDF_SIZE_MB}MB·5쪽)</p>
        </div>
        <div className="rd-pr-checks">
          <label className="rd-pr-check">
            <input type="checkbox" checked={agreeOcr} disabled={uploading} onChange={(e) => setAgreeOcr(e.target.checked)} />
            <span className="rd-pr-check__txt">
              <span>
                <RdRequired /> 사진이 네이버 클라우드 CLOVA OCR로 전송되어 글자를 인식합니다.
                {/* §5-2-4 — 스위치 꺼짐이면 옛 문구 그대로 */}
                {!photoStorageEnabled && ' 이어봄은 사진을 보관하지 않으며, 인식된 텍스트만 암호화되어 저장됩니다.'}
              </span>
            </span>
          </label>
          {/* §5-2-4 보관 체크 — 스위치 켬일 때만. 동의가 아니라 선택이라 "필수" 표시가 없다 */}
          {photoStorageEnabled && (
            <label className="rd-pr-check">
              <input type="checkbox" checked={agreeKeep} disabled={uploading} onChange={(e) => setAgreeKeep(e.target.checked)} />
              <span className="rd-pr-check__txt">
                <b>사진도 보관하기</b>
                <small>사진을 암호화하여 보관합니다. 본인만 볼 수 있고, 삭제하면 30일 뒤 완전히 삭제됩니다.</small>
                <small>사진은 사본이며 효력은 손으로 쓴 원본에만 있습니다.</small>
              </span>
            </label>
          )}
        </div>
        {error && (
          <p className="rd-pr-err" role="alert">
            <IconErrorCircle />
            <span>{error}</span>
          </p>
        )}
        <div className="rd-pr-actions">
          <RdButton kind="secondary" place="dialog" disabled={!agreeOcr || uploading} onClick={() => fileRef.current?.click()}>파일 선택</RdButton>
          <RdButton place="dialog" disabled={!canUpload && !uploading} busy={uploading} busyText="올리는 중…" onClick={run}>올리기</RdButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.heic,.heif,.pdf,image/jpeg,image/png,image/heic,image/heif,application/pdf"
          multiple
          hidden
          onChange={(e) => { void pickFiles(e.target.files); e.target.value = ''; }}
        />
        {files.length > 0 && (
          <ol className="rd-pr-files">
            {files.map((f, i) => (
              <li className="rd-pr-files__li" key={`${f.name}-${i}`}>
                <span className="rd-pr-files__no">{i + 1}</span>
                <span className="rd-pr-files__name">{f.name}</span>
                {!uploading && (
                  <>
                    <RdIconButton label="위로 이동" disabled={i === 0} onClick={() => move(i, -1)}><IconChevronUp size={18} /></RdIconButton>
                    <RdIconButton label="아래로 이동" disabled={i === files.length - 1} onClick={() => move(i, 1)}><IconChevronDown size={18} /></RdIconButton>
                    <RdIconButton label={`${f.name} 빼기`} onClick={() => remove(i)}><IconClose size={18} /></RdIconButton>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  } else if (screen === 'working') {
    body = (
      <div className="rd-pr-working" role="status">
        <RdState kind="working" title="처리하고 있습니다." desc={`최대 ${HEAVY_CLIENT_LIMITS.photo.maxMinutes}분까지 걸릴 수 있습니다.`} />
        <p>이 화면을 닫으면 처음부터 다시 해야 합니다.</p>
      </div>
    );
  } else if (screen === 'result' && result) {
    width = 960;
    const reqPane = (
      <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ul className="rd-pr-rq" aria-label="자필증서 요건">
          {requirements.map((r) => {
            const clickable = !phone || !!r.box;
            const inner = (
              <>
                <span className="rd-pr-rq__name">{REQUIREMENT_LABEL[r.key]}</span>
                <span className={`rd-pr-rq__res${r.state === 'missing' ? ' rd-pr-rq__res--no' : r.state === 'unknown' ? ' rd-pr-rq__res--maybe' : ''}`}>{REQUIREMENT_STATE_LABEL[r.state]}</span>
                {/* 🔴 결과 문구는 서버가 만든 사실 문구를 그대로 보여준다. 유효·무효·적합·합계를 여기서 만들지 않는다(06-06 §3.1) */}
                {r.evidence && <span className="rd-pr-rq__ev">{r.evidence}</span>}
              </>
            );
            return (
              <li key={r.key}>
                {clickable ? (
                  <button type="button" className="rd-pr-rq__btn" aria-pressed={selKey === r.key} onClick={() => onSelectReq(r)}>{inner}</button>
                ) : (
                  <div className="rd-pr-rq__btn rd-pr-rq__btn--static">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
        {!phone && <p className="rd-pr-small">항목을 누르면 사진에서 찾은 위치가 표시됩니다.</p>}
        <p className="rd-pr-small">자동 확인은 참고용입니다. 요건 체크는 유언장 초안 화면에서 직접 해 주세요.</p>
      </div>
    );
    const textPane = (
      <div className="rd-pr-ocr">
        {pages.map((_, i) => (
          <div key={i} className="rd-pr-ocr__page">
            <h4>{i + 1}쪽</h4>
            <RdTextarea
              aria-label={`${i + 1}쪽 인식된 글 고치기`}
              rows={phone ? 8 : 10}
              maxLength={20000}
              value={pageTexts[i] ?? ''}
              onChange={(e) => setPageTexts(pageTexts.map((t, k) => (k === i ? e.target.value : t)))}
            />
          </div>
        ))}
        <p className="rd-pr-small">{phone ? '틀릴 수 있습니다. 사진과 대조해 주세요.' : '인식된 글은 틀릴 수 있습니다. 사진과 대조해 주세요.'}</p>
      </div>
    );
    const src = photoOf(page);
    const info = pages[page];
    const photoPane = src && info ? (
      <div className="rd-pr-photo">
        <PhotoPage src={src} n={page + 1} hit={hl} width={info.width} height={info.height} />
        {pages.length > 1 && hasAnyPhoto && <PagerRow page={page} total={pages.length} setPage={setPage} />}
        {!phone && sel && !sel.box && <p className="rd-pr-photo__note">이 항목은 사진에서 표시할 위치가 없습니다.</p>}
      </div>
    ) : (
      <p className="rd-pr-photo__pdf">PDF는 사진 표시 없이 결과만 보여 줍니다.</p>
    );
    if (phone) {
      body = (
        <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RdTabs label="결과" tabs={[{ value: 'photo', label: '사진' }, { value: 'req', label: '요건' }, { value: 'text', label: '인식된 글' }]} value={tab} onChange={pickTab} />
          {tab === 'photo' && (
            <>
              {fromReq && sel && (
                <p className="rd-pr-small">
                  <b>{REQUIREMENT_LABEL[sel.key]}</b> {REQUIREMENT_STATE_LABEL[sel.state]}
                  {' · '}
                  {sel.box ? sel.evidence : '이 항목은 사진에서 표시할 위치가 없습니다.'}
                  {sel.box && foundOthers.length ? ` · ${foundOthers.join(' · ')} 찾음` : ''}
                </p>
              )}
              {photoPane}
            </>
          )}
          {tab === 'req' && reqPane}
          {tab === 'text' && textPane}
        </div>
      );
    } else {
      body = (
        <div className="rd-pr-result">
          {photoPane}
          <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RdTabs label="결과" tabs={[{ value: 'req', label: '자필증서 요건' }, { value: 'text', label: '인식된 글' }]} value={tab === 'photo' ? 'req' : tab} onChange={pickTab} />
            {tab === 'text' ? textPane : reqPane}
          </div>
        </div>
      );
    }
    // 초안에 들어가는 글 = 고친 글(서버 text와 같은 이음 방식)
    const joined = pageTexts.join('\n\n').trim();
    footer = draftEmpty ? (
      <>
        <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
        <RdButton place="dialog" onClick={() => onApply(joined, 'put')}>초안에 넣기</RdButton>
      </>
    ) : (
      <>
        <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
        <RdButton kind="secondary" place="dialog" onClick={() => setConfirm('append')}>뒤에 붙이기</RdButton>
        <RdButton place="dialog" onClick={() => setConfirm('replace')}>바꾸기</RdButton>
      </>
    );
    even = !draftEmpty;
  } else if (screen === 'vault') {
    title = '보관한 사진';
    body = (
      <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sets === null && <p className="rd-pr-small" role="status">불러오는 중…</p>}
        {sets !== null && vaultError && <RdState kind="error" title="보관한 사진을 불러오지 못했습니다." />}
        {sets !== null && !vaultError && sets.length === 0 && <RdState kind="empty" title="보관한 사진이 없습니다." />}
        {sets !== null && !vaultError && sets.length > 0 && (
          <>
            <p className="rd-pr-small">암호화하여 보관하며 본인만 볼 수 있습니다.</p>
            <ul className="rd-pr-vault">
              {sets.map((s) => (
                <li className="rd-pr-vault__li" key={s.id}>
                  <span>{formatKstDate(s.createdAt, '.')} 보관 · {s.mimes[0] === 'application/pdf' ? 'PDF' : `${s.pageCount}장`}</span>
                  <RdButton kind="secondary" place="row" onClick={() => void openBundle(s)}>열기</RdButton>
                  <RdButton kind="secondary" place="row" onClick={() => setDelAsk(s)}>삭제</RdButton>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  } else if (screen === 'bundle' && bundle) {
    title = `${formatKstDate(bundle.createdAt, '.')} 보관 · ${bundle.mimes[0] === 'application/pdf' ? 'PDF' : `${bundle.pageCount}장`}`;
    body = (
      <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bundleState === 'loading' && <p className="rd-pr-small" role="status">사진을 불러오는 중…</p>}
        {bundleState === 'openfail' && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>사진을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</span></p>}
        {bundleState === 'delfail' && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.</span></p>}
        {(bundleState === 'ready' || bundleState === 'delfail') &&
          (bundlePages.length > 0 && bundlePages.every((p) => p.mime === 'application/pdf') ? (
            <p className="rd-pr-photo__pdf">PDF는 사진 표시 없이 결과만 보여 줍니다.</p>
          ) : (
            <div className="rd-pr-photos3">
              {bundlePages.map((p, i) => (
                <PhotoPage key={p.url} src={p.url} n={i + 1} />
              ))}
            </div>
          ))}
        {bundleState !== 'loading' && <p className="rd-pr-small">다시 인식은 사진을 CLOVA OCR로 다시 보내며 하루 이용 횟수(10회)에 포함됩니다.</p>}
      </div>
    );
    footer =
      bundleState === 'loading' ? (
        <RdButton kind="secondary" place="dialog" onClick={onClose}>닫기</RdButton>
      ) : (
        <>
          <RdButton kind="secondary" place="dialog" onClick={() => setDelAsk(bundle)}>삭제</RdButton>
          <RdButton kind="secondary" place="dialog" onClick={() => { setScreen('vault'); }}>목록으로</RdButton>
          {bundleState === 'ready' && <RdButton place="dialog" onClick={reOcr}>다시 인식</RdButton>}
        </>
      );
    even = true;
  }

  return (
    <>
      <RdDialog form width={width} title={title} onClose={onClose} closeX evenButtons={even} footer={footer}>
        {body}
      </RdDialog>
      {alertBox && <RdAlertDialog title={alertBox.title} desc={alertBox.desc} onOk={() => setAlertBox(null)} />}
      {confirm && (
        <RdConfirmDialog
          title={confirm === 'append' ? '인식된 글을 지금 초안 뒤에 붙입니다.' : '지금 초안이 인식된 글로 바뀝니다.'}
          desc="적용하면 이 화면이 닫힙니다."
          keepLabel="취소"
          doLabel="적용"
          onKeep={() => setConfirm(null)}
          onDo={() => { const how = confirm; setConfirm(null); onApply(pageTexts.join('\n\n').trim(), how); }}
        />
      )}
      {delAsk && (
        <RdDangerDialog
          title="이 사진 묶음을 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          doLabel="삭제"
          onCancel={() => setDelAsk(null)}
          onDo={() => void deleteSet(delAsk)}
        />
      )}
    </>
  );
}
