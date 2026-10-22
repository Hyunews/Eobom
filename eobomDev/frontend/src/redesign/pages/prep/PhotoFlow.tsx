import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RdBadge, RdButton, RdIconButton, RdRequired } from '../../parts/RdButtons';
import { RdTabs } from '../../parts/RdNav';
import { RdTextarea } from '../../parts/RdInputs';
import { RdAlertDialog, RdConfirmDialog, RdDangerDialog, RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp, IconClose, IconErrorCircle } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { FOUND_LABEL, OCR_PAGES, OCR_REQS, VAULT, type OcrReq, type VaultBundle } from './noteData';
import { sleep } from './prepCommon';

// 사진 읽기 창 묶음(1-6 올리기 · 1-7 읽는 중 · 1-8 결과 · 1-9 보관한 사진 · 1-10 상태). 서버 호출 없이 예시 값으로 흐름만 돈다.

type Screen = 'upload' | 'working' | 'result' | 'vault' | 'bundle';
export type PhotoMode = 'upload' | 'result' | 'vault';

const ERR = {
  format: 'jpg·png·heic·pdf 파일만 올릴 수 있습니다.',
  count: '사진은 최대 5장까지 올릴 수 있습니다.',
  mixed: 'PDF는 1개만 올릴 수 있고, 사진과 함께 올릴 수 없습니다.',
  photoSize: '사진 1장은 5MB까지 올릴 수 있습니다.',
  pdfSize: 'PDF 파일은 20MB까지 올릴 수 있습니다.',
};

const DEMO_ERR: Record<string, string> = {
  'up-format': ERR.format,
  'up-count': ERR.count,
  'up-mixed': ERR.mixed,
  'up-photo-size': ERR.photoSize,
  'up-pdf-size': ERR.pdfSize,
};

function validate(files: File[]): string | null {
  const ext = (f: File) => f.name.split('.').pop()?.toLowerCase() ?? '';
  const okExt = ['jpg', 'jpeg', 'png', 'heic', 'pdf'];
  if (files.some((f) => !okExt.includes(ext(f)))) return ERR.format;
  const pdfs = files.filter((f) => ext(f) === 'pdf');
  const photos = files.filter((f) => ext(f) !== 'pdf');
  if (pdfs.length > 1 || (pdfs.length && photos.length)) return ERR.mixed;
  if (photos.length > 5) return ERR.count;
  if (photos.some((f) => f.size > 5 * 1024 * 1024)) return ERR.photoSize;
  if (pdfs.some((f) => f.size > 20 * 1024 * 1024)) return ERR.pdfSize;
  return null;
}

/** 예시 사진 — 실제 사진 대신 줄무늬 쪽. 위치 표시(hit)는 그 쪽에만 그린다. */
function PhotoPage({ n, hit, small }: { n: number; hit?: OcrReq['hit']; small?: boolean }) {
  return (
    <div className="rd-pr-photo__page" role="img" aria-label={`예시 사진 ${n}쪽`}>
      {Array.from({ length: small ? 6 : 12 }).map((_, i) => (
        <span key={i} className="rd-pr-photo__line" style={{ width: `${60 + ((i * 17) % 38)}%` }} />
      ))}
      {hit && hit.page === n && (
        <span className="rd-pr-photo__hit" style={{ top: `${hit.top}%`, left: `${hit.left}%`, width: `${hit.w}%`, height: `${hit.h}%` }} aria-hidden="true" />
      )}
    </div>
  );
}

function PhotoView({ page, total, setPage, hit, noLocation }: { page: number; total: number; setPage: (n: number) => void; hit?: OcrReq['hit']; noLocation?: boolean }) {
  return (
    <div className="rd-pr-photo">
      <span className="rd-pr-photo__badge"><RdBadge kind="example">예시</RdBadge></span>
      <PhotoPage n={page} hit={hit} />
      <div className="rd-pr-photo__nav">
        <RdIconButton label="이전 쪽" disabled={page <= 1} onClick={() => setPage(page - 1)}><IconChevronLeft /></RdIconButton>
        <span aria-live="polite">{page} / {total}</span>
        <RdIconButton label="다음 쪽" disabled={page >= total} onClick={() => setPage(page + 1)}><IconChevronRight /></RdIconButton>
      </div>
      {noLocation && <p className="rd-pr-photo__note">이 항목은 사진에서 표시할 위치가 없습니다.</p>}
    </div>
  );
}

function ReqList({ selected, onSelect }: { selected: string | null; onSelect: (r: OcrReq) => void }) {
  return (
    <ul className="rd-pr-rq" aria-label="자필증서 요건">
      {OCR_REQS.map((r) => (
        <li key={r.id}>
          <button type="button" className="rd-pr-rq__btn" aria-pressed={selected === r.id} onClick={() => onSelect(r)}>
            <span className="rd-pr-rq__name">{r.name}</span>
            <span className={`rd-pr-rq__res${r.state === 'missing' ? ' rd-pr-rq__res--no' : r.state === 'unsure' ? ' rd-pr-rq__res--maybe' : ''}`}>{FOUND_LABEL[r.state]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PhotoFlow({
  mode,
  demo,
  draftEmpty,
  onApply,
  onClose,
}: {
  mode: PhotoMode;
  demo: string;
  draftEmpty: boolean;
  onApply: (text: string, how: 'put' | 'append' | 'replace') => void;
  onClose: () => void;
}) {
  const phone = useIsPhone();
  const [screen, setScreen] = useState<Screen>(mode);
  const [files, setFiles] = useState<File[]>([]);
  const [agreeOcr, setAgreeOcr] = useState(false);
  const [agreeKeep, setAgreeKeep] = useState(true);
  const [error, setError] = useState<string | null>(DEMO_ERR[demo] ?? null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; desc: string } | null>(null);
  const [pdfResult, setPdfResult] = useState(demo === 'result-pdf');
  const [tab, setTab] = useState('req');
  const [selReq, setSelReq] = useState<string | null>(demo === 'result-noloc' ? 'seal' : null);
  const [page, setPage] = useState(1);
  const [ocrText, setOcrText] = useState<string[]>(OCR_PAGES);
  const [confirm, setConfirm] = useState<'append' | 'replace' | null>(null);
  // 보관한 사진
  const [vault, setVault] = useState<'loading' | 'ready' | 'empty' | 'error'>(demo === 'vault-loading' ? 'loading' : demo === 'vault-empty' ? 'empty' : demo === 'vault-error' ? 'error' : 'ready');
  const [bundles, setBundles] = useState<VaultBundle[]>(VAULT);
  const [bundle, setBundle] = useState<VaultBundle | null>(null);
  const [bundleState, setBundleState] = useState<'loading' | 'ready' | 'openfail' | 'delfail'>('ready');
  const [delAsk, setDelAsk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  // 보기 상태를 바꾸면 그 모양으로 바로 간다.
  useEffect(() => {
    if (DEMO_ERR[demo]) { setScreen('upload'); setError(DEMO_ERR[demo]); }
    if (demo === 'ocr-fail') { setScreen('upload'); setAlert({ title: '사진 인식에 실패했습니다.', desc: '아래 입력창에 직접 입력해 주세요.' }); }
    if (demo === 'reocr-fail') { setScreen('bundle'); setBundle(VAULT[0]); setAlert({ title: '사진 인식에 실패했습니다.', desc: '잠시 뒤 다시 시도해 주세요.' }); }
    if (demo.startsWith('vault-')) { setScreen('vault'); setVault(demo === 'vault-loading' ? 'loading' : demo === 'vault-empty' ? 'empty' : demo === 'vault-error' ? 'error' : 'ready'); }
    if (demo.startsWith('bundle-')) { setScreen('bundle'); setBundle(VAULT[0]); setBundleState(demo === 'bundle-loading' ? 'loading' : demo === 'bundle-openfail' ? 'openfail' : 'delfail'); }
    if (demo === 'result-pdf' || demo === 'result-noloc') { setScreen('result'); setPdfResult(demo === 'result-pdf'); setSelReq(demo === 'result-noloc' ? 'seal' : null); setTab(phone && demo === 'result-noloc' ? 'photo' : 'req'); }
  }, [demo]); // eslint-disable-line react-hooks/exhaustive-deps

  const canUpload = agreeOcr && files.length > 0 && !error && !uploading;
  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    setFiles(next);
    setError(validate(next));
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...files];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setFiles(next);
  };
  const remove = (i: number) => {
    const next = files.filter((_, k) => k !== i);
    setFiles(next);
    setError(next.length ? validate(next) : null);
  };

  const run = async () => {
    setUploading(true);
    await sleep(1200);
    if (!alive.current) return;
    setUploading(false);
    setScreen('working');
    await sleep(2200);
    if (!alive.current) return;
    setPdfResult(files.length === 1 && files[0].name.toLowerCase().endsWith('.pdf'));
    setPage(1);
    setTab('req');
    setSelReq(null);
    setScreen('result');
  };

  const openVault = async () => {
    setScreen('vault');
    if (demo === 'vault-loading') return;
    setVault('loading');
    await sleep(600);
    if (alive.current) setVault(demo === 'vault-empty' ? 'empty' : demo === 'vault-error' ? 'error' : 'ready');
  };
  const openBundle = async (b: VaultBundle) => {
    setBundle(b);
    setScreen('bundle');
    setBundleState('loading');
    await sleep(500);
    if (alive.current) setBundleState(demo === 'bundle-openfail' ? 'openfail' : 'ready');
  };
  const reOcr = async () => {
    setScreen('working');
    await sleep(1800);
    if (!alive.current) return;
    if (demo === 'reocr-fail') {
      setScreen('bundle');
      setAlert({ title: '사진 인식에 실패했습니다.', desc: '잠시 뒤 다시 시도해 주세요.' });
      return;
    }
    setPdfResult(bundle?.pages === 'pdf');
    setPage(1);
    setTab('req');
    setSelReq(null);
    setScreen('result');
  };

  const total = pdfResult ? 0 : 3;
  const selected = OCR_REQS.find((r) => r.id === selReq) ?? null;
  const onSelectReq = (r: OcrReq) => {
    setSelReq(r.id);
    if (r.hit) setPage(r.hit.page);
    if (phone) setTab('photo');
  };
  const foundOthers = useMemo(() => OCR_REQS.filter((r) => r.state === 'found' && r.id !== selReq).map((r) => r.name), [selReq]);

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
          <p>{phone ? '본인이 쓴 유언장만. 한자·외국어는 직접 입력.' : '본인이 쓴 유언장만 올려 주세요. 한자·외국어는 직접 입력해 주세요.'}</p>
          <p>jpg·png·heic 5장(5MB씩) 또는 PDF 1개(20MB·5쪽)</p>
        </div>
        <div className="rd-pr-checks">
          <label className="rd-pr-check">
            <input type="checkbox" checked={agreeOcr} disabled={uploading} onChange={(e) => setAgreeOcr(e.target.checked)} />
            <span className="rd-pr-check__txt">
              <span><RdRequired /> 사진이 네이버 클라우드 CLOVA OCR로 전송되어 글자를 인식합니다.</span>
            </span>
          </label>
          <label className="rd-pr-check">
            <input type="checkbox" checked={agreeKeep} disabled={uploading} onChange={(e) => setAgreeKeep(e.target.checked)} />
            <span className="rd-pr-check__txt">
              <b>사진도 보관하기</b>
              <small>사진을 암호화하여 보관합니다. 본인만 볼 수 있고, 삭제하면 30일 뒤 완전히 삭제됩니다.</small>
              <small>사진은 사본이며 효력은 손으로 쓴 원본에만 있습니다.</small>
            </span>
          </label>
        </div>
        {error && (
          <p className="rd-pr-err" role="alert">
            <IconErrorCircle />
            <span>{error}</span>
          </p>
        )}
        <div className="rd-pr-actions">
          <RdButton kind="secondary" place="dialog" disabled={uploading} onClick={() => fileRef.current?.click()}>파일 선택</RdButton>
          <RdButton place="dialog" disabled={!canUpload && !uploading} busy={uploading} busyText="올리는 중…" onClick={run}>올리기</RdButton>
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.heic,.pdf,image/*,application/pdf" multiple hidden onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} />
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
        <RdState kind="working" title="처리하고 있습니다." desc="최대 1분까지 걸릴 수 있습니다." />
        <p>이 화면을 닫으면 처음부터 다시 해야 합니다.</p>
      </div>
    );
  } else if (screen === 'result') {
    width = 960;
    const reqPane = (
      <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ReqList selected={selReq} onSelect={onSelectReq} />
        {!phone && <p className="rd-pr-small">항목을 누르면 사진에서 찾은 위치가 표시됩니다.</p>}
        <p className="rd-pr-small">자동 확인은 참고용입니다. 직접 확인해 주세요.</p>
      </div>
    );
    const textPane = (
      <div className="rd-pr-ocr">
        <h4>{page}쪽</h4>
        <RdTextarea
          aria-label={`인식된 글 ${page}쪽`}
          rows={phone ? 8 : 10}
          maxLength={2000}
          value={ocrText[page - 1] ?? ''}
          onChange={(e) => setOcrText(ocrText.map((t, i) => (i === page - 1 ? e.target.value : t)))}
        />
        {phone && !pdfResult && (
          <div className="rd-pr-photo__nav">
            <RdIconButton label="이전 쪽" disabled={page <= 1} onClick={() => setPage(page - 1)}><IconChevronLeft /></RdIconButton>
            <span aria-live="polite">{page} / {total}</span>
            <RdIconButton label="다음 쪽" disabled={page >= total} onClick={() => setPage(page + 1)}><IconChevronRight /></RdIconButton>
          </div>
        )}
        <p className="rd-pr-small">{phone ? '틀릴 수 있습니다. 사진과 대조해 주세요.' : '인식된 글은 틀릴 수 있습니다. 사진과 대조해 주세요.'}</p>
      </div>
    );
    const photoPane = pdfResult ? (
      <p className="rd-pr-photo__pdf">PDF는 사진 표시 없이 결과만 보여 줍니다.</p>
    ) : (
      <PhotoView page={page} total={total} setPage={setPage} hit={selected?.hit} noLocation={!!selected && !selected.hit} />
    );
    if (phone) {
      body = (
        <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RdTabs label="결과" tabs={[{ value: 'photo', label: '사진' }, { value: 'req', label: '요건' }, { value: 'text', label: '인식된 글' }]} value={tab} onChange={setTab} />
          {tab === 'photo' && (
            <>
              {photoPane}
              {selected && selected.hit && (
                <p className="rd-pr-small"><b>{selected.name}</b>{foundOthers.length ? ` · ${foundOthers.join(' · ')}` : ''} 찾음</p>
              )}
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
            <RdTabs label="결과" tabs={[{ value: 'req', label: '자필증서 요건' }, { value: 'text', label: '인식된 글' }]} value={tab === 'photo' ? 'req' : tab} onChange={setTab} />
            {tab === 'text' ? textPane : reqPane}
          </div>
        </div>
      );
    }
    const joined = ocrText.join('\n\n');
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
        {vault === 'loading' && <p className="rd-pr-small" role="status">불러오는 중…</p>}
        {vault === 'empty' && <RdState kind="empty" title="보관한 사진이 없습니다." />}
        {vault === 'error' && <RdState kind="error" title="보관한 사진을 불러오지 못했습니다." />}
        {vault === 'ready' && (
          <>
            <p className="rd-pr-small">암호화하여 보관하며 본인만 볼 수 있습니다.</p>
            <ul className="rd-pr-vault">
              {bundles.map((b) => (
                <li className="rd-pr-vault__li" key={b.id}>
                  <span>{b.label}</span>
                  <RdButton kind="secondary" place="row" onClick={() => openBundle(b)}>열기</RdButton>
                  <RdButton kind="secondary" place="row" onClick={() => { setBundle(b); setDelAsk(true); }}>삭제</RdButton>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  } else if (screen === 'bundle' && bundle) {
    title = bundle.label;
    body = (
      <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bundleState === 'loading' && <p className="rd-pr-small" role="status">사진을 불러오는 중…</p>}
        {bundleState === 'openfail' && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>사진을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</span></p>}
        {bundleState === 'delfail' && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.</span></p>}
        {(bundleState === 'ready' || bundleState === 'delfail') &&
          (bundle.pages === 'pdf' ? (
            <p className="rd-pr-photo__pdf">PDF는 사진 표시 없이 결과만 보여 줍니다.</p>
          ) : (
            <div className="rd-pr-photos3">
              {[1, 2, 3].map((n) => (
                <PhotoPage key={n} n={n} small />
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
          <RdButton kind="secondary" place="dialog" onClick={() => setDelAsk(true)}>삭제</RdButton>
          <RdButton kind="secondary" place="dialog" onClick={() => setScreen('vault')}>목록으로</RdButton>
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
      {alert && <RdAlertDialog title={alert.title} desc={alert.desc} onOk={() => setAlert(null)} />}
      {confirm && (
        <RdConfirmDialog
          title={confirm === 'append' ? '인식된 글을 지금 초안 뒤에 붙입니다.' : '지금 초안이 인식된 글로 바뀝니다.'}
          desc="적용하면 이 화면이 닫힙니다."
          keepLabel="취소"
          doLabel="적용"
          onKeep={() => setConfirm(null)}
          onDo={() => { const how = confirm; setConfirm(null); onApply(ocrText.join('\n\n'), how); }}
        />
      )}
      {delAsk && (
        <RdDangerDialog
          title="이 사진 묶음을 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          doLabel="삭제"
          onCancel={() => setDelAsk(false)}
          onDo={() => {
            setDelAsk(false);
            if (demo === 'bundle-delfail' && bundle) {
              setScreen('bundle');
              setBundleState('delfail');
              return;
            }
            const rest = bundles.filter((b) => b.id !== bundle?.id);
            setBundles(rest);
            setVault(rest.length ? 'ready' : 'empty');
            setScreen('vault');
          }}
        />
      )}
    </>
  );
}
