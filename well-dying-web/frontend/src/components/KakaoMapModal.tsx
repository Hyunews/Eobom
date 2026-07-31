import React from 'react';
import { X, MapPin, Navigation, ExternalLink, ShieldCheck, Car, PhoneCall, Clock } from 'lucide-react';

interface KakaoMapModalProps {
  facility: {
    name: string;
    location: string;
    lat?: number;
    lng?: number;
    tags: string[];
    amenities?: string[];
    price?: string;
  };
  userLocation?: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const KakaoMapModal: React.FC<KakaoMapModalProps> = ({ facility, userLocation, onClose }) => {
  // 거리 계산 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const lat = facility.lat || 37.4925;
  const lng = facility.lng || 127.0078;
  const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : '3.2';

  const kakaoMapNavUrl = `https://map.kakao.com/link/to/${encodeURIComponent(facility.name)},${lat},${lng}`;
  const kakaoRoadviewUrl = `https://map.kakao.com/link/roadview/${lat},${lng}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            border: 'none',
            background: 'var(--bg-card)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={20} color="var(--primary-color)" />
        </button>

        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
            카카오맵 LBS 위치 서비스
          </span>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-color)', marginTop: '0.4rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin color="var(--accent-red)" /> {facility.name}
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            주소: {facility.location} (현 위치에서 <strong style={{ color: 'var(--point-color)' }}>{distance} km</strong>)
          </p>
        </div>

        {/* 지도 프리뷰 영역 */}
        <div
          style={{
            position: 'relative',
            height: '320px',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#E2E8F0',
            border: '1px solid var(--border-color)',
            backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* LBS 반경 원 그래픽 */}
          <div
            style={{
              position: 'absolute',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              border: '2px dashed rgba(217, 119, 6, 0.4)',
              backgroundColor: 'rgba(217, 119, 6, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--point-color)', fontWeight: 700, position: 'absolute', top: '10px' }}>
              📍 반경 내 최적 접근 경로
            </span>
          </div>

          {/* 중앙 마커 핀 */}
          <div style={{ zIndex: 5, textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: 'var(--accent-red)',
                color: '#FFF',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)',
                marginBottom: '0.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <MapPin size={16} /> {facility.name}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
              GPS 좌표: {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>

          {/* 카카오 지도 뱃지 */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: '#FEE500',
              color: '#000000',
              padding: '0.3rem 0.7rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            Kakao Map LBS Connected
          </div>
        </div>

        {/* 편의 정보 및 링크 */}
        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--point-color)" /> 주차 및 보증 정보
            </p>
            <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-muted)' }}>• 무료 주차 가능 (대형 버스 지원)</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>• 24시간 장례 지도사 상주 및 안치실</p>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="var(--point-color)" /> 빠른 방문 안내
            </p>
            <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-muted)' }}>• 지하철/버스 정류장 도보 5분</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>• 긴급 운구 차량 15분 내 도달 지역</p>
          </div>
        </div>

        {/* 카카오맵 내비게이션 & 로드뷰 외출 버튼 */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem' }}>
          <a
            href={kakaoMapNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              flex: 1,
              backgroundColor: '#FEE500',
              color: '#191919',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            <Navigation size={18} /> 카카오맵 길찾기 <ExternalLink size={14} />
          </a>

          <a
            href={kakaoRoadviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              flex: 1,
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--primary-color)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            <MapPin size={18} /> 로드뷰 보기 <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
