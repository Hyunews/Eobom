import React, { useState, useEffect } from 'react';
import { Video, Calculator, MessageCircle, ChevronRight } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { ConsultRequestModal } from '../components/expert/ConsultRequestModal';
import { TaxSimulatorModal } from '../components/counseling/TaxSimulatorModal';
import { HandScalesIcon } from '../components/MenuIcons';

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
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FEF3C7', color: 'var(--accent-gold)', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <HandScalesIcon size={18} color="var(--accent-gold)" /> 상속세 시뮬레이터 &amp; 변호사 · 세무사 1:1 케어
        </div>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <HandScalesIcon color="var(--point-color)" size={32} /> 상속 · 법률 · 세무 비대면 전문가 상담
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          변호사, 세무사, 행정사, 장례지도사 분야별 상담 신청 및 상속세 자동 시뮬레이터
        </p>
      </div>

      {/* 상속세 시뮬레이터 진입 배너 — 클릭 시 모달로 열림 */}
      <button
        onClick={() => setIsSimulatorOpen(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.1rem',
          marginBottom: '1.1rem',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'var(--box-shadow)',
          borderLeft: '5px solid var(--point-color)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--secondary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Calculator color="var(--point-color)" size={22} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>상속세, 대략 얼마나 나올까요?</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>배우자·자녀 수 등 조건을 입력하면 예상 세액을 단계별로 계산해드립니다</p>
          </div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--point-color)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
          간이 시뮬레이터 열기 <ChevronRight size={18} />
        </span>
      </button>

      {/* 전문가 상담 신청 & 분야 필터 */}
      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--box-shadow)',
        borderTop: '5px solid var(--primary-color)'
      }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Video color="var(--primary-color)" /> 분야별 전문가 상담
        </h3>

        {/* 분야 선택 필터 */}
        <div className="form-group" style={{ marginBottom: '1.1rem' }}>
          <label className="form-label">분야 선택</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: selectedCategory === cat.value ? 'var(--primary-color)' : 'var(--secondary-color)',
                  color: selectedCategory === cat.value ? '#FFFFFF' : 'var(--text-main)',
                  fontWeight: selectedCategory === cat.value ? 600 : 400,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 전문가 카드 목록 */}
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>불러오는 중...</p>
        ) : experts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.75rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
              {selectedCategory === '전체' ? '아직 입점한 전문가가 없습니다.' : `${CATEGORY_LABEL[selectedCategory]} 분야에 입점한 전문가가 아직 없습니다.`}
            </p>
            <p style={{ fontSize: '0.9rem' }}>준비되는 대로 순차적으로 노출됩니다.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {experts.map((exp) => (
              <div key={exp.id} style={{
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--secondary-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{exp.name}</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', backgroundColor: 'var(--point-color)', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                    {CATEGORY_LABEL[exp.category] || exp.category}
                  </span>
                </div>
                {exp.licenseOrg && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{exp.licenseOrg}</p>
                )}
                {exp.specialties.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {exp.specialties.map((s, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', backgroundColor: 'var(--card-bg)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: '#444' }}>
                        #{s}
                      </span>
                    ))}
                  </div>
                )}
                {exp.bio && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>{exp.bio}</p>
                )}
                <button
                  onClick={() => handleOpenConsultModal(exp)}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}
                >
                  <MessageCircle size={16} /> 상담 신청
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
