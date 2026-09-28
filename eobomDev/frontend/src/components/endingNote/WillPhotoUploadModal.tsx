import React, { useRef, useState } from 'react';
import { Camera, Loader2, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import { backdropCloseProps } from '../../utils/backdropClose';

// docs 06-06 §6 — ⑨ 유언장 초안 카드의 "사진으로 불러오기" 입구(P1, F1). VoiceToTextInput.tsx의
// Ⓐ 파일 업로드(동의 체크→선택→업로드/인식 중→결과)와 같은 결로 만들되, 사진은 여러 장을
// 받고(§4.1) 결과를 바로 저장하지 않고 부모가 초안 편집 영역에 합류시킨다(§6 4번, 바꾸기/
// 뒤에 붙이기는 기존 글 유무에 따라 갈린다).

type Stage = 'idle' | 'uploading' | 'processing' | 'done';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 50;
// 🔄 09-28 Opus 편차 보정 [F] — §4.1 "HEIC — 1차 방어"는 accept로 CLOVA가 받는 4개만 보여주는
// 것까지다. heic/heif는 accept에서 뺀다 — 그래도 오면 서버 heic-convert(2차 방어)가 처리한다.
const ACCEPT = '.jpg,.jpeg,.png,.tif,.tiff,.pdf,image/jpeg,image/png,image/tiff,application/pdf';
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

interface WillPhotoUploadModalProps {
  hasExistingDraft: boolean;
  onClose: () => void;
  onMerge: (text: string, mode: 'replace' | 'append') => void;
}

export const WillPhotoUploadModal: React.FC<WillPhotoUploadModalProps> = ({ hasExistingDraft, onClose, onMerge }) => {
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (selected.length === 0) return;
    setError(null);

    if (selected.length > MAX_FILES) {
      setError(`사진은 최대 ${MAX_FILES}장까지 올릴 수 있습니다.`);
      return;
    }
    const tooLarge = selected.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setError(`파일이 너무 큽니다. 장당 최대 ${MAX_FILE_SIZE_MB}MB까지 올릴 수 있습니다.`);
      return;
    }
    const resized = await Promise.all(selected.map(resizeImageIfNeeded));
    setFiles(resized);
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
  const handleUpload = async () => {
    if (files.length === 0 || !consent) return;
    setError(null);
    setStage('uploading');

    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));

    try {
      setStage('processing');
      const data = await apiFetch<{ text: string }>('/api/ocr/recognize', 'USER', { method: 'POST', body: formData });
      setResultText(data.text);
      setStage('done');
    } catch (e) {
      const message = e instanceof ApiError ? e.message : '사진 인식에 실패했습니다. 아래 입력창에 직접 입력해 주세요.';
      setError(message);
      setStage('idle');
    }
  };

  return (
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-label="사진으로 불러오기" {...backdropCloseProps(onClose)}>
      <div className="v2-modal is-scroll" onClick={(e) => e.stopPropagation()}>
        <h3 className="v2-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={20} color="var(--v2-point)" /> 사진으로 불러오기
        </h3>

        <div className="v2-modal-body">
          {stage !== 'done' && (
            <>
              <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginBottom: '4px' }}>
                jpg · png · pdf · tiff 사진을 올릴 수 있습니다(최대 {MAX_FILES}장, 장당 {MAX_FILE_SIZE_MB}MB, PDF는 5쪽까지).
              </p>
              <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginBottom: '14px' }}>
                본인이 쓴 유언장만 올려주세요.
              </p>

              <label className="v2-check" htmlFor="will-photo-upload-consent" style={{ alignItems: 'flex-start' }}>
                <span
                  id="will-photo-upload-consent"
                  onClick={(e) => { e.preventDefault(); setConsent((v) => !v); }}
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
                  이어봄은 사진을 보관하지 않으며, 인식된 텍스트만 암호화되어 저장됩니다.
                </span>
              </label>
              <p className="v2-check-sub" style={{ marginBottom: '14px', paddingLeft: '32px' }}>
                동의하지 않으셔도 직접 입력으로 초안을 남기실 수 있습니다.
              </p>

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
                  ) : stage === 'processing' ? (
                    <><Loader2 size={16} /> 인식 중…</>
                  ) : (
                    '올리기'
                  )}
                </button>
              </div>

              {files.length > 0 && (
                <>
                  <p style={{ marginTop: '10px', marginBottom: '4px', fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)' }}>
                    올린 순서대로 인식됩니다. 순서를 바꾸려면 화살표를 눌러주세요.
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
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {error && <p className="v2-notice-warn" style={{ marginTop: '12px' }}>{error}</p>}
            </>
          )}

          {stage === 'done' && resultText && (
            <>
              <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginBottom: '8px' }}>
                인식된 내용입니다. 사진과 대조해 확인해 주세요.
              </p>
              <div
                style={{
                  whiteSpace: 'pre-wrap', maxHeight: '260px', overflowY: 'auto',
                  border: '1px solid var(--v2-divider-strong)', borderRadius: '4px', padding: '12px',
                  fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-main)', backgroundColor: 'var(--v2-bg)',
                }}
              >
                {resultText}
              </div>
            </>
          )}
        </div>

        {stage === 'done' && resultText ? (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="v2-btn-outline" onClick={onClose}>취소</button>
            {hasExistingDraft ? (
              <>
                <button type="button" className="v2-btn-outline" onClick={() => onMerge(resultText, 'append')}>뒤에 붙이기</button>
                <button type="button" className="v2-btn-primary" onClick={() => onMerge(resultText, 'replace')}>바꾸기</button>
              </>
            ) : (
              <button type="button" className="v2-btn-primary" onClick={() => onMerge(resultText, 'replace')}>초안에 넣기</button>
            )}
          </div>
        ) : (
          <button type="button" className="v2-modal-close" onClick={onClose}>닫기</button>
        )}
      </div>
    </div>
  );
};
