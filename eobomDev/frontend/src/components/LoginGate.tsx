import React from 'react';
import { LogIn } from 'lucide-react';
import { EobomLogo } from './EobomLogo';

// 00-34 §2.4 결정 ② (09-29) — 로그인이 필요한 화면의 비로그인 "가림판". 모든 화면이 같은 모양·같은 문구.
// 🔴 카드 내용은 로고 + 제목(두 줄) + 버튼뿐(이모지·설명 줄·화면별 문구 없음). 닫기 없음 — 버튼만 로그인 창을 연다.
// 🔴 실제 본문 컴포넌트는 렌더하지 않는다(비로그인 API 호출 0) — 뒤 배경은 그 화면의 제목·부제목과
// 회색 자리표시 줄일 뿐이다. 스타일은 design-v2.css `.v2-login-gate*`.
interface LoginGateProps {
  title: string;
  subtitle?: string;
  onOpenLogin?: () => void;
}

const PLACEHOLDER_WIDTHS = ['92%', '78%', '85%', '64%', '88%'];

export const LoginGate: React.FC<LoginGateProps> = ({ title, subtitle, onOpenLogin }) => (
  <div className="v2-page v2-login-gate">
    <div className="v2-login-gate-overlay">
      <div className="v2-login-gate-card">
        <div className="v2-login-gate-logo">
          <EobomLogo variant="symbol" height={44} />
        </div>
        <h2 className="v2-login-gate-title">
          로그인이 필요한<br />회원 전용 서비스입니다.
        </h2>
        <button type="button" onClick={onOpenLogin} className="v2-btn-primary v2-login-gate-btn">
          <LogIn size={20} /> 로그인 / 회원가입 하러가기
        </button>
      </div>
    </div>

    <div className="v2-page-head v2-login-gate-blur" aria-hidden="true">
      <h1 className="v2-page-title">{title}</h1>
      {subtitle && <p className="v2-page-subtitle">{subtitle}</p>}
    </div>

    <div className="v2-content v2-login-gate-blur" aria-hidden="true">
      {PLACEHOLDER_WIDTHS.map((w, i) => (
        <div key={i} className="v2-login-gate-line" style={{ width: w }} />
      ))}
    </div>
  </div>
);
