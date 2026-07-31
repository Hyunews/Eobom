import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from './MenuIcons';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isHovered, setIsHovered] = useState(false);

  // 공식 6개 네비게이션 메뉴 (각 메뉴별 보조 설명 문구 제거하여 디자인 극대화)
  const menuItems = [
    { id: 'home', label: '메인', icon: Home },
    { id: 'facility', label: '장례 · 묘지 매칭', icon: HouseLeafIcon },
    { id: 'counseling', label: '상속 · 법률 케어', icon: HandScalesIcon },
    { id: 'digital-estate', label: '디지털 유품 정리', icon: PhoneHeartIcon },
    { id: 'ending-note', label: '디지털 엔딩노트', icon: NoteKeyIcon },
    { id: 'care-guide', label: '상중 · 행정 케어', icon: ChecklistShieldIcon },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        left: 0,
        top: '72px', // Header 아래 고정
        bottom: 0,
        width: isHovered ? '240px' : '72px',
        backgroundColor: 'var(--primary-color)',
        color: '#FFFFFF',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 900,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0.5rem'
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
                style={{
                  fontSize: '0.98rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#FFFFFF' : '#F8FAFC',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.25s ease'
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
