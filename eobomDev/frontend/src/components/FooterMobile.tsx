import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { EobomLogo } from './EobomLogo';

// 2026-09-09 — 사용자 지시. 데스크톱 Footer(4열 그리드, Footer.tsx)를 모바일 폭에 그대로
// 쌓으면 4섹션이 완전히 펼쳐져 본문보다 길어진다. 로고+카카오 CTA만 먼저 보이고 약관·대표번호는
// 아코디언으로 접어 둔다. 열림/닫힘 상태기계가 생겨 Footer.tsx에서 분리했다(00-38 §6.5).
export const FooterMobile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer
      style={{
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        padding: '1.75rem 1.5rem 0',
        marginTop: '2rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.1rem' }}>
        <EobomLogo variant="symbol" height={38} />
      </div>

      <a
        href="https://pf.kakao.com/_LVxdxaX/chat"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%',
          height: 'var(--min-touch-target)',
          backgroundColor: '#FEE500',
          color: '#191919',
          borderRadius: 'var(--r-sm)',
          fontSize: '1rem',
          fontWeight: 700,
          textDecoration: 'none',
          marginBottom: '0.55rem'
        }}
      >
        <MessageCircle size={18} /> 카카오톡으로 문의하기
      </a>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
        평일 09:00 ~ 17:00
      </p>

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3rem',
          width: '100%',
          background: 'none',
          border: 'none',
          borderTop: '1px dashed var(--border-color)',
          padding: '0.6rem 0',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--point-color)',
          cursor: 'pointer'
        }}
      >
        약관 · 대표번호 안내 {isOpen ? '접기' : '보기'}
        <ChevronDown size={14} className={`footer-mobile-toggle-icon${isOpen ? ' open' : ''}`} />
      </button>

      <div className={`footer-mobile-panel${isOpen ? ' open' : ''}`}>
        <div style={{ padding: '0.3rem 0.25rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <Link to="/terms" style={{ color: 'var(--primary-color)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              서비스 이용약관
            </Link>
            <span style={{ color: 'var(--border-color)' }}>·</span>
            <Link to="/privacy" style={{ color: 'var(--primary-color)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              개인정보 처리방침
            </Link>
          </div>
          사업장·전문가 문의, 개인정보 열람·삭제:<br />070-8856-2725
        </div>
      </div>

      <div
        style={{
          paddingTop: '0.9rem',
          marginTop: '0.4rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          paddingBottom: '1.3rem'
        }}
      >
        Copyright © 2026 이어봄 (Eobom) Total Care Platform. All rights reserved.
      </div>
    </footer>
  );
};
