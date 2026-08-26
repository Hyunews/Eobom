import React, { useState, useRef, useEffect } from 'react';
import { ScrollText, FileCheck, LogIn, Mic, MicOff, Printer, Copy, Download, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { NoteKeyIcon } from '../components/MenuIcons';

interface EndingNotePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const EndingNotePage: React.FC<EndingNotePageProps> = ({ currentUser, onOpenLogin, setActiveTab }) => {
  const [lifeSupport, setLifeSupport] = useState<string>('연명의료 중단 희망');
  const [funeralType, setFuneralType] = useState<string>('가족장 (수목장)');

  // ⑨ 말로 남기는 초안(STT) — Phase 1-a. 서버 저장 없음, 브라우저 임시 저장(localStorage 등)도 하지 않음.
  const [draftText, setDraftText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [draftConfirmed, setDraftConfirmed] = useState<boolean>(false);
  const [largeText, setLargeText] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const sttSupported = !!SpeechRecognitionCtor && (typeof window === 'undefined' || window.isSecureContext);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
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
        setDraftText((prev) => (prev ? `${prev.trimEnd()} ${finalChunk.trim()}` : finalChunk.trim()));
        setDraftConfirmed(false);
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

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setCopyFeedback('복사되었습니다.');
    } catch {
      setCopyFeedback('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
    }
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleDownloadDraft = () => {
    const blob = new Blob([draftText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '말로_남기는_초안.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintDraft = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    const safeText = draftText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    printWindow.document.write(
      `<html><head><title>말로 남기는 초안</title><style>
        body { font-family: 'Malgun Gothic', sans-serif; font-size: ${largeText ? '22px' : '16px'}; line-height: 1.9; padding: 2.5rem; white-space: pre-wrap; }
      </style></head><body>${safeText}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const hasAddressHint = /\d+(-\d+)?\s*(번지|호)|(로|길)\s*\d+/.test(draftText);
  const hasDateHint = /\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/.test(draftText);

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* 미로그인 시 접근 제약 안내 오버레이 카드 */}
      {!currentUser && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(247, 244, 239, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          borderRadius: 'var(--border-radius)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '2.2rem 1.75rem',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            maxWidth: '520px',
            border: '2px solid var(--primary-color)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.1rem',
              fontSize: '2rem'
            }}>
              🔒
            </div>
            <h2 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              로그인이 필요한 회원 전용 서비스입니다
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              디지털 엔딩노트는 개인 사전 의향서 및 유족에게 남기는 메시지를 다루는 최고 보안 영역입니다. 로그인 후 안전하게 작성하고 보관하세요.
            </p>
            <button 
              onClick={onOpenLogin} 
              className="btn btn-point"
              style={{ width: '100%', height: '52px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <LogIn size={20} /> 로그인 / 회원가입 하러가기
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F1F5F9', color: 'var(--primary-color)', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <NoteKeyIcon size={18} color="var(--primary-color)" /> 남겨야 할 것을 빠짐없이
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <NoteKeyIcon color="var(--primary-color)" size={32} /> 디지털 엔딩노트
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          연명의료 의향 메모, 장례 희망 방식, 말로 남기는 유언 초안까지 표준화된 항목을 차근차근 채워두세요.
        </p>
      </div>

      <div style={{ filter: !currentUser ? 'blur(3px)' : 'none' }}>
        {/* 사전 의향서 작성 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck color="var(--point-color)" /> 연명의료 의향 메모 & 장례 희망
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            ⚠️ 이 메모는 법적 효력이 없습니다. 법적 효력이 있는 「사전연명의료의향서」는 보건복지부
            지정 등록기관에서 본인이 직접 작성·등록해야 합니다(비용 없음).
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label className="form-label">연명의료 중단 의향</label>
              <select value={lifeSupport} onChange={(e) => setLifeSupport(e.target.value)} className="form-select">
                <option value="연명의료 중단 희망">임종 시 무의미한 연명의료 중단 희망</option>
                <option value="적극적 치료 희망">가능한 모든 의료 조치 시행 희망</option>
                <option value="자녀 판단에 위임">가족/자녀의 판단에 위임</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">희망하는 장례 방식</label>
              <select value={funeralType} onChange={(e) => setFuneralType(e.target.value)} className="form-select">
                <option value="가족장 (수목장)">가족장 후 자연 수목장 안치</option>
                <option value="일반 장례 (봉안당)">일반 3일장 후 봉안당 안치</option>
                <option value="조용한 검소장">최소 인원 검소장</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="submit"
                className="btn"
                disabled
                style={{ flex: 1, fontSize: '0.9rem', backgroundColor: 'var(--secondary-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              >
                의향서 저장 (준비 중)
              </button>
              <button
                type="button"
                onClick={() => alert('🏥 [개발중] 모바일 응급 연명의료 QR 카드 생성 연동 기능 개발 중입니다.')}
                className="btn"
                style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.9rem' }}
              >
                📱 응급실 전용 QR 카드 (개발중)
              </button>
            </div>
          </form>
        </div>

        {/* 06-05 §7.2 — 크로스 링크는 양방향. 이쪽은 엔딩노트 → 보관함(자유 텍스트 ③이 분리돼
            나간 자리, §3.1). "저장됩니다" 류의 남은 약속이 없도록 링크만 둔다. */}
        {setActiveTab && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.9rem',
              color: 'var(--primary-color)',
              textAlign: 'center',
            }}
          >
            가족 한 분 한 분께 하고 싶은 말이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('farewell-messages')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
            >
              유족 메시지 보관함 →
            </button>
          </div>
        )}
      </div>

      {/* ⑨ 말로 남기는 초안 (STT) — Phase 1-a. 서버 저장 없음. localStorage 등 브라우저 임시 저장도 하지 않음 */}
      <div style={{ marginTop: '1.5rem', backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ScrollText color="var(--point-color)" /> 말로 남기는 초안
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          말씀하신 내용을 글로 옮겨, 자필증서 유언장을 손으로 옮겨 쓸 때 참고하는 초안을 만듭니다. 이 화면에서 만든 글 자체는 유언장이 아닙니다.
        </p>

        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span>이 초안은 저장되지 않습니다. 인쇄하거나 복사해 두세요.</span>
        </div>

        {!sttSupported && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            이 브라우저에서는 음성 인식을 지원하지 않습니다. 아래 입력창에 직접 입력해 주세요.
          </div>
        )}

        {micError && (
          <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            {micError}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {sttSupported && (
            isRecording ? (
              <button type="button" onClick={stopRecording} className="btn" style={{ backgroundColor: '#B91C1C', color: '#fff' }}>
                <MicOff size={18} /> 녹음 멈춤
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="btn btn-point">
                <Mic size={18} /> 음성으로 말하기
              </button>
            )
          )}
          {isRecording && <span style={{ fontSize: '0.85rem', color: 'var(--point-color)' }}>● 듣고 있습니다…</span>}
        </div>

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

        <div className="form-group">
          <label className="form-label">초안 (음성 인식 결과 + 직접 입력)</label>
          <textarea
            rows={8}
            value={draftText}
            onChange={(e) => { setDraftText(e.target.value); setDraftConfirmed(false); }}
            className="form-input"
            style={{ height: 'auto', padding: '1rem', fontSize: largeText ? '1.15rem' : '1rem', lineHeight: 1.7 }}
            placeholder="여기에 직접 입력하거나, 위 '음성으로 말하기' 버튼을 눌러 말씀하신 내용을 받아 적으세요."
          />
        </div>

        {!draftConfirmed ? (
          <button
            type="button"
            onClick={() => setDraftConfirmed(true)}
            disabled={!draftText.trim()}
            className="btn btn-primary"
            style={{ opacity: draftText.trim() ? 1 : 0.5, cursor: draftText.trim() ? 'pointer' : 'not-allowed' }}
          >
            <CheckCircle2 size={18} /> 이 내용을 확인했습니다
          </button>
        ) : (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--point-color)', backgroundColor: 'rgba(91, 112, 101, 0.12)', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> 확인되었습니다. 아래 요건을 확인하고 직접 손으로 옮겨 적으세요. (내용을 다시 고치면 확인이 풀립니다)
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                자필증서 유언장의 4대 요건 — 옮겨 쓸 때 빠뜨리지 마세요
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasAddressHint ? 'var(--point-color)' : 'var(--text-muted)' }}>
                  {hasAddressHint ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  주소 — 번지까지 정확히 {hasAddressHint ? '(초안에서 확인됨)' : '(빠졌을 수 있습니다. 번지까지 쓰셔야 합니다)'}
                </li>
                <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasDateHint ? 'var(--point-color)' : 'var(--text-muted)' }}>
                  {hasDateHint ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  연월일 {hasDateHint ? '(초안에서 확인됨)' : '(빠졌을 수 있습니다. "2026년 8월 25일"처럼 정확히 쓰셔야 합니다)'}
                </li>
                <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <Circle size={16} /> 성명 — 본인이 직접 확인하세요 (자동으로 확인되지 않습니다)
                </li>
                <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <Circle size={16} /> 날인 — 옮겨 쓴 종이에 도장 또는 지장을 찍으세요 (화면에서는 확인할 수 없습니다)
                </li>
              </ul>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                ※ 위 표시는 참고용 안내일 뿐이며, 이어봄이 주소·연월일·성명을 대신 채워 넣지 않습니다.
              </p>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.9rem', marginBottom: '1rem' }}>
              이 초안을 보고 직접 손으로 옮겨 쓰십시오. 컴퓨터로 작성한 문서는 자필증서 유언장으로 인정되지 않습니다.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setLargeText((v) => !v)} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
                {largeText ? '보통 글씨로' : '큰 글씨로 보기'}
              </button>
              <button type="button" onClick={handlePrintDraft} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
                <Printer size={18} /> 인쇄하기
              </button>
              <button type="button" onClick={handleCopyDraft} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
                <Copy size={18} /> 텍스트 복사
              </button>
              <button type="button" onClick={handleDownloadDraft} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
                <Download size={18} /> .txt 내려받기
              </button>
            </div>
            {copyFeedback && (
              <p style={{ fontSize: '0.85rem', color: 'var(--point-color)', marginTop: '0.5rem' }}>{copyFeedback}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
