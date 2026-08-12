import React from 'react';
import { Home } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from './MenuIcons';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// width/margin-left 확장 동기화는 순수 CSS(:hover)로 처리한다(→ index.css `.sidebar`) —
// 이전엔 이 컴포넌트의 React state로 width만 넓히고 .main-wrapper의 margin-left는
// 못 따라가서, 확장 시 사이드바가 본문 위에 그대로 올라타 콘텐츠를 가리는 문제가 있었다.
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  // 공식 6개 네비게이션 메뉴 (각 메뉴별 보조 설명 문구 제거하여 디자인 극대화)
  const menuItems = [
    { id: 'home', label: '메인', icon: Home },
    { id: 'facility', label: '장례 · 묘지 매칭', icon: HouseLeafIcon },
    { id: 'counseling', label: '상속 · 법률 케어', icon: HandScalesIcon },
    { id: 'digital-estate', label: '디지털 유품 정리', icon: PhoneHeartIcon },
    { id: 'care-guide', label: '상중 · 행정 케어', icon: ChecklistShieldIcon },
    { id: 'ending-note', label: '디지털 엔딩노트', icon: NoteKeyIcon },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        backgroundColor: 'var(--primary-color)',
        color: '#FFFFFF',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          width: '100%'
        }}
      >
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.9rem 0.85rem',
                borderRadius: '12px',
                border: isActive ? '1.5px solid var(--accent-gold)' : '1px solid transparent',
                borderLeft: isActive ? '5px solid var(--accent-gold)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#CBD5E1',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                whiteSpace: 'nowrap',
                width: '100%',
                textAlign: 'left',
                boxShadow: isActive ? '0 4px 14px rgba(91, 112, 101, 0.5)' : 'none'
              }}
              title={item.label}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}>
                {item.id === 'home' ? (
                  <Home size={24} color={isActive ? '#FFFFFF' : '#E2E8F0'} />
                ) : (
                  <IconComponent
                    size={24}
                    color={isActive ? '#FFFFFF' : '#E2E8F0'}
                    accentColor={isActive ? '#FDE047' : '#D4A359'}
                    fillColor={isActive ? '#FFFFFF' : '#5B7065'}
                  />
                )}
              </div>

              <span
                className="sidebar-label"
                style={{
                  fontSize: '0.98rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#FFFFFF' : '#F8FAFC'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
