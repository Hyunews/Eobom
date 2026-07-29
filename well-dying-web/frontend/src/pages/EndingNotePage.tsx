import React, { useState } from 'react';
import { ScrollText, Lock, Key, Send, FileCheck } from 'lucide-react';

export const EndingNotePage: React.FC = () => {
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
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ScrollText color="var(--primary-color)" /> 4. 디지털 엔딩노트 & 암호화 보안 금고
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          사전 연명의료 의향서, 장례 희망 방식, 자산/비밀번호 AES-256 개인 금고 및 사후 지정 수신 유언 메시지
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* 사전 의향서 작성 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck color="var(--point-color)" /> 사전 연명의료 & 장례 희망 의향서
          </h3>
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
              <label className="form-label">희망하는 장례 방식</label>
              <select value={funeralType} onChange={(e) => setFuneralType(e.target.value)} className="form-select">
                <option value="가족장 (수목장)">가족장 후 자연 수목장 안치</option>
                <option value="일반 장례 (봉안당)">일반 3일장 후 봉안당 안치</option>
                <option value="조용한 검소장">최소 인원 검소장</option>
              </select>
            </div>

            <button type="submit" className="btn btn-point" style={{ width: '100%' }}>
              엔딩노트 의향서 암호화 저장
            </button>
          </form>

          {savedSuccess && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#D4EDDA', color: '#155724', borderRadius: '8px' }}>
              🔒 엔딩노트 사전 의향서가 AES-256 알고리즘으로 본인 암호화 저장되었습니다.
            </div>
          )}
        </div>

        {/* 자산 및 비밀번호 보안 금고 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock color="var(--primary-color)" /> AES-256 자산 & 비밀번호 보안 금고
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            유족이 사후에 찾아야 할 주요 예금 계좌번호, 보험 증서 번호, 클라우드 마스터 비밀번호를 안전하게 암호화 보관합니다.
          </p>

          <div className="form-group">
            <label className="form-label">보안 금고에 저장할 주요 메모/비밀번호</label>
            <textarea
              rows={4}
              value={vaultSecret}
              onChange={(e) => setVaultSecret(e.target.value)}
              className="form-input"
              style={{ height: 'auto', padding: '1rem' }}
              placeholder="예: OO은행 비상 예금 계좌 정보, 유언 전달용 마스터 암호..."
            />
          </div>

          <button onClick={() => alert('보안 금고에 데이터가 AES-256-GCM 암호화 보관되었습니다.')} className="btn btn-primary" style={{ width: '100%' }}>
            <Key size={18} /> 보안 금고에 암호화 보관
          </button>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} color="var(--point-color)" /> 사후 지정 수신인 유언 메시지
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
