import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, ShieldCheck, FileText, Lock } from 'lucide-react';
import { EobomLogo } from './EobomLogo';

interface FooterProps {
  isFullPageSnap?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isFullPageSnap = false }) => {
  return (
    <footer
      style={{
        backgroundColor: '#1A2B4C',
        color: '#D1D5DB',
        padding: isFullPageSnap ? '1.75rem 1.75rem 1.3rem 1.75rem' : '2.25rem 1.5rem 1.5rem 1.5rem',
        marginTop: isFullPageSnap ? 0 : '2.75rem',
        borderRadius: isFullPageSnap ? '24px' : 0,
        boxShadow: isFullPageSnap ? '0 16px 40px rgba(26, 43, 76, 0.15)' : 'none',
        borderTop: isFullPageSnap ? '4px solid var(--accent-gold)' : '5px solid var(--point-color)',
        maxWidth: isFullPageSnap ? '1200px' : '100%',
        width: '100%',
        margin: isFullPageSnap ? '0 auto' : '2.75rem 0 0 0'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.75rem',
          alignItems: 'start'
        }}
      >
        {/* 열 1: 플랫폼 소개 */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <EobomLogo variant="footer" height={36} />
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#9CA3AF', margin: 0 }}>
            생전 준비(엔딩노트, 상속)부터 임종 직후(장례, 묘지) 및 사후 정리(디지털 유품, 사망 행정)까지 단일 플랫폼에서 완결하는 웰다잉 토탈 케어 정보 서비스입니다.
          </p>
        </div>

        {/* 열 2: 보안 & 약관 */}
        <div>
          <h3
            style={{
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 700,
              marginBottom: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              lineHeight: 1.2
            }}
          >
            <Lock size={18} color="#D4A359" /> 보안 &amp; 약관
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.88rem',
              lineHeight: 1.9,
              color: '#9CA3AF'
            }}
          >
            {/* "KISA 기준 최고 등급 보안 암호화" 문구 제거(00-14 §2.5(2-7), 2026-08-18 개발자 확정) —
                그런 등급 제도가 존재하지 않고 ISMS-P 미인증 상태에서 인증 사칭으로 읽힘. 대체 문구
                없이 제거하며, 실제 보안 조치가 갖춰지면 그때 추가한다(00-18 §2.3). */}
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/terms" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                <FileText size={16} color="#9CA3AF" /> 서비스 이용약관
              </Link>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/privacy" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                <ShieldCheck size={16} color="#9CA3AF" /> 개인정보 처리방침
              </Link>
            </li>
          </ul>
        </div>

        {/* 열 3: 고객센터 — "24h 긴급콜·즉시 파견"은 받을 사람이 없는 약속이라 제거함
            (00-14 §2-4 → 07-02 §5.3, 2026-08-14 정정). 응답 가능 시간은 아직 사장님 확정 전이라
            임의로 명시하지 않는다(07-02 §7 미결 #4). */}
        <div>
          <h3
            style={{
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 700,
              marginBottom: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              lineHeight: 1.2
            }}
          >
            <Phone size={18} color="#D4A359" /> 고객센터
          </h3>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#D4A359',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}
          >
            1588-0000
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#9CA3AF', margin: 0 }}>
            장사시설·장례 절차 관련 문의는 전화로 안내해드립니다.
          </p>
        </div>
      </div>

      {/* 파트너 진입 링크 — 카피라이트 줄(법적 고지, 스캔에서 빠짐)에서 분리해 본문 정보로
          승격(00-06 §7.3 ②). 열 2(보안 & 약관)와 같은 0.88rem. */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '1.5rem auto 0 auto',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}
      >
        <Link to="/partner" style={{ fontSize: '0.88rem', color: '#D1D5DB', textDecoration: 'underline', fontWeight: 600 }}>
          장사시설·전문가 파트너이신가요? →
        </Link>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0.9rem auto 0 auto',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#6B7280'
        }}
      >
        Copyright © 2026 이어봄 (Eobom) Total Care Platform. All rights reserved.
      </div>
    </footer>
  );
};
