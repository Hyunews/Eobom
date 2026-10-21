import React, { useEffect, useRef } from 'react';
import { KAKAO_CHANNEL_CHAT_URL, CONTACT_EMAIL } from '../../config';
import { PART1_ITEMS, PART1_TITLE, PART2_ITEMS, PART2_TITLE } from '../nav';
import { RdItem } from './RdMenuPanel';
import { KakaoIcon } from './KakaoIcon';

interface Props {
  onClose: () => void;
  onLogin?: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled])';

/** 모바일 메뉴 펼침 — 전체 화면 판. 머리와 [로그인]은 고정, 가운데만 스크롤(연락처 묶음이 바닥글을 대신한다). */
export function RdMenuSheet({ onClose, onLogin }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc로 닫고, Tab이 판 밖으로 나가지 않게 가둔다.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const els = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="rd-sheet" role="dialog" aria-modal="true" aria-label="메뉴" ref={ref} onKeyDown={onKeyDown}>
      <div className="rd-sheet__bar">
        <a href="/" className="rd-logo">이어봄</a>
        <button type="button" className="rd-menu-btn" style={{ display: 'inline-flex' }} aria-label="메뉴 닫기" ref={closeRef} onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B2620" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="rd-sheet__scroll">
        <nav aria-label="주 메뉴">
          <a href="/" className="rd-sheet__home" onClick={onClose}>홈</a>
          <p className="rd-sheet__title">{PART1_TITLE}</p>
          {PART1_ITEMS.map((it, i) => (
            <RdItem key={it.label} item={it} no={i + 1} onNavigate={onClose} />
          ))}
          <p className="rd-sheet__title">{PART2_TITLE}</p>
          {PART2_ITEMS.map((it, i) => (
            <RdItem key={it.label} item={it} no={i + 1} onNavigate={onClose} />
          ))}
        </nav>

        <section className="rd-contact" aria-label="연락처">
          <a href={KAKAO_CHANNEL_CHAT_URL} className="rd-kakao" target="_blank" rel="noopener noreferrer">
            <KakaoIcon />카카오톡으로 문의하기
          </a>
          <span className="rd-contact__hours">평일 09:00~17:00 (공휴일 제외)</span>
          <a href="tel:07088562725" className="rd-contact__row">
            <span className="rd-contact__name">대표번호</span>
            <span className="rd-contact__tel">070-8856-2725</span>
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="rd-contact__row">
            <span className="rd-contact__name">이메일</span>
            <span className="rd-contact__mail">{CONTACT_EMAIL}</span>
          </a>
          <div className="rd-contact__legal">
            <a href="/terms">이용약관</a>
            <a href="/privacy">개인정보 처리방침</a>
            <a href="/partner">파트너 로그인</a>
          </div>
        </section>
      </div>

      <div className="rd-sheet__foot">
        <button type="button" className="rd-sheet__login" onClick={onLogin}>로그인</button>
      </div>
    </div>
  );
}
