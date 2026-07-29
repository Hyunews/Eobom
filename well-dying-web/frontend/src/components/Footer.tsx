import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--primary-color)',
      color: '#DFDCD7',
      padding: '3rem 2rem 2rem 2rem',
      marginTop: '4rem',
      borderTop: '5px solid var(--point-color)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        <div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '1rem' }}>🌿 K-Ending 토탈 케어</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
            생전 준비(엔딩노트, 상속)부터 임종 직후(장례, 묘지) 및 사후 정리(디지털 유품, 사망 행정)까지 단일 플랫폼에서 완결하는 한국형 디지털 엔딩 정보 서비스입니다.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '1rem' }}>고객센터 & 24h 긴급콜</h4>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--point-light)', marginBottom: '0.5rem' }}>
            📞 1588-0000
          </p>
          <p style={{ fontSize: '0.9rem' }}>365일 24시간 긴급 장례 지도사 즉시 파동 시스템</p>
        </div>
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '1rem' }}>보안 & 약관</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', lineHeight: 2 }}>
            <li>🔒 KISA 개인정보 암호화 (AES-256-GCM)</li>
            <li>📜 서비스 이용약관</li>
            <li>🛡️ 개인정보 처리방침</li>
          </ul>
        </div>
      </div>
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto 0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#A0AAB2'
      }}>
        Copyright © 2026 K-Ending Total Care Platform. All rights reserved.
      </div>
    </footer>
  );
};
