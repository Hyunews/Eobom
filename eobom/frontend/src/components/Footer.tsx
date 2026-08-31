import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, ShieldCheck, FileText, Lock, MessageCircle } from 'lucide-react';
import { EobomLogo } from './EobomLogo';

// 2026-08-24 — Header.tsx(A안: 흰 배경 + 평면 메뉴)와 같은 톤으로 재개편. 기존 짙은 네이비 블록
// 대신 배경을 투명하게 둔다 — HomePage.tsx 섹션2(에필로그)에서는 그 위에 fullpage_03 배경 사진이
// 깔려 있어 Footer까지 사진이 자연스럽게 이어져 보이고, 다른 페이지(App.tsx)에서는 페이지 배경색
// (--secondary-color, 크림)이 그대로 비쳐 보여 어느 쪽이든 위화감이 없다.
// isFullPageSnap(둥근 카드로 띄우는 변형)은 실제로 어디서도 true로 넘겨진 적 없는 죽은 분기였고,
// 짙은 배경을 전제로 한 그림자·라운딩이라 투명 배경 디자인과 맞지 않아 이번에 정리했다.
export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        padding: '2.5rem 1.75rem 1.75rem',
        marginTop: '2rem',
        borderTop: '1px solid var(--border-color)',
        width: '100%'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          // min(260px,100%) — 최소 지원 폭 280px에서 고정 260px 트랙이 가로 스크롤을 유발하지
          // 않게 한다(.auto-grid·ObituaryPage.tsx와 같은 패턴, 2026-08-25).
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: '1.4rem',
          alignItems: 'start'
        }}
      >
        {/* 열 1: 플랫폼 소개 — Header.tsx와 같은 밝은 배경용 심볼(variant="symbol")로 통일 */}
        <div>
          <div style={{ marginBottom: '0rem' }}>
            <EobomLogo variant="symbol" height={34} />
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
            생전 준비(엔딩노트, 상속)부터 임종 직후(장례, 묘지) 및 사후 정리(디지털 유품, 사망 행정)까지 단일 플랫폼에서 완결하는 웰다잉 토탈 케어 정보 서비스입니다.
          </p>
        </div>

        {/* 열 2: 보안 & 약관 */}
        <div>
          <h3
            style={{
              color: 'var(--primary-color)',
              fontSize: '1.05rem',
              fontWeight: 700,
              marginBottom: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              lineHeight: 1.2
            }}
          >
            <Lock size={18} color="var(--point-color)" /> 보안 &amp; 약관
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.88rem',
              lineHeight: 1.9,
              color: 'var(--text-muted)'
            }}
          >
            {/* "KISA 기준 최고 등급 보안 암호화" 문구 제거(00-14 §2.5(2-7), 2026-08-18 개발자 확정) —
                그런 등급 제도가 존재하지 않고 ISMS-P 미인증 상태에서 인증 사칭으로 읽힘. 대체 문구
                없이 제거하며, 실제 보안 조치가 갖춰지면 그때 추가한다(00-18 §2.3). */}
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/terms" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                <FileText size={16} color="var(--text-muted)" /> 서비스 이용약관
              </Link>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/privacy" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                <ShieldCheck size={16} color="var(--text-muted)" /> 개인정보 처리방침
              </Link>
            </li>
          </ul>
        </div>

        {/* 열 3: 대표번호(전화) — "24h 긴급콜·즉시 파견"은 받을 사람이 없는 약속이라
            제거함(00-14 §2-4 → 07-02 §5.3, 2026-08-14 정정). 창구를 성격으로 분리
            (07-02 §5.4-1, 2026-08-28) — 사업자·개인정보 요청=전화 / 일반 이용자(유족)=카카오톡.
            대표번호·고객문의를 별개 박스로 분리(2026-08-31). */}
        <div>
          <h3
            style={{
              color: 'var(--primary-color)',
              fontSize: '1.05rem',
              fontWeight: 700,
              marginBottom: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              lineHeight: 1.2
            }}
          >
            <Phone size={18} color="var(--point-color)" /> 대표번호
          </h3>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--primary-color)',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}
          >
            070-8856-2725
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
            사업장·전문가 문의 · 개인정보 열람·삭제 요청
          </p>
        </div>

        {/* 열 4: 고객 문의(카카오톡) — 채널 URL·응답시간 값은 §5.4-2-2 확정. */}
        <div>
          <h3
            style={{
              color: 'var(--primary-color)',
              fontSize: '1.05rem',
              fontWeight: 700,
              marginBottom: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              lineHeight: 1.2
            }}
          >
            <MessageCircle size={18} color="var(--point-color)" /> 고객 문의
          </h3>
          <a
            href="https://pf.kakao.com/_LVxdxaX/chat"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'var(--min-touch-target)',
              padding: '0 1.5rem',
              backgroundColor: '#FEE500',
              color: '#191919',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              marginBottom: '0.5rem'
            }}
          >
            💬 카카오톡으로 문의하기
          </a>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
            평일 09:00 ~ 17:00
          </p>
        </div>
      </div>

      {/* 파트너 진입 링크 삭제(개발자 확정, 2026-08) — 파트너 진입은 LoginModal 하단 분기로도
          가능하다(00-06 §7.3 ①). 링크 제거로 비어난 자리만큼 카피라이트 줄 여백도 같이 줄인다. */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '1.1rem auto 0 auto',
          paddingTop: '0.9rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}
      >
        Copyright © 2026 이어봄 (Eobom) Total Care Platform. All rights reserved.
      </div>
    </footer>
  );
};
