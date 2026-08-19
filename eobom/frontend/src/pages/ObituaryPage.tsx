import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

// 08-19 8차(개발자 직접 지시) — CareGuidePage에 얹혀 있던 "모바일 부고장 간편 작성"을
// 별도 도메인/메뉴로 분리. 상중 케어 체크리스트(07)는 07-02 원칙상 로그인 없이 열람돼야 하지만,
// 부고장 "전송"은 별개 기능이라 로그인 게이트를 그대로 유지한다(domainSlides.tsx obituary,
// modeNav.ts BEREAVED_MENU).

interface ObituaryPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const ObituaryPage: React.FC<ObituaryPageProps> = ({ currentUser, onOpenLogin }) => {
  const [deceasedName, setDeceasedName] = useState('홍길동');
  const [mournerName, setMournerName] = useState('홍상주');
  const [funeralPlace, setFuneralPlace] = useState('서울 평안 장례식장 201호');

  const handleSendObituary = () => {
    if (!currentUser) {
      alert('⚠️ 모바일 부고장 전송 서비스는 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    // 05 디지털 추모관이 열리기 전까지는 부고장에 추모 페이지 링크를 넣을 수 없다
    // (memorial 상태 comingSoon). 오픈되면 이 알림을 카카오톡 API 연동 + 추모 페이지 링크
    // 동봉으로 교체한다(개발자 지시, 2026-08-19).
    alert('💬 [개발중] 카카오톡 부고장 공유 API 연동 기능 개발 중입니다.');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            padding: '0.3rem 0.8rem',
            borderRadius: '16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.6rem',
          }}
        >
          <MessageSquare size={18} color="#03543F" /> 모바일 부고장
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <MessageSquare color="var(--point-color)" size={32} /> 모바일 부고장 작성
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          부고 정보를 입력하고 카카오톡으로 간편하게 전송하세요.
        </p>
      </div>

      <div
        style={{
          maxWidth: '480px',
          backgroundColor: 'var(--card-bg)',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--box-shadow)',
        }}
      >
        <div className="form-group">
          <label className="form-label">고인 성함</label>
          <input type="text" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">상주 성함</label>
          <input type="text" value={mournerName} onChange={(e) => setMournerName(e.target.value)} className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">빈소 위치</label>
          <input type="text" value={funeralPlace} onChange={(e) => setFuneralPlace(e.target.value)} className="form-input" />
        </div>

        <div
          style={{
            marginTop: '1.1rem',
            padding: '1.2rem',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h4 style={{ color: 'var(--primary-color)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>📱 생성된 부고장 프리뷰</h4>
          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            [부고] {deceasedName} 님께서 별세하셨기에 아래와 같이 부고를 전합니다.<br />
            • 상주: {mournerName}<br />
            • 빈소: {funeralPlace}<br />
            • 마음 전하실 곳: 카카오뱅크 3333-xx-xxxx
          </div>
          <button onClick={handleSendObituary} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            카카오톡 부고장 전송하기 (개발중)
          </button>
        </div>
      </div>
    </div>
  );
};
