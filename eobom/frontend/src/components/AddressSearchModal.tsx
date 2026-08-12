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

interface AddressSearchModalProps {
  onSelect: (address: string) => void;
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
          onSelect(data.roadAddress || data.jibunAddress);
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
