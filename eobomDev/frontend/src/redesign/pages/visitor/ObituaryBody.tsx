import React from 'react';
import { formatKST, formatDeathDate } from '../../../utils/obituaryCard';
import { IconArrowOut } from '../../parts/icons';
import { Chrysanthemum, VsFoot } from './visitorParts';
import type { ExObituary } from './visitorData';
import './visitor.css';

// 8단계 묶음 6 · 부고장 받은 화면 본문(판 3-1·3-2). 구조는 지금 components/ObituaryView.tsx와 같고 틀·값만 새 디자인이다
// (07-03 §6.3-2). 묶음 5의 "조문객 화면 미리보기" 창(/preview/obituary)에도 이 컴포넌트가 그대로 들어간다.
// 데스크톱·모바일은 같은 DOM이고 CSS가 가른다(유족 한 줄/한 줄씩 · 전화 걸기).

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

const IconFlower = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="2" />
    <path d="M12 10v12" />
    <path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z" />
    <path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z" />
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" />
  </svg>
);

function Row({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rd-vs-row">
      <span className="rd-vs-row__label">{label}</span>
      <div className="rd-vs-row__value">{children}</div>
      {action}
    </div>
  );
}

export function ObituaryBody({
  data,
  feedback,
  onCopy,
}: {
  data: ExObituary;
  /** [링크 복사] 결과 글. 없으면 보이지 않는다 */
  feedback?: { ok: boolean; text: string } | null;
  /** 없으면 [링크 복사]를 두지 않는다 — 관리 화면 안 "조문객 화면 미리보기" 창이 그렇다(지금 ObituaryView의 slug 없음과 같다) */
  onCopy?: () => void;
}) {
  const chief = data.mourners.find((m) => m.isChief);
  const rest = data.mourners.filter((m) => !m.isChief);
  // 지금 ObituaryView와 같은 길찾기 주소(좌표가 없어 검색 주소를 쓴다).
  const mapQuery = [data.funeralHall, data.funeralHallAddr].filter(Boolean).join(' ');
  const kakaoMapUrl = mapQuery ? `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}` : null;

  return (
    <div className="rd-vs-wrap">
      <article className="rd-vs-card">
        <header className="rd-vs-head">
          {onCopy && (
            <button type="button" className="rd-vs-copy" onClick={onCopy}>
              <IconCopy />
              링크 복사
            </button>
          )}
          {onCopy && feedback && (
            <p role="status" className={`rd-vs-copy-note${feedback.ok ? '' : ' is-fail'}`}>
              {feedback.text}
            </p>
          )}
          <Chrysanthemum className="rd-vs-flower" />
          <p className="rd-vs-lede">삼가 고인의 명복을 빕니다</p>
          <h1 className="rd-vs-name">故 {data.deceasedName}</h1>
          {data.deceasedDeathDate && <p className="rd-vs-death">{formatDeathDate(data.deceasedDeathDate)} 별세</p>}
        </header>

        <section className="rd-vs-sec">
          <h2 className="rd-vs-sec__title">장례 일정</h2>
          {data.funeralHall && (
            <Row
              label="빈소"
              action={
                kakaoMapUrl && (
                  <a href={kakaoMapUrl} target="_blank" rel="noreferrer" className="rd-vs-go">
                    길찾기
                    <IconArrowOut size={14} />
                  </a>
                )
              }
            >
              <div className="rd-vs-stack">
                <div>
                  {data.funeralHall}
                  {data.mourningRoom ? ` ${data.mourningRoom}` : ''}
                </div>
                {data.funeralHallAddr && <div className="rd-vs-addr">{data.funeralHallAddr}</div>}
              </div>
            </Row>
          )}
          {data.coffinAt && <Row label="입관">{formatKST(data.coffinAt)}</Row>}
          <Row label="발인">{formatKST(data.funeralAt)}</Row>
          {data.burialSite && <Row label="장지">{data.burialSite}</Row>}
        </section>

        <section className="rd-vs-sec">
          <h2 className="rd-vs-sec__title">상주·유족</h2>
          {chief && <Row label="상주">{chief.relationship} {chief.name}</Row>}
          {rest.length > 0 && (
            <Row label="유족">
              <div className="rd-vs-people rd-vs-only-phone">
                {rest.map((m) => (
                  <div key={`${m.relationship}-${m.name}`}>{m.relationship} {m.name}</div>
                ))}
              </div>
              <span className="rd-vs-only-desktop">{rest.map((m) => `${m.relationship} ${m.name}`).join(' · ')}</span>
            </Row>
          )}
          {data.contactPhone && (
            <Row
              label="연락처"
              action={
                // 전화 걸기는 모바일에서만(데스크톱은 번호만) — 번호와 같은 줄 오른쪽 끝
                <a href={`tel:${data.contactPhone}`} className="rd-vs-go rd-vs-only-phone">
                  <IconPhone />
                  전화 걸기
                </a>
              }
            >
              {data.contactPhone}
            </Row>
          )}
        </section>

        {data.account && (
          <section className="rd-vs-sec">
            <h2 className="rd-vs-sec__title">마음 전하실 곳</h2>
            <Row label="계좌">
              <div className="rd-vs-stack">
                <div>{data.account.bankName} {data.account.accountNumber}</div>
                <div className="rd-vs-addr">예금주 {data.account.holder}</div>
              </div>
            </Row>
          </section>
        )}
      </article>

      {data.memorialSlug && (
        // 추모관 들어가기 — 카드 밖, 카드 아래 14(그림자 6 + 8)
        <a href="#" onClick={(e) => e.preventDefault()} className="rd-vs-memorial-btn">
          <IconFlower />
          추모관 들어가기
        </a>
      )}

      <VsFoot updated={formatKST(data.updatedAt)} />
    </div>
  );
}

/** 불러오는 중 — 본문과 같은 자리에 회색 뼈대(종이 카드 안). 추모관 버튼 자리는 카드 밖. 판 3-3. */
export function ObituarySkeleton() {
  return (
    <div className="rd-vs-wrap" role="status" aria-label="불러오는 중">
      <div className="rd-vs-card">
        <div>
          <div className="rd-vs-sk" style={{ width: 160, height: 13, marginBottom: 8 }} />
          <div className="rd-vs-sk" style={{ width: 190, height: 28 }} />
        </div>
        <div className="rd-vs-sec">
          {[0, 1].map((i) => (
            <div key={i} className="rd-vs-row">
              <div className="rd-vs-row__label"><div className="rd-vs-sk" style={{ width: 32, height: 13 }} /></div>
              <div className="rd-vs-row__value"><div className="rd-vs-sk" style={{ width: '70%', height: 16 }} /></div>
            </div>
          ))}
        </div>
        <div className="rd-vs-sec">
          <div className="rd-vs-row">
            <div className="rd-vs-row__label"><div className="rd-vs-sk" style={{ width: 32, height: 13 }} /></div>
            <div className="rd-vs-row__value"><div className="rd-vs-sk" style={{ width: '45%', height: 16 }} /></div>
          </div>
        </div>
      </div>
      <div className="rd-vs-sk rd-vs-sk--btn" />
    </div>
  );
}
