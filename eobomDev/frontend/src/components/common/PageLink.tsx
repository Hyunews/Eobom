import React from 'react';
import { useNavigate } from 'react-router-dom';

// 00-34 §2.2 (09-29 결정) — 페이지로 이동하는 메뉴·버튼은 링크, 동작은 버튼.
// 보통 클릭은 예전 그대로(onNavigate), Ctrl·⌘·Shift·휠 클릭은 브라우저 기본(새 탭).
// 🔴 로그인이 필요한 곳으로 가는 링크를 비로그인 상태에서 `<a>`로 만들면 우클릭 "새 탭에서 열기"를
// 코드로 막을 수 없다 → 그 경우엔 링크 자체를 만들지 않고 `<button>`으로 그려 로그인 창만 연다.

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

  if (loginRequired && !currentUser) {
    return (
      <button type="button" className={className} style={style} onClick={() => onOpenLogin?.()} {...rest}>
        {children}
      </button>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; // 브라우저 기본(새 탭)
    e.preventDefault();
    if (onNavigate) onNavigate();
    else navigate(to);
  };

  return (
    <a href={to} className={cls} style={style} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
