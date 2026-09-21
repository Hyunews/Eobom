import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { SECTIONS, RELATIONSHIP_LABEL } from '../components/endingNote/constants';
import '../styles/design-v2.css';

// 00-36 §4.6-1(SCR-020) — "나에게 공유된 것". 나를 가족으로 지정한 분별로, 지금 열람할 수 있는
// 엔딩노트 섹션을 보여준다. 데이터는 `GET /api/ending-note/family-view`(이미 구현됨) — 서버 변경 0건(M-1.5).
// 시안: Design 캔버스 "그룹② mypage 시안" v4(S1~S4). 규칙 정본은 00-39 §6 훑는 목록 + 폼 모달 뼈대(.v2-modal).
//
// 🔴 보이지 않아야 하는 것(§4.6-1) — 응답에 애초에 없으므로 그릴 수도 없다. 응답 필드를 늘려도 여기
// 표시를 늘리지 말 것: 지정자 연락처·이메일(00-27 §3 불변식 2) · 같은 노트의 다른 수락자 ·
// POSTMORTEM 섹션의 존재 자체(06-04 §7.4 "잠긴 섹션은 제목도 보이지 않는다" — API가 이미 그렇게 내려준다).
// 🔴 과장 금지 — "○○님의 엔딩노트를 볼 수 있습니다" 류 문구를 쓰지 않는다. 실제로 열리는 것은
// IMMEDIATE로 부여된 섹션뿐이다(현재 FUNERAL·CONTACTS). 🔴 빈 상태에 권유 문구를 붙이지 않는다.
//
// 🟡 SCR-020이 요구하는 scope(주 연락자/열람자)·수락한 날짜는 family-view 응답에 없어서 표시하지
// 못한다(서버 변경은 M-1.5 범위 밖). 지정 관계는 응답의 relationship을 그대로 쓴다.

interface FamilyViewEntry {
  section: string;
  title: string | null;
  value: unknown;
  updatedAt: string;
}

interface FamilyViewItem {
  designationId: string;
  ownerName: string;
  relationship: string;
  relationshipEtc: string | null;
  entries: FamilyViewEntry[];
}

interface FamilySharedPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
};

const sectionTitle = (code: string): string => SECTIONS.find((s) => s.code === code)?.title ?? code;

const relationLabel = (item: FamilyViewItem): string =>
  item.relationship === 'OTHER' && item.relationshipEtc
    ? item.relationshipEtc
    : RELATIONSHIP_LABEL[item.relationship] ?? item.relationship;

// 섹션별 저장 모양(EndingNotePage.tsx sectionPayloads와 같다). IMMEDIATE가 허용되는 두 섹션만 다룬다 —
// 그 밖의 값이 오면(백엔드가 막고 있지만) 그리지 않는다. 모르는 필드를 추측해 보여주지 않는다.
const entryFields = (section: string, value: unknown): { label: string; text: string }[] => {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  if (section === 'FUNERAL') return [{ label: '장례 희망', text: str(v.funeralType) }].filter((f) => f.text);
  if (section === 'CONTACTS') {
    return [
      { label: '연락처 메모', text: str(v.contactsNote) },
      { label: '반려동물', text: str(v.petCaretaker) },
    ].filter((f) => f.text);
  }
  return [];
};

export const FamilySharedPage: React.FC<FamilySharedPageProps> = ({ currentUser, onOpenLogin }) => {
  const [items, setItems] = useState<FamilyViewItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState<{ item: FamilyViewItem; entry: FamilyViewEntry } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    apiFetch<FamilyViewItem[]>('/api/ending-note/family-view', 'USER')
      .then(setItems)
      .catch(() => setLoadError(true));
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="v2-page">
        <div className="v2-content">
          <h1 className="v2-page-title">나에게 공유된 것</h1>
          <p className="v2-empty">로그인 후 확인하실 수 있습니다.</p>
          <button type="button" className="v2-btn-primary" onClick={onOpenLogin}>로그인 / 회원가입</button>
        </div>
      </div>
    );
  }

  const fields = open ? entryFields(open.entry.section, open.entry.value) : [];

  return (
    <div className="v2-page">
      <div className="v2-content">
        <h1 className="v2-page-title">나에게 공유된 것</h1>

        {loadError && <p className="v2-error-text">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {!loadError && items === null && <p className="v2-empty">불러오는 중…</p>}
        {!loadError && items !== null && items.length === 0 && <p className="v2-empty">아직 공유받은 것이 없습니다.</p>}

        {items?.map((item) => (
          <section key={item.designationId} className="v2-hub-section">
            <div className="v2-section-head">
              <h2 className="v2-section-title">{item.ownerName} 님</h2>
              <span className="v2-section-head-meta">지정 관계 · {relationLabel(item)}</span>
            </div>
            {item.entries.length === 0 ? (
              <p className="v2-empty" style={{ margin: 0, borderBottom: '1px solid var(--v2-divider)' }}>지금 볼 수 있는 항목이 없습니다.</p>
            ) : (
              item.entries.map((entry) => (
                <button type="button" key={entry.section} className="v2-nav-row" onClick={() => setOpen({ item, entry })}>
                  <span className="v2-nav-row-label">{sectionTitle(entry.section)}</span>
                  <span className="v2-nav-row-meta">{formatDate(entry.updatedAt)}</span>
                  <span className="v2-nav-row-arrow"><ChevronRight size={18} /></span>
                </button>
              ))
            )}
          </section>
        ))}
      </div>

      {open && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="family-shared-title" onClick={() => setOpen(null)}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="family-shared-title" className="v2-modal-title">{sectionTitle(open.entry.section)}</h3>
            {fields.length === 0 ? (
              <p className="v2-empty" style={{ padding: 0 }}>작성된 내용이 없습니다.</p>
            ) : (
              fields.map((f) => (
                <div key={f.label} className="v2-modal-row">
                  <span className="v2-modal-label">{f.label}</span>
                  <span className="v2-modal-value" style={{ whiteSpace: 'pre-wrap' }}>{f.text}</span>
                </div>
              ))
            )}
            <div className="v2-modal-row">
              <span className="v2-modal-label">최종 수정</span>
              <span className="v2-modal-value">{formatDate(open.entry.updatedAt)}</span>
            </div>
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setOpen(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
