import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// 다음(카카오) 우편번호 서비스 — 별도 API 키 없이 무료로 쓸 수 있는 공개 주소검색 위젯.
// 도로명 주소를 정확히 선택하게 해서 관리자·전문가가 직접 타이핑하며 생기는 주소 오탈자를 없앤다.
declare global {
  interface Window {
    daum: any;
  }
}

const POSTCODE_SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

// 00-28 §3.4 — 우편번호(zonecode)도 필요한 화면(회원 프로필)이 생기면서 문자열 하나였던
// onSelect를 객체로 넓혔다. 상세주소는 이 위젯이 안 받는 값이라 여기 포함하지 않는다 —
// 폼에서 별도 입력칸으로 받는다(§3.3). ⚠️ 호출부를 고칠 땐 두 곳(AdminPage.tsx·
// PartnerPortalPage.tsx)을 같은 커밋에서 동반 수정할 것 — 한쪽만 고치면 타입이 깨진다.
export interface AddressSearchResult {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

interface AddressSearchModalProps {
  onSelect: (address: AddressSearchResult) => void;
  onClose: () => void;
}

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({ onSelect, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    const embed = () => {
      if (cancelled || !containerRef.current || !window.daum?.Postcode) return;
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          if (cancelled) return;
          onSelect({ zonecode: data.zonecode, roadAddress: data.roadAddress, jibunAddress: data.jibunAddress });
          onClose();
        },
        width: '100%',
        height: '100%',
      }).embed(containerRef.current);
    };

    if (window.daum?.Postcode) {
      embed();
    } else {
      const existing = document.querySelector(`script[src="${POSTCODE_SCRIPT_SRC}"]`);
      if (!existing) {
        const script = document.createElement('script');
        script.src = POSTCODE_SCRIPT_SRC;
        script.async = true;
        script.onload = embed;
        document.head.appendChild(script);
      } else {
        pollInterval = setInterval(() => {
          if (window.daum?.Postcode) {
            if (pollInterval) clearInterval(pollInterval);
            embed();
          }
        }, 100);
      }
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [onSelect, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1rem',
          width: '440px',
          maxWidth: '100%',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.8rem',
            right: '0.8rem',
            border: 'none',
            background: 'var(--bg-card)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={18} color="var(--primary-color)" />
        </button>
        <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.1rem', color: 'var(--primary-color)' }}>주소 검색</h3>
        <div ref={containerRef} style={{ width: '100%', height: '420px' }} />
      </div>
    </div>
  );
};
