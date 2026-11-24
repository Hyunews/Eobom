import React, { useMemo, useState } from 'react';
import estateVendors from '../../../mockData/estateVendors.json';
import { RdButton } from '../../parts/RdButtons';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdPageHead } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdAlertDialog, RdDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconPin } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { InquiryDialog } from './InquiryDialog';
import { LocationBox, type LocationState } from './LocationBox';
import './after.css';

// 8단계 묶음 5 · /preview/pickup — 2단계 캔버스 판 2-4(기본) · 2-5(업체 창·상태) · 2-11(견적 신청 창).
// 업체는 지금 코드와 같은 예시 자료(estateVendors.json). 서버·위치 없이 움직인다.

interface Vendor {
  name: string;
  province: string;
  district: string;
  region: string;
  tags: string[];
}
const VENDORS = estateVendors as Vendor[];

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본 (위치 확인됨)' },
  { value: 'login', label: '로그인 전' },
  { value: 'checking', label: '위치 확인 중', group: '위치' },
  { value: 'fallback', label: '위치 기본값', group: '위치' },
  { value: 'failed', label: '위치 확인 실패', group: '위치' },
  { value: 'empty', label: '결과 없음', group: '결과' },
  { value: 'est', label: '견적 신청 창 (제휴 업체 등록 후 화면)', group: '견적 신청 창' },
  { value: 'est-noaddr', label: '견적 신청 창, 주소 없이 신청', group: '견적 신청 창' },
  { value: 'est-noconsent', label: '견적 신청 창, 동의하지 않고 신청', group: '견적 신청 창' },
];

export function PickupPage() {
  const phone = useIsPhone();
  const [demo, setDemo] = useState('normal');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState({ province: '', district: '', query: '' });
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [example, setExample] = useState(false);
  const [estimate, setEstimate] = useState<string | null>(null);

  const regions = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const v of VENDORS) (map[v.province] ??= new Set()).add(v.district);
    const out: Record<string, string[]> = {};
    Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .forEach((p) => (out[p] = Array.from(map[p]).sort((a, b) => a.localeCompare(b, 'ko'))));
    return out;
  }, []);

  const shown = useMemo(() => {
    if (demo === 'empty') return [];
    const q = applied.query;
    return VENDORS.filter((v) => {
      if (applied.province && v.province !== applied.province) return false;
      if (applied.district && v.district !== applied.district) return false;
      if (q && !v.name.includes(q) && !v.region.includes(q)) return false;
      return true;
    });
  }, [demo, applied]);

  const loc: LocationState = demo === 'checking' ? 'checking' : demo === 'fallback' ? 'fallback' : demo === 'failed' ? 'failed' : 'real';
  const locName = loc === 'fallback' ? '서울 중구' : '인천 연수구';
  const selected = openIdx !== null ? shown[openIdx] : null;

  const estDemo =
    demo === 'est' || demo === 'est-noaddr' || demo === 'est-noconsent'
      ? { noAddress: demo === 'est-noaddr', noConsent: demo === 'est-noconsent' }
      : null;

  const apply = () => setApplied({ province, district, query: query.trim() });
  const bar = <DemoBar value={demo} options={DEMOS} onChange={(v) => { setDemo(v); setOpenIdx(null); setExample(false); setEstimate(null); }} />;
  const ask = (name: string) => (estDemo ? setEstimate(name) : setExample(true));

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title="유품 정리 업체 검색" desc={phone ? '유품 정리·수거 전문 업체와 연결해 드립니다.' : '지역 기반 유품 정리·수거 전문 업체와 연결해 드립니다.'} />
        <div className="rd-af-gatebox"><RdLoginGate screenName="유품 정리 업체 검색" contained /></div>
        {bar}
      </div>
    );
  }

  return (
    <div className="rd-container rd-screen">
      <RdPageHead title="유품 정리 업체 검색" desc={phone ? '유품 정리·수거 전문 업체와 연결해 드립니다.' : '지역 기반 유품 정리·수거 전문 업체와 연결해 드립니다.'} />

      {!phone && <RdNotice tone="info" title="가까운 지역 업체를 보여드리기 위해 위치 정보를 사용합니다." />}

      <LocationBox
        state={loc}
        name={locName}
        provinces={Object.keys(regions)}
        districts={province ? regions[province] ?? [] : []}
        province={province}
        district={district}
        onProvince={(v) => { setProvince(v); setDistrict(''); }}
        onDistrict={setDistrict}
        query={query}
        onQuery={setQuery}
        onSearch={apply}
        searchLabel="업체명·지역 검색"
        searchPlaceholder="업체명 또는 지역명으로 검색"
      />

      {phone ? (
        <RdNotice tone="caution" title="유품을 처분하면 상속포기·한정승인을 못 할 수 있습니다(민법 제1026조)." />
      ) : (
        <RdNotice tone="caution" title="유품은 상속재산입니다.">
          처분하면 단순승인으로 간주되어, 채무를 이어받을 수 있습니다(민법 제1026조). 상속포기·한정승인을 고려 중이라면 처분 전에 확인하세요.
        </RdNotice>
      )}

      {shown.length === 0 ? (
        <RdState kind="empty" title="조건에 맞는 업체가 없습니다." />
      ) : (
        <div className="rd-af-vendors">
          {shown.map((v, i) => (
            <article className="rd-card rd-card--flat rd-af-vendor" key={v.name}>
              <p className="rd-card__eyebrow rd-af-vendor__region"><IconPin size={15} />{v.region}</p>
              <h3 className="rd-card__title">
                <button type="button" className="rd-af-vendor__name" onClick={() => setOpenIdx(i)}>{v.name}</button>
              </h3>
              <div className="rd-card__foot rd-af-vendor__foot">
                <RdButton kind="secondary" place="row" className="rd-af-vendor__ask" onClick={() => ask(v.name)}>견적 신청</RdButton>
              </div>
            </article>
          ))}
        </div>
      )}

      {bar}

      {selected && !estimate && (
        <RdDialog
          eyebrow="예시 데이터"
          title={selected.name}
          evenButtons
          onClose={() => setOpenIdx(null)}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" onClick={() => setOpenIdx(null)}>닫기</RdButton>
              <RdButton place="dialog" onClick={() => ask(selected.name)}>견적 신청</RdButton>
            </>
          }
        >
          <dl className="rd-dl">
            <dt>지역</dt>
            <dd>{selected.region}</dd>
            <dt>태그</dt>
            <dd>{selected.tags.map((t) => `#${t}`).join(' ')}</dd>
          </dl>
        </RdDialog>
      )}

      {example && (
        <RdAlertDialog
          title="예시 업체입니다."
          desc="실제 제휴 서비스는 준비 중이라 이 견적 신청은 접수되지 않습니다."
          onOk={() => setExample(false)}
        />
      )}

      {estimate && estDemo && (
        <InquiryDialog kind="estate" name={estimate} demo={estDemo} onClose={() => { setEstimate(null); setOpenIdx(null); }} />
      )}
    </div>
  );
}
