import React from 'react';
import { Phone, ShieldCheck, FileText, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--primary-color)',
      color: '#D1D5DB',
      padding: '3.5rem 2rem 2rem 2rem',
      marginTop: '4rem',
      borderTop: '5px solid var(--point-color)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '3rem',
        alignItems: 'start'
      }}>
        {/* 열 1: 플랫폼 소개 */}
        <div>
          <h3 style={{ 
            color: '#FFFFFF', 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            lineHeight: 1.2
          }}>
            🌿 DEWD 토탈 케어
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#9CA3AF', margin: 0 }}>
            생전 준비(엔딩노트, 상속)부터 임종 직후(장례, 묘지) 및 사후 정리(디지털 유품, 사망 행정)까지 단일 플랫폼에서 완결하는 한국형 디지털 엔딩 정보 서비스입니다.
          </p>
        </div>

        {/* 열 2: 보안 & 약관 */}
        <div>
          <h3 style={{ 
            color: '#FFFFFF', 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            lineHeight: 1.2
          }}>
            <Lock size={18} color="#60A5FA" /> 보안 & 약관
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            fontSize: '0.9rem', 
            lineHeight: 1.9,
            color: '#9CA3AF'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#34D399" /> KISA 기준 최고 등급 보안 암호화
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
          <h3 style={{ 
            color: '#FFFFFF', 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            lineHeight: 1.2
          }}>
            <Phone size={18} color="var(--point-light)" /> 고객센터 & 24h 긴급콜
          </h3>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: 'var(--point-light)', 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            letterSpacing: '0.02em',
            lineHeight: 1.2
          }}>
            1588-0000
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#9CA3AF', margin: 0 }}>
            365일 24시간 긴급 장례 지도사 즉시 파견 시스템
          </p>
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '2.5rem auto 0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#6B7280'
      }}>
        Copyright © 2026 DEWD Total Care Platform. All rights reserved.
      </div>
    </footer>
  );
};
