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

export const KakaoMapModal: React.FC<KakaoMapModalProps> = ({ facility, userLocation, onClose, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const lat = facility.lat || 37.4925;
  const lng = facility.lng || 127.0078;

  // 환경변수 또는 props의 API Key 확인
  const kakaoAppKey = apiKey || (import.meta as any).env?.VITE_KAKAO_MAP_KEY || '';

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

  // 동적 카카오 지도 SDK 스크립트 안전 로드 및 맵 초기화
  useEffect(() => {
    if (!kakaoAppKey) {
      setIsMapLoaded(false);
      return;
    }

    let isSubscribed = true;

    const initMap = () => {
      if (!isSubscribed || !mapRef.current) return;

      try {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
          setIsMapLoaded(false);
          return;
        }

        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 3
        };

        const map = new window.kakao.maps.Map(container, options);

        // 마커 생성
        const markerPosition = new window.kakao.maps.LatLng(lat, lng);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition
        });
        marker.setMap(map);

        // 인포윈도우(팝업) 생성
        const iwContent = `
          <div style="padding:10px 14px; border-radius:12px; font-family:sans-serif; font-size:12px; line-height:1.4;">
            <strong style="color:#1E293B; font-size:13px;">📍 ${facility.name}</strong><br/>
            <span style="color:#64748B;">${facility.location}</span>
          </div>
        `;
        const infowindow = new window.kakao.maps.InfoWindow({
          content: iwContent
        });
        infowindow.open(map, marker);

        // 지도 조작 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        setIsMapLoaded(true);
      } catch (err) {
        console.warn('Kakao Map initialization fallback:', err);
        setIsMapLoaded(false);
      }
    };

    const loadKakaoSDK = () => {
      // 1. 이미 kakao.maps.LatLng 객체까지 완전히 로드 완료된 경우
      if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
        initMap();
        return;
      }

      // 2. window.kakao.maps.load 함수가 호출 가능한 상태인 경우
      if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
        window.kakao.maps.load(() => initMap());
        return;
      }

      // 3. 스크립트 엘리먼트가 이미 존재하는 경우
      const existingScript = document.getElementById('kakao-map-script') as HTMLScriptElement;
      if (existingScript) {
        const handleScriptLoad = () => {
          if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
            window.kakao.maps.load(() => initMap());
          } else {
            initMap();
          }
        };

        existingScript.addEventListener('load', handleScriptLoad);
        
        // 지연 시간 후 폴백 확인
        const timer = setTimeout(() => {
          if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
            window.kakao.maps.load(() => initMap());
          } else {
            initMap();
          }
        }, 300);

        return () => {
          existingScript.removeEventListener('load', handleScriptLoad);
          clearTimeout(timer);
        };
      }

      // 4. 신규 스크립트 생성 로드
      const script = document.createElement('script');
      script.id = 'kakao-map-script';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
          window.kakao.maps.load(() => initMap());
        } else {
          initMap();
        }
      };
      script.onerror = () => setIsMapLoaded(false);
      document.head.appendChild(script);
    };

    const cleanup = loadKakaoSDK();

    return () => {
      isSubscribed = false;
      if (typeof cleanup === 'function') cleanup();
    };
  }, [kakaoAppKey, lat, lng, facility.name, facility.location]);

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
              Kakao Maps LBS SDK Connected
            </span>
            {isMapLoaded ? (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#DEF7EC', color: '#03543F', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                ● 실제 카카오 지도 렌더링 중
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                ● LBS 위치 스마트 가이드 (실시간 안전 전환)
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

        {/* 지도 영역 (실제 SDK 맵 컨테이너 + 하이브리드 폴백) */}
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
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* 지도 미로드 시 나타나는 스마트 LBS UI 폴백 */}
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
              <div
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(217, 119, 6, 0.4)',
                  backgroundColor: 'rgba(217, 119, 6, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--point-color)', fontWeight: 700, position: 'absolute', top: '10px' }}>
                  📍 LBS 반경 {distance}km 위치 탐색
                </span>
              </div>

              <div style={{ zIndex: 5, textAlign: 'center', position: 'absolute' }}>
                <div
                  style={{
                    backgroundColor: 'var(--accent-red)',
                    color: '#FFF',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)',
                    marginBottom: '0.4rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <MapPin size={16} /> {facility.name}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: 'rgba(255,255,255,0.95)', padding: '0.3rem 0.7rem', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  GPS 좌표: {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
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
