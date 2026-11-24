import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdInput } from '../../parts/RdInputs';
import { RdAlertDialog, useRdToast } from '../../parts/RdModal';
import { IconPin } from '../../parts/icons';
import { PartnerMain, PartnerShellFor, StatusText } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import { CLAIMS, CLAIM_LABEL, CLAIM_TONE, SEARCH_HITS, type ClaimStatus } from './partnerData';

// 8단계 묶음 10 · /preview/partner/link — 시설 연동. 정본: 01-05 §14-6 · §14-8 · 판 6-7.
// 데스크톱 2열 — 왼쪽 "내 시설 찾아 연동하기"(검색 + 결과 줄 [연동 신청]) / 오른쪽 "연동 신청 현황"(줄 = 시설명 · 상태). 모바일 1열(결과 줄 [연동 신청]은 아래 가득 폭).
// "(이미 연동된 시설)"은 갈색 글, 그 줄에도 [연동 신청]은 그대로(코드 그대로 — 남의 시설이면 서버가 분쟁 건으로 받음 §3.3).

type View = 'ready' | 'noclaims' | 'loading' | 'loadfail' | 'applyfail';
const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본' },
  { value: 'noclaims', label: '신청 현황 없음' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'applyfail', label: '연동 신청 실패 (알림 창)', group: '상태' },
];

type Claim = { id: string; name: string; status: ClaimStatus };

export function PartnerLinkPage() {
  const [view, setView] = useState<View>('ready');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<typeof SEARCH_HITS | null>(null);
  const [searching, setSearching] = useState(false);
  const [claims, setClaims] = useState<Claim[]>(CLAIMS);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [failText, setFailText] = useState<string | null>(null);
  const toast = useRdToast();

  const shownClaims = view === 'noclaims' ? [] : claims;

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    await sleep(500);
    setHits(SEARCH_HITS);
    setSearching(false);
  };

  const apply = async (id: string, name: string) => {
    setApplyingId(id);
    await sleep(600);
    setApplyingId(null);
    if (view === 'applyfail') {
      setFailText('연동 신청에 실패했습니다.');
      return;
    }
    setClaims((all) => (all.some((c) => c.name === name) ? all : [{ id: `n${all.length}`, name, status: 'PENDING' }, ...all]));
    toast.show('연동 신청이 접수되었습니다. 운영자 심사 후 연동됩니다.');
  };

  const loading = view === 'loading';
  const loadfail = view === 'loadfail';

  return (
    <PartnerShellFor current="link">
      <PartnerMain>
        <PartnerTitle>시설 연동</PartnerTitle>
        {loading && <p className="rd-pt-line" role="status">불러오는 중…</p>}
        {loadfail && <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {!loading && !loadfail && (
          <div className="rd-pt-link">
            <section className="rd-pt-linksec" aria-labelledby="lk-find">
              <h2 className="rd-pt-linksec__title" id="lk-find">내 시설 찾아 연동하기</h2>
              <form className="rd-pt-search" onSubmit={search}>
                <RdInput aria-label="시설명" placeholder="시설명으로 검색 (예: OO장례식장)" value={query} onChange={(e) => setQuery(e.target.value)} />
                <RdButton type="submit" place="screen" busy={searching} busyText="검색 중…">검색</RdButton>
              </form>
              {hits && (
                <ul className="rd-pt-hits">
                  {hits.map((h) => (
                    <li className="rd-pt-hit" key={h.id}>
                      <div className="rd-pt-hit__text">
                        <span className="rd-pt-hit__name">{h.name}</span>
                        <span className="rd-pt-hit__region">
                          <IconPin size={14} />
                          {h.region}
                          {h.linked && <span className="rd-pt-hit__linked">(이미 연동된 시설)</span>}
                        </span>
                      </div>
                      <RdButton kind="secondary" place="row" busy={applyingId === h.id} busyText="신청 중…" onClick={() => apply(h.id, h.name)}>연동 신청</RdButton>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rd-pt-linksec" aria-labelledby="lk-status">
              <h2 className="rd-pt-linksec__title" id="lk-status">연동 신청 현황</h2>
              {shownClaims.length === 0 ? (
                <p className="rd-pt-line">신청한 연동이 없습니다.</p>
              ) : (
                <ul className="rd-pt-claims">
                  {shownClaims.map((c) => (
                    <li className="rd-pt-claim" key={c.id}>
                      <span className="rd-pt-claim__name">{c.name}</span>
                      <StatusText tone={CLAIM_TONE[c.status]}>{CLAIM_LABEL[c.status]}</StatusText>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
        <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
      </PartnerMain>
      {toast.node}
      {failText && <RdAlertDialog title={failText} onOk={() => setFailText(null)} />}
    </PartnerShellFor>
  );
}
