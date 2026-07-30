import React, { useState } from 'react';
import { Home, Home as HouseIcon, Scale, Smartphone, ScrollText, ClipboardCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { id: 'home', label: '홈 메인', icon: Home },
    { id: 'facility', label: '장례 · 묘지 매칭', icon: HouseIcon },
    { id: 'counseling', label: '상속 · 법률 케어', icon: Scale },
    { id: 'digital-estate', label: '디지털 유품 정리', icon: Smartphone },
    { id: 'ending-note', label: '디지털 엔딩노트', icon: ScrollText },
    { id: 'care-guide', label: '상중 · 행정 케어', icon: ClipboardCheck },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        left: 0,
        top: '72px', // Header 아래에 고정
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
        padding: '1.5rem 0.5rem'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: '100%'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#DFDCD7',
                fontWeight: isActive ? 600 : 400,
                fontSize: '1rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s',
                width: '100%',
                justifyContent: isHovered ? 'flex-start' : 'center'
              }}
              title={!isHovered ? item.label : undefined}
            >
              <Icon size={24} style={{ flexShrink: 0 }} />
              {isHovered && (
                <span style={{
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s ease-in-out',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
