import React, { useState, useEffect } from 'react';
import { Calculator, ChevronRight } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { ConsultRequestModal } from '../components/expert/ConsultRequestModal';
import { TaxSimulatorModal } from '../components/counseling/TaxSimulatorModal';
import '../styles/design-v2.css';

// 00-39 §9.1 — 그룹①(목록·체크리스트) 대표 care-guide에서 뽑은 클래스를 시안 없이 그대로 적용.
// 전문가 카드(테두리·배경 있는 박스)는 규칙1(카드·그림자 금지)에 따라 행 목록으로 바꾸고,
// licenseOrg·specialties·bio는 §6-8·9(체크/안내 분리)와 같은 원리로 행 클릭 → 모달로 옮겼다.

interface CounselingPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

// docs/02_전문가_매칭/02-05 §3.3의 5대 직역(법무사 추가, 2026-08-14). 라벨 순서 = 탭 노출 순서.
const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: '전체', label: '전체' },
  { value: 'LAWYER', label: '상속 변호사' },
  { value: 'JUDICIAL_SCRIVENER', label: '상속 법무사' },
  { value: 'TAX_ACCOUNTANT', label: '상속세 세무사' },
  { value: 'ADMINISTRATIVE_SCRIVENER', label: '행정사' },
  { value: 'FUNERAL_DIRECTOR', label: '장례 지도사' },
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORY_TABS.map((c) => [c.value, c.label]));

interface PublicExpert {
  id: string;
  category: string;
  name: string;
  licenseOrg: string | null;
  bio: string | null;
  specialties: string[];
  createdAt: string;
}

export const CounselingPage: React.FC<CounselingPageProps> = ({ currentUser, onOpenLogin }) => {
  // 분야 선택 필터 — 2026-08-11 Domain02 Stage 1: 서버 GET /api/experts 실연동으로 전환
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [experts, setExperts] = useState<PublicExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 상담 신청 모달 상태
  const [consultTarget, setConsultTarget] = useState<PublicExpert | null>(null);
  // 전문가 상세 보기 모달 상태(행 클릭) — licenseOrg·specialties·bio는 여기서만 본다
  const [detailTarget, setDetailTarget] = useState<PublicExpert | null>(null);
  // 상속세 시뮬레이터 모달 상태 — 원래 본문에 있었으나 포션이 커서 버튼으로 여는 모달로 분리(2026-08-11)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const handleOpenConsultModal = (expert: PublicExpert) => {
    if (!currentUser) {
      alert('⚠️ 전문가 1:1 상담 신청은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    setConsultTarget(expert);
  };

  // 필터 변경 시 서버에 조건 그대로 위임해서 재조회 (FacilityPage와 동일 패턴)
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== '전체') params.set('category', selectedCategory);

    fetch(`${BACKEND_URL}/api/experts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setExperts(data.data);
      })
      .catch(() => {
        // 조회 실패 시 빈 목록으로 유지 — 필터 UI는 정상 노출
      })
      .finally(() => setIsLoading(false));
  }, [selectedCategory]);

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">
          <span className="v2-desktop-only">상속 · 법률 · 세무 비대면 전문가 상담</span>
          <span className="v2-mobile-only">전문가 상담</span>
        </h1>
        <p className="v2-page-subtitle">변호사, 세무사, 행정사, 장례지도사 분야별 상담 신청 및 상속세 자동 시뮬레이터</p>
      </div>

      <div className="v2-content">
        {/* 상속세 시뮬레이터 진입 배너 — 클릭 시 모달로 열림 */}
        <button type="button" className="v2-banner" onClick={() => setIsSimulatorOpen(true)}>
          <span className="v2-banner-title">
            <Calculator size={16} /> 상속세, 대략 얼마나 나올까요?
          </span>
          <span className="v2-banner-cta">
            계산하기 <ChevronRight size={16} />
          </span>
        </button>

        {/* 분야 선택 필터 — 모든 화면에서 가로 스크롤(§9.1이 잇는 그룹①의 칩 패턴) */}
        <div className="v2-chip-row">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`v2-chip${selectedCategory === cat.value ? ' is-active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 전문가 목록 — 제목(이름)+분야만, 상세는 모달(§6-1·§6-8·9) */}
        {isLoading ? (
          <p className="v2-empty">불러오는 중...</p>
        ) : experts.length === 0 ? (
          <p className="v2-empty">
            {selectedCategory === '전체' ? '아직 입점한 전문가가 없습니다.' : `${CATEGORY_LABEL[selectedCategory]} 분야에 입점한 전문가가 아직 없습니다.`}
            {' '}준비되는 대로 순차적으로 노출됩니다.
          </p>
        ) : (
          experts.map((exp) => (
            // 2026-09-18 사용자 지시 — 행의 어느 부분을 눌러도 모달이 뜨도록 행 전체를 버튼화.
            // 데스크톱만 이름 옆에 분야를 붙이고 우측에 간단 소개를 추가(모바일은 현상 유지).
            <div
              key={exp.id}
              className="v2-list-row is-clickable"
              role="button"
              tabIndex={0}
              onClick={() => setDetailTarget(exp)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDetailTarget(exp);
                }
              }}
            >
              <span className="v2-list-title">
                {exp.name}
                <span className="v2-desktop-only v2-list-inline-meta"> {CATEGORY_LABEL[exp.category] || exp.category}</span>
              </span>
              <span className="v2-list-meta v2-mobile-only">{CATEGORY_LABEL[exp.category] || exp.category}</span>
              {exp.bio && <span className="v2-list-intro v2-desktop-only">{exp.bio}</span>}
              <ChevronRight size={16} className="v2-row-chevron" />
            </div>
          ))
        )}
      </div>

      {/* 전문가 상세 모달 */}
      {detailTarget && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" onClick={() => setDetailTarget(null)}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="v2-modal-title">{detailTarget.name}</h3>

            <div className="v2-modal-row">
              <span className="v2-modal-label">분야</span>
              <span className="v2-modal-value">{CATEGORY_LABEL[detailTarget.category] || detailTarget.category}</span>
            </div>

            {detailTarget.licenseOrg && (
              <div className="v2-modal-row">
                <span className="v2-modal-label">자격</span>
                <span className="v2-modal-value">{detailTarget.licenseOrg}</span>
              </div>
            )}

            {detailTarget.specialties.length > 0 && (
              <div className="v2-modal-row">
                <span className="v2-modal-label">전문</span>
                <span className="v2-modal-value">{detailTarget.specialties.map((s) => `#${s}`).join(' ')}</span>
              </div>
            )}

            {detailTarget.bio && (
              <div className="v2-modal-row">
                <span className="v2-modal-label">소개</span>
                <span className="v2-modal-value">{detailTarget.bio}</span>
              </div>
            )}

            <div className="v2-modal-actions">
              <button
                type="button"
                className="v2-btn-primary"
                onClick={() => {
                  setDetailTarget(null);
                  handleOpenConsultModal(detailTarget);
                }}
              >
                상담 신청
              </button>
            </div>

            <button type="button" className="v2-modal-close" onClick={() => setDetailTarget(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 상담 신청 모달 */}
      {consultTarget && (
        <ConsultRequestModal
          expertId={consultTarget.id}
          expertName={consultTarget.name}
          onClose={() => setConsultTarget(null)}
        />
      )}

      {/* 상속세 간이 시뮬레이터 모달 */}
      {isSimulatorOpen && <TaxSimulatorModal onClose={() => setIsSimulatorOpen(false)} />}
    </div>
  );
};
