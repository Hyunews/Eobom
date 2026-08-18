import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface LegalDocLayoutProps {
  title: string;
  effectiveDateLabel: string; // 예: "시행일: 추후 공지"
  children: React.ReactNode;
}

// 법적 문서(약관·처리방침) 공용 레이아웃 — docs 00-19 / 00-21의 본문을 그대로 담는 화면.
// 두 문서 다 아직 v0.9 초안이라(docs 00-18 §8.1 게시 게이트 미통과) 상단에 준비중 배너를
// 고정한다. 실제 시행(v1.0) 전환 시 이 배너만 제거하면 된다.
export const LegalDocLayout: React.FC<LegalDocLayoutProps> = ({ title, effectiveDateLabel, children }) => {
  return (
    <div className="container" style={{ maxWidth: '860px', paddingBottom: '4rem' }}>
      <div
        style={{
          backgroundColor: '#FFEDD5',
          border: '2px solid #FDBA74',
          borderRadius: '12px',
          padding: '1rem 1.2rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.7rem'
        }}
      >
        <AlertTriangle color="#9A3412" size={22} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong style={{ color: '#9A3412', fontSize: '0.95rem' }}>시행 준비 중 — 공식 게시본이 아닙니다</strong>
          <p style={{ color: '#9A3412', fontSize: '0.85rem', margin: '0.25rem 0 0 0', lineHeight: 1.6 }}>
            아래 내용은 공식 시행 전 초안이며, 일부 항목은 확정되는 대로 채워집니다.
          </p>
        </div>
      </div>

      <h1 style={{ color: 'var(--primary-color)', fontSize: '1.9rem', margin: '0 0 0.3rem 0' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>{effectiveDateLabel}</p>

      <div style={{ color: 'var(--primary-color)', lineHeight: 1.8 }}>{children}</div>

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <Link to="/" style={{ color: 'var(--point-color)', fontWeight: 600, textDecoration: 'none' }}>
          ← 이어봄 홈으로
        </Link>
      </div>
    </div>
  );
};

// 조(條) 단위 섹션 — 제목(h2) + 본문.
export const LegalArticle: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: '2.25rem' }}>
    <h2 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
      {title}
    </h2>
    <div style={{ fontSize: '0.95rem', color: '#374151' }}>{children}</div>
  </section>
);

// 장(章) 단위 구분 — 여러 조를 묶는 표제.
export const LegalChapter: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <h3
      style={{
        color: '#FFFFFF',
        backgroundColor: 'var(--primary-color)',
        display: 'inline-block',
        fontSize: '0.85rem',
        fontWeight: 700,
        padding: '0.3rem 0.9rem',
        borderRadius: '14px',
        marginBottom: '1.25rem'
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

// 항 번호가 매겨진 목록 — 법령 표기(1. 2. 3.)와 시각적으로 맞춘 순서 목록.
export const LegalList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ol style={{ paddingLeft: '1.4rem', margin: '0 0 0.75rem 0', lineHeight: 1.85 }}>{children}</ol>
);

// 표 — 처리 목적/보유기간 등 표 형태 조항용.
export const LegalTable: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
  <div style={{ overflowX: 'auto', margin: '0.75rem 0 1.25rem 0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                backgroundColor: '#F1F5F9',
                color: 'var(--primary-color)',
                borderBottom: `2px solid var(--border-color)`,
                whiteSpace: 'nowrap'
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
