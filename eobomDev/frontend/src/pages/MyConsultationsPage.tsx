import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { backdropCloseProps } from '../utils/backdropClose';
import '../styles/design-v2.css';

// 00-36 §4.4(SCR-019) — "내 상담 내역". `Lead`(업체 상담)와 `ConsultRequest`(전문가 상담)는 사용자에게
// 같은 것이라(2026-09-10 사람 정정 — 통계도 합산) 두 목록을 **한 목록**으로 합쳐 최신순으로 보여준다.
// 데이터: `GET /api/me/leads` + `GET /api/me/consult-requests`(M-2, meActivityController.ts).
// 화면 규칙: 00-39 §6 "훑는 목록"(카드·그림자 없이 1px 구분선 행) + 안내 모달(.v2-modal).
//
// 🔴 내부 상태(CONVERTED·LOST 등)는 서버가 이미 4단계로 접어 내려준다 — 여기서 원본 상태를 다시 만들지 않는다.
// 🔴 서버가 안 내려주는 값(연락처·정산 필드·payload 원문)은 애초에 이 화면에 없다.
// 🔄 2026-09-21 00-36 §4.4-1 — 전화 문의(type=CALL)는 상담이 아니라 "버튼을 누른 기록"이라 서버가 목록에서
// 뺐다(`GET /api/me/leads`의 `type: { not: 'CALL' }`). 카카오톡 문의도 Lead에 얹지 않아 이 목록에 없다.
// 🔴 00-36 §6 #9 — 목록은 최신순 100건까지만 보여준다. 서버가 101건째까지 내려주므로(meActivityController
// LIST_LIMIT + 1) 101건째가 왔는지로 "잘렸다"를 정확히 알고, 잘렸으면 목록 끝에 한 줄을 단다.
// 조용히 잘리면 6070 이용자에게는 "내 기록이 사라졌다"가 된다.
const LIST_LIMIT = 100;

type StatusGroup = 'RECEIVED' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';

interface LeadRow {
  no: string;
  type: string;
  facilityName: string | null;
  summary: string;
  statusGroup: StatusGroup;
  thirdPartyConsentAt: string | null;
  createdAt: string;
}

interface ConsultRow {
  no: string;
  channel: string;
  expertName: string;
  category: string;
  summary: string;
  statusGroup: StatusGroup;
  thirdPartyConsentAt: string | null;
  createdAt: string;
}

interface Item {
  key: string;
  no: string;
  title: string;
  how: string;
  summary: string;
  statusGroup: StatusGroup;
  consentAt: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<StatusGroup, string> = {
  RECEIVED: '접수됨',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
  CLOSED: '종료',
};

const LEAD_TYPE_LABEL: Record<string, string> = { QUOTE: '견적 문의', CONSULT: '상담 문의' };
const CHANNEL_LABEL: Record<string, string> = { ALIMTALK: '알림톡', PHONE: '전화', VIDEO: '화상', VISIT: '방문' };
// CounselingPage.tsx CATEGORY_TABS와 같은 라벨(02-05 §3.3 5대 직역)
const CATEGORY_LABEL: Record<string, string> = {
  LAWYER: '상속 변호사',
  JUDICIAL_SCRIVENER: '상속 법무사',
  TAX_ACCOUNTANT: '상속세 세무사',
  ADMINISTRATIVE_SCRIVENER: '행정사',
  FUNERAL_DIRECTOR: '장례 지도사',
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
};

interface MyConsultationsPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const MyConsultationsPage: React.FC<MyConsultationsPageProps> = ({ currentUser, onOpenLogin, setActiveTab }) => {
  const [items, setItems] = useState<Item[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    // 두 목록을 병렬로 — 하나가 실패해도 나머지는 보여준다(둘 다 실패해야 오류 화면).
    Promise.allSettled([
      apiFetch<LeadRow[]>('/api/me/leads', 'USER'),
      apiFetch<ConsultRow[]>('/api/me/consult-requests', 'USER'),
    ]).then(([leadsRes, consultsRes]) => {
      if (leadsRes.status === 'rejected' && consultsRes.status === 'rejected') {
        setLoadError(true);
        return;
      }
      const leads: Item[] =
        leadsRes.status === 'fulfilled'
          ? leadsRes.value.map((r) => ({
              key: `L-${r.no}`,
              no: r.no,
              title: r.facilityName ?? '비제휴 업체',
              how: LEAD_TYPE_LABEL[r.type] ?? '문의',
              summary: r.summary,
              statusGroup: r.statusGroup,
              consentAt: r.thirdPartyConsentAt,
              createdAt: r.createdAt,
            }))
          : [];
      const consults: Item[] =
        consultsRes.status === 'fulfilled'
          ? consultsRes.value.map((r) => ({
              key: `C-${r.no}`,
              no: r.no,
              title: `${r.expertName} ${CATEGORY_LABEL[r.category] ?? r.category}`,
              how: CHANNEL_LABEL[r.channel] ?? r.channel,
              summary: r.summary,
              statusGroup: r.statusGroup,
              consentAt: r.thirdPartyConsentAt,
              createdAt: r.createdAt,
            }))
          : [];
      const merged = [...leads, ...consults].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      // 어느 쪽이든 101건째가 왔거나 합쳐서 100건을 넘으면 잘린 것 — 100건까지만 그린다
      setTruncated(leads.length > LIST_LIMIT || consults.length > LIST_LIMIT || merged.length > LIST_LIMIT);
      setItems(merged.slice(0, LIST_LIMIT));
    });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="v2-page">
        <div className="v2-content">
          <h1 className="v2-page-title">내 상담 내역</h1>
          <p className="v2-empty">로그인 후 확인하실 수 있습니다.</p>
          <button type="button" className="v2-btn-primary" onClick={onOpenLogin}>로그인 / 회원가입</button>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-page">
      <div className="v2-content">
        <h1 className="v2-page-title">내 상담 내역</h1>

        {loadError && <p className="v2-error-text">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {!loadError && items === null && <p className="v2-empty">불러오는 중…</p>}
        {!loadError && items !== null && items.length === 0 && (
          <>
            <p className="v2-empty">아직 신청하신 상담이 없습니다.</p>
            <button type="button" className="v2-btn-primary" onClick={() => setActiveTab?.('counseling')}>상담 신청</button>
          </>
        )}

        {items && items.length > 0 && (
          <div className="v2-hub-section">
            {items.map((item) => (
              <button type="button" key={item.key} className="v2-nav-row" onClick={() => setOpen(item)}>
                <span className="v2-nav-row-text">
                  <span className="v2-nav-row-label">{item.title}</span>
                  <span className="v2-nav-row-sub">{item.how} · {formatDate(item.createdAt)}</span>
                </span>
                <span className="v2-nav-row-meta">{STATUS_LABEL[item.statusGroup]}</span>
                <span className="v2-nav-row-arrow"><ChevronRight size={18} /></span>
              </button>
            ))}
            {truncated && <p className="v2-hub-foot">최근 {LIST_LIMIT}건까지만 표시됩니다.</p>}
          </div>
        )}
      </div>

      {open && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="my-consult-title" {...backdropCloseProps(() => setOpen(null))}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="my-consult-title" className="v2-modal-title">{open.title}</h3>
            <div className="v2-modal-row">
              <span className="v2-modal-label">접수번호</span>
              <span className="v2-modal-value">{open.no}</span>
            </div>
            <div className="v2-modal-row">
              <span className="v2-modal-label">방식</span>
              <span className="v2-modal-value">{open.how}</span>
            </div>
            <div className="v2-modal-row">
              <span className="v2-modal-label">신청일</span>
              <span className="v2-modal-value">{formatDate(open.createdAt)}</span>
            </div>
            <div className="v2-modal-row">
              <span className="v2-modal-label">상태</span>
              <span className="v2-modal-value">{STATUS_LABEL[open.statusGroup]}</span>
            </div>
            {open.summary && (
              <div className="v2-modal-row">
                <span className="v2-modal-label">내용</span>
                <span className="v2-modal-value" style={{ whiteSpace: 'pre-wrap' }}>{open.summary}</span>
              </div>
            )}
            {/* 건별 동의(제3자 제공)는 토글 대상이 아니다 — 이미 제공된 사실이라 시각만 보여준다(00-36 §4.5) */}
            {open.consentAt && (
              <div className="v2-modal-row">
                <span className="v2-modal-label">제3자 제공 동의</span>
                <span className="v2-modal-value">{formatDate(open.consentAt)}</span>
              </div>
            )}
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setOpen(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
