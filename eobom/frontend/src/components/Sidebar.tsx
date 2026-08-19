import React from 'react';
import { Home } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from './MenuIcons';
import { Badge } from './home/EntryBoxes';
import { MODE_MENUS, type NavMode, type ModeMenuItem } from '../modeNav';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navMode?: NavMode | null;
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

// width/margin-left 확장 동기화는 순수 CSS(:hover)로 처리한다(→ index.css `.sidebar`) —
// 이전엔 이 컴포넌트의 React state로 width만 넓히고 .main-wrapper의 margin-left는
// 못 따라가서, 확장 시 사이드바가 본문 위에 그대로 올라타 콘텐츠를 가리는 문제가 있었다.
// 00-26 §3·§7 — navMode가 있으면 모드별 맞춤 메뉴(3개/6개, modeNav.ts), 없으면(직접 URL
// 진입 등) 기존 6개 메뉴를 라벨만 정정해 그대로 둔다(§6 #5).
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, navMode, currentUser, onOpenLogin }) => {
  // 공식 6개 네비게이션 메뉴 — 00-26 §5가 잡은 라벨 불일치 3건 정정(장례·묘지 매칭 /
  // 상속·법률 케어 / 디지털 유품 정리 → 00-02 §3.2 정본).
  const defaultMenuItems = [
    { id: 'home', label: '메인', icon: Home },
    { id: 'facility', label: '장사시설 매칭', icon: HouseLeafIcon },
    { id: 'counseling', label: '전문가 매칭', icon: HandScalesIcon },
    { id: 'digital-estate', label: '디지털 자산·계정 정산', icon: PhoneHeartIcon },
    { id: 'care-guide', label: '상중 · 행정 케어', icon: ChecklistShieldIcon },
    { id: 'ending-note', label: '디지털 엔딩노트', icon: NoteKeyIcon },
  ];

  const modeItems: ModeMenuItem[] | null = navMode ? MODE_MENUS[navMode] : null;

  const handleModeItemClick = (item: ModeMenuItem) => {
    if (item.status === 'comingSoon') return;
    if (item.loginRequired && !currentUser) {
      onOpenLogin?.();
      return;
    }
    setActiveTab(item.id);
  };

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
        {modeItems
          ? modeItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              const isComingSoon = item.status === 'comingSoon';

              return (
                <button
                  key={item.id}
                  onClick={() => handleModeItemClick(item)}
                  disabled={isComingSoon}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                    padding: '0.9rem 0.85rem',
                    borderRadius: '12px',
                    border: isActive ? '1.5px solid var(--accent-gold)' : '1px solid transparent',
                    borderLeft: isActive ? '5px solid var(--accent-gold)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                    color: isComingSoon ? '#94A3B8' : isActive ? '#FFFFFF' : '#CBD5E1',
                    cursor: isComingSoon ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 14px rgba(91, 112, 101, 0.5)' : 'none'
                  }}
                  title={item.label}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}>
                      <IconComponent size={24} color={isComingSoon ? '#64748B' : isActive ? '#FFFFFF' : '#E2E8F0'} />
                    </span>
                    <span
                      className="sidebar-label"
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isComingSoon ? '#94A3B8' : isActive ? '#FFFFFF' : '#F8FAFC'
                      }}
                    >
                      {item.label}
                    </span>
                  </span>
                  {item.status !== 'active' && (
                    <span className="sidebar-label">
                      <Badge status={item.status === 'preview' ? 'preview' : 'comingSoon'} />
                    </span>
                  )}
                </button>
              );
            })
          : defaultMenuItems.map((item) => {
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
