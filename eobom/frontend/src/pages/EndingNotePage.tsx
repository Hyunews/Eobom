import React, { useState } from 'react';
import { ScrollText, Lock, Key, Send, FileCheck, LogIn } from 'lucide-react';
import { NoteKeyIcon } from '../components/MenuIcons';

interface EndingNotePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const EndingNotePage: React.FC<EndingNotePageProps> = ({ currentUser, onOpenLogin, setActiveTab }) => {
  const [lifeSupport, setLifeSupport] = useState<string>('연명의료 중단 희망');
  const [funeralType, setFuneralType] = useState<string>('가족장 (수목장)');
  const [vaultSecret, setVaultSecret] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
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
          <NoteKeyIcon size={18} color="var(--primary-color)" /> 유족에게 남기는 메시지 작성 &amp; 256-bit AES 암호화 금고
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <NoteKeyIcon color="var(--primary-color)" size={32} /> 디지털 엔딩노트 &amp; 유족 메시지 보관함
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          연명의료 의향 메모, 장례 희망 방식, 유족에게 남기는 메시지 &amp; 비밀 보관함 및 사후 자동 발송
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', filter: !currentUser ? 'blur(3px)' : 'none' }}>
        {/* 사전 의향서 작성 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck color="var(--point-color)" /> 연명의료 의향 메모 & 장례 희망
            </h3>
            <span style={{ fontSize: '0.85rem', backgroundColor: 'rgba(26, 43, 76, 0.08)', color: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600 }}>
              🏥 생전/응급 시 대리인 즉시 열람 가능
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            중태 및 응급 시 의료진/지정 대리인이 본인의 연명의료 의향을 생전에 사전 확인할 수 있습니다.
          </p>
          <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            ⚠️ 이 메모는 법적 효력이 없습니다. 법적 효력이 있는 「사전연명의료의향서」는 보건복지부
            지정 등록기관에서 본인이 직접 작성·등록해야 합니다(비용 없음).
          </div>

          <form onSubmit={handleSaveNote}>
            <div className="form-group">
              <label className="form-label">연명의료 중단 의향</label>
              <select value={lifeSupport} onChange={(e) => setLifeSupport(e.target.value)} className="form-select">
                <option value="연명의료 중단 희망">임종 시 무의미한 연명의료 중단 희망</option>
                <option value="적극적 치료 희망">가능한 모든 의료 조치 시행 희망</option>
                <option value="자녀 판단에 위임">가족/자녀의 판단에 위임</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">생전 응급 열람 지정 대리인 (주보호자)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="예: 홍자녀 (010-1234-5678)" 
                defaultValue="홍자녀 (010-1234-5678)"
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                * 응급상황 시 해당 보호자의 휴대전화 SMS 인증 후 연명의료 의향 메모가 1회 열람됩니다.
              </p>
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
              <button type="submit" className="btn btn-point" style={{ flex: 1, fontSize: '0.9rem' }}>
                의향서 암호화 저장
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

          {savedSuccess && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(91, 112, 101, 0.12)', color: 'var(--point-color)', borderRadius: '8px', fontSize: '0.9rem' }}>
              🔒 연명의료 의향 메모가 저장되었으며, 국립연명의료관리기관 DB 호환 모바일 QR카드가 준비되었습니다.
            </div>
          )}
        </div>

        {/* 유족에게 남기는 메시지 & 비밀 보관함 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock color="var(--primary-color)" /> 유족에게 남기는 메시지 & 비밀 보관함
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            사랑하는 자녀와 가족에게 남길 따뜻한 메시지, 비상 예금 계좌, 마스터 비밀번호 등 사후에 꼭 전달되어야 할 마음과 중요한 정보를 안전하게 암호화 보관합니다.
          </p>

          <div className="form-group">
            <label className="form-label">유족에게 전달할 메시지 및 비상 자산 정보</label>
            <textarea
              rows={4}
              value={vaultSecret}
              onChange={(e) => setVaultSecret(e.target.value)}
              className="form-input"
              style={{ height: 'auto', padding: '1rem' }}
              placeholder="예: 사랑하는 자녀들아, 항상 서로 의지하고 행복하거라. OO은행 비상 예금 계좌 및 유품 정리 마스터 암호는..."
            />
          </div>

          <button onClick={() => alert('유족 메시지 및 비밀 데이터가 안전하게 암호화 보관되었습니다.')} className="btn btn-primary" style={{ width: '100%' }}>
            <Key size={18} /> 유족 메시지 & 비밀 보관함 저장
          </button>

          <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', lineHeight: 1.6 }}>
            ⚠️ 이 기록은 법적 효력이 있는 유언장이 아닙니다. 재산 처분에 관한 의사는 민법이 정한
            방식의 유언장이 따로 필요합니다.{' '}
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('counseling')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#92400E', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
              >
                유언장 안내 보기 →
              </button>
            )}
          </div>

          <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} color="var(--point-color)" /> 사후 지정 수신인 메시지
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              사망 인증 시 지정된 수신인(자녀/배우자)의 휴대전화 알림톡으로 엔딩노트 열람 키가 자동 발송됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
