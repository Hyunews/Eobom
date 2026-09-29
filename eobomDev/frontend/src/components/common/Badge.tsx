import React from 'react';

// Sidebar(모드별 메뉴)가 쓰는 상태 배지 — 00-26 §3 규격(00-23 §8.3과 동일).
// 원래 home/EntryBoxes.tsx에 있었으나 그 파일이 삭제되며(00-40 §3.3 C6 이후 미사용) 여기로 옮겼다.
export const Badge: React.FC<{ status: 'preview' | 'comingSoon' }> = ({ status }) => {
  const preview = status === 'preview';
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: 'var(--fs-body)',
        fontWeight: 700,
        padding: '0.2rem 0.55rem',
        borderRadius: 'var(--r-sm)',
        color: preview ? '#475569' : '#94A3B8',
        backgroundColor: preview ? 'var(--secondary-dark)' : 'var(--surface-subtle)',
      }}
    >
      {preview ? '미리보기' : '준비 중'}
    </span>
  );
};
