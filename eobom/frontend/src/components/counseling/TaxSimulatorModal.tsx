import React, { useState } from 'react';
import { X, Calculator, Info } from 'lucide-react';
import { calculateInheritanceTax, InheritanceTaxBreakdown } from '../../utils/inheritanceTax';

// 상속세 간이 시뮬레이터 — 원래 CounselingPage 본문에 있었으나 화면 포션을 너무 많이 차지해
// 버튼으로 여는 모달로 분리(2026-08-11). 계산 로직은 utils/inheritanceTax.ts, 반영/미반영 범위는
// 아래 "참고사항" 블록과 반드시 같이 유지할 것.

interface TaxSimulatorModalProps {
  onClose: () => void;
}

export const TaxSimulatorModal: React.FC<TaxSimulatorModalProps> = ({ onClose }) => {
  const [totalAsset, setTotalAsset] = useState<number>(100000);
  const [debtAndFuneralCost, setDebtAndFuneralCost] = useState<number>(0);
  const [financialAsset, setFinancialAsset] = useState<number>(0);
  const [hasSpouse, setHasSpouse] = useState<boolean>(true);
  const [spouseInheritedAmount, setSpouseInheritedAmount] = useState<string>(''); // 빈 문자열이면 법정상속분 자동 추정
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [elderlyCount, setElderlyCount] = useState<number>(0);
  const [taxResult, setTaxResult] = useState<InheritanceTaxBreakdown | null>(null);

  const handleCalculateTax = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateInheritanceTax({
      totalAsset,
      debtAndFuneralCost,
      financialAsset,
      hasSpouse,
      spouseInheritedAmount: hasSpouse && spouseInheritedAmount !== '' ? Number(spouseInheritedAmount) : null,
      childrenCount,
      elderlyCount,
    });
    setTaxResult(result);
  };

  const fmt = (v: number) => Math.round(v).toLocaleString();

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
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator color="var(--point-color)" /> 상속세 간이 시뮬레이터
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
          아래 조건을 입력하면 예상 상속세를 단계별로 계산해드립니다.
        </p>

        <form onSubmit={handleCalculateTax} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">총 상속재산가액 (만원)</label>
            <input type="number" min={0} value={totalAsset} onChange={(e) => setTotalAsset(Number(e.target.value))} className="form-input" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* 약 {(totalAsset / 10000).toFixed(2)}억원 (부동산·예금·주식 등 전체)</span>
          </div>

          <div className="form-group">
            <label className="form-label">채무 및 장례비용 (만원)</label>
            <input type="number" min={0} value={debtAndFuneralCost} onChange={(e) => setDebtAndFuneralCost(Number(e.target.value))} className="form-input" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* 고인의 채무, 장례비 등 (과세가액에서 차감)</span>
          </div>

          <div className="form-group">
            <label className="form-label">그중 순수 금융재산가액 (만원)</label>
            <input type="number" min={0} value={financialAsset} onChange={(e) => setFinancialAsset(Number(e.target.value))} className="form-input" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* 총 상속재산 중 예금·보험·주식 등 (부동산 제외, 금융재산공제 계산용)</span>
          </div>

          <div className="form-group">
            <label className="form-label">배우자 유무</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ cursor: 'pointer' }}>
                <input type="radio" checked={hasSpouse} onChange={() => setHasSpouse(true)} /> 배우자 있음
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input type="radio" checked={!hasSpouse} onChange={() => { setHasSpouse(false); setSpouseInheritedAmount(''); }} /> 배우자 없음
              </label>
            </div>
          </div>

          {hasSpouse && (
            <div className="form-group">
              <label className="form-label">배우자 실제 상속액 (만원, 선택)</label>
              <input
                type="number"
                min={0}
                placeholder="비워두면 법정상속분으로 자동 추정"
                value={spouseInheritedAmount}
                onChange={(e) => setSpouseInheritedAmount(e.target.value)}
                className="form-input"
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* 배우자공제는 실제 상속액 기준(최소 5억~최대 30억)</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">자녀 수</label>
              <input type="number" min={0} value={childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">65세 이상 상속인 수</label>
              <input type="number" min={0} value={elderlyCount} onChange={(e) => setElderlyCount(Number(e.target.value))} className="form-input" />
            </div>
          </div>

          <button type="submit" className="btn btn-point" style={{ width: '100%' }}>
            상속세 산출하기
          </button>
        </form>

        {taxResult && (
          <div style={{
            marginTop: '1.1rem',
            padding: '1.2rem',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '8px',
            borderLeft: '4px solid var(--primary-color)'
          }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.6rem' }}>📊 예상 상속세 산출 결과</h4>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <Row label="상속세 과세가액" value={`${fmt(taxResult.taxableBase)} 만원`} />
              <Row label="기초공제/일괄공제(큰 금액)" value={`- ${fmt(taxResult.basicOrLumpSumDeduction)} 만원`} />
              <Row
                label={`배우자공제${taxResult.spouseDeductionIsEstimated ? ' (법정상속분 추정)' : ''}`}
                value={`- ${fmt(taxResult.spouseDeduction)} 만원`}
              />
              <Row label="금융재산 상속공제" value={`- ${fmt(taxResult.financialAssetDeduction)} 만원`} />
              <div style={{ borderTop: '1px dashed var(--border-color)', margin: '0.3rem 0' }} />
              <Row label="과세표준" value={`${fmt(taxResult.taxBase)} 만원`} bold />
              <Row label="적용 최고세율 구간" value={`${taxResult.bracketRate}%`} />
              <Row label="산출세액" value={`${fmt(taxResult.calculatedTax)} 만원`} />
              <Row label="신고세액공제 (3%, 기한 내 신고 가정)" value={`- ${fmt(taxResult.reportingDeduction)} 만원`} />
            </div>

            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-red)', margin: '0.8rem 0 0 0' }}>
              최종 예상 상속세액: 약 {fmt(taxResult.finalTax)} 만원 ({(taxResult.finalTax / 10000).toFixed(2)} 억원)
            </p>
          </div>
        )}

        {/* 참고사항 — 계산 기준·반영 범위·면책. utils/inheritanceTax.ts의 실제 계산 범위와 반드시 일치시킬 것 */}
        <div style={{
          marginTop: '1.2rem',
          padding: '1rem 1.2rem',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#78350F',
        }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Info size={15} /> 계산 기준 및 참고사항
          </p>
          <p style={{ margin: '0.3rem 0' }}>
            <strong>반영한 항목</strong>: 기초공제(2억)·자녀공제(1인당 5천만원)·연로자공제(1인당 5천만원) 중 일괄공제(5억)와 비교해 큰 금액, 배우자공제(최소 5억~최대 30억), 금융재산 상속공제(순금융재산의 20%, 최소 2천만원~한도 2억), 5단계 누진세율(10~50%), 신고세액공제(3%).
          </p>
          <p style={{ margin: '0.3rem 0' }}>
            <strong>반영하지 않은 항목</strong>: 미성년자·장애인공제(기대여명 등 개별 심사 필요), 동거주택 상속공제(거주요건 확인 필요), 가업·영농상속공제, 세대생략 상속 할증, 10년 이내 사전증여재산 합산, 상속공제 종합한도.
          </p>
          <p style={{ margin: '0.3rem 0' }}>
            법적 근거: 상속세 및 증여세법. 세율·공제액은 세법 개정에 따라 달라질 수 있으므로 최신 기준은 국세청 또는 세무 전문가를 통해 반드시 확인하시기 바랍니다.
          </p>
          <p style={{ margin: '0.3rem 0', fontWeight: 700 }}>
            이 결과는 참고용 추정치이며 법적 효력이 없습니다. 정확한 세액은 전문가 상담을 이용해주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: bold ? 700 : 400 }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span>{value}</span>
  </div>
);
