import React from 'react';
import { useNavigate } from 'react-router-dom';

// 00-34 §2.2 (09-29 결정) — 페이지로 이동하는 메뉴·버튼은 링크, 동작은 버튼.
// 보통 클릭은 예전 그대로(onNavigate), Ctrl·⌘·Shift·휠 클릭은 브라우저 기본(새 탭).
// 🔄 09-29 정정(00-34 §2.4) — 로그인 여부와 무관하게 항상 `<a>`. 보통 클릭만 비로그인+loginRequired면
// 로그인 창을 열고, 새 탭(Ctrl·휠·우클릭)은 막지 않는다(도착한 화면이 스스로 로그인을 요구한다).

// App.setActiveTab이 만드는 경로 규칙과 같아야 한다(tab==='home' ? '/' : `/${tab}`).
export const tabPath = (tab: string) => (tab === 'home' ? '/' : `/${tab}`);

interface PageLinkProps {
  to: string;
  // 보통 클릭 때 실행할 기존 로직(스크롤 저장·모드 지정·드로어 닫기 등). 없으면 navigate(to).
  onNavigate?: () => void;
  loginRequired?: boolean;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  // 새 탭으로 여는 링크(로그인 게이트 없음) — target="_blank" rel="noopener noreferrer".
  newTab?: boolean;
  // 'button'(기본): 예전 <button>과 똑같이 보이도록 UA 기본 모양을 되살린다.
  // 'plain': 예전이 div·span이던 곳 — 글자색·밑줄만 지운다. (index.css `.page-link*`)
  look?: 'button' | 'plain';
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  'aria-label'?: string;
  children?: React.ReactNode;
}

export const PageLink: React.FC<PageLinkProps> = ({
  to,
  onNavigate,
  loginRequired,
  currentUser,
  onOpenLogin,
  newTab,
  look = 'button',
  className,
  style,
  children,
  ...rest
}) => {
  const navigate = useNavigate();
  const cls = `page-link page-link--${look}${className ? ` ${className}` : ''}`;

  if (newTab) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} style={style} {...rest}>
        {children}
      </a>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented) return;
    // ① 보조키·휠 등 — 로그인 여부와 무관하게 브라우저 기본(새 탭). 새 탭에서의 로그인 요구는
    // 도착한 화면이 한다(00-34 §2.4 결정 ②). 휠 클릭은 auxclick으로 와서 이 onClick을 타지 않는다.
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    // ② 보통 클릭 + 로그인 필요 + 비로그인 → 이동하지 않고 지금 창에 로그인 창
    if (loginRequired && !currentUser) {
      onOpenLogin?.();
      return;
    }
    // ③ 보통 클릭
    if (onNavigate) onNavigate();
    else navigate(to);
  };

  return (
    <a href={to} className={cls} style={style} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
