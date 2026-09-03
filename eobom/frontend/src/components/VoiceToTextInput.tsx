import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Upload, Loader2, Check } from 'lucide-react';
import { BACKEND_URL } from '../config';

// 06-05 §4.2 정정(08-26) — 말로 남기기(음성 입력 전체)가 엔딩노트 ⑨에서 유족 메시지 보관함으로
// 이관됐다. EndingNotePage.tsx에 인라인으로 있던 Ⓐ(파일 업로드)·Ⓑ(직접 녹음) UI를 그대로
// 추출한 독립 컴포넌트 — 백엔드(sttProvider·clovaSpeechProvider·audioConvert·uploadAudio·
// sttRoutes)는 손대지 않고 그대로 재사용한다.
// 🆕 06-05 §5.5(2026-09-03) — Ⓑ가 Web Speech 단독에서 MediaRecorder 본체 + Web Speech 보조
// 자막 구조로 바뀌었다. Web Speech는 되면 쓰고 안 되면 폴백(§5.5-2)일 뿐, 저장 대상은 항상
// MediaRecorder가 만든 오디오 blob이다.

export interface SavedMedia {
  mediaKey: string;
  mediaMime: string;
  mediaDurationSec?: number;
}

interface VoiceToTextInputProps {
  token: string | null; // /api/stt/transcribe·/api/stt/store-audio 인증용
  onText: (text: string) => void; // 인식된 텍스트 조각(최종본)을 부모 편집기로 넘긴다
  onMediaSaved?: (media: SavedMedia | null) => void; // R2에 저장된 음성 원본(있으면)을 부모에 알린다
  disabled?: boolean;
}

const ALLOWED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm'];
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
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

interface UploadResult {
  text?: string;
  media?: { mediaKey: string; mediaMime: string };
}

export const VoiceToTextInput: React.FC<VoiceToTextInputProps> = ({ token, onText, onMediaSaved, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStage, setRecordingStage] = useState<'idle' | 'processing'>('idle');
  const [interimText, setInterimText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [showFirstTimeNotice, setShowFirstTimeNotice] = useState(false);

  const [sttUploadEnabled, setSttUploadEnabled] = useState(false);
  const [voiceStorageEnabled, setVoiceStorageEnabled] = useState(false); // R2_ENABLED — /status로만 판단
  const [saveVoiceEnabled, setSaveVoiceEnabled] = useState(true); // §5.5-3 — 기본값 켬
  // §6.4-11-6-1 — 동의는 "매번" 받는다. 세션 간 기억하지 않으므로 초기값은 항상 false.
  const [uploadConsent, setUploadConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const recognizedAnyFinalRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const sttSupported = !!SpeechRecognitionCtor && (typeof window === 'undefined' || window.isSecureContext);
  const recordingSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const stopMediaStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream();
    };
  }, []);

  // §6.4-9-5 — 서버에 물어서만 업로드 UI를 켠다(프론트에 플래그를 직접 심지 않는다).
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stt/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setSttUploadEnabled(!!data.data?.enabled);
          setVoiceStorageEnabled(!!data.data?.voiceStorageEnabled);
        }
      })
      .catch(() => { });
  }, []);

  const uploadBlob = async (blob: Blob, mimeType: string, path: string, saveAudio: boolean): Promise<UploadResult | null> => {
    if (!token) return null;
    const formData = new FormData();
    formData.append('audio', blob, `recording.${extensionForMime(mimeType)}`);
    if (path === '/api/stt/transcribe') {
      formData.append('saveAudio', saveAudio ? 'true' : 'false');
    }
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (data.status !== 'success') {
      throw new Error(data.message || '업로드에 실패했습니다.');
    }
    return data.data as UploadResult;
  };

  // [녹음 종료] 이후 처리(§5.5-2) — Web Speech가 한 번이라도 확정 결과를 냈으면 그 텍스트를
  // 그대로 쓰고, 없으면(iOS 등 인식 실패) blob을 Ⓐ 경로(/transcribe)로 보내 변환을 폴백한다.
  // 인식 성공 여부와 무관하게 "목소리도 함께 남기기"가 켜져 있으면 원본을 R2에 남긴다.
  const finalizeRecording = async () => {
    setIsRecording(false);
    setInterimText('');
    stopMediaStream();

    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];
    if (chunks.length === 0) return;

    const mimeType = mediaRecorderRef.current?.mimeType || chunks[0].type || 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });
    const durationSec = Math.max(0, Math.round((Date.now() - recordStartRef.current) / 1000));
    const wantsSave = saveVoiceEnabled && voiceStorageEnabled;

    if (!recognizedAnyFinalRef.current) {
      // 폴백 — 인식된 텍스트가 없다.
      if (!sttUploadEnabled) {
        setMicError('음성 인식에 실패했습니다. 아래 입력창에 직접 입력해 주세요.');
        return;
      }
      setRecordingStage('processing');
      try {
        const result = await uploadBlob(blob, mimeType, '/api/stt/transcribe', wantsSave);
        if (result?.text) {
          onText(result.text);
        } else {
          setMicError('음성 인식에 실패했습니다. 아래 입력창에 직접 입력해 주세요.');
        }
        onMediaSaved?.(result?.media ? { ...result.media, mediaDurationSec: durationSec } : null);
      } catch {
        setMicError('음성 변환에 실패했습니다. 아래 입력창에 직접 입력해 주세요.');
      } finally {
        setRecordingStage('idle');
      }
      return;
    }

    // Web Speech가 이미 성공했다 — 변환은 필요 없고, 저장만 하면 된다.
    if (!wantsSave) {
      onMediaSaved?.(null);
      return;
    }
    setRecordingStage('processing');
    try {
      const result = await uploadBlob(blob, mimeType, '/api/stt/store-audio', true);
      onMediaSaved?.(result?.media ? { ...result.media, mediaDurationSec: durationSec } : null);
    } catch {
      // 저장 실패가 이미 받은 텍스트를 무효로 만들지는 않는다 — 조용히 넘어간다.
      onMediaSaved?.(null);
    } finally {
      setRecordingStage('idle');
    }
  };

  const beginRecording = async () => {
    setMicError(null);
    recognizedAnyFinalRef.current = false;
    recordedChunksRef.current = [];

    // Web Speech — 되면 좋고 안 되면 생략(§5.5-2). 녹음 자체를 막지 않는다.
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunk += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        if (finalChunk) {
          recognizedAnyFinalRef.current = true;
          onText(finalChunk.trim());
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldListenRef.current = false;
        }
        // 그 외 오류는 녹음(MediaRecorder)이 계속되므로 여기서 중단하지 않는다 — 종료 시
        // recognizedAnyFinalRef를 보고 폴백 여부를 판단한다.
      };

      recognition.onend = () => {
        setInterimText('');
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch {
            /* 이미 시작된 상태에서의 재시작 시도는 무시 */
          }
        }
      };

      recognitionRef.current = recognition;
      shouldListenRef.current = true;
      try {
        recognition.start();
      } catch {
        shouldListenRef.current = false;
      }
    }

    // MediaRecorder — 본체(§5.5-2). 여기 실패하면 녹음 자체가 안 되는 것이므로 중단한다.
    if (!recordingSupported) {
      setMicError('이 브라우저에서는 녹음을 지원하지 않습니다. 아래 입력창에 직접 입력해 주세요.');
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
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
      recorder.onstop = () => {
        void finalizeRecording();
      };
      recorder.start();
      recordStartRef.current = Date.now();
      setIsRecording(true);
    } catch {
      setMicError('마이크를 사용할 수 없습니다. 권한을 확인하거나 아래 입력창에 직접 입력해 주세요.');
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const startRecording = () => {
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

  const stopRecording = () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // onstop → finalizeRecording
    } else {
      setIsRecording(false);
    }
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSelectedFile(file);
  };

  const handleAudioUpload = () => {
    if (!selectedFile || !uploadConsent || !token) return;

    setUploadError(null);
    setUploadStage('uploading');

    const formData = new FormData();
    formData.append('audio', selectedFile);
    // 06-05 §8 D-2 #14 — Ⓐ 경로도 같은 "목소리도 함께 남기기" 선택을 따른다.
    formData.append('saveAudio', saveVoiceEnabled && voiceStorageEnabled ? 'true' : 'false');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/api/stt/transcribe`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 90000;

    const fail = (message: string) => {
      setUploadError(message);
      setUploadStage('idle');
    };
    const fallbackMsg = '직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요.';

    xhr.upload.onload = () => setUploadStage('processing');
    xhr.ontimeout = () => fail(`변환이 너무 오래 걸려 중단했습니다. ${fallbackMsg}`);
    xhr.onerror = () => fail(`서버와 통신 중 오류가 발생했습니다. ${fallbackMsg}`);
    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // 아래 폴백 메시지로 처리
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.status === 'success' && typeof data.data?.text === 'string') {
        const text = data.data.text.trim();
        onText(text);
        onMediaSaved?.(data.data.media ? { ...data.data.media } : null);
        setSelectedFile(null);
        setUploadConsent(false);
        setUploadStage('idle');
      } else {
        fail(data?.message || `음성 변환에 실패했습니다. ${fallbackMsg}`);
      }
    };
    xhr.send(formData);
  };

  return (
    <div style={{ position: 'relative' }}>
      {showFirstTimeNotice && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.98)',
            border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: 'var(--box-shadow)',
          }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 700 }}>
            🎙️ 목소리를 녹음합니다
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            말씀하신 목소리는 글로 바뀌어 편지 내용으로 들어갑니다. 브라우저가 바로 글로 바꾸지
            못하면 네이버 CLOVA Speech로 자동 전송되어 변환됩니다.
            {voiceStorageEnabled && ' "목소리도 함께 남기기"가 켜져 있으면 목소리 원본도 암호화되어 함께 보관되며, 유족이 편지를 열람할 때 함께 들을 수 있습니다.'}
            이 안내는 처음 한 번만 표시됩니다.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setShowFirstTimeNotice(false)} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
              취소
            </button>
            <button type="button" onClick={acknowledgeFirstTimeNotice} className="btn btn-point" style={{ flex: 1 }}>
              확인하고 시작하기
            </button>
          </div>
        </div>
      )}

      {micError && (
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          {micError}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {recordingSupported && (
          isRecording ? (
            <button type="button" onClick={stopRecording} disabled={disabled} className="btn" style={{ backgroundColor: '#B91C1C', color: '#fff' }}>
              <MicOff size={18} /> 녹음 멈춤
            </button>
          ) : (
            <button type="button" onClick={startRecording} disabled={disabled || recordingStage === 'processing'} className="btn btn-point">
              {recordingStage === 'processing' ? <><Loader2 size={18} /> 처리 중…</> : <><Mic size={18} /> 음성으로 말하기</>}
            </button>
          )
        )}
        {isRecording && <span style={{ fontSize: '0.85rem', color: 'var(--point-color)' }}>● 듣고 있습니다…</span>}
      </div>

      {recordingSupported && voiceStorageEnabled && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.6rem' }}>
          <span
            onClick={(e) => { e.preventDefault(); if (!disabled && !isRecording) setSaveVoiceEnabled((v) => !v); }}
            role="checkbox"
            aria-checked={saveVoiceEnabled}
            style={{
              width: '17px', height: '17px', flexShrink: 0, borderRadius: '5px',
              border: saveVoiceEnabled ? 'none' : '1.5px solid #D1D5DB',
              backgroundColor: saveVoiceEnabled ? 'var(--point-color)' : '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            {saveVoiceEnabled && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
          </span>
          목소리도 함께 남기기
        </label>
      )}

      {!recordingSupported && !sttSupported && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          이 브라우저에서는 음성 입력을 지원하지 않습니다. 아래 입력창에 직접 입력해 주세요.
        </div>
      )}

      {recordingSupported && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          🎙️ 말씀하신 내용은 글로 바뀌어 편지에 들어갑니다.
          {voiceStorageEnabled
            ? ' "목소리도 함께 남기기"가 켜져 있으면 목소리 원본도 암호화되어 함께 보관됩니다.'
            : ' 이어봄은 변환된 글만 저장하며 음성 파일은 보관하지 않습니다.'}
        </p>
      )}

      {interimText && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
          인식 중: {interimText}
        </p>
      )}

      {/* Ⓐ 파일 업로드 — CLOVA_STT_ENABLED가 꺼져 있으면(기본값) 이 블록 전체가 렌더되지 않는다. */}
      {sttUploadEnabled && (
        <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={16} color="var(--point-color)" /> 또는, 녹음해 둔 음성 파일 올리기
          </h4>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            m4a · mp3 · wav · webm 파일을 올릴 수 있습니다(최대 {MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB).
          </p>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
            본인의 음성만 올려주세요. 다른 분의 음성인지 이어봄이 확인할 방법은 없습니다.
          </p>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer', fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.4rem' }}>
            <span
              onClick={(e) => { e.preventDefault(); setUploadConsent((v) => !v); }}
              role="checkbox"
              aria-checked={uploadConsent}
              style={{
                width: '19px', height: '19px', flexShrink: 0, marginTop: '0.1rem', borderRadius: '5px',
                border: uploadConsent ? 'none' : '1.5px solid #D1D5DB',
                backgroundColor: uploadConsent ? 'var(--point-color)' : '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {uploadConsent && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </span>
            <span>
              <strong style={{ color: 'var(--primary-color)' }}>(필수)</strong> 음성 파일이 네이버 클라우드
              CLOVA Speech로 전송되며, 네이버의 음성인식 성능 향상에 활용될 수 있습니다. 변환된 텍스트는
              네이버에 7일간 보관된 뒤 삭제됩니다.
              {voiceStorageEnabled
                ? ' "목소리도 함께 남기기"가 켜져 있으면 이 파일도 이어봄에 암호화되어 함께 보관됩니다.'
                : ' 이어봄은 음성 파일을 보관하지 않습니다.'}
            </span>
          </label>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.9rem', marginLeft: '1.75rem' }}>
            동의하지 않으셔도 직접 입력으로 편지를 남기실 수 있습니다.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".m4a,.mp3,.wav,.webm,audio/mp4,audio/x-m4a,audio/mpeg,audio/wav,audio/webm"
              onChange={handleAudioFileSelect}
              disabled={disabled || !uploadConsent || uploadStage !== 'idle'}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || !uploadConsent || uploadStage !== 'idle'}
              className="btn"
              style={{
                backgroundColor: 'var(--secondary-color)',
                color: 'var(--primary-color)',
                opacity: !uploadConsent || uploadStage !== 'idle' ? 0.5 : 1,
                cursor: !uploadConsent || uploadStage !== 'idle' ? 'not-allowed' : 'pointer',
              }}
            >
              파일 선택
            </button>
            {selectedFile && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedFile.name}</span>}
            <button
              type="button"
              onClick={handleAudioUpload}
              disabled={disabled || !uploadConsent || !selectedFile || uploadStage !== 'idle'}
              className="btn btn-point"
              style={{ opacity: !uploadConsent || !selectedFile || uploadStage !== 'idle' ? 0.5 : 1 }}
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

          {uploadError && (
            <div style={{ marginTop: '0.7rem', fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
              {uploadError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
