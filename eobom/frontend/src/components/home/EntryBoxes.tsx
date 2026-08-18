import React, { useState } from 'react';
import { ChevronRight, HeartHandshake, DoorOpen, Building2 } from 'lucide-react';
import { ChecklistShieldIcon } from '../MenuIcons';
import { domainSlides } from './domainSlides';
import { BoxDetailOverlay } from './BoxDetailOverlay';

// docs/00_핵심플랫폼/00-23 §8 — 메인화면 진입구조 목업. 사장님 지시(2026-08-18 2차)로
// 박스①②는 항목 목록을 뺀 "간단 설명"만 남기고, 클릭 시 박스별 미니 풀스크린 오버레이에서
// 도메인 소개 슬라이드(구 HomePage 섹션 01~05)를 휠로 넘겨보게 바꿨다. 박스③④(Guest·파트너)는
// 항목이 1개뿐이라 기존 방식(목록 1줄) 그대로 둔다.
// 08-19 시각 정제(00-23 §8.5) — ①②/③④를 별도 그리드 블록으로 나눠 "큰 카드/낮은 카드"
// 위계를 복원하고, ①②는 아이콘 확대 + 클릭 불가 요약 칩으로 빈 공간을 채운다.

const box1Keys = ['counseling', 'ending-note', 'digital-estate'];
const box2Keys = ['care-guide', 'facility', 'counseling', 'digital-estate', 'memorial', 'pickup'];

// 박스 요약 칩 전용 짧은 라벨 — domainSlides.badgeLabel은 오버레이 슬라이드 제목용이라 길다.
const chipLabels: Record<string, string> = {
  counseling: '전문가 상담',
  'ending-note': '디지털 엔딩노트',
  'digital-estate': '디지털 자산 정리',
  'care-guide': '상중 케어',
  facility: '장사시설 매칭',
  memorial: '디지털 추모관',
  pickup: '유품 수거',
};

interface EntryBoxesProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

interface EntryItem {
  label: string;
  tab?: string;
  status: 'active' | 'preview' | 'comingSoon';
  loginRequired?: boolean;
}

const box4Items: EntryItem[] = [{ label: '파트너 로그인', tab: 'partner', status: 'active' }];

const Badge: React.FC<{ status: 'preview' | 'comingSoon' }> = ({ status }) => {
  const preview = status === 'preview';
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '0.2rem 0.55rem',
        borderRadius: '4px',
        color: preview ? '#475569' : '#94A3B8',
        backgroundColor: preview ? '#E2E8F0' : '#F1F5F9',
      }}
    >
      {preview ? '미리보기' : '준비 중'}
    </span>
  );
};

// 클릭 불가 요약 칩 — 박스①②의 빈 공간을 채우되 어포던스를 만들지 않도록 순수 <span>만 쓴다.
const ChipRow: React.FC<{ labels: string[] }> = ({ labels }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.1rem' }}>
    {labels.map((label) => (
      <span
        key={label}
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#6C7A89',
          backgroundColor: '#F1F5F9',
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
        }}
      >
        {label}
      </span>
    ))}
  </div>
);

const EntryRow: React.FC<{
  item: EntryItem;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}> = ({ item, currentUser, onOpenLogin, setActiveTab }) => {
  const isComingSoon = item.status === 'comingSoon';

  const handleClick = () => {
    if (isComingSoon) return;
    if (item.loginRequired && !currentUser) {
      onOpenLogin?.();
      return;
    }
    if (item.tab) setActiveTab?.(item.tab);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isComingSoon}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.6rem',
        width: '100%',
        minHeight: 'var(--min-touch-target)',
        padding: '0.3rem 0.1rem',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: isComingSoon ? 'not-allowed' : 'pointer',
        color: isComingSoon ? '#94A3B8' : 'var(--text-main)',
      }}
    >
      <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.label}</span>
      {item.status === 'preview' && <Badge status="preview" />}
      {item.status === 'comingSoon' && <Badge status="comingSoon" />}
      {item.status === 'active' && <ChevronRight size={18} color="#94A3B8" />}
    </button>
  );
};

const BoxHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  size?: 'lg' | 'sm';
}> = ({ icon, title, subtitle, badge, size = 'lg' }) => {
  const boxSize = size === 'lg' ? '52px' : '40px';
  const titleSize = size === 'lg' ? '1.3rem' : '1.15rem';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: boxSize,
              height: boxSize,
              flexShrink: 0,
              borderRadius: '14px',
              backgroundColor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
          <h3 style={{ fontSize: titleSize, fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>{title}</h3>
        </div>
        {badge}
      </div>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: '0.6rem 0 0 0' }}>{subtitle}</p>
    </div>
  );
};

export const EntryBoxes: React.FC<EntryBoxesProps> = ({ currentUser, onOpenLogin, setActiveTab }) => {
  const [openBox, setOpenBox] = useState<'box1' | 'box2' | null>(null);

  return (
    <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      <h2
        style={{
          fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
          fontWeight: 800,
          color: '#1A2B4C',
          fontFamily: "'KoPub World Batang', serif",
          textAlign: 'center',
          marginBottom: '1.4rem',
        }}
      >
        어떤 도움이 필요하신가요?
      </h2>

      {/* 상단 블록 — ①② 큰 카드(00-23 §8.5) */}
      <div className="entry-boxes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ① 생전 준비 — 클릭 시 미니 오버레이(전문가상담·엔딩노트·디지털자산) */}
        <button
          type="button"
          onClick={() => setOpenBox('box1')}
          className="card entry-box-primary"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            width: '100%',
            fontFamily: 'inherit',
            justifyContent: 'space-between',
          }}
        >
          <BoxHeader
            icon={<HeartHandshake size={28} color="var(--point-color)" />}
            title="생전 준비"
            subtitle="미리 준비해 두면, 남은 가족이 덜 힘듭니다."
          />
          <ChipRow labels={box1Keys.map((k) => chipLabels[k])} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              marginTop: '1.1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--point-color)',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            자세히 보기 <ChevronRight size={16} />
          </div>
        </button>

        {/* ② 임종 및 사후 정리 — 클릭 시 미니 오버레이(상중케어부터 순서대로) */}
        <button
          type="button"
          onClick={() => setOpenBox('box2')}
          className="card entry-box-primary"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            width: '100%',
            fontFamily: 'inherit',
            justifyContent: 'space-between',
          }}
        >
          <BoxHeader
            icon={<ChecklistShieldIcon size={28} color="#03543F" />}
            title="임종 및 사후 정리"
            subtitle="지금 해야 할 일부터 순서대로 안내해 드립니다."
          />
          <ChipRow labels={box2Keys.map((k) => chipLabels[k])} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              marginTop: '1.1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--point-color)',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            자세히 보기 <ChevronRight size={16} />
          </div>
        </button>
      </div>

      {/* 하단 블록 — ③④ 낮은 카드, 높이 약 절반(00-23 §8.5) */}
      <div
        className="entry-boxes-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}
      >
        {/* ③ Guest — 링크 전체 붙여넣기(00-23 §4.4). 목업 단계는 비활성 고정, 기존 방식 유지 */}
        <div className="card entry-box-secondary">
          <BoxHeader
            icon={<DoorOpen size={20} color="#5B7065" />}
            title="Guest"
            subtitle="받으신 추모관 링크로 입장하세요."
            badge={<Badge status="comingSoon" />}
            size="sm"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="받으신 링크를 그대로 붙여넣어 주세요"
              disabled
              title="준비 중인 서비스입니다."
              style={{ cursor: 'not-allowed', backgroundColor: '#F8F7F4', color: '#94A3B8' }}
            />
            <button
              type="button"
              className="btn"
              disabled
              title="준비 중인 서비스입니다."
              style={{ backgroundColor: '#F1F5F9', color: '#94A3B8', cursor: 'not-allowed' }}
            >
              입장
            </button>
          </div>
        </div>

        {/* ④ 파트너 — 항목 1개뿐이라 기존 방식(목록 1줄) 그대로 유지 */}
        <div className="card entry-box-secondary">
          <BoxHeader
            icon={<Building2 size={20} color="var(--primary-color)" />}
            title="파트너"
            subtitle="장사시설·전문가 사업자이신가요?"
            size="sm"
          />
          <div style={{ marginTop: '0.5rem' }}>
            {box4Items.map((item) => (
              <EntryRow key={item.label} item={item} currentUser={currentUser} onOpenLogin={onOpenLogin} setActiveTab={setActiveTab} />
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            로그인하시면 대시보드로 이동합니다.
          </p>
        </div>
      </div>

      {openBox === 'box1' && (
        <BoxDetailOverlay
          boxTitle="생전 준비"
          slides={box1Keys.map((k) => domainSlides[k])}
          onClose={() => setOpenBox(null)}
          currentUser={currentUser}
          onOpenLogin={onOpenLogin}
          setActiveTab={setActiveTab}
        />
      )}
      {openBox === 'box2' && (
        <BoxDetailOverlay
          boxTitle="임종 및 사후 정리"
          slides={box2Keys.map((k) => domainSlides[k])}
          onClose={() => setOpenBox(null)}
          currentUser={currentUser}
          onOpenLogin={onOpenLogin}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};
