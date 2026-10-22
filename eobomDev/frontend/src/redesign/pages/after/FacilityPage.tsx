import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RdButton } from '../../parts/RdButtons';
import { RdPagerNumbered } from '../../parts/RdCards';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdChips, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdPageHead } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdAlertDialog, RdDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronRight, IconGrid, IconHome, IconList, IconMap, IconPin, IconSend, IconSliders, IconSearch } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { TAG_CATALOG, TAG_GROUP_LABEL, tagsForGroup, type SelectedTags, type TagGroup } from '../../../components/facility/tagCatalog';
import { InquiryDialog } from './InquiryDialog';
import { LocationBox, type LocationState } from './LocationBox';
import { MapDialog } from './MapDialog';
import { DEMO_FACILITIES, PREVIEW_DISTRICTS, PREVIEW_PROVINCES, type DemoFacility } from './facilityData';
import './after.css';

// 8단계 묶음 5 · /preview/facility — 2단계 캔버스 판 2-6(카드형) · 2-7(리스트형) · 2-8(상태·필터 판) + 상담 창(2-9) · 지도 창(2-10).
// 시설·거리는 예시(facilityData.ts). 서버·위치 없이 움직인다. 시설명을 누르면 업체 자세히 보기(/preview/facility/:id)로 간다.

const CATEGORY_LABEL: Record<string, string> = { 전체: '전체', 장례식장: '장례식장', '묘지/수목장': '묘지/봉안당/수목장' };

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본 (위치 확인됨)' },
  { value: 'login', label: '로그인 전' },
  { value: 'checking', label: '위치 확인 중', group: '위치' },
  { value: 'fallback', label: '위치 기본값', group: '위치' },
  { value: 'failed', label: '위치 확인 실패', group: '위치' },
  { value: 'err-notfound', label: '위치 검색 오류, 해당 위치를 찾을 수 없음', group: '위치' },
  { value: 'err-search', label: '위치 검색 오류, 검색 중 오류', group: '위치' },
  { value: 'loading', label: '결과 불러오는 중', group: '결과' },
  { value: 'empty', label: '결과 없음', group: '결과' },
  { value: 'error', label: '불러오기 실패', group: '결과' },
  { value: 'noleads', label: '[상담] 누르면 "문의를 받지 않는 시설" 알림', group: '창' },
  { value: 'map-loading', label: '지도 창, 불러오는 중', group: '창' },
  { value: 'map-failed', label: '지도 창, 불러오지 못함', group: '창' },
  { value: 'inq-noconsent', label: '상담 창, 동의하지 않고 전송', group: '창' },
  { value: 'inq-servererr', label: '상담 창, 서버 오류', group: '창' },
];

const labelOf = (t: string) => TAG_CATALOG[t].label;

function TagRows({ category, selected, onChange }: { category: string; selected: SelectedTags; onChange: (n: SelectedTags) => void }) {
  const any = (selected.owner?.length ?? 0) + (selected.kind?.length ?? 0) > 0;
  return (
    <div className="rd-af-tags">
      {(['owner', 'kind'] as TagGroup[]).map((g) => {
        const values = tagsForGroup(g, category);
        return (
          <div className="rd-af-tags__row" key={g}>
            <span className="rd-af-tags__name">{TAG_GROUP_LABEL[g]}</span>
            <RdChips
              label={TAG_GROUP_LABEL[g]}
              multiple
              options={values.map((v) => `#${labelOf(v)}`)}
              value={(selected[g] ?? []).filter((v) => values.includes(v)).map((v) => `#${labelOf(v)}`)}
              onChange={(next) => onChange({ ...selected, [g]: values.filter((v) => next.includes(`#${labelOf(v)}`)) })}
            />
            {g === 'kind' && any && (
              <button type="button" className="rd-af-tags__clear" onClick={() => onChange({})}>모두 해제</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 모바일 필터 판 안의 칩: # 없이, 한 줄 옆으로 밀어 넘김 */
function SheetChips({ group, category, selected, onChange }: { group: TagGroup; category: string; selected: SelectedTags; onChange: (n: SelectedTags) => void }) {
  const values = tagsForGroup(group, category);
  return (
    <div className="rd-af-sheet__group">
      <p className="rd-af-sheet__name">{TAG_GROUP_LABEL[group]}</p>
      <RdChips
        label={TAG_GROUP_LABEL[group]}
        multiple
        options={values.map(labelOf)}
        value={(selected[group] ?? []).filter((v) => values.includes(v)).map(labelOf)}
        onChange={(next) => onChange({ ...selected, [group]: values.filter((v) => next.includes(labelOf(v))) })}
      />
    </div>
  );
}

export function FacilityPage() {
  const phone = useIsPhone();
  const [demo, setDemo] = useState('normal');
  const [view, setView] = useState<'card' | 'list'>('card');
  const [page, setPage] = useState(1);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('전체');
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<SelectedTags>({});
  const [applied, setApplied] = useState({ province: '', district: '', category: '전체', query: '', tags: {} as SelectedTags });
  const [searching, setSearching] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [mapOf, setMapOf] = useState<DemoFacility | null>(null);
  const [inquiry, setInquiry] = useState<DemoFacility | null>(null);
  const [noLeads, setNoLeads] = useState(false);

  const loc: LocationState = demo === 'checking' ? 'checking' : demo === 'fallback' ? 'fallback' : demo === 'failed' ? 'failed' : 'real';
  const locName = loc === 'fallback' ? '서울 중구' : '인천 연수구';
  const locError = demo === 'err-notfound' ? '해당 위치를 찾을 수 없습니다.' : demo === 'err-search' ? '위치 검색 중 오류가 발생했습니다.' : undefined;

  const filtered = useMemo(() => {
    if (demo === 'empty' || demo === 'error' || demo === 'loading') return [];
    const q = applied.query.trim();
    return DEMO_FACILITIES.filter((x) => {
      if (applied.province && x.province !== applied.province) return false;
      if (applied.district && x.district !== applied.district) return false;
      if (applied.category !== '전체' && x.type !== applied.category) return false;
      if (q && !x.name.includes(q) && !x.location.includes(q)) return false;
      for (const g of ['owner', 'kind'] as TagGroup[]) {
        const want = applied.tags[g];
        if (want && want.length > 0 && !want.some((t) => x.tags.includes(t))) return false;
      }
      return true;
    });
  }, [demo, applied]);

  // 미리보기는 시설이 12곳뿐이라 쪽당 건수를 줄여 쪽 넘김을 보인다(실제 화면은 카드 24/8 · 리스트 30/15)
  const perPage = view === 'list' ? (phone ? 4 : 6) : phone ? 3 : 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const cur = Math.min(page, totalPages);
  const shown = filtered.slice((cur - 1) * perPage, cur * perPage);

  const run = async (close?: boolean) => {
    setSearching(true);
    await sleep(500);
    setApplied({ province, district, category, query, tags });
    setPage(1);
    setSearching(false);
    if (close) setSheet(false);
  };

  const summary = [
    loc === 'checking' ? '위치 확인 중...' : loc === 'failed' ? '위치 확인 실패' : province ? `${province}${district ? ' ' + district : ''}` : locName,
    category === '전체' ? '전체' : CATEGORY_LABEL[category],
    [...(tags.owner ?? []), ...(tags.kind ?? [])].map(labelOf).join('·'),
  ].filter(Boolean).join(' · ');
  const hasFilter = !!applied.province || applied.category !== '전체' || (applied.tags.owner?.length ?? 0) + (applied.tags.kind?.length ?? 0) > 0;

  const ask = (x: DemoFacility) => {
    if (demo === 'noleads') setNoLeads(true);
    else setInquiry(x);
  };
  const bar = <DemoBar value={demo} options={DEMOS} onChange={(v) => { setDemo(v); setMapOf(null); setInquiry(null); setNoLeads(false); setPage(1); }} />;

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title="장사시설 검색" icon={<IconHome />} />
        <div className="rd-af-gatebox"><RdLoginGate screenName="장사시설 검색" contained /></div>
        {bar}
      </div>
    );
  }

  const pickProvince = (v: string) => { setProvince(v); setDistrict(''); };
  const catSelect = (
    <RdSelect aria-label="구분" value={category} onChange={(e) => { setCategory(e.target.value); setTags((t) => ({ ...t, kind: [] })); }}>
      {Object.keys(CATEGORY_LABEL).map((c) => (
        <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
      ))}
    </RdSelect>
  );

  const body = (() => {
    if (demo === 'loading') return <RdState kind="working" title="검색 중..." />;
    if (demo === 'error') return <RdState kind="offline" title="서버에 연결하지 못했습니다"><RdButton place="row" onClick={() => setDemo('normal')}>다시 시도</RdButton></RdState>;
    if (filtered.length === 0) return <RdState kind="empty" title="조건에 맞는 시설이 없습니다." />;
    return null;
  })();

  const headCount = demo === 'error' ? 0 : filtered.length;

  return (
    <div className="rd-container rd-screen">
      <RdPageHead title="장사시설 검색" icon={<IconHome />} />

      {!phone && (
        <>
          <RdNotice tone="info" title="가까운 장례식장을 먼저 보여드리기 위해 현재 위치를 사용합니다. 허용하지 않아도 아래에서 지역을 직접 선택할 수 있습니다." />
          <LocationBox
            state={loc}
            name={locName}
            provinces={PREVIEW_PROVINCES}
            districts={province ? PREVIEW_DISTRICTS[province] ?? [] : []}
            province={province}
            district={district}
            onProvince={pickProvince}
            onDistrict={setDistrict}
            query={query}
            onQuery={setQuery}
            onSearch={() => run()}
            busy={searching}
            searchLabel="시설명·지역 검색"
            searchPlaceholder="시설 이름 또는 지역명으로 검색"
            extra={catSelect}
            error={locError}
          />
          <TagRows category={category} selected={tags} onChange={setTags} />
        </>
      )}

      {phone && (
        <div className="rd-af-msearch">
          <div className="rd-af-msearch__row">
            <RdInput
              aria-label="시설명·지역 검색"
              placeholder="시설 이름 또는 지역명으로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
            />
            <button type="button" className="rd-af-msearch__filter" aria-label={hasFilter ? '필터 열기, 조건 적용 중' : '필터 열기'} onClick={() => setSheet(true)}>
              <IconSliders />
              {hasFilter && <span className="rd-af-msearch__dot" aria-hidden="true" />}
            </button>
          </div>
          <button type="button" className="rd-af-msearch__sum" onClick={() => setSheet(true)}>
            <IconPin size={17} />
            <span>{summary}</span>
            <IconChevronRight />
          </button>
        </div>
      )}

      <div className="rd-af-count">
        <p>
          총 <b>{headCount}개</b> 시설이 검색되었습니다. ({cur}/{totalPages} 페이지)
        </p>
        <div className="rd-af-view" role="group" aria-label="보기 방식">
          <button type="button" aria-pressed={view === 'card'} onClick={() => { setView('card'); setPage(1); }}><IconGrid />카드형</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => { setView('list'); setPage(1); }}><IconList />리스트형</button>
        </div>
      </div>

      {body ?? (
        <>
          {view === 'card' ? (
            <div className="rd-af-facs">
              {shown.map((x) => (
                <article className="rd-card rd-card--flat rd-af-fac" key={x.id}>
                  <div className="rd-af-fac__top">
                    <span className="rd-card__eyebrow">{x.type === '묘지/수목장' ? '묘지/봉안당/수목장' : x.type}</span>
                    <span className="rd-af-km" title="지도상 직선거리입니다. 실제 이동 거리는 카카오맵에서 확인해주세요.">{x.distanceKm.toFixed(1)} km</span>
                  </div>
                  <h3 className="rd-card__title">
                    <Link className="rd-af-fac__name" to={`/preview/facility/${x.id}`} state={{ distanceKm: x.distanceKm }}>{x.name}</Link>
                  </h3>
                  <p className="rd-af-fac__addr">{x.location}</p>
                  {!phone && (
                    <div className="rd-af-fac__tags">
                      {x.tags.map((t) => {
                        const g = TAG_CATALOG[t].group;
                        const on = !!tags[g]?.includes(t);
                        return (
                          <button
                            type="button"
                            key={t}
                            className="rd-chip rd-af-fac__tag"
                            aria-pressed={on}
                            title={`"${labelOf(t)}" 태그로 걸러보기`}
                            onClick={() => {
                              const next = { ...tags, [g]: on ? (tags[g] ?? []).filter((v) => v !== t) : [...(tags[g] ?? []), t] };
                              setTags(next);
                              setApplied((a) => ({ ...a, tags: next }));
                              setPage(1);
                            }}
                          >
                            <span>#{labelOf(t)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="rd-card__foot rd-af-fac__foot">
                    <RdButton kind="secondary" place="row" className="rd-af-fac__btn" onClick={() => setMapOf(x)}><IconMap />카카오 지도</RdButton>
                    <RdButton place="row" className="rd-af-fac__btn" onClick={() => ask(x)}><IconSend />상담</RdButton>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ul className="rd-list rd-af-flist">
              {shown.map((x) => (
                <li className="rd-list__li rd-af-frow" key={x.id}>
                  <div className="rd-af-frow__main">
                    <Link className="rd-af-fac__name rd-af-frow__name" to={`/preview/facility/${x.id}`} state={{ distanceKm: x.distanceKm }}>{x.name}</Link>
                    <span className="rd-af-frow__addr">{!phone && <IconPin size={14} />}{x.location}</span>
                  </div>
                  <RdButton kind="secondary" place="row" className="rd-af-frow__btn" aria-label={`${x.name} 카카오 지도`} onClick={() => setMapOf(x)}>
                    <IconMap size={18} />{!phone && '카카오 지도'}
                  </RdButton>
                  <RdButton place="row" className="rd-af-frow__btn" aria-label={`${x.name} 상담`} onClick={() => ask(x)}>
                    <IconSend size={18} />{!phone && '상담'}
                  </RdButton>
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 && <RdPagerNumbered page={cur} total={totalPages} onChange={setPage} />}
        </>
      )}

      {bar}

      {sheet && (
        <RdDialog
          title="필터"
          onClose={() => setSheet(false)}
          footer={<RdButton place="dialog" busy={searching} busyText="검색 중..." onClick={() => run(true)}><IconSearch />적용하고 검색</RdButton>}
        >
          <div className="rd-formstack">
            <LocationBox
              state={loc}
              name={locName}
              provinces={PREVIEW_PROVINCES}
              districts={province ? PREVIEW_DISTRICTS[province] ?? [] : []}
              province={province}
              district={district}
              onProvince={pickProvince}
              onDistrict={setDistrict}
              query={query}
              onQuery={setQuery}
              onSearch={() => run(true)}
              searchLabel="시설명·지역 검색"
              searchPlaceholder="시설 이름 또는 지역명으로 검색"
              error={locError}
              compact
            />
            <div className="rd-af-sheet__group">
              <p className="rd-af-sheet__name">구분</p>
              {catSelect}
            </div>
            <SheetChips group="owner" category={category} selected={tags} onChange={setTags} />
            <SheetChips group="kind" category={category} selected={tags} onChange={setTags} />
          </div>
        </RdDialog>
      )}

      {mapOf && (
        <MapDialog
          facility={mapOf}
          distanceKm={mapOf.distanceKm}
          forceState={demo === 'map-loading' ? 'loading' : demo === 'map-failed' ? 'failed' : undefined}
          onClose={() => setMapOf(null)}
        />
      )}
      {inquiry && (
        <InquiryDialog
          kind="facility"
          name={inquiry.name}
          demo={{ noConsent: demo === 'inq-noconsent', serverError: demo === 'inq-servererr' }}
          onClose={() => setInquiry(null)}
        />
      )}
      {noLeads && <RdAlertDialog title="이 시설은 아직 문의를 받지 않습니다." onOk={() => setNoLeads(false)} />}
    </div>
  );
}
