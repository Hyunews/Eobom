import React, { useState } from 'react';
import {
  ScrollText,
  FileCheck,
  LogIn,
  Printer,
  Copy,
  Download,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Landmark,
  Smartphone,
  ShieldCheck,
  Users,
  MapPin,
  HeartPulse,
} from 'lucide-react';
import { NoteKeyIcon } from '../components/MenuIcons';

interface EndingNotePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

// 06-04 §6.1 — ④~⑧ 신규 섹션. Phase 1 모델(EndingNoteEntry)이 아직 없어 전부 화면 상태로만
// 존재한다 — 저장 버튼은 기존 ①(연명의료·장례희망) 카드와 같은 "준비 중" 비활성 버튼으로 둔다.
// §6.3 금지 항목(비밀번호·PIN·계좌번호·잔액·주민등록번호·서류파일·상속지분·유류분)을 어느
// 섹션에도 다시 들여오지 않는다 — ④는 "소재"만, ⑥은 "가입 사실"만, ⑧은 "소재"만 받는다.
const DIGITAL_ACCOUNT_CATEGORIES = ['이메일', 'SNS', '클라우드', '구독 서비스'] as const;
const DIGITAL_ACCOUNT_CHOICES: Record<string, string> = {
  '': '미정',
  DELETE: '삭제',
  MEMORIALIZE: '추모 전환',
  KEEP: '보존',
};

const INSURANCE_ITEMS = [
  { key: 'life', label: '생명보험' },
  { key: 'pension', label: '연금(개인·퇴직)' },
  { key: 'accident', label: '실손·상해보험' },
] as const;

export const EndingNotePage: React.FC<EndingNotePageProps> = ({ currentUser, onOpenLogin, setActiveTab }) => {
  const [lifeSupport, setLifeSupport] = useState<string>('연명의료 중단 희망');
  const [funeralType, setFuneralType] = useState<string>('가족장 (수목장)');

  // ④ 자산 "소재" 안내 — §6.3 "소재 안내형" 대체 문구를 그대로 placeholder로 쓴다.
  const [assetNote, setAssetNote] = useState<string>('');

  // ⑤ 디지털 계정 처리 의향 — 플랫폼 카테고리별 삭제/추모전환/보존 중 하나. 의향만 받고
  // 실행(04 DigitalCleanupItem)은 이 화면 소관이 아니다.
  const [digitalPrefs, setDigitalPrefs] = useState<Record<string, string>>({});

  // ⑥ 보험·연금 가입 사실 — 회사명만 받는다. 증권번호·보장내역은 받지 않는다(§6.3).
  const [insurance, setInsurance] = useState<Record<string, { checked: boolean; company: string }>>({});

  // ⑦ 중요 연락처·반려동물
  const [contactsNote, setContactsNote] = useState<string>('');
  const [petCaretaker, setPetCaretaker] = useState<string>('');

  // ⑧ 유언장 소재 안내 — "어디에 보관했는지"만. 원본·사본은 받지 않는다(§6.3, 06-02 §7 #3).
  const [willLocation, setWillLocation] = useState<string>('');

  // ⑩ 장기·조직 기증 의향 — ①(연명의료)과 같은 구조. 등록 여부·등록일까지만 받고 내용은
  // 보관하지 않는다 — 국가 등록 제도가 따로 있다(06-04 §6.1 ⑩). 🔴 시신 기증(해부용)은
  // 별개 제도라 이 항목과 섞지 않는다.
  const [donationStatus, setDonationStatus] = useState<string>('모름');
  const [donationDate, setDonationDate] = useState<string>('');

  // ⑨ 유언장 초안(2026-08-27 개명) — 06-05 §4.2 정정으로 음성 입력은 유족 메시지 보관함으로
  // 전부 이관됐다. 여기는 타이핑 전용 필사 도구로 남는다. 서버 저장 없음, 브라우저 임시
  // 저장(localStorage 등)도 하지 않음. §6.4-5 정정(08-27) — "확인" 버튼은 만든 요구를 과하게
  // 구현한 것이었다(저장이 아예 없는 화면에서 확인 뒤 저장할 대상이 없다) — 제거하고 요건
  // 체크·필사 안내·인쇄/복사 버튼을 상시 노출한다.
  const [draftText, setDraftText] = useState<string>('');
  const [largeText, setLargeText] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // §6.4-1 2026-08-27 균형 조정 — 이름이 "유언장"에 가까워진 만큼 상단 상시 노출 + 인쇄물
  // 머리에 같은 문장을 넣는다. 종이만 따로 돌아다닐 때가 가장 위험하다.
  const NOT_A_WILL_NOTICE =
    '이 화면에서 만든 글은 유언장이 아닙니다. 자필증서 유언은 반드시 손으로 직접 쓰셔야 하며, 컴퓨터로 작성한 문서는 효력이 없습니다.';

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
    a.download = '유언장_초안.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintDraft = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    const safeText = draftText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeNotice = NOT_A_WILL_NOTICE.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    printWindow.document.write(
      `<html><head><title>유언장 초안</title><style>
        body { font-family: 'Malgun Gothic', sans-serif; font-size: ${largeText ? '22px' : '16px'}; line-height: 1.9; padding: 2.5rem; white-space: pre-wrap; }
        .notice { font-size: 13px; color: #92400E; border: 1px solid #FDE68A; background: #FEF3C7; border-radius: 8px; padding: 0.7rem 0.9rem; margin-bottom: 1.5rem; white-space: normal; }
      </style></head><body><div class="notice">${safeNotice}</div>${safeText}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const hasAddressHint = /\d+(-\d+)?\s*(번지|호)|(로|길)\s*\d+/.test(draftText);
  const hasDateHint = /\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/.test(draftText);

  const cardStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    backgroundColor: 'var(--card-bg)',
    padding: '1.5rem',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--box-shadow)',
  };
  const cardTitleStyle: React.CSSProperties = {
    color: 'var(--primary-color)',
    margin: '0 0 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };
  const prepSaveButtonStyle: React.CSSProperties = {
    // display:'block' — 위 select들을 담은 .form-group이 인라인 배치로 바뀌면서(index.css
    // .container .form-group:has(> select)), 버튼 기본값인 inline-block 그대로 두면 마지막
    // select 옆 남는 공간에 버튼이 끼어 들어간다. 새 줄에서 시작하도록 명시적으로 고정.
    display: 'block',
    marginTop: '1rem',
    fontSize: '0.9rem',
    backgroundColor: 'var(--secondary-color)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
  };

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
          연명의료 의향 메모, 장례 희망 방식, 유언장 초안까지 표준화된 항목을 차근차근 채워두세요.
        </p>
      </div>

      <div style={{ filter: !currentUser ? 'blur(3px)' : 'none' }}>
        {/* ① 사전 의향서 작성 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={cardTitleStyle}>
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

        {/* ④ 자산 "소재" 안내 — 06-04 §6.1 ④·§6.3. 잔액·계좌번호·비밀번호는 받지 않는다 —
            placeholder 자체가 §6.3의 "소재 안내형" 대체 문구다. */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            <Landmark color="var(--point-color)" /> 자산 소재 안내
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            🔴 어느 은행·증권사에 거래가 있는지까지만 적어주세요. 계좌번호·잔액·비밀번호는 절대
            적지 마세요 — 유족은 이 정보 없이도 공적 창구(안심상속 원스톱서비스 등)로 조회할 수 있습니다.
          </div>
          <div className="form-group">
            <label className="form-label">거래 중인 은행·증권사</label>
            <textarea
              rows={3}
              value={assetNote}
              onChange={(e) => setAssetNote(e.target.value)}
              className="form-input"
              style={{ height: 'auto', padding: '1rem' }}
              placeholder="예: 국민은행에 주거래 계좌가 있고, 통장은 안방 서랍 두 번째 칸에 있습니다. 비밀번호는 적지 마세요 — 유족이 서류로 조회할 수 있습니다."
            />
          </div>
          <button type="button" className="btn" disabled style={prepSaveButtonStyle}>
            저장 (준비 중)
          </button>
        </div>

        {/* ⑤ 디지털 계정 처리 의향 — 06-04 §6.1 ⑤. 의향만 받는다(실행은 04 DigitalCleanupItem). */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            <Smartphone color="var(--point-color)" /> 디지털 계정 처리 의향
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            자주 쓰시는 디지털 서비스를 사후에 어떻게 처리하고 싶으신지 미리 정해두세요. 실제 처리는
            디지털 정산(04) 화면에서 유족이 진행합니다.
          </p>
          {DIGITAL_ACCOUNT_CATEGORIES.map((category) => (
            <div key={category} className="form-group">
              <label className="form-label">{category}</label>
              <select
                value={digitalPrefs[category] || ''}
                onChange={(e) => setDigitalPrefs((prev) => ({ ...prev, [category]: e.target.value }))}
                className="form-select"
              >
                {Object.entries(DIGITAL_ACCOUNT_CHOICES).map(([value, label]) => (
                  <option key={value || 'undecided'} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button type="button" className="btn" disabled style={prepSaveButtonStyle}>
            저장 (준비 중)
          </button>
        </div>

        {/* ⑥ 보험·연금 가입 사실 — 06-04 §6.1 ⑥·§6.3. 회사명만 받는다. 증권번호·보장내역은 받지 않는다. */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            <ShieldCheck color="var(--point-color)" /> 보험·연금 가입 사실
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            유족이 존재를 몰라 청구를 못 하는 경우가 가장 흔한 손실입니다. 회사명만 남겨두세요 —
            증권번호·보장 내역은 받지 않습니다.
          </p>
          {INSURANCE_ITEMS.map((item) => (
            <div key={item.key} style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={!!insurance[item.key]?.checked}
                  onChange={(e) =>
                    setInsurance((prev) => ({
                      ...prev,
                      [item.key]: { checked: e.target.checked, company: prev[item.key]?.company || '' },
                    }))
                  }
                />
                {item.label} 가입
              </label>
              {insurance[item.key]?.checked && (
                <input
                  type="text"
                  value={insurance[item.key]?.company || ''}
                  onChange={(e) =>
                    setInsurance((prev) => ({
                      ...prev,
                      [item.key]: { checked: true, company: e.target.value },
                    }))
                  }
                  className="form-input"
                  placeholder="가입 회사명만 (예: OO생명)"
                  style={{ marginLeft: '1.6rem', width: 'calc(100% - 1.6rem)' }}
                />
              )}
            </div>
          ))}
          <button type="button" className="btn" disabled style={prepSaveButtonStyle}>
            저장 (준비 중)
          </button>
        </div>

        {/* ⑦ 중요 연락처·반려동물 — 06-04 §6.1 ⑦ */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            <Users color="var(--point-color)" /> 중요 연락처 · 반려동물
          </h3>
          <div className="form-group">
            <label className="form-label">부고를 꼭 알려야 할 사람</label>
            <textarea
              rows={3}
              value={contactsNote}
              onChange={(e) => setContactsNote(e.target.value)}
              className="form-input"
              style={{ height: 'auto', padding: '1rem' }}
              placeholder="예: 김OO - 대학 동창 - 010-0000-0000 (한 분씩 한 줄로 적어주세요)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">반려동물을 부탁하고 싶은 분</label>
            <input
              type="text"
              value={petCaretaker}
              onChange={(e) => setPetCaretaker(e.target.value)}
              className="form-input"
              placeholder="예: 막내 여동생 김OO"
            />
          </div>
          <button type="button" className="btn" disabled style={prepSaveButtonStyle}>
            저장 (준비 중)
          </button>
        </div>

        {/* ⑧ 유언장 소재 안내 — 06-04 §6.1 ⑧·§6.3. 소재만 받는다 — 원본·사본 업로드 UI를 만들지 않는다. */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            <MapPin color="var(--point-color)" /> 유언장 소재 안내
          </h3>
          <div className="form-group">
            <label className="form-label">자필증서를 어디에 보관했는지 한 줄로</label>
            <input
              type="text"
              value={willLocation}
              onChange={(e) => setWillLocation(e.target.value)}
              className="form-input"
              placeholder="예: 안방 화장대 서랍 안쪽 서류 봉투"
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🔴 이어봄은 유언장 원본·사본을 보관하지 않습니다. 보관 장소만 남겨두세요.
          </p>
          <button type="button" className="btn" disabled style={prepSaveButtonStyle}>
            저장 (준비 중)
          </button>
        </div>

        {/* ⑩ 장기·조직 기증 의향 — 06-04 §6.1 ⑩. ①(연명의료)과 같은 구조 — 등록 여부·등록일까지만
            받고 내용은 보관하지 않는다(국가 등록 제도가 따로 있음). 시신 기증(해부용)은 별개 제도라
            섞지 않는다. */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            <HeartPulse color="var(--point-color)" /> 장기·조직 기증 의향
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            ⚠️ 이어봄은 등록 여부와 등록일만 보관합니다. 실제 등록은 국립장기조직혈액관리원(사랑의
            장기기증운동본부 등 등록기관)에서 본인이 직접 해야 하며, 이어봄은 등록을 대행하지 않습니다.
            🔴 시신 기증(해부용 시신 기증)은 별도 제도입니다 — 이 항목과 섞지 마세요.
          </div>
          <div className="form-group">
            <label className="form-label">장기·조직 기증 등록 여부</label>
            <select value={donationStatus} onChange={(e) => setDonationStatus(e.target.value)} className="form-select">
              <option value="등록함">등록함</option>
              <option value="등록하지 않음">등록하지 않음</option>
              <option value="모름">모름</option>
            </select>
          </div>
          {donationStatus === '등록함' && (
            <div className="form-group">
              <label className="form-label">등록일 (선택)</label>
              <input
                type="date"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="form-input"
              />
            </div>
          )}
          <button type="button" className="btn" disabled style={prepSaveButtonStyle}>
            저장 (준비 중)
          </button>
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

      {/* ⑨ 유언장 초안(2026-08-27 개명) — 06-05 §4.2 정정으로 타이핑 전용 도구로 남는다.
          서버 저장 없음. localStorage 등 브라우저 임시 저장도 하지 않음 */}
      <div style={{ ...cardStyle, filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <h3 style={cardTitleStyle}>
          <ScrollText color="var(--point-color)" /> 유언장 초안
        </h3>

        {/* §6.4-1 2026-08-27 — 이름이 "유언장"에 가까워진 만큼 상시 노출하는 고지 */}
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontWeight: 700 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span>{NOT_A_WILL_NOTICE}</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          직접 입력한 내용을 자필증서 유언장을 손으로 옮겨 쓸 때 참고하는 초안으로 씁니다.
        </p>

        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span>
            이 초안은 저장되지 않습니다. 인쇄하거나 복사해 두세요.
            마음을 전하고 싶으시면 유족 메시지 보관함을 이용해 주세요.
          </span>
        </div>

        {/* 작업2 — 데스크톱은 초안 입력과 4대 요건을 2단으로, 모바일은 세로 스택(auto-fit라
            가로 스크롤 없이 640px 이하에서 자동으로 1열이 된다, FarewellMessagePage·
            DomainOverviewPage와 같은 기법). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">초안 (직접 입력)</label>
            <textarea
              rows={10}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="form-input"
              style={{ height: 'auto', padding: '1rem', fontSize: largeText ? '1.15rem' : '1rem', lineHeight: 1.7 }}
              placeholder="여기에 직접 입력해 주세요."
            />
          </div>

          <div>
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
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.9rem', marginTop: '0.9rem' }}>
              이 초안을 보고 직접 손으로 옮겨 쓰십시오. 컴퓨터로 작성한 문서는 자필증서 유언장으로 인정되지 않습니다.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
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
      </div>
    </div>
  );
};
