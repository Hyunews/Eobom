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
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#5B7065" /> KISA 기준 최고 등급 보안 암호화
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="#9CA3AF" /> 서비스 이용약관
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#9CA3AF" /> 개인정보 처리방침
            </li>
          </ul>
        </div>

        {/* 열 3: 고객센터 & 긴급콜 */}
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
            <Phone size={18} color="#D4A359" /> 고객센터 &amp; 24h 긴급콜
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
            365일 24시간 긴급 장례 지도사 즉시 파견 시스템
          </p>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '1.5rem auto 0 auto',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#6B7280'
        }}
      >
        Copyright © 2026 이어봄 (Eobom) Total Care Platform. All rights reserved.
        {' · '}
        <Link to="/partner" style={{ color: '#6B7280', textDecoration: 'underline' }}>
          장사시설·전문가 파트너이신가요?
        </Link>
      </div>
    </footer>
  );
};
