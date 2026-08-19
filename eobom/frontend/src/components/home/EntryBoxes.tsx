import React, { useState } from 'react';
import { ChevronRight, HeartHandshake, DoorOpen, Building2 } from 'lucide-react';
import { ChecklistShieldIcon } from '../MenuIcons';
import { domainSlides } from './domainSlides';
import { BoxDetailOverlay } from './BoxDetailOverlay';
import type { NavMode } from '../../modeNav';

// docs/00_핵심플랫폼/00-23 §8 — 메인화면 진입구조 목업. 사장님 지시(2026-08-18 2차)로
// 박스①②는 항목 목록을 뺀 "간단 설명"만 남기고, 클릭 시 박스별 미니 풀스크린 오버레이에서
// 도메인 소개 슬라이드(구 HomePage 섹션 01~05)를 휠로 넘겨보게 바꿨다. 박스③④(Guest·파트너)는
// 항목이 1개뿐이라 기존 방식(목록 1줄) 그대로 둔다.
// 08-19 시각 정제(00-23 §8.5) — ①②/③④를 별도 그리드 블록으로 나눠 "큰 카드/낮은 카드" 위계 복원.
// 08-19 2차 — 동적 포커스 인터랙션 고도화. 기본 상태는 [아이콘+제목+한줄설명]만 정갈하게 노출하고,
// 칩·CTA·부가 버튼은 `.entry-box-reveal`로 감싸 index.css의 @media (hover:hover)에서만 접었다 편다
// (터치 기기는 이 media 밖이라 처음부터 펼쳐진 채로 보여 터치 UX를 막지 않는다).
// 카드 배경은 00-09 §2.1 5색 토큰에서 파생한 옅은 그라데이션 틴트(index.css --box-tint-*)로 마감.

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
  onSetMode?: (mode: NavMode) => void;
}

interface EntryItem {
  label: string;
  tab?: string;
  status: 'active' | 'preview' | 'comingSoon';
  loginRequired?: boolean;
}

const box4Items: EntryItem[] = [{ label: '파트너 로그인', tab: 'partner', status: 'active' }];

// Sidebar(모드별 메뉴)가 00-26 §3의 상태 배지 규격 재사용을 위해 export한다(00-23 §8.3과 동일 규격).
export const Badge: React.FC<{ status: 'preview' | 'comingSoon' }> = ({ status }) => {
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

// 클릭 불가 요약 칩 — 박스①②의 호버 펼침 콘텐츠에 쓰인다. 순수 <span>만 써서 어포던스를 안 만든다.
const ChipRow: React.FC<{ labels: string[] }> = ({ labels }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.9rem' }}>
    {labels.map((label) => (
      <span
        key={label}
        style={{
          fontSize: '0.92rem',
          fontWeight: 600,
          color: '#6C7A89',
          backgroundColor: '#F1F5F9',
          padding: '0.35rem 0.85rem',
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
  iconBg?: string;
}> = ({ icon, title, subtitle, badge, size = 'lg', iconBg = '#F1F5F9' }) => {
  // 2026-08-19 3차 — 카드는 줄이고(index.css min-height 축소) 내부 요소는 키워서 균형을 맞춘다.
  const boxSize = size === 'lg' ? '64px' : '48px';
  const titleSize = size === 'lg' ? '1.5rem' : '1.3rem';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: boxSize,
              height: boxSize,
              flexShrink: 0,
              borderRadius: '16px',
              backgroundColor: iconBg,
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
      <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', margin: '0.65rem 0 0 0', lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
};

// 호버(또는 키보드 포커스) 시에만 펼쳐지는 콘텐츠 래퍼 — index.css `.entry-box-reveal`
// (grid-template-rows 0fr↔1fr 트릭)과 짝을 이룬다. 호버 불가 기기에서는 처음부터 펼쳐진다.
const RevealContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="entry-box-reveal">
    <div className="entry-box-reveal__inner">{children}</div>
  </div>
);

export const EntryBoxes: React.FC<EntryBoxesProps> = ({ currentUser, onOpenLogin, setActiveTab, onSetMode }) => {
  const [openBox, setOpenBox] = useState<'box1' | 'box2' | null>(null);

  // 2026-08-19 5차(개발자 직접 지시) — 로그인 위치를 박스 클릭 시점에서 오버레이 내부 CTA
  // 클릭 시점으로 옮김. "소개글(오버레이 슬라이드)은 로그인 없이도 봐야 한다"는 UX 판단.
  // 🔴 00-26 §4.2-1("①은 전부 로그인 필수라 박스 단위 게이트")과 어긋나는 편차 — 슬라이드별
  // CTA는 이미 `loginRequired`로 개별 게이트돼 있어(BoxDetailOverlay, 예: 엔딩노트 작성하기)
  // 박스 단위 게이트를 없애도 실제 "쓰기" 진입은 그대로 막힌다. [Opus]가 §4.2-1을
  // 이 기준으로 재정합해야 한다.
  const handleBox1Click = () => {
    onSetMode?.('prep');
    setOpenBox('box1');
  };

  // 00-26 §4.2-1 — ②는 로그인 없이 즉시 진입(07 열람은 07-02 원칙상 즉시 가능해야 함).
  const handleBox2Click = () => {
    onSetMode?.('bereaved');
    setOpenBox('box2');
  };

  return (
    <div className="entry-boxes-focus-group" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
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
          onClick={handleBox1Click}
          className="card entry-box-primary entry-box-card entry-box-tint-green"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
            justifyContent: 'center',
          }}
        >
          <BoxHeader
            icon={<HeartHandshake size={32} color="var(--point-color)" />}
            title="생전 준비"
            subtitle="미리 준비해 두면, 남은 가족이 덜 힘듭니다."
            iconBg="rgba(91, 112, 101, 0.12)"
          />
          <RevealContent>
            <ChipRow labels={box1Keys.map((k) => chipLabels[k])} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginTop: '1.1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(91, 112, 101, 0.2)',
                color: 'var(--point-color)',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              자세히 보기 <ChevronRight size={18} />
            </div>
          </RevealContent>
        </button>

        {/* ② 임종 및 사후 정리 — 클릭 시 미니 오버레이(상중케어부터 순서대로) */}
        <button
          type="button"
          onClick={handleBox2Click}
          className="card entry-box-primary entry-box-card entry-box-tint-gold"
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
            justifyContent: 'center',
          }}
        >
          <BoxHeader
            icon={<ChecklistShieldIcon size={32} color="#03543F" />}
            title="임종 및 사후 정리"
            subtitle="지금 해야 할 일부터 순서대로 안내해 드립니다."
            iconBg="rgba(212, 163, 89, 0.16)"
          />
          <RevealContent>
            <ChipRow labels={box2Keys.map((k) => chipLabels[k])} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginTop: '1.1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(212, 163, 89, 0.25)',
                color: 'var(--point-color)',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              자세히 보기 <ChevronRight size={18} />
            </div>
          </RevealContent>
        </button>
      </div>

      {/* 하단 블록 — ③④ 낮은 카드, 높이 약 절반(00-23 §8.5) */}
      <div
        className="entry-boxes-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}
      >
        {/* ③ Guest — 링크 전체 붙여넣기(00-23 §4.4). 목업 단계는 비활성 고정, 기존 방식 유지 */}
        <div className="card entry-box-secondary entry-box-card entry-box-tint-slate">
          <BoxHeader
            icon={<DoorOpen size={24} color="#5B7065" />}
            title="Guest"
            subtitle="받으신 추모관 링크로 입장하세요."
            badge={<Badge status="comingSoon" />}
            size="sm"
          />
          <RevealContent>
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
          </RevealContent>
        </div>

        {/* ④ 파트너 — 항목 1개뿐이라 기존 방식(목록 1줄) 그대로 유지 */}
        <div className="card entry-box-secondary entry-box-card entry-box-tint-slate">
          <BoxHeader
            icon={<Building2 size={24} color="var(--primary-color)" />}
            title="파트너"
            subtitle="장사시설·전문가 사업자이신가요?"
            size="sm"
          />
          <RevealContent>
            <div style={{ marginTop: '0.5rem' }}>
              {box4Items.map((item) => (
                <EntryRow key={item.label} item={item} currentUser={currentUser} onOpenLogin={onOpenLogin} setActiveTab={setActiveTab} />
              ))}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
              로그인하시면 대시보드로 이동합니다.
            </p>
          </RevealContent>
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
