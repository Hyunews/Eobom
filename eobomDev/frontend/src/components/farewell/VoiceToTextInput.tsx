import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Upload, Loader2, Check, Play } from 'lucide-react';
import { apiUploadForm, ApiError } from '../../lib/api';
import {
  HEAVY_CLIENT_LIMITS, HEAVY_TIMEOUT_MESSAGE, HEAVY_NETWORK_MESSAGE, AUDIO_TOO_LONG_MESSAGE, readAudioDurationSec,
} from '../../lib/heavyLimits';
import { WorkingView, HeavyNoticeDialog } from '../common/HeavyWork';

// 06-05 §4.2 정정(08-26) — 말로 남기기(음성 입력 전체)가 엔딩노트 ⑨에서 유족 메시지 보관함으로
// 이관됐다. Ⓐ(파일 업로드)·Ⓑ(직접 녹음) UI를 독립 컴포넌트로 둔 것.
// 🔄 06-05 §5.6-9 D-12(2026-10-07) — 변환과 저장을 나눴다. 이 컴포넌트는 **글 변환까지만** 한다.
//   - 변환 요청은 항상 saveAudio=false — R2·DB에는 아무것도 쓰지 않는다(변환 중 창을 닫아도 남는 것이 없다).
//   - 변환이 끝나면 글과 원본 음성(메모리 blob)을 부모(onConverted)에 넘긴다. R2 업로드(store-audio)와
//     편지 저장은 부모의 `저장` 버튼에서만 일어난다.
//   - Web Speech는 폐기했다 — 녹음 글 변환은 항상 CLOVA이고, 녹음 중에는 경과 시간만 보여준다.
//   - 동의 체크·"목소리도 함께 남기기"는 부모가 소유한다(변환이 끝나도 풀지 않고, 편집기를 닫을 때 부모가 초기화).

export interface SavedMedia {
  mediaKey: string;
  mediaMime: string;
  mediaDurationSec?: number;
}

// 변환은 끝났지만 아직 저장 전인 원본 음성 — 부모가 브라우저 메모리에만 들고 있는다.
export interface PendingVoice {
  blob: Blob;
  mime: string;
  durationSec: number | null;
}

interface VoiceToTextInputProps {
  token: string | null; // /api/stt/transcribe 인증용
  onConverted: (text: string, voice: PendingVoice) => void;
  disabled?: boolean;
  // 🆕 07-04 §8-9 후속(2026-09-08) — Ⓐ(업로드)·Ⓑ(녹음) 둘 중 하나만 그린다.
  mode: 'upload' | 'record';
  // §5.6-9-3 — 저장된 음성 또는 저장 전 음성이 이미 있으면 업로드·녹음을 막고 안내한다.
  blocked: boolean;
  hasPendingVoice: boolean; // 막힌 이유가 "저장 전 음성"이면 안내 문구가 다르다(저장 전 음성 → 저장하면 됨)
  sttUploadEnabled: boolean;
  voiceStorageEnabled: boolean; // R2_ENABLED
  uploadConsent: boolean;
  onUploadConsentChange: (v: boolean) => void;
  recordConsent: boolean;
  onRecordConsentChange: (v: boolean) => void;
}

const ALLOWED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm'];
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
const FALLBACK_MSG = '직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요.';
const BLOCKED_MSG = '이미 저장된 음성이 있습니다. 위의 \'음성 삭제\'를 누르면 다시 올리거나 녹음할 수 있습니다.'; // 저장된 음성이 붙어 있을 때(§5.6-9-3)
// 🔄 10-07 개발자 지시 — 변환이 끝나 저장만 하면 되는 때에 "다시 녹음"이 나오면 오류처럼 읽혀 문구를 나눈다.
const BLOCKED_PENDING_MSG = '변환이 끝났습니다. 다른 음성으로 바꾸려면 위의 \'삭제\'를 누르세요.'; // 저장 안내는 위 "저장 전 음성" 박스에 있다
const MAX_RECORD_MINUTES = Math.round(HEAVY_CLIENT_LIMITS.audioMaxSeconds / 60);
const RECORD_NOTICE_SEEN_KEY = 'eobom_voice_record_notice_seen'; // §5.5-3 — "1회" 안내를 다시 보여주지 않기 위한 로컬 기록
const RECORDER_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

const pickRecorderMimeType = (): string | undefined => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return RECORDER_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
};

const extensionForMime = (mime: string): string => {
  const lower = mime.toLowerCase();
  if (lower.includes('webm')) return 'webm';
  if (lower.includes('mp4') || lower.includes('m4a') || lower.includes('aac')) return 'm4a';
  if (lower.includes('wav')) return 'wav';
  return 'webm';
};

const formatElapsed = (sec: number): string =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

interface TranscribeResult {
  text?: string;
}

export const VoiceToTextInput: React.FC<VoiceToTextInputProps> = ({
  token, onConverted, disabled, mode, blocked, hasPendingVoice, sttUploadEnabled, voiceStorageEnabled,
  uploadConsent, onUploadConsentChange, recordConsent, onRecordConsentChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [recordNotice, setRecordNotice] = useState<string | null>(null); // 10분 자동 중지 안내
  const [showFirstTimeNotice, setShowFirstTimeNotice] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [workNotice, setWorkNotice] = useState<string | null>(null); // 대기·처리·연결 알림 창
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedDurationRef = useRef<number | null>(null);

  // Ⓑ 녹음 중지 후 확인 창(§5.6-9-2) — 먼저 들어보기 · 취소 · 글로 바꾸기.
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // "먼저 들어보기" — 로컬 blob, 서버 안 탐

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const discardOnStopRef = useRef(false); // 언마운트 등으로 끊긴 녹음은 확인 창 없이 버린다
  const pendingBlobRef = useRef<Blob | null>(null); // 변환 전 녹음 — 브라우저 메모리에만
  const pendingMimeRef = useRef<string>('audio/webm');
  const pendingDurationRef = useRef<number>(0);

  const recordingSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const stopMediaStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const revokePreview = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  useEffect(() => {
    return () => {
      discardOnStopRef.current = true;
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream();
      revokePreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [녹음 종료] — 🔴 여기서는 아무것도 서버로 보내지 않는다. blob을 메모리(ref)에만 두고 확인 창을 띄운다.
  const handleRecordingStopped = () => {
    if (discardOnStopRef.current) {
      recordedChunksRef.current = [];
      return;
    }
    stopTimer();
    setIsRecording(false);
    stopMediaStream();

    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];
    if (chunks.length === 0) return;

    const mimeType = mediaRecorderRef.current?.mimeType || chunks[0].type || 'audio/webm';
    pendingBlobRef.current = new Blob(chunks, { type: mimeType });
    pendingMimeRef.current = mimeType;
    pendingDurationRef.current = Math.max(0, Math.round((Date.now() - recordStartRef.current) / 1000));

    setUploadError(null);
    setShowConfirm(true);
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // onstop → handleRecordingStopped
    } else {
      setIsRecording(false);
    }
  };

  // 경과 시간 표시 + 10분(§6.4-11-10 음성 길이 상한, 잠정)에 이르면 자동 중지 + 안내.
  const startTimer = () => {
    stopTimer();
    setElapsedSec(0);
    timerRef.current = window.setInterval(() => {
      const sec = Math.floor((Date.now() - recordStartRef.current) / 1000);
      setElapsedSec(sec);
      if (sec >= HEAVY_CLIENT_LIMITS.audioMaxSeconds) {
        setRecordNotice(`최대 ${MAX_RECORD_MINUTES}분까지 녹음할 수 있습니다.`);
        stopRecording();
      }
    }, 500);
  };

  const openPreview = () => {
    if (previewUrl || !pendingBlobRef.current) return;
    setPreviewUrl(URL.createObjectURL(pendingBlobRef.current));
  };

  // 취소 = blob 폐기 + revokeObjectURL. 🔴 어떤 네트워크 요청도 보내지 않는다.
  const discardPending = () => {
    pendingBlobRef.current = null;
    revokePreview();
    setShowConfirm(false);
    setUploadError(null);
    setRecordNotice(null);
  };

  const beginRecording = async () => {
    setMicError(null);
    setRecordNotice(null);
    recordedChunksRef.current = [];
    discardOnStopRef.current = false;

    if (!recordingSupported) {
      setMicError('이 브라우저에서는 녹음을 지원하지 않습니다. 아래 입력창에 직접 입력해 주세요.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStopped;
      recorder.start();
      recordStartRef.current = Date.now();
      setIsRecording(true);
      startTimer();
    } catch {
      stopMediaStream();
      setMicError('마이크를 사용할 수 없습니다. 권한을 확인하거나 아래 입력창에 직접 입력해 주세요.');
      setIsRecording(false);
    }
  };

  const startRecording = () => {
    if (!recordConsent || blocked) return;
    if (typeof window !== 'undefined' && !window.localStorage.getItem(RECORD_NOTICE_SEEN_KEY)) {
      setShowFirstTimeNotice(true);
      return;
    }
    void beginRecording();
  };

  const acknowledgeFirstTimeNotice = () => {
    window.localStorage.setItem(RECORD_NOTICE_SEEN_KEY, '1');
    setShowFirstTimeNotice(false);
    void beginRecording();
  };

  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);

    const dot = file.name.lastIndexOf('.');
    const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      setUploadError('m4a · mp3 · wav · webm 파일만 올릴 수 있습니다.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setUploadError(`파일이 너무 큽니다. 최대 ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB까지 올릴 수 있습니다.`);
      setSelectedFile(null);
      return;
    }
    // 06-04 §6.4-11-10 음성 길이 상한(잠정 10분) — 2분 안에 끝나지 않을 녹음은 고를 때 막는다.
    // 브라우저가 <audio> 메타데이터로 재생 길이만 읽는다(파일을 풀지 않음). 못 읽으면 그대로 통과 —
    // 서버가 한 번 더 확인하고, 그래도 못 읽으면 서버 시간 제한이 막는다.
    const duration = await readAudioDurationSec(file);
    if (duration !== null && duration > HEAVY_CLIENT_LIMITS.audioMaxSeconds) {
      setUploadError(AUDIO_TOO_LONG_MESSAGE);
      setSelectedFile(null);
      return;
    }
    selectedDurationRef.current = duration === null ? null : Math.round(duration);
    setSelectedFile(file);
  };

  // 글 변환(Ⓐ 업로드 · Ⓑ 글로 바꾸기 공통) — 🔴 saveAudio=false 고정: 서버는 R2에 아무것도 올리지 않는다.
  // 06-04 §6.4-11-10 — 업로드가 끝나면 "작업 중" 모달. 화면 마감은 업로드가 끝난 뒤 125초(서버 115초 + 여유 10).
  // 모달을 닫으면 요청을 끊는다("처음부터 다시"). 닫아도 서버에 남는 것이 없다.
  const uploadAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => uploadAbortRef.current?.abort(), []);

  const closeWorking = () => {
    uploadAbortRef.current?.abort(); // 'ABORTED'로 끝나 아래 catch가 조용히 넘긴다
    setUploadStage('idle');
  };

  const convertToText = async (blob: Blob, fileName: string, mime: string, durationSec: number | null, onDone: () => void) => {
    if (!token) return;
    setUploadError(null);
    setUploadStage('uploading');

    const formData = new FormData();
    formData.append('audio', blob, fileName);
    formData.append('saveAudio', 'false');

    const ac = new AbortController();
    uploadAbortRef.current = ac;
    try {
      const data = await apiUploadForm<TranscribeResult>('/api/stt/transcribe', 'USER', formData, {
        deadlineMs: HEAVY_CLIENT_LIMITS.audio.deadlineMs,
        timeoutMessage: HEAVY_TIMEOUT_MESSAGE.audio,
        networkMessage: HEAVY_NETWORK_MESSAGE.audio,
        onUploaded: () => setUploadStage('processing'),
        signal: ac.signal,
      });
      if (typeof data?.text !== 'string') throw new ApiError(`음성 변환에 실패했습니다. ${FALLBACK_MSG}`);
      setUploadStage('idle');
      onDone();
      onConverted(data.text.trim(), { blob, mime, durationSec });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ABORTED') return; // 창을 닫아 끊음 — 저장 전 음성은 그대로
      setUploadStage('idle');
      const message = e instanceof ApiError ? e.baseMessage : `음성 변환에 실패했습니다. ${FALLBACK_MSG}`;
      // 대기·처리·연결 이유는 알림 창, 그 밖(형식·용량·길이·무음 등)은 기존 줄.
      if (e instanceof ApiError && (e.code === 'BUSY' || e.code === 'SLOW' || e.code === 'UPSTREAM' || e.code === 'QUOTA')) setWorkNotice(message);
      else setUploadError(message);
    }
  };

  // Ⓐ — "업로드" 버튼 자체가 확인이다. 글 변환까지만 하고 편지는 저장하지 않는다.
  const handleAudioUpload = () => {
    if (!selectedFile || !uploadConsent || blocked) return;
    const file = selectedFile;
    void convertToText(file, file.name, file.type, selectedDurationRef.current, () => {
      setSelectedFile(null);
    });
  };

  // Ⓑ [글로 바꾸기] — 확인 창에서만 CLOVA로 전송된다. 실패하면 확인 창이 남아 다시 누를 수 있다.
  const handleConvertRecording = () => {
    const blob = pendingBlobRef.current;
    if (!blob || !recordConsent) return;
    const mime = pendingMimeRef.current;
    void convertToText(blob, `recording.${extensionForMime(mime)}`, mime, pendingDurationRef.current, () => {
      // 소유권은 부모로 넘어갔다 — 미리듣기 URL만 정리한다.
      pendingBlobRef.current = null;
      revokePreview();
      setShowConfirm(false);
      setRecordNotice(null);
    });
  };

  const busy = uploadStage !== 'idle';

  // 🆕 09-04 — 파일선택/업로드/듣기/삭제 4개 버튼을 한 줄에서 같은 크기로 보여달라는 요청.
  // height를 고정값(40px)으로 줘야 'auto'였던 기존 듣기/삭제 버튼과도 픽셀 단위로 맞는다.
  // 🆕 09-04 — minWidth 없이는 "파일 선택"/"듣기"처럼 글자 수가 적은 버튼이 좁아져 한 줄에서
  // 들쭉날쭉해 보였다. 가장 긴 기본 라벨(음성 삭제·음성 녹음)에 맞춰 바닥값을 주고, 로딩 중
  // 텍스트(예: "글로 바꾸는 중…")처럼 그보다 긴 경우만 예외적으로 더 늘어나게 둔다.
  const actionBtnStyle = (bg: string, color: string, isDisabled: boolean, bordered?: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    height: '42px', minWidth: '112px', padding: '0 16px', fontSize: 'var(--v2-fs-support)', fontWeight: 600,
    borderRadius: '4px', border: bordered ? '1px solid var(--v2-btn-border)' : 'none', whiteSpace: 'nowrap',
    backgroundColor: bg, color, opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer',
  });

  // 막힌 때는 폼 전체를 접고 한 줄만 보여준다(스크롤 줄이기) — 변환이 끝났으면 저장 안내는 위 "저장 전 음성" 박스가 맡는다.
  const blockedNote = <p className="v2-notice" style={{ margin: 0 }}>{hasPendingVoice ? BLOCKED_PENDING_MSG : BLOCKED_MSG}</p>;

  return (
    <div style={{ position: 'relative' }}>
      {mode === 'record' && showFirstTimeNotice && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.98)',
            border: '1px solid var(--v2-btn-border)', borderRadius: '4px', padding: '18px',
            display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--v2-modal-shadow)',
          }}
        >
          <p style={{ fontSize: 'var(--v2-fs-item-title)', color: 'var(--v2-text-main)', fontWeight: 700, margin: 0 }}>
            🎙️ 목소리를 녹음합니다
          </p>
          <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', lineHeight: 1.6, margin: 0 }}>
            녹음을 마친 뒤 &apos;글로 바꾸기&apos;를 누르면 음성이 네이버 클라우드 CLOVA Speech로 전송되어 글로 변환되고,
            그 글이 편지 내용으로 들어갑니다.
            {voiceStorageEnabled && ' "목소리도 함께 남기기"가 켜져 있으면 편지를 저장할 때 목소리 원본도 암호화되어 함께 보관되며, 유족이 편지를 열람할 때 함께 들을 수 있습니다.'}
            녹음을 마치면 글로 바꾸기 전에 먼저 들어볼 수 있습니다. 이 안내는 처음 한 번만 표시됩니다.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setShowFirstTimeNotice(false)} className="v2-btn-outline">
              취소
            </button>
            <button type="button" onClick={acknowledgeFirstTimeNotice} className="v2-btn-primary" style={{ flex: 1 }}>
              확인하고 시작하기
            </button>
          </div>
        </div>
      )}

      {/* Ⓑ 녹음 중지 후 확인 창(§5.6-9-2). 글로 바꾸기를 누르기 전에는 CLOVA·R2·DB 어디에도 보내지 않는다. */}
      {mode === 'record' && showConfirm && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.98)',
            border: '1px solid var(--v2-btn-border)', borderRadius: '4px', padding: '18px',
            display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--v2-modal-shadow)',
            overflowY: 'auto',
          }}
        >
          <p style={{ fontSize: 'var(--v2-fs-item-title)', color: 'var(--v2-text-main)', fontWeight: 700, margin: 0 }}>
            녹음을 마쳤습니다.
          </p>

          {recordNotice && <p className="v2-notice-warn">{recordNotice}</p>}

          {!previewUrl ? (
            <button type="button" onClick={openPreview} disabled={busy} className="v2-btn-outline" style={{ alignSelf: 'flex-start' }}>
              <Play size={16} /> 먼저 들어보기
            </button>
          ) : (
            <audio controls src={previewUrl} style={{ width: '100%' }} />
          )}

          {uploadError && <p className="v2-notice-warn">{uploadError}</p>}

          <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-urgent)', margin: 0 }}>취소하면 녹음이 사라집니다.</p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={discardPending} disabled={busy} style={actionBtnStyle('transparent', 'var(--v2-text-main)', busy, true)}>
              취소
            </button>
            <button
              type="button"
              onClick={handleConvertRecording}
              disabled={busy || !recordConsent || !sttUploadEnabled}
              style={{ ...actionBtnStyle('var(--v2-point)', '#FFFFFF', busy || !recordConsent || !sttUploadEnabled), flex: 1 }}
            >
              {uploadStage === 'uploading' ? (
                <><Loader2 size={16} /> 올리는 중…</>
              ) : uploadStage === 'processing' ? (
                <><Loader2 size={16} /> 글로 바꾸는 중…</>
              ) : (
                '글로 바꾸기'
              )}
            </button>
          </div>
        </div>
      )}

      {mode === 'record' && micError && <p className="v2-notice-warn" style={{ marginBottom: '16px' }}>{micError}</p>}
      {mode === 'record' && recordNotice && !showConfirm && <p className="v2-notice-warn" style={{ marginBottom: '16px' }}>{recordNotice}</p>}

      {mode === 'record' && blocked && blockedNote}
      {mode === 'record' && !blocked && (
      <>
      {!recordingSupported && (
        <p className="v2-notice" style={{ marginBottom: '16px' }}>
          이 브라우저에서는 음성 입력을 지원하지 않습니다. 아래 입력창에 직접 입력해 주세요.
        </p>
      )}

      {recordingSupported && (
        <>
          {/* 체크 칸뿐 아니라 문구를 눌러도 토글된다(label이 클릭을 받는다). */}
          <label
            className="v2-check"
            htmlFor="voice-record-consent"
            style={{ alignItems: 'flex-start', cursor: 'pointer', marginBottom: '10px' }}
            onClick={(e) => { e.preventDefault(); if (!disabled && !isRecording) onRecordConsentChange(!recordConsent); }}
          >
            <span
              id="voice-record-consent"
              role="checkbox"
              aria-checked={recordConsent}
              style={{
                width: '20px', height: '20px', flexShrink: 0, marginTop: '2px', borderRadius: '4px',
                border: recordConsent ? 'none' : '1.5px solid var(--v2-input-border)',
                backgroundColor: recordConsent ? 'var(--v2-point)' : '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {recordConsent && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </span>
            <span>
              <span className="v2-req">필수</span> &apos;글로 바꾸기&apos;를 누르면 녹음이 네이버 클라우드
              CLOVA Speech로 전송되며 음성인식 성능 향상에 활용될 수 있습니다. 변환된 텍스트는 네이버에
              7일간 보관 후 삭제됩니다.
              {voiceStorageEnabled
                ? ' 편지를 저장하면 녹음 원본도 암호화되어 함께 보관됩니다.'
                : ' 이어봄은 음성 파일을 보관하지 않습니다.'}
            </span>
          </label>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {recordingSupported && (
          isRecording ? (
            <button type="button" onClick={stopRecording} disabled={disabled} style={actionBtnStyle('var(--v2-urgent)', '#FFFFFF', !!disabled)}>
              <MicOff size={16} /> 녹음 멈춤
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || blocked || !recordConsent || busy || showConfirm}
              style={actionBtnStyle('var(--v2-point)', '#FFFFFF', !!disabled || blocked || !recordConsent || busy || showConfirm)}
            >
              <Mic size={16} /> 음성 녹음
            </button>
          )
        )}
        {isRecording && (
          <span style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-point)' }}>
            ● 녹음 중 {formatElapsed(elapsedSec)} <span style={{ color: 'var(--v2-text-muted)' }}>(최대 {MAX_RECORD_MINUTES}분)</span>
          </span>
        )}
      </div>
      </>
      )}

      {/* Ⓐ 파일 업로드 — mode="upload"에서만 그린다. 서버 플래그(CLOVA_STT_ENABLED)가 꺼져
          있으면 안내만 남기고 버튼은 숨긴다(§8-9 후속 — 탭 자체는 항상 있으므로 안내가 필요하다). */}
      {mode === 'upload' && !sttUploadEnabled && (
        <p className="v2-notice">지금은 음성 파일 업로드를 사용할 수 없습니다. "직접 쓰기" 탭을 이용해 주세요.</p>
      )}
      {mode === 'upload' && sttUploadEnabled && blocked && blockedNote}
      {mode === 'upload' && sttUploadEnabled && !blocked && (
        <div>
          <h4 style={{ fontSize: 'var(--v2-fs-item-title)', color: 'var(--v2-text-main)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} color="var(--v2-point)" /> 녹음해 둔 음성 파일 올리기
          </h4>

          {/* 한 줄 안내 — 글자를 줄이고 줄바꿈을 막는다(좁은 폭에서는 줄이 넘치지 않게 말줄임). */}
          <p style={{ fontSize: '12px', color: 'var(--v2-text-muted)', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            m4a · mp3 · wav · webm, 최대 {MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB · {MAX_RECORD_MINUTES}분 이하. 본인의 음성만 올려 주세요.
          </p>

          {/* 체크 칸뿐 아니라 문구를 눌러도 토글된다(label이 클릭을 받는다). */}
          <label
            className="v2-check"
            htmlFor="voice-upload-consent"
            style={{ alignItems: 'flex-start', cursor: 'pointer', marginBottom: '10px' }}
            onClick={(e) => { e.preventDefault(); onUploadConsentChange(!uploadConsent); }}
          >
            <span
              id="voice-upload-consent"
              role="checkbox"
              aria-checked={uploadConsent}
              style={{
                width: '20px', height: '20px', flexShrink: 0, marginTop: '2px', borderRadius: '4px',
                border: uploadConsent ? 'none' : '1.5px solid var(--v2-input-border)',
                backgroundColor: uploadConsent ? 'var(--v2-point)' : '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {uploadConsent && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </span>
            <span>
              <span className="v2-req">필수</span> 음성 파일이 네이버 클라우드
              CLOVA Speech로 전송되며 음성인식 성능 향상에 활용될 수 있습니다. 변환된 텍스트는 네이버에
              7일간 보관 후 삭제됩니다.
              {voiceStorageEnabled
                ? ' 편지를 저장하면 이 파일도 암호화되어 함께 보관됩니다.'
                : ' 이어봄은 음성 파일을 보관하지 않습니다.'}
            </span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".m4a,.mp3,.wav,.webm,audio/mp4,audio/x-m4a,audio/mpeg,audio/wav,audio/webm"
            onChange={handleAudioFileSelect}
            disabled={disabled || blocked || !uploadConsent || busy}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || blocked || !uploadConsent || busy}
              style={actionBtnStyle('transparent', 'var(--v2-text-main)', disabled || blocked || !uploadConsent || busy, true)}
            >
              파일 선택
            </button>
            <button
              type="button"
              onClick={handleAudioUpload}
              disabled={disabled || blocked || !uploadConsent || !selectedFile || busy}
              style={actionBtnStyle('var(--v2-point)', '#FFFFFF', disabled || blocked || !uploadConsent || !selectedFile || busy)}
            >
              {uploadStage === 'uploading' ? (
                <><Loader2 size={16} /> 업로드 중…</>
              ) : uploadStage === 'processing' ? (
                <><Loader2 size={16} /> 글로 바꾸는 중…</>
              ) : (
                <>업로드</>
              )}
            </button>
          </div>

          {selectedFile && (
            <p style={{ marginTop: '8px', fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)' }}>{selectedFile.name}</p>
          )}

          {uploadError && <p className="v2-notice-warn" style={{ marginTop: '12px' }}>{uploadError}</p>}
        </div>
      )}

      {/* 06-04 §6.4-11-10 — 업로드가 끝난 뒤 "작업 중" 모달(음성은 새 모달). 닫으면 요청을 끊고 처음부터 다시. */}
      {uploadStage === 'processing' && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-label="음성 변환 중">
          <div className="v2-modal is-ocr-confirm" style={{ width: '420px' }}>
            <WorkingView maxMinutes={HEAVY_CLIENT_LIMITS.audio.maxMinutes} />
            <div className="v2-ocr-confirm-actions">
              <button type="button" className="v2-btn-outline" onClick={closeWorking}>닫기</button>
            </div>
          </div>
        </div>
      )}
      {workNotice && <HeavyNoticeDialog message={workNotice} onClose={() => setWorkNotice(null)} />}
    </div>
  );
};
