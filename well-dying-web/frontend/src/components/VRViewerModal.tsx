import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, Maximize, RotateCcw, Compass, ZoomIn, ZoomOut, Info, MapPin } from 'lucide-react';

interface VRScene {
  id: string;
  title: string;
  url: string;
}

interface VRViewerModalProps {
  facilityName: string;
  scenes: VRScene[];
  onClose: () => void;
}

export const VRViewerModal: React.FC<VRViewerModalProps> = ({ facilityName, scenes, onClose }) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [rotation, setRotation] = useState({ pitch: 0, yaw: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeScene = scenes[activeSceneIndex] || scenes[0];

  // 자동 회전 루프
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotation((prev) => ({ ...prev, yaw: (prev.yaw + 0.3) % 360 }));
    }, 50);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotation((prev) => ({
      yaw: (prev.yaw - deltaX * 0.4 + 360) % 360,
      pitch: Math.max(-45, Math.min(45, prev.pitch - deltaY * 0.3))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.8));
  const handleReset = () => {
    setRotation({ pitch: 0, yaw: 0 });
    setZoom(1);
  };

  // 모달 핫스팟 정의
  const hotspots = [
    { id: 'altar', title: '영정 제단 & 생화 조화', yaw: 45, pitch: 5, info: '최신 스마트 멀티미디어 영정 스크린 및 생화 특대 제단 지원' },
    { id: 'rest', title: '유족 개별 침실 & 안마의자', yaw: 180, pitch: -10, info: '독립형 샤워부스, 바디프랜드 안마의자 및 24h 온돌 설치' },
    { id: 'dining', title: '접객석 & 자율 뷔페 세팅', yaw: 290, pitch: 0, info: '최대 200석 동시 수용, 친환경 식기 및 정찰제 음식 서비스' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        color: '#FFFFFF'
      }}
    >
      {/* 상단 툴바 */}
      <div
        style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ backgroundColor: 'var(--point-color)', color: '#1E293B', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
              360° VR VIRTUAL TOUR
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{facilityName}</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0.2rem 0 0 0' }}>
            마우스 드래그로 360도 공간을 자유롭게 둘러보세요. (현재 공간: <span style={{ color: 'var(--accent-gold)' }}>{activeScene.title}</span>)
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* VR 파노라마 메인 뷰어 영역 */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* 파노라마 가상 구형 배경 */}
        <div
          style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            backgroundImage: `url(${activeScene.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${zoom}) rotateX(${rotation.pitch}deg) rotateY(${rotation.yaw}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            filter: 'brightness(0.9) contrast(1.05)'
          }}
        />

        {/* 그리드 오버레이 (3D 가상 공간 감각 증대) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle, transparent 40%, rgba(15,23,42,0.6) 90%)'
          }}
        />

        {/* 핫스팟 포인트 마커 */}
        {hotspots.map((hs) => {
          // yaw 각도 기반 화면 X 좌표 추정 계산
          const relativeYaw = ((hs.yaw - rotation.yaw + 540) % 360) - 180;
          if (Math.abs(relativeYaw) > 70) return null; // 화면 뒤쪽 핫스팟은 숨김

          const posX = 50 + (relativeYaw / 70) * 40;
          const posY = 50 + (hs.pitch - rotation.pitch) * 0.8;

          return (
            <div
              key={hs.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHotspot(hs.id === selectedHotspot ? null : hs.id);
              }}
              style={{
                position: 'absolute',
                left: `${posX}%`,
                top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.9)',
                  color: '#FFFFFF',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 0 15px rgba(217, 119, 6, 0.8)',
                  border: '2px solid #FFFFFF',
                  animation: 'pulse 2s infinite'
                }}
              >
                <Eye size={14} /> {hs.title}
              </div>

              {/* 핫스팟 상세 팝업 카드 */}
              {selectedHotspot === hs.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    width: '220px',
                    fontSize: '0.8rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--accent-gold)' }}>📍 {hs.title}</p>
                  <p style={{ color: '#CBD5E1', margin: 0, lineHeight: '1.3' }}>{hs.info}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* 나침반 & 방위 안내 위젯 */}
        <div
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            backgroundColor: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: '0.6rem 1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Compass size={18} style={{ transform: `rotate(${-rotation.yaw}deg)`, transition: 'transform 0.1s' }} color="var(--accent-gold)" />
          <span>시점 방위각: {Math.round(rotation.yaw)}° (정면 0°)</span>
        </div>

        {/* 우측 컨트롤 도구 모음 */}
        <div
          style={{
            position: 'absolute',
            right: '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: '0.6rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <button onClick={handleZoomIn} title="확대" style={{ background: 'none', border: 'none', color: '#FFF', padding: '0.5rem', cursor: 'pointer' }}>
            <ZoomIn size={20} />
          </button>
          <button onClick={handleZoomOut} title="축소" style={{ background: 'none', border: 'none', color: '#FFF', padding: '0.5rem', cursor: 'pointer' }}>
            <ZoomOut size={20} />
          </button>
          <button onClick={handleReset} title="초기화" style={{ background: 'none', border: 'none', color: '#FFF', padding: '0.5rem', cursor: 'pointer' }}>
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="자동회전"
            style={{
              background: autoRotate ? 'var(--point-color)' : 'none',
              color: autoRotate ? '#1E293B' : '#FFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Compass size={20} />
          </button>
        </div>
      </div>

      {/* 하단 씬(Scene) 탭 선택바 */}
      <div
        style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          overflowX: 'auto'
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 600 }}>
          공간 선택:
        </span>
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => {
              setActiveSceneIndex(index);
              setSelectedHotspot(null);
            }}
            style={{
              backgroundColor: activeSceneIndex === index ? 'var(--point-color)' : 'rgba(255, 255, 255, 0.1)',
              color: activeSceneIndex === index ? '#1E293B' : '#FFFFFF',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MapPin size={16} /> {scene.title}
          </button>
        ))}
      </div>
    </div>
  );
};
