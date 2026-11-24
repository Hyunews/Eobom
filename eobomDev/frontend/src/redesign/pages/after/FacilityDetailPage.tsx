import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../../../config';
import { isFilterableTag, TAG_CATALOG } from '../../../components/facility/tagCatalog';
import { RdButton } from '../../parts/RdButtons';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdSaveBar } from '../../parts/RdInputs';
import { RdAlertDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronLeft, IconMap, IconSend } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { InquiryDialog } from './InquiryDialog';
import { MapDialog } from './MapDialog';
import { DEMO_FACILITIES, DEMO_PUBLIC_DETAIL } from './facilityData';
import './after.css';

// 8단계 묶음 5 · /preview/facility/:id — 업체 자세히 보기. 2단계 캔버스 판 2-25(제휴) · 2-26(비제휴) · 2-27(상태), 정본 01-01 §5.
// id가 example-partner / example-public이면 예시 자료를, 그 밖이면 서버 GET /api/facilities/:id/detail(공개 칸만)을 부른다.

interface Detail {
  id: string;
  name: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
  tags: string[];
  amenities: string[];
  religion: string;
  guests: string;
  isPartner: boolean;
  /** 사업자가 쓴 소개 글. 서버 칸은 묶음 10 스키마 전이라 null */
  intro: string | null;
}

type Load = { kind: 'loading' } | { kind: 'ok'; data: Detail } | { kind: 'failed' } | { kind: 'missing' };

const DEFAULT_RELIGION = '전체 종교';
const DEFAULT_GUESTS = '전체 규모';

const DEMOS: DemoOption[] = [
  { value: 'auto', label: '주소의 id대로 (example-partner · example-public은 예시, 그 밖은 서버 조회)' },
  { value: 'partner', label: '제휴 시설 예시' },
  { value: 'public', label: '비제휴 시설 예시' },
  { value: 'login', label: '로그인 전', group: '상태' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'failed', label: '불러오기 실패', group: '상태' },
  { value: 'missing', label: '없는 시설', group: '상태' },
];

export function FacilityDetailPage() {
  const { id = '' } = useParams();
  const fromSearch = (useLocation().state as { distanceKm?: number } | null)?.distanceKm ?? null;
  const phone = useIsPhone();
  const [demo, setDemo] = useState('auto');
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  const [map, setMap] = useState(false);
  const [asking, setAsking] = useState(false);
  const [noLeads, setNoLeads] = useState(false);

  useEffect(() => {
    if (demo === 'login') return;
    if (demo === 'loading') return setLoad({ kind: 'loading' });
    if (demo === 'failed') return setLoad({ kind: 'failed' });
    if (demo === 'missing') return setLoad({ kind: 'missing' });
    const wantPartner = demo === 'partner' || (demo === 'auto' && id === 'example-partner');
    const wantPublic = demo === 'public' || (demo === 'auto' && id === 'example-public');
    const sample = wantPartner ? DEMO_FACILITIES[0] : wantPublic ? DEMO_PUBLIC_DETAIL : null;
    if (sample) return setLoad({ kind: 'ok', data: sample });
    let dead = false;
    setLoad({ kind: 'loading' });
    fetch(`${BACKEND_URL}/api/facilities/${encodeURIComponent(id)}/detail`)
      .then(async (res) => {
        if (res.status === 404) return !dead && setLoad({ kind: 'missing' });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        if (!dead) setLoad({ kind: 'ok', data: body.data as Detail });
      })
      .catch(() => !dead && setLoad({ kind: 'failed' }));
    return () => {
      dead = true;
    };
  }, [demo, id, tick]);

  const bar = <DemoBar value={demo} options={DEMOS} onChange={setDemo} />;
  const back = (
    <Link className="rd-link rd-af-back" to="/preview/facility">
      <IconChevronLeft size={16} />
      <span>검색 결과로</span>
    </Link>
  );

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <div className="rd-af-gatebox"><RdLoginGate screenName="장사시설 검색" contained /></div>
        {bar}
      </div>
    );
  }

  if (load.kind !== 'ok') {
    return (
      <div className="rd-container rd-screen">
        {back}
        {load.kind === 'loading' && <p className="rd-lineinfo" role="status">불러오는 중...</p>}
        {load.kind === 'failed' && (
          <RdState kind="offline" title="시설 정보를 불러오지 못했습니다" desc="잠시 후 다시 시도해 주세요.">
            <RdButton place="row" onClick={() => (demo === 'failed' ? setDemo('auto') : setTick((t) => t + 1))}>다시 시도</RdButton>
          </RdState>
        )}
        {load.kind === 'missing' && (
          <RdState kind="empty" title="시설을 찾을 수 없습니다" desc="주소를 다시 확인해 주세요." link={<Link className="rd-link" to="/preview/facility"><span>검색 결과로</span></Link>} />
        )}
        {bar}
      </div>
    );
  }

  const f = load.data;
  const typeLabel = f.type === '묘지/수목장' ? '묘지/봉안당/수목장' : f.type;
  // 소개 글: 제휴 시설이고 글이 있을 때. 운영자 숨김 칸은 묶음 10 스키마라 아직 없다 → 칸이 없으면 보인다(01-01 §5.7 #3)
  const introHidden = false;
  const showIntro = f.isPartner && !!f.intro && !introHidden;
  // 시설 정보: 기본값 종교·수용 규모는 감추고, 하나도 없으면 칸 전체를 감춘다(01-01 §5.2)
  const rows: { name: string; node: React.ReactNode }[] = [];
  if (f.religion && f.religion !== DEFAULT_RELIGION) rows.push({ name: '종교', node: f.religion });
  if (f.guests && f.guests !== DEFAULT_GUESTS) rows.push({ name: '수용 규모', node: f.guests });
  if (f.amenities.length > 0) {
    rows.push({
      name: '부대시설',
      node: (
        <span className="rd-af-chips">
          {f.amenities.map((a) => (
            <span className="rd-af-chip rd-af-chip--fill" key={a}>{a}</span>
          ))}
        </span>
      ),
    });
  }
  const tags = f.tags.filter(isFilterableTag);
  const ask = () => (f.isPartner ? setAsking(true) : setNoLeads(true));

  return (
    <div className="rd-container rd-screen">
      {back}

      <header className="rd-af-dhead">
        <span className="rd-card__eyebrow">{typeLabel}</span>
        <h1 className="rd-t-title">{f.name}</h1>
        {tags.length > 0 && (
          <div className="rd-af-chips">
            {tags.map((t) => (
              <span className="rd-af-chip" key={t}>#{TAG_CATALOG[t].label}</span>
            ))}
          </div>
        )}
      </header>

      <div className="rd-af-detail">
        <div className="rd-af-detail__main">
          {showIntro && (
            <section className="rd-af-block">
              <h2 className="rd-card__title">소개</h2>
              <p className="rd-af-block__text">{f.intro}</p>
            </section>
          )}
          {rows.length > 0 && (
            <section className="rd-af-block">
              <h2 className="rd-card__title">시설 정보</h2>
              <dl className="rd-af-facts rd-af-facts--wide">
                {rows.map((r) => (
                  <div key={r.name}>
                    <dt>{r.name}</dt>
                    <dd>{r.node}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="rd-af-detail__side">
          <section className="rd-af-block">
            <h2 className="rd-card__title">위치</h2>
            <div className="rd-af-place">
              <p className="rd-af-block__text">{f.location}</p>
              {fromSearch !== null && (
                <span className="rd-af-km" title="지도상 직선거리입니다. 실제 이동 거리는 카카오맵에서 확인해주세요.">{fromSearch.toFixed(1)} km</span>
              )}
            </div>
            <RdButton kind="secondary" className="rd-af-wide" onClick={() => setMap(true)}><IconMap />카카오 지도</RdButton>
          </section>
          {!phone && <RdButton className="rd-af-wide" onClick={ask}><IconSend />상담</RdButton>}
        </aside>
      </div>

      {phone && (
        <RdSaveBar>
          <RdButton place="bar" onClick={ask}><IconSend />상담</RdButton>
        </RdSaveBar>
      )}

      {bar}

      {map && <MapDialog facility={f} distanceKm={fromSearch} onClose={() => setMap(false)} />}
      {asking && <InquiryDialog kind="facility" name={f.name} onClose={() => setAsking(false)} />}
      {noLeads && <RdAlertDialog title="이 시설은 아직 문의를 받지 않습니다." onOk={() => setNoLeads(false)} />}
    </div>
  );
}
