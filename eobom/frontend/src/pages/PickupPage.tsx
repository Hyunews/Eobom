import React, { useState } from 'react';
import { Package } from 'lucide-react';
import digitalEstateData from '../mockData/digitalEstate.json';

// 08-19 9차(개발자 직접 지시) — DigitalEstatePage 서브탭 3개(digital/physical/memorial) 중
// "현물 유품 정리(physical)"를 별도 도메인(tab: 'pickup')으로 분리. 내용은 그대로 옮겼다
// (예시 업체 데이터, "예시" 배지 등 — 00-14 §2.2 원칙 유지).

interface PickupPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const PickupPage: React.FC<PickupPageProps> = () => {
  const vendors = digitalEstateData.vendors;

  // 지역필터 — 기존 "서울/경기" 같은 임의 권역 대신 장사시설(FacilityPage)과 동일하게
  // 실제 시/도 -> 시/군/구 2단계 선택으로 구현(2026-08-20 지시). 보유 업체(예시) 데이터에서
  // 직접 뽑아 항상 결과가 있는 지역만 노출한다(FacilityPage의 /api/geo/regions와 같은 원칙).
  const regionsData = React.useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const v of vendors) {
      if (!map[v.province]) map[v.province] = new Set();
      map[v.province].add(v.district);
    }
    const result: Record<string, string[]> = {};
    Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .forEach((p) => {
        result[p] = Array.from(map[p]).sort((a, b) => a.localeCompare(b, 'ko'));
      });
    return result;
  }, [vendors]);

  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const provinceOptions = Object.keys(regionsData);
  const districtOptions = province ? regionsData[province] || [] : [];

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict('');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F1F5F9', color: '#6C7A89', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <Package size={18} color="#6C7A89" /> 지역 기반 현물 유품 정리 매칭
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Package color="var(--point-color)" size={32} /> 유품 수거
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          지역 기반 유품 정리·수거 전문 업체와 연결해 드립니다.
        </p>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        ⚠️ 이 페이지는 화면 구성을 보여드리기 위한 <strong>예시 데이터</strong>로 채워져 있습니다.
        아래 업체·평점은 실존하지 않으며, 실제 제휴 업체는 아직 없습니다.
      </div>

      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>지역 기반 현물 유품 정리 전문 업체 연결</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
          유품 정찰제 수거, 소각 대행 및 특수 청소 업체 화면 구성 예시입니다. 실제 제휴 업체는
          아직 없습니다 — 제휴가 시작되면 이 목록이 실제 업체 정보로 교체됩니다.
        </p>

        <div className="form-group" style={{ maxWidth: '360px', marginBottom: '1.1rem' }}>
          <label className="form-label">지역 필터</label>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <select value={province} onChange={(e) => handleProvinceChange(e.target.value)} className="form-select" style={{ flex: '1 1 140px' }}>
              <option value="">시/도 선택</option>
              {provinceOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={!province}
              className="form-select"
              style={{ flex: '1 1 140px' }}
            >
              <option value="">선택 안함</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid">
          {vendors
            .filter((v) => (!province || v.province === province) && (!district || v.district === district))
            .map((vendor, idx) => (
              <div key={idx} className="card" style={{ borderTop: '4px solid var(--primary-color)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '0.7rem', right: '0.7rem', fontSize: '0.85rem', fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.1rem 0.5rem' }}>예시</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--point-color)' }}>📍 {vendor.region}</span>
                  <span style={{ fontWeight: 'bold' }}>★ {vendor.rating}</span>
                </div>
                <h4 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{vendor.name}</h4>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {vendor.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: '0.85rem', backgroundColor: 'var(--secondary-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      #{t}
                    </span>
                  ))}
                </div>
                <button onClick={() => alert('🚧 예시 업체입니다. 실제 제휴 서비스는 준비 중이라 이 견적 신청은 접수되지 않습니다.')} className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>
                  무료 방문 견적 신청 (예시)
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
