import React, { useEffect, useRef, useState } from 'react';
import { GEOLOCATION_FALLBACK, KAKAO_MAP_LOAD_TIMEOUT_MS, KAKAO_MAP_LOAD_POLL_INTERVAL_MS } from '../../../config';
import { RdDialog } from '../../parts/RdModal';
import { IconArrowOut, IconPin, IconWarn } from '../../parts/icons';

// 8단계 묶음 5 · 지도 창 — 판 2-10. 지도를 붙이는 방식은 지금 KakaoMapModal.tsx와 같다(SDK 주소·키·타임아웃·폴링 그대로).
// 달라진 것: 화면 문구에서 개발자용 설명(Kakao Maps Live Integration · API 키 안내 · 좌표)을 뺐고(2단계 확정 ③),
// 로드뷰(보조)를 왼쪽, 길찾기(주)를 오른쪽에 둔다(0단계 창 버튼 규칙).
// forceState = 미리보기 전용: 지도를 붙이지 않고 "불러오는 중" / "불러오지 못함" 모양만 보인다.

declare global {
  interface Window {
    kakao: any;
  }
}

export interface MapTarget {
  name: string;
  location: string;
  lat?: number;
  lng?: number;
}

const km = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

export function MapDialog({
  facility,
  userLocation,
  distanceKm,
  forceState,
  onClose,
}: {
  facility: MapTarget;
  userLocation?: { lat: number; lng: number } | null;
  /** 이미 아는 거리(카드에 보인 값). 없고 userLocation도 없으면 거리 문구를 뺀다 */
  distanceKm?: number | null;
  forceState?: 'loading' | 'failed';
  onClose: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(forceState === 'failed');

  const lat = facility.lat || GEOLOCATION_FALLBACK.lat;
  const lng = facility.lng || GEOLOCATION_FALLBACK.lng;
  const distance = userLocation ? km(userLocation.lat, userLocation.lng, lat, lng) : distanceKm != null ? distanceKm.toFixed(1) : null;
  const navUrl = `https://map.kakao.com/link/to/${encodeURIComponent(facility.name)},${lat},${lng}`;
  const roadUrl = `https://map.kakao.com/link/roadview/${lat},${lng}`;

  useEffect(() => {
    if (forceState) return;
    let cancelled = false;
    let map: any = null;
    setFailed(false);

    const KEY = import.meta.env.VITE_KAKAO_MAP_KEY || '';
    if (!KEY) {
      setFailed(true);
      return;
    }
    if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services&autoload=false`;
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      document.head.appendChild(script);
    }

    const render = () => {
      if (cancelled || !mapRef.current) return false;
      try {
        if (!window.kakao?.maps?.LatLng) return false;
        const pos = new window.kakao.maps.LatLng(lat, lng);
        map = new window.kakao.maps.Map(mapRef.current, { center: pos, level: 3 });
        new window.kakao.maps.Marker({ position: pos }).setMap(map);
        map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
        setTimeout(() => {
          if (map?.relayout) {
            map.relayout();
            map.setCenter(pos);
          }
        }, 150);
        setLoaded(true);
        return true;
      } catch (e) {
        console.error('Kakao Map render error:', e);
        return false;
      }
    };
    const tryInit = () => {
      if (window.kakao?.maps) {
        if (typeof window.kakao.maps.load === 'function') window.kakao.maps.load(() => render());
        else render();
      }
    };

    let attempts = 0;
    const maxAttempts = Math.ceil(KAKAO_MAP_LOAD_TIMEOUT_MS / KAKAO_MAP_LOAD_POLL_INTERVAL_MS);
    const timer = setInterval(() => {
      attempts++;
      if (window.kakao?.maps?.LatLng) {
        if (render()) clearInterval(timer);
      } else tryInit();
      if (attempts > maxAttempts) {
        clearInterval(timer);
        if (!cancelled && !window.kakao) setFailed(true);
      }
    }, KAKAO_MAP_LOAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [lat, lng, forceState]);

  return (
    <RdDialog
      form
      width={560}
      title={facility.name}
      closeX
      onClose={onClose}
      footer={
        <>
          <a className="rd-btn rd-btn--secondary rd-btn--dialog" href={roadUrl} target="_blank" rel="noopener noreferrer">
            <span>로드뷰 바로가기</span>
            <IconArrowOut size={14} />
          </a>
          <a className="rd-btn rd-btn--primary rd-btn--dialog" href={navUrl} target="_blank" rel="noopener noreferrer">
            <span>카카오맵 길찾기</span>
            <IconArrowOut size={14} />
          </a>
        </>
      }
    >
      <div className="rd-formstack">
        <div className="rd-af-map">
          <div ref={mapRef} className="rd-af-map__canvas" />
          {!loaded && !failed && (
            <div className="rd-af-map__cover rd-af-map__cover--wait" role="status">
              <span className="rd-spin rd-af-map__spin" aria-hidden="true" />
              <p>실제 카카오 지도를 불러오는 중입니다...</p>
            </div>
          )}
          {failed && (
            <div className="rd-af-map__cover rd-af-map__cover--fail" role="alert">
              <IconWarn size={40} />
              <p>지도를 불러오지 못했습니다</p>
            </div>
          )}
        </div>
        <p className="rd-af-map__addr">
          <IconPin size={16} />
          <span>
            주소: {facility.location}
            {distance && (
              <>
                {' '}
                (현재 위치에서 <b>{distance} km</b>)
              </>
            )}
          </span>
        </p>
      </div>
    </RdDialog>
  );
}
