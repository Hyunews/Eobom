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
    <div className="en-timing">
      <div className="en-timing-title">가족 공개 시점</div>
      {/* PC: 이름 / 드롭다운 / 안내 3열 그리드(행마다 이름 폭이 달라도 드롭다운 열이 맞는다).
          모바일: 이름 위·드롭다운 아래 세로 배치(design-v2.css .en-timing-*). */}
      <div className="en-timing-list">
        {family.map((f) => {
          const activeGrant = grants.find((g) => g.section === section && g.designationId === f.id && !g.revokedAt);
          return (
            <div key={f.id} className="en-timing-row">
              <span className="en-timing-name">
                {f.name} ({RELATIONSHIP_LABEL[f.relationship] || f.relationship}
                {f.relationship === 'OTHER' && f.relationshipEtc ? ` · ${f.relationshipEtc}` : ''})
                {f.status !== 'ACCEPTED' && (
                  <span style={{ marginLeft: '6px', color: 'var(--v2-text-muted)', fontWeight: 400 }}>
                    {f.status === 'DRAFT' ? '초대 전' : '수락 전'}
                  </span>
                )}
              </span>
              <select
                value={activeGrant?.timing || ''}
                onChange={(e) => onChange(f.id, e.target.value || null, activeGrant?.id)}
                className="v2-select"
              >
                <option value="">비공개</option>
                {allowed.map((t) => (
                  <option key={t} value={t}>
                    {TIMING_LABEL[t]}
                  </option>
                ))}
              </select>
              {/* 00-41 §7.3 — 수락 전(초대 전 포함) 가족에게 즉시 공개를 고르면 수락하는 순간부터 보인다. 막지 않고 사실만 적는다. */}
              {/* 그리드 3열을 유지하려고 안내가 없어도 빈 칸을 그린다. */}
              <span className="en-timing-hint">
                {f.status !== 'ACCEPTED' && activeGrant?.timing === 'IMMEDIATE' && '초대를 수락하면 바로 볼 수 있습니다.'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
