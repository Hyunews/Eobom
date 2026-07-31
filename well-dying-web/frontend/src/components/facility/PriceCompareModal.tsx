import React from 'react';
import { X, Calculator } from 'lucide-react';

interface PriceCompareModalProps {
  facility: {
    name: string;
    detailedPrices?: {
      facilityFee: string;
      casketFee: string;
      shroudFee: string;
      mourningDress: string;
      altarFlower: string;
      totalEst: string;
    };
  };
  onClose: () => void;
}

export const PriceCompareModal: React.FC<PriceCompareModalProps> = ({ facility, onClose }) => {
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
        zIndex: 2100,
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
          maxWidth: '550px',
          width: '100%',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator color="var(--point-color)" /> [{facility.name}] 세부 가격 공시표
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          보건복지부 e하늘 장사정보시스템 표준 공시 가격 기준 (투명 견적 보증)
        </p>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {facility.detailedPrices ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 빈소 사용료 (2일 기준):</span>
                <strong>{facility.detailedPrices.facilityFee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 관 (Casket) 비용:</span>
                <strong>{facility.detailedPrices.casketFee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 수의 (Shroud) 비용:</span>
                <strong>{facility.detailedPrices.shroudFee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 상복 및 유족 용품:</span>
                <strong>{facility.detailedPrices.mourningDress}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• 제단 생화 장식:</span>
                <strong>{facility.detailedPrices.altarFlower}</strong>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #CBD5E1', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--point-color)', fontWeight: 800 }}>
                <span>총 예상 소요 견적:</span>
                <span>{facility.detailedPrices.totalEst}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>기본 팩 500만원 ~ 850만원 예상</p>
          )}
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
          확인 닫기
        </button>
      </div>
    </div>
  );
};
