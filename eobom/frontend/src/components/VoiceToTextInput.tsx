import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Upload, Loader2, Check } from 'lucide-react';
import { BACKEND_URL } from '../config';

// 06-05 §4.2 정정(08-26) — 말로 남기기(음성 입력 전체)가 엔딩노트 ⑨에서 유족 메시지 보관함으로
// 이관됐다. EndingNotePage.tsx에 인라인으로 있던 Ⓐ(파일 업로드)·Ⓑ(직접 녹음) UI를 그대로
// 추출한 독립 컴포넌트 — 백엔드(sttProvider·clovaSpeechProvider·audioConvert·uploadAudio·
// sttRoutes)는 손대지 않고 그대로 재사용한다.

interface VoiceToTextInputProps {
  token: string | null; // /api/stt/transcribe 인증용(sessionStorage 'k_ending_token')
  onText: (text: string) => void; // 인식된 텍스트 조각(최종본)을 부모 편집기로 넘긴다
  disabled?: boolean;
}

const ALLOWED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav'];
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

export const VoiceToTextInput: React.FC<VoiceToTextInputProps> = ({ token, onText, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const [sttUploadEnabled, setSttUploadEnabled] = useState(false);
  // §6.4-11-6-1 — 동의는 "매번" 받는다. 세션 간 기억하지 않으므로 초기값은 항상 false.
  const [uploadConsent, setUploadConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const sttSupported = !!SpeechRecognitionCtor && (typeof window === 'undefined' || window.isSecureContext);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // §6.4-9-5 — 서버에 물어서만 업로드 UI를 켠다(프론트에 플래그를 직접 심지 않는다).
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stt/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setSttUploadEnabled(!!data.data?.enabled);
      })
      .catch(() => { });
  }, []);

  const startRecording = () => {
    if (!SpeechRecognitionCtor) return;
    setMicError(null);
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
        onText(finalChunk.trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('마이크 권한이 거부되었습니다. 아래 입력창에 직접 입력해 주세요.');
        shouldListenRef.current = false;
        setIsRecording(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setMicError('음성 인식 중 문제가 발생했습니다. 아래 입력창에 직접 입력해 주세요.');
      }
    };

    recognition.onend = () => {
      setInterimText('');
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          /* 이미 시작된 상태에서의 재시작 시도는 무시 */
        }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);

    const dot = file.name.lastIndexOf('.');
    const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      setUploadError('m4a · mp3 · wav 파일만 올릴 수 있습니다.');
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
    <div>
      {micError && (
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          {micError}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {sttSupported && (
          isRecording ? (
            <button type="button" onClick={stopRecording} disabled={disabled} className="btn" style={{ backgroundColor: '#B91C1C', color: '#fff' }}>
              <MicOff size={18} /> 녹음 멈춤
            </button>
          ) : (
            <button type="button" onClick={startRecording} disabled={disabled} className="btn btn-point">
              <Mic size={18} /> 음성으로 말하기
            </button>
          )
        )}
        {isRecording && <span style={{ fontSize: '0.85rem', color: 'var(--point-color)' }}>● 듣고 있습니다…</span>}
      </div>

      {!sttSupported && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          이 브라우저에서는 음성 인식을 지원하지 않습니다. 아래 입력창에 직접 입력해 주세요.
        </div>
      )}

      {sttSupported && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          🎙️ 음성 인식을 위해 말씀하신 내용이 음성인식 서비스로 전송됩니다. 이어봄은 변환된 글만 저장하며 음성 파일은 보관하지 않습니다.
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
            m4a · mp3 · wav 파일을 올릴 수 있습니다(최대 {MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB).
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
              네이버에 7일간 보관된 뒤 삭제됩니다. 이어봄은 음성 파일을 보관하지 않습니다.
            </span>
          </label>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.9rem', marginLeft: '1.75rem' }}>
            동의하지 않으셔도 직접 입력으로 편지를 남기실 수 있습니다.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".m4a,.mp3,.wav,audio/mp4,audio/x-m4a,audio/mpeg,audio/wav"
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
