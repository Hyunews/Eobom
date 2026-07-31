import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, ExternalLink, ShieldCheck, Clock } from 'lucide-react';

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
  apiKey?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export const KakaoMapModal: React.FC<KakaoMapModalProps> = ({ facility, userLocation, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const lat = facility.lat || 37.4925;
  const lng = facility.lng || 127.0078;

  // 거리 계산 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : '3.2';

  const kakaoMapNavUrl = `https://map.kakao.com/link/to/${encodeURIComponent(facility.name)},${lat},${lng}`;
  const kakaoRoadviewUrl = `https://map.kakao.com/link/roadview/${lat},${lng}`;

  useEffect(() => {
    let isCancelled = false;
    let mapInstance: any = null;

    // .env에서 API 키를 가져와 동적으로 SDK 스크립트 로드 (단일 소스 관리)
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY || '';
    if (KAKAO_KEY && !document.querySelector('script[src*="dapi.kakao.com"]')) {
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services`;
      script.async = true;
      document.head.appendChild(script);
    }

    const renderKakaoMap = () => {
      if (isCancelled || !mapRef.current) return false;
      const container = mapRef.current;

      try {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
          return false;
        }

        const options = {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 3
        };

        mapInstance = new window.kakao.maps.Map(container, options);

        const markerPosition = new window.kakao.maps.LatLng(lat, lng);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition
        });
        marker.setMap(mapInstance);

        const iwContent = `
          <div style="padding:10px 14px; border-radius:12px; font-family:sans-serif; font-size:12px; line-height:1.4;">
            <strong style="color:#1E293B; font-size:13px;">📍 ${facility.name}</strong><br/>
            <span style="color:#64748B;">${facility.location}</span>
          </div>
        `;
        const infowindow = new window.kakao.maps.InfoWindow({
          content: iwContent
        });
        infowindow.open(mapInstance, marker);

        const zoomControl = new window.kakao.maps.ZoomControl();
        mapInstance.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        setTimeout(() => {
          if (mapInstance && mapInstance.relayout) {
            mapInstance.relayout();
            mapInstance.setCenter(new window.kakao.maps.LatLng(lat, lng));
          }
        }, 150);

        setIsMapLoaded(true);
        return true;
      } catch (e) {
        console.error('Kakao Map render error:', e);
        return false;
      }
    };

    const tryInit = () => {
      if (window.kakao && window.kakao.maps) {
        if (typeof window.kakao.maps.load === 'function') {
          window.kakao.maps.load(() => {
            renderKakaoMap();
          });
        } else {
          renderKakaoMap();
        }
      }
    };

    // 100ms 폴링으로 Kakao SDK 준비 감지
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
        const success = renderKakaoMap();
        if (success) {
          clearInterval(interval);
        }
      } else {
        tryInit();
      }

      if (attempts > 50) { // 5초 타임아웃
        clearInterval(interval);
      }
    }, 100);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [lat, lng, facility.name, facility.location]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
          maxWidth: '720px',
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
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={20} color="var(--primary-color)" />
        </button>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', backgroundColor: '#FEE500', color: '#191919', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800 }}>
              Kakao Maps Live Integration
            </span>
            {isMapLoaded ? (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#DEF7EC', color: '#03543F', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                ● 실제 카카오 지도 렌더링 완료
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                ● 카카오 지도 렌더링 중...
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginTop: '0.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <MapPin color="var(--accent-red)" /> {facility.name}
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            주소: {facility.location} (현재 위치에서 <strong style={{ color: 'var(--point-color)' }}>{distance} km</strong>)
          </p>
        </div>

        {/* 지도 영역 (실제 SDK 맵 컨테이너) */}
        <div
          style={{
            position: 'relative',
            height: '360px',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#E2E8F0',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* 실제 카카오 지도 마운트 엘리먼트 */}
          <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

          {/* 로딩 대기 시 안내 표시 */}
          {!isMapLoaded && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F1F5F9',
                zIndex: 2
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <MapPin size={32} color="var(--accent-red)" className="animate-pulse" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 700 }}>실제 카카오 지도를 불러오는 중입니다...</p>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{facility.name} (좌표: {lat}, {lng})</p>
              </div>
            </div>
          )}
        </div>

        {/* 편의 정보 */}
        <div style={{ marginTop: '1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '0.9rem', borderRadius: '12px', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--point-color)" /> 주차 및 보증 정보
            </p>
            <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-muted)' }}>• 무료 주차 (대형 버스/유족 우선)</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>• 24시간 장례지도사 상주</p>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '0.9rem', borderRadius: '12px', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="var(--point-color)" /> 빠른 방문 안내
            </p>
            <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-muted)' }}>• 대중교통 도보 5분 거리</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>• 긴급 운구 차 15분 도착 지역</p>
          </div>
        </div>

        {/* 카카오맵 내비게이션 & 로드뷰 외출 버튼 */}
        <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem' }}>
          <a
            href={kakaoMapNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              flex: 1,
              backgroundColor: '#FEE500',
              color: '#191919',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              padding: '0.8rem'
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
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              padding: '0.8rem'
            }}
          >
            <MapPin size={18} /> 로드뷰 바로가기 <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
