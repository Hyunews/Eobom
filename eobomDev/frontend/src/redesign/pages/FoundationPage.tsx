import React from 'react';

// 묶음 1 확인용 — 색·글자·폭 값을 눈으로 대조하는 쪽. 부품(버튼·입력 등)은 묶음 2의 /preview/parts.
const COLORS: { name: string; value: string; use: string }[] = [
  { name: '바탕', value: '#F4EEE3', use: '화면 전체' },
  { name: '종이', value: '#FBF8F2', use: '카드·창·입력칸' },
  { name: '테두리', value: '#DDD3C2', use: '칸 테두리·구분선' },
  { name: '그림자', value: '#E6DCCB', use: '종이 카드의 어긋난 그림자' },
  { name: '먹색', value: '#2B2620', use: '제목·본문·주 버튼' },
  { name: '보조 글자', value: '#5A5046', use: '설명·도움말' },
  { name: '작은 글자', value: '#6E6255', use: '날짜·출처·바닥글' },
  { name: '포인트 갈색', value: '#7A5634', use: '아이콘·링크·초점' },
  { name: '점선', value: '#B9AC98', use: '목록 줄 사이' },
  { name: '위험', value: '#9A3B2E', use: '지우기·탈퇴·기한 임박' },
  { name: '완료', value: '#4F6B3A', use: '저장됨·끝냄' },
  { name: '눌린 바탕', value: '#EDE5D6', use: '고른 줄·마우스 올림' },
  { name: '입력칸 테두리', value: '#8A7E70', use: '입력칸·체크 상자 테두리' },
];

export function FoundationPage({ notFound }: { notFound?: boolean }) {
  return (
    <div className="rd-container rd-pv">
      <div className="rd-pv__head">
        <p className="rd-t-eyebrow">8단계 · 묶음 1</p>
        <h1 className="rd-t-title">{notFound ? '미리보기 주소가 없습니다' : '기반 — 색 · 글자 · 폭'}</h1>
        <p className="rd-t-support">
          {notFound ? '/preview 로 이동하세요.' : '이 쪽은 값 확인용입니다. 메뉴·링크에 연결하지 않습니다.'}
        </p>
      </div>

      {!notFound && (
        <>
          <section className="rd-pv__block" aria-labelledby="pv-color">
            <h2 className="rd-t-section" id="pv-color">색</h2>
            <div className="rd-pv__swatches">
              {COLORS.map((c) => (
                <div className="rd-pv__swatch" key={c.value + c.name}>
                  <div className="rd-pv__chip" style={{ background: c.value }} />
                  <div className="rd-pv__swatch-text">
                    <p className="rd-t-support" style={{ color: 'var(--rd-ink)' }}>{c.name}</p>
                    <p className="rd-t-small">{c.value} · {c.use}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rd-pv__block" aria-labelledby="pv-type">
            <h2 className="rd-t-section" id="pv-type">글자</h2>
            <div className="rd-pv__card rd-pv__card--paper rd-pv__read" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="rd-t-eyebrow">윗글 14 / 13</p>
              <p className="rd-t-title">쪽 제목 36 / 28</p>
              <p className="rd-t-section">구간 제목 24 / 21</p>
              <p className="rd-t-sub">소제목 19 / 18</p>
              <p style={{ margin: 0 }}>본문 17 / 16 — 줄간격 1.7. 한글은 어절 단위로 줄을 바꿉니다.</p>
              <p className="rd-t-support">보조 15 / 14 — 보조 글자색</p>
              <p className="rd-t-small">작은 글 13 — 출처·날짜</p>
            </div>
          </section>

          <section className="rd-pv__block" aria-labelledby="pv-layout">
            <h2 className="rd-t-section" id="pv-layout">레이아웃</h2>
            <div className="rd-pv__card">
              <table className="rd-pv__table">
                <thead>
                  <tr><th>항목</th><th>데스크톱</th><th>모바일(767 이하)</th></tr>
                </thead>
                <tbody>
                  <tr><td>본문 최대 폭</td><td>1120, 가운데</td><td>화면 폭 − 여백</td></tr>
                  <tr><td>좌우 여백</td><td>1280에서 80 · 최소 40</td><td>24</td></tr>
                  <tr><td>구간 사이</td><td>64</td><td>48</td></tr>
                  <tr><td>카드 안 여백</td><td>32</td><td>24</td></tr>
                  <tr><td>모서리</td><td>2</td><td>2</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
