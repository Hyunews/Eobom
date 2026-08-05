import React from 'react';
import { X, PhoneCall } from 'lucide-react';

interface EmergencyModalProps {
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '2.5rem',
          maxWidth: '600px',
          width: '100%',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <PhoneCall size={32} color="var(--accent-red)" className="animate-pulse" />
          </div>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--primary-color)', fontWeight: 800 }}>🚨 24시간 긴급 장례 지원 센터</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>임종 직후 1-Touch 원클릭으로 15분 내 전담 장례지도사 배정</p>
        </div>

        {/* 3단계 프로세스 타임라인 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'var(--accent-red)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
              1
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>긴급 접수 &amp; 위치 확인</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>GPS 위치 파악 및 앰뷸런스 운구차 즉시 배차 조치</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'var(--point-color)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
              2
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>1:1 전담 장례지도사 전화 연결</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>병원/자택 안치 수속 및 사망진단서 수령 가이드</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'var(--primary-color)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
              3
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>희망 장례식장 안치실 우선 예약</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>실시간 빈소 잔여 현황 조회 후 맞춤 안치 연결</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5', textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#991B1B', fontSize: '1.1rem' }}>📞 직통 대표전화: 1588-0000 (24시간 무료)</p>
        </div>

        <button onClick={() => alert('🚨 긴급 센터로 자동 다이얼 연결 중입니다...')} className="btn" style={{ width: '100%', backgroundColor: 'var(--accent-red)', color: '#FFF', padding: '1rem', fontSize: '1.1rem', fontWeight: 800 }}>
          전화 연결하기
        </button>
      </div>
    </div>
  );
};
