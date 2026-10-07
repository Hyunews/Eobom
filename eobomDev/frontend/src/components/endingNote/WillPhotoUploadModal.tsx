import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Check, ChevronUp, ChevronDown, X } from 'lucide-react';
import { apiUploadForm, ApiError } from '../../lib/api';
import { HEAVY_CLIENT_LIMITS, HEAVY_TIMEOUT_MESSAGE, HEAVY_NETWORK_MESSAGE } from '../../lib/heavyLimits';
import { WorkingView, HeavyNoticeDialog } from '../common/HeavyWork';
import { backdropCloseProps } from '../../utils/backdropClose';
import { WillPhotoResult } from './WillPhotoResult';
import type { WillOcrResponse } from './WillPhotoResult';

// docs 06-06 §6 — ⑨ 유언장 초안 카드의 "사진으로 불러오기" 입구(P1, F1). VoiceToTextInput.tsx의
// Ⓐ 파일 업로드(동의 체크→선택→업로드/인식 중→결과)와 같은 결로 만들되, 사진은 여러 장을
// 받고(§4.1) 결과를 바로 저장하지 않고 부모가 초안 편집 영역에 합류시킨다(§6 4번, 바꾸기/
// 뒤에 붙이기는 기존 글 유무에 따라 갈린다).

type Stage = 'idle' | 'uploading' | 'processing' | 'done';

const MAX_FILES = 5;
// §4.1 용량(10-06 3차 결정) — 사진 1장 5MB · PDF 1개 20MB. 사진은 줄이기 "뒤" 크기로 잰다.
const MAX_PHOTO_SIZE_MB = 5;
const MAX_PDF_SIZE_MB = 20;
const MB = 1024 * 1024;
// §4.1 형식 — jpg·png·pdf에 더해 10-07 heic·heif도 파일 선택 창에 보인다(폰 사진 그대로 올리도록).
// 브라우저는 heic를 못 줄이므로 원본이 서버로 가고, 서버 heic-convert(2차 방어)가 jpg로 바꾼다.
// tiff는 10-06 3차 결정으로 받지 않는다.
const ACCEPT = '.jpg,.jpeg,.png,.heic,.heif,.pdf,image/jpeg,image/png,image/heic,image/heif,application/pdf';
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif'];
const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
// §4.1 "크기 줄이기" — 브라우저 우선 축소 기준.
const MAX_LONG_EDGE = 1960;

// 🔄 09-28 Opus 편차 보정 [E] — jpg·png만 캔버스로 긴 변 1,960px까지 축소한다(이미 기준 이하면
// 그대로 반환). pdf·tiff나 브라우저가 못 읽는 파일은 원본 그대로 서버로 보낸다(서버 §4.1
// "서버 재확인"이 한 번 더 줄인다). 무엇이 실패하든 원본을 그대로 반환한다 — 사용자에게
// 오류를 띄우지 않는다(요청 그대로).
const resizeImageIfNeeded = async (file: File): Promise<File> => {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (Math.max(width, height) <= MAX_LONG_EDGE) {
      bitmap.close();
      return file;
    }
    const scale = MAX_LONG_EDGE / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.92));
    if (!blob) return file;
    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
};

// §6 단계 5-1 — 부모(EndingNotePage)가 메모리에만 들고 있는 마지막 인식 결과. 있으면 올리기 단계를 건너뛰고
// 같은 결과 화면을 다시 연다(CLOVA 재호출 없음).
export interface RecentOcr {
  files: File[];
  result: WillOcrResponse;
  pageTexts?: string[]; // 10-07 — "인식된 글" 탭에서 고친 쪽별 글. 없으면 서버가 준 글 그대로.
}

interface WillPhotoUploadModalProps {
  hasExistingDraft: boolean;
  // 06-06 §5-2-1 — 서버 스위치(GET /api/ocr/status의 photoStorageEnabled). 꺼짐이면 "보관하지 않습니다" 문구·체크 없음 그대로.
  photoStorageEnabled?: boolean;
  recent?: RecentOcr | null;
  onRecognized: (recent: RecentOcr) => void;
  onClose: () => void;
  onMerge: (text: string, mode: 'replace' | 'append') => void;
}

export const WillPhotoUploadModal: React.FC<WillPhotoUploadModalProps> = ({ hasExistingDraft, photoStorageEnabled = false, recent, onRecognized, onClose, onMerge }) => {
  const [consent, setConsent] = useState(false);
  const [keepPhoto, setKeepPhoto] = useState(true); // §5-2-4 `사진도 보관하기` — 기본 켬
  const [files, setFiles] = useState<File[]>(recent?.files ?? []);
  const [stage, setStage] = useState<Stage>(recent ? 'done' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WillOcrResponse | null>(recent?.result ?? null);
  const [notice, setNotice] = useState<string | null>(null); // 대기·처리·연결 알림 창
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;
    setError(null);

    // 10-07 — 이미 고른 파일은 그대로 두고 새로 고른 것을 뒤에 더한다(같은 파일을 다시 고르면 건너뜀).
    const same = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    const added = picked.filter((p) => !files.some((f) => same(f, p)));
    if (added.length === 0) return;
    const selected = [...files, ...added];

    if (selected.length > MAX_FILES) {
      setError(`사진은 최대 ${MAX_FILES}장까지 올릴 수 있습니다.`);
      return;
    }
    if (selected.some((f) => !ALLOWED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext)))) {
      setError('jpg·png·pdf 파일만 올릴 수 있습니다.');
      return;
    }
    // §4.1 PDF 1개 — 2개 이상이거나 사진과 섞이면 서버로 보내기 전에 막는다.
    const pdfCount = selected.filter(isPdf).length;
    if (pdfCount > 1 || (pdfCount === 1 && selected.length > 1)) {
      setError('PDF는 1개만 올릴 수 있고, 사진과 함께 올릴 수 없습니다.');
      return;
    }
    // PDF는 원본 크기, 사진은 줄인 뒤 크기(고화소 폰 사진이 줄이기 전 크기로 막히지 않게).
    const resized = [...files, ...(await Promise.all(added.map(resizeImageIfNeeded)))]; // 이미 담긴 파일은 줄여 둔 것
    if (resized.some((f) => isPdf(f) && f.size > MAX_PDF_SIZE_MB * MB)) {
      setError(`PDF 파일은 ${MAX_PDF_SIZE_MB}MB까지 올릴 수 있습니다.`);
      return;
    }
    if (resized.some((f) => !isPdf(f) && f.size > MAX_PHOTO_SIZE_MB * MB)) {
      setError(`사진 1장은 ${MAX_PHOTO_SIZE_MB}MB까지 올릴 수 있습니다.`);
      return;
    }
    setFiles(resized);
  };

  const removeFile = (index: number) => {
    setError(null);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔄 09-28 Opus 편차 보정 [H] — §4.1 "여러 장" 올린 순서 = 쪽 순서. 목록에서 위/아래로
  // 옮겨 순서를 바꿀 수 있게 한다.
  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // §6 단계 2 — 올리는 중 / 인식 중 / 완료. apiFetch(fetch 기반)라 업로드 진행률은 못 재지만,
  // 요청을 보내는 즉시 '인식 중'으로 넘겨 두 단계는 구분해 보여준다(VoiceToTextInput.tsx와
  // 같은 근사 — 서버가 사실상 업로드 수신과 동시에 인식을 시작한다).
  // 🔄 10-06 (06-04 §6.4-11-10) — 업로드가 끝나면 올리기 모달 안에서 "작업 중" 화면으로 바뀐다. 화면 마감은
  // 업로드가 끝난 뒤 65초(서버 55초 + 여유 10). 창을 닫으면 요청을 끊는다("처음부터 다시").
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleUpload = async () => {
    if (files.length === 0 || !consent) return;
    setError(null);
    setNotice(null);
    setStage('uploading');

    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    if (photoStorageEnabled && keepPhoto) formData.append('keepPhoto', 'true');

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const data = await apiUploadForm<WillOcrResponse>('/api/ocr/recognize', 'USER', formData, {
        deadlineMs: HEAVY_CLIENT_LIMITS.photo.deadlineMs,
        timeoutMessage: HEAVY_TIMEOUT_MESSAGE.photo,
        networkMessage: HEAVY_NETWORK_MESSAGE.photo,
        onUploaded: () => setStage('processing'),
        signal: ac.signal,
      });
      setResult(data);
      onRecognized({ files, result: data });
      setStage('done');
      // §5-2-2 — 인식은 됐지만 보관은 못 한 경우(10묶음 초과·저장 실패) 결과 화면 위에 이유를 알린다.
      if (data.photo && !data.photo.stored && data.photo.message) setNotice(data.photo.message);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ABORTED') return; // 닫아서 끊음 — 화면이 이미 없다
      // 서버가 이유별로 보낸 문구(대기·처리·연결)는 알림 창으로, 그 밖의 오류(형식·용량 등)는 기존 줄로.
      // 502(인식 실패·연결 오류)는 코드가 없어도 알림 창으로 — 줄 문구만으로는 진행창이 사라진 이유가 안 보인다.
      const known =
        e instanceof ApiError &&
        (e.code === 'BUSY' || e.code === 'SLOW' || e.code === 'UPSTREAM' || e.code === 'NO_TEXT' || e.status === 502);
      const message = e instanceof ApiError ? e.baseMessage : '사진 인식에 실패했습니다. 아래 입력창에 직접 입력해 주세요.';
      if (known) setNotice(message);
      else setError(message);
      setStage('idle');
    }
  };

  // §6-1 단계 3 — 결과 단계는 모달이 1048px로 넓어지고(웹) 전체 화면이 된다(모바일). 결과 화면 전체를
  // WillPhotoResult가 맡고, 이 파일은 올리기 단계(1·2)만 그린다.
  if (stage === 'done' && result) {
    return (
      <>
        {notice && <HeavyNoticeDialog message={notice} onClose={() => setNotice(null)} />}
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-label="사진으로 불러오기" {...backdropCloseProps(onClose)}>
          <div className="v2-modal is-ocr-result" onClick={(e) => e.stopPropagation()}>
            <WillPhotoResult
              files={files}
              result={result}
              hasExistingDraft={hasExistingDraft}
              onClose={onClose}
              onMerge={onMerge}
              initialPageTexts={recent?.pageTexts}
              onPageTextsChange={(pageTexts) => onRecognized({ files, result, pageTexts })}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    {notice && <HeavyNoticeDialog message={notice} onClose={() => setNotice(null)} />}
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-label="사진으로 불러오기" {...backdropCloseProps(onClose)}>
      <div className="v2-modal is-scroll" onClick={(e) => e.stopPropagation()}>
        <h3 className="v2-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={20} color="var(--v2-point)" /> 사진으로 불러오기
        </h3>

        <div className="v2-modal-body">
          {stage === 'processing' && <WorkingView maxMinutes={HEAVY_CLIENT_LIMITS.photo.maxMinutes} />}
          {stage !== 'done' && stage !== 'processing' && (
            <>
              <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginBottom: '4px', lineHeight: 1.5 }}>
                jpg · png 최대 {MAX_FILES}장(1장당 {MAX_PHOTO_SIZE_MB}MB) 또는 PDF 1개({MAX_PDF_SIZE_MB}MB · 5쪽까지). 사진과 PDF는 함께 올릴 수 없습니다.
              </p>
              {/* 06-06 §6 단계1·§9-1 T-2 — 콘솔 도메인 언어가 단일 선택이라 코드로 못 푸는 한계를 미리 알린다 */}
              <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                본인이 쓴 유언장만 올려 주세요. 한글·숫자·기호만 인식하며, 한자나 외국어는 직접 입력해 주세요.
              </p>

              {/* 체크 칸뿐 아니라 문구를 눌러도 토글된다(label이 클릭을 받는다). */}
              <label
                className="v2-check"
                htmlFor="will-photo-upload-consent"
                style={{ alignItems: 'flex-start', cursor: 'pointer', marginBottom: '10px' }}
                onClick={(e) => { e.preventDefault(); setConsent((v) => !v); }}
              >
                <span
                  id="will-photo-upload-consent"
                  role="checkbox"
                  aria-checked={consent}
                  style={{
                    width: '20px', height: '20px', flexShrink: 0, marginTop: '2px', borderRadius: '4px',
                    border: consent ? 'none' : '1.5px solid var(--v2-input-border)',
                    backgroundColor: consent ? 'var(--v2-point)' : '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  {consent && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </span>
                <span>
                  <span className="v2-req">필수</span> 사진이 네이버 클라우드 CLOVA OCR로 전송되어 글자를 인식합니다.
                  {/* §5-2-4 — 스위치 꺼짐이면 옛 문구 그대로 */}
                  {!photoStorageEnabled && ' 이어봄은 사진을 보관하지 않으며, 인식된 텍스트만 암호화되어 저장됩니다.'}
                </span>
              </label>

              {/* §5-2-4 보관 체크(새) — 스위치 켬일 때만. 동의가 아니라 선택이라 "필수" 표시가 없다. */}
              {photoStorageEnabled && (
                <label
                  className="v2-check"
                  htmlFor="will-photo-upload-keep"
                  style={{ alignItems: 'flex-start', cursor: 'pointer', marginBottom: '10px' }}
                  onClick={(e) => { e.preventDefault(); setKeepPhoto((v) => !v); }}
                >
                  <span
                    id="will-photo-upload-keep"
                    role="checkbox"
                    aria-checked={keepPhoto}
                    style={{
                      width: '20px', height: '20px', flexShrink: 0, marginTop: '2px', borderRadius: '4px',
                      border: keepPhoto ? 'none' : '1.5px solid var(--v2-input-border)',
                      backgroundColor: keepPhoto ? 'var(--v2-point)' : '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    {keepPhoto && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                  </span>
                  <span>
                    <strong>사진도 보관하기</strong>{' '}
                    사진을 암호화하여 보관합니다. 본인만 볼 수 있고, 삭제하면 30일 뒤 완전히 삭제됩니다. 사진은 사본이며 효력은 손으로 쓴 원본에만 있습니다.
                  </span>
                </label>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handleFileSelect}
                disabled={!consent || stage !== 'idle'}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!consent || stage !== 'idle'}
                  className="v2-btn-outline"
                >
                  파일 선택
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!consent || files.length === 0 || stage !== 'idle'}
                  className="v2-btn-primary"
                >
                  {stage === 'uploading' ? (
                    <><Loader2 size={16} /> 올리는 중…</>
                  ) : (
                    '올리기'
                  )}
                </button>
              </div>

              {files.length > 0 && (
                <>
                  <p style={{ marginTop: '10px', marginBottom: '4px', fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)' }}>
                    목록 순서대로 인식됩니다. 화살표로 순서를 바꾸고 X로 뺄 수 있으며, 다시 선택한 파일은 뒤에 더해집니다.
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)',
                          }}
                        >
                          {i + 1}. {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveFile(i, -1)}
                          disabled={i === 0 || stage !== 'idle'}
                          aria-label="위로 이동"
                          style={{
                            minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'none', border: '1px solid var(--v2-btn-border)', borderRadius: '4px',
                            opacity: i === 0 || stage !== 'idle' ? 0.4 : 1, cursor: i === 0 || stage !== 'idle' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFile(i, 1)}
                          disabled={i === files.length - 1 || stage !== 'idle'}
                          aria-label="아래로 이동"
                          style={{
                            minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'none', border: '1px solid var(--v2-btn-border)', borderRadius: '4px',
                            opacity: i === files.length - 1 || stage !== 'idle' ? 0.4 : 1, cursor: i === files.length - 1 || stage !== 'idle' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={stage !== 'idle'}
                          aria-label={`${f.name} 빼기`}
                          style={{
                            minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'none', border: '1px solid var(--v2-btn-border)', borderRadius: '4px',
                            opacity: stage !== 'idle' ? 0.4 : 1, cursor: stage !== 'idle' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {error && <p className="v2-notice-warn" style={{ marginTop: '12px' }}>{error}</p>}
            </>
          )}

        </div>

        <button type="button" className="v2-modal-close" onClick={onClose}>닫기</button>
      </div>
    </div>
    </>
  );
};
