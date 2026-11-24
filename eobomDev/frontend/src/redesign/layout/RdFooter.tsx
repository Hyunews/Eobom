import React from 'react';
import { KAKAO_CHANNEL_CHAT_URL, CONTACT_EMAIL } from '../../config';
import { KakaoIcon } from './KakaoIcon';

/** 00-44 §5-5 바닥글 — 데스크톱 두 줄 띠. 모바일은 바닥글을 만들지 않는다(CSS로 숨김, 연락처는 메뉴 판). */
export function RdFooter() {
  return (
    // 세로 flex 바로 아래 자식에 margin auto를 주면 폭이 내용만큼 줄어든다 — 블록 감싸개로 헤더와 같은 폭을 낸다.
    <div className="rd-footer-wrap">
    <footer className="rd-container rd-footer">
      <div className="rd-footer__row1">
        <div className="rd-footer__links">
          <a href="/" className="rd-footer__brand">이어봄</a>
          <a href="/terms">이용약관</a>
          <a href="/privacy">개인정보 처리방침</a>
          <a href="/partner">파트너 로그인</a>
        </div>
        <a href={KAKAO_CHANNEL_CHAT_URL} className="rd-kakao" target="_blank" rel="noopener noreferrer">
          <KakaoIcon />카카오톡으로 문의하기
        </a>
      </div>
      <div className="rd-footer__row2">
        <div className="rd-footer__facts">
          <span>대표번호 <b>070-8856-2725</b> (사업장·개인정보 요청)</span>
          <span className="rd-footer__sep" aria-hidden="true">·</span>
          <span>이메일 {CONTACT_EMAIL}</span>
          <span className="rd-footer__sep" aria-hidden="true">·</span>
          <span>평일 09:00~17:00 (공휴일 제외)</span>
        </div>
        <span>© 2026 이어봄</span>
      </div>
    </footer>
    </div>
  );
}
