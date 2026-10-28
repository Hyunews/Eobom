import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, apiUploadForm } from '../../../lib/api';
import {
  AUDIO_TOO_LONG_MESSAGE,
  HEAVY_CLIENT_LIMITS,
  HEAVY_NETWORK_MESSAGE,
  HEAVY_TIMEOUT_MESSAGE,
  readAudioDurationSec,
  RECORD_AUTO_STOP_SECONDS,
} from '../../../lib/heavyLimits';

// 10단계 묶음 10-2 — 유족 메시지 보관함의 음성 → 글 변환(올리기 · 녹음).
// 지금 화면(`components/farewell/VoiceToTextInput.tsx`)에서 옮겼다. 정본 = 06-05 §4.2 · §5.6-9(D-12) · 06-04 §6.4-11-10.
// 🔴 이 훅은 **글 변환까지만** 한다 — 변환 요청은 항상 saveAudio=false(R2·DB에 아무것도 쓰지 않는다). 원본 음성은 메모리(blob)에만 두고
//    저장(store-audio)과 편지 저장은 부모의 [저장]에서만 일어난다. 녹음 글 변환은 항상 CLOVA이고 녹음 중에는 경과 시간만 보여준다.

/** 변환은 끝났지만 아직 저장 전인 원본 음성 — 브라우저 메모리에만 */
export interface PendingVoice {
  blob: Blob;
  mime: string;
  durationSec: number | null;
}

export interface SavedMedia {
  mediaKey: string;
  mediaMime: string;
  mediaDurationSec?: number;
}

const ALLOWED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm'];
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
export const VOICE_FALLBACK_MSG = '직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요.';
export const MAX_RECORD_MINUTES = Math.round(HEAVY_CLIENT_LIMITS.audioMaxSeconds / 60);
const RECORD_NOTICE_SEEN_KEY = 'eobom_voice_record_notice_seen'; // §5.5-3 — "1회" 안내를 다시 보여주지 않기 위한 로컬 기록
const RECORDER_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

const pickRecorderMimeType = (): string | undefined => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return RECORDER_MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
};

export const extensionForMime = (mime: string): string => {
  const lower = mime.toLowerCase();
  if (lower.includes('webm')) return 'webm';
  if (lower.includes('mp4') || lower.includes('m4a') || lower.includes('aac')) return 'm4a';
  if (lower.includes('wav')) return 'wav';
  if (lower.includes('mpeg')) return 'mp3';
  return 'webm';
};

export const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export const recordNoticeSeen = (): boolean => {
  try {
    return !!window.localStorage.getItem(RECORD_NOTICE_SEEN_KEY);
  } catch {
    return false;
  }
};
export const markRecordNoticeSeen = () => {
  try {
    window.localStorage.setItem(RECORD_NOTICE_SEEN_KEY, '1');
  } catch {
    /* 저장이 막힌 브라우저 — 안내가 다음에도 한 번 더 뜰 뿐이다 */
  }
};

export type RecState = 'idle' | 'recording' | 'done';

export function useVoiceCapture(onConverted: (text: string, voice: PendingVoice) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [workErr, setWorkErr] = useState<string | null>(null);
  /** 대기·처리·연결 이유 알림 창 */
  const [notice, setNotice] = useState<string | null>(null);
  const [rec, setRec] = useState<RecState>('idle');
  const [sec, setSec] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [recNotice, setRecNotice] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const durationRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const discardOnStopRef = useRef(false); // 언마운트 등으로 끊긴 녹음은 확인 없이 버린다
  const pendingRef = useRef<{ blob: Blob; mime: string; durationSec: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onConvertedRef = useRef(onConverted);
  onConvertedRef.current = onConverted;

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const revokePreview = () =>
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

  useEffect(
    () => () => {
      discardOnStopRef.current = true;
      stopTimer();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      stopStream();
      abortRef.current?.abort();
    },
    [],
  );
  // 미리 듣기 주소는 바꾸거나 닫을 때 거둔다
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // ── 올리기 ──
  const pickFile = useCallback(async (f: File | null) => {
    if (!f) return;
    setFileErr(null);
    setWorkErr(null);
    const dot = f.name.lastIndexOf('.');
    const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : '';
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      setFile(null);
      setFileErr('m4a · mp3 · wav · webm 파일만 올릴 수 있습니다.');
      return;
    }
    if (f.size > MAX_UPLOAD_SIZE_BYTES) {
      setFile(null);
      setFileErr(`파일이 너무 큽니다. 최대 ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB까지 올릴 수 있습니다.`);
      return;
    }
    // 06-04 §6.4-11-10 음성 길이 상한(잠정 10분) — 2분 안에 끝나지 않을 녹음은 고를 때 막는다. 못 읽으면 그대로 통과(서버가 한 번 더 막는다)
    const duration = await readAudioDurationSec(f);
    if (duration !== null && duration > HEAVY_CLIENT_LIMITS.audioMaxSeconds) {
      setFile(null);
      setFileErr(AUDIO_TOO_LONG_MESSAGE);
      return;
    }
    durationRef.current = duration === null ? null : Math.round(duration);
    setFile(f);
  }, []);
  const clearFile = useCallback(() => {
    setFile(null);
    setFileErr(null);
  }, []);

  // ── 글 변환(올리기 · 글로 바꾸기 공통). 마감은 업로드가 끝난 뒤 125초(서버 115초 + 여유 10). 창을 닫으면 요청을 끊는다("처음부터 다시") ──
  const convert = async (blob: Blob, fileName: string, mime: string, durationSec: number | null, onDone: () => void) => {
    setWorkErr(null);
    setWorking(true);
    const formData = new FormData();
    formData.append('audio', blob, fileName);
    formData.append('saveAudio', 'false');
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const data = await apiUploadForm<{ text?: string }>('/api/stt/transcribe', 'USER', formData, {
        deadlineMs: HEAVY_CLIENT_LIMITS.audio.deadlineMs,
        timeoutMessage: HEAVY_TIMEOUT_MESSAGE.audio,
        networkMessage: HEAVY_NETWORK_MESSAGE.audio,
        signal: ac.signal,
      });
      if (typeof data?.text !== 'string') throw new ApiError(`음성 변환에 실패했습니다. ${VOICE_FALLBACK_MSG}`);
      setWorking(false);
      onDone();
      onConvertedRef.current(data.text.trim(), { blob, mime, durationSec });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ABORTED') return; // 창을 닫아 끊음 — 저장 전 음성은 그대로
      setWorking(false);
      const message = e instanceof ApiError ? e.baseMessage : `음성 변환에 실패했습니다. ${VOICE_FALLBACK_MSG}`;
      // 대기·처리·연결 이유는 알림 창, 그 밖(형식·용량·길이·무음 등)은 기존 줄
      if (e instanceof ApiError && (e.code === 'BUSY' || e.code === 'SLOW' || e.code === 'UPSTREAM' || e.code === 'QUOTA')) setNotice(message);
      else setWorkErr(message);
    }
  };

  const uploadFile = () => {
    if (!file) return;
    const f = file;
    void convert(f, f.name, f.type, durationRef.current, () => setFile(null));
  };

  // ── 녹음 ──
  const onStopped = () => {
    if (discardOnStopRef.current) {
      chunksRef.current = [];
      return;
    }
    stopTimer();
    stopStream();
    const chunks = chunksRef.current;
    chunksRef.current = [];
    if (chunks.length === 0) {
      setRec('idle');
      return;
    }
    const mime = recorderRef.current?.mimeType || chunks[0].type || 'audio/webm';
    pendingRef.current = {
      blob: new Blob(chunks, { type: mime }),
      mime,
      durationSec: Math.max(0, Math.round((Date.now() - startRef.current) / 1000)),
    };
    setWorkErr(null);
    setRec('done');
  };

  const stopRecording = () => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop(); // onstop → onStopped
    else setRec('idle');
  };

  const startRecording = async () => {
    setMicError(null);
    setRecNotice(null);
    setWorkErr(null);
    chunksRef.current = [];
    discardOnStopRef.current = false;
    if (!recSupported) {
      setMicError('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = onStopped;
      recorder.start();
      startRef.current = Date.now();
      setSec(0);
      setRec('recording');
      stopTimer();
      timerRef.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - startRef.current) / 1000);
        setSec(s);
        if (s >= RECORD_AUTO_STOP_SECONDS) {
          setRecNotice(`최대 ${MAX_RECORD_MINUTES}분까지 녹음할 수 있습니다.`);
          stopRecording();
        }
      }, 500);
    } catch {
      stopStream();
      setMicError('denied');
      setRec('idle');
    }
  };

  /** 취소 = blob 폐기. 🔴 어떤 네트워크 요청도 보내지 않는다 */
  const discardRecording = () => {
    pendingRef.current = null;
    revokePreview();
    setRec('idle');
    setSec(0);
    setRecNotice(null);
    setWorkErr(null);
  };
  const convertRecording = () => {
    const p = pendingRef.current;
    if (!p) return;
    void convert(p.blob, `recording.${extensionForMime(p.mime)}`, p.mime, p.durationSec, () => {
      pendingRef.current = null;
      revokePreview();
      setRec('idle');
      setSec(0);
    });
  };
  /** "먼저 들어보기" — 로컬 blob, 서버를 타지 않는다 */
  const openPreview = () => {
    if (previewUrl || !pendingRef.current) return;
    setPreviewUrl(URL.createObjectURL(pendingRef.current.blob));
  };

  const closeWorking = () => {
    abortRef.current?.abort();
    setWorking(false);
  };

  return {
    file, fileErr, pickFile, clearFile, uploadFile,
    working, workErr, notice, clearNotice: () => setNotice(null), closeWorking,
    rec, sec, micError, recNotice, recSupported, startRecording, stopRecording, discardRecording, convertRecording,
    previewUrl, openPreview,
  };
}
