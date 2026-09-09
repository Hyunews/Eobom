import React from 'react';
import { Info } from 'lucide-react';

// 06-05 §4.3 원문 복원(00-38 §8.1-1 ⓒ, 2026-09-08) — 기존 코드(FarewellMessagePage.tsx:127)는
// "지정하신 분에게 전달됩니다"만 있고 "재산 분배·상속에 관한 내용은 남기지 마세요" 절반이
// 빠져 있었다. 09-08 톤 조정(경고 amber → 안내 중립, 원형 i 아이콘)은 색·아이콘에 대한
// 지시였지 문구 삭제 지시가 아니었다 — 06-05 §4.3 원문으로 복원한다.
// Desktop·Mobile 두 뷰가 위치만 다르게(상단 고정 / 컴포저 바로 위) 이 컴포넌트를 그대로 쓴다.
export const FarewellNotice: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-muted)',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--r-sm)',
      padding: 'var(--sp-4) 1rem',
      lineHeight: 1.6,
      ...style,
    }}
  >
    <Info size={18} color="var(--point-color)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
    <span>
      여기에 남기신 글과 음성은 <strong style={{ color: 'var(--primary-color)' }}>사망 확인 후 지정하신 분에게 전달</strong>됩니다.{' '}
      재산 분배·상속에 관한 내용은 <strong style={{ color: 'var(--primary-color)' }}>남기지 마세요</strong> — 유언의 효력이 없고 유족 간 다툼의 씨앗이 됩니다.
    </span>
  </div>
);
