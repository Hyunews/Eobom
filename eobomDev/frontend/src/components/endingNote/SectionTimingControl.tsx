import React from 'react';
import { SECTION_ALLOWED_TIMINGS, TIMING_LABEL, RELATIONSHIP_LABEL } from './constants';
import type { FamilyItem, GrantItem } from './types';

// §10 Phase 2 — 섹션별 공개 시점 UI. WILL_DRAFT처럼 허용 timing이 없는 섹션에서는 아무것도
// 그리지 않는다(§7.4 모델 레벨 차단이 UI에도 그대로 반영). 🔴 모듈 최상위(AccordionSection과
// 같은 이유 — 렌더 함수 안에 두면 리렌더마다 재마운트돼 select 포커스가 끊긴다).
export const SectionTimingControl: React.FC<{
  section: string;
  family: FamilyItem[];
  grants: GrantItem[];
  onChange: (designationId: string, timing: string | null, grantId?: string) => void;
}> = ({ section, family, grants, onChange }) => {
  const allowed = SECTION_ALLOWED_TIMINGS[section];
  if (!allowed || family.length === 0) return null;

  return (
    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--v2-divider)' }}>
      <div style={{ fontSize: 'var(--v2-fs-support)', fontWeight: 700, color: 'var(--v2-text-main)', marginBottom: '10px' }}>
        가족 공개 시점
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {family.map((f) => {
          const activeGrant = grants.find((g) => g.section === section && g.designationId === f.id && !g.revokedAt);
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--v2-fs-support)', flexWrap: 'wrap' }}>
              <span style={{ minWidth: '120px', color: 'var(--v2-text-main)' }}>
                {f.name} ({RELATIONSHIP_LABEL[f.relationship] || f.relationship}
                {f.relationship === 'OTHER' && f.relationshipEtc ? ` · ${f.relationshipEtc}` : ''})
              </span>
              <select
                value={activeGrant?.timing || ''}
                onChange={(e) => onChange(f.id, e.target.value || null, activeGrant?.id)}
                className="v2-select"
                style={{ width: '220px', flexShrink: 0 }}
              >
                <option value="">비공개</option>
                {allowed.map((t) => (
                  <option key={t} value={t}>
                    {TIMING_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
