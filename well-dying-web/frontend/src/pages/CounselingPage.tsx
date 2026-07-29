import React, { useState } from 'react';
import { Scale, Video, Calculator, Calendar, Clock, X, CheckCircle2 } from 'lucide-react';

export const CounselingPage: React.FC = () => {
  // 분야 선택 필터
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 상담 예약 모달 및 달력 상태
  const [bookingExpert, setBookingExpert] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-05');
  const [selectedTime, setSelectedTime] = useState<string>('14:00');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // 상속세 시뮬레이터 상태
  const [totalAsset, setTotalAsset] = useState<number>(100000);
  const [hasSpouse, setHasSpouse] = useState<boolean>(true);
  const [calculatedTax, setCalculatedTax] = useState<number | null>(null);

  const handleCalculateTax = (e: React.FormEvent) => {
    e.preventDefault();
    let deduction = 50000;
    if (hasSpouse) deduction += 50000;
    const taxableAmount = Math.max(0, totalAsset - deduction);
    const tax = Math.round(taxableAmount * 0.2);
    setCalculatedTax(tax);
  };

  const experts = [
    {
      id: 'e1',
      name: '김상속 변호사',
      category: '유언·상속 분쟁',
      experience: '경력 15년',
      rating: '4.9/5.0',
      available: '화상상담 가능'
    },
    {
      id: 'e2',
      name: '이세무 세무사',
      category: '세무·증여 절세',
      experience: '경력 12년',
      rating: '5.0/5.0',
      available: '화상/방문 가능'
    },
    {
      id: 'e3',
      name: '박법무 법무사',
      category: '부동산·등기 공증',
      experience: '경력 18년',
      rating: '4.8/5.0',
      available: '예약 가능'
    }
  ];

  const filteredExperts = selectedCategory === '전체' 
    ? experts 
    : experts.filter(e => e.category.includes(selectedCategory));

  const handleConfirmBooking = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingExpert(null);
    }, 3000);
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale color="var(--primary-color)" /> 2. 상속·법률·세무 비대면 전문가 상담
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          변호사, 세무사 분야별 1:1 상담 예약, 상담 일정 달력 선택 및 상속세 자동 시뮬레이터
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* 왼쪽: 전문가 1:1 상담 및 분야 필터 & 달력 예약 */}
        <div style={{
          backgroundColor: 'var(--card-bg)',
          padding: '2rem',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--box-shadow)',
          borderTop: '5px solid var(--primary-color)'
        }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video color="var(--primary-color)" /> 분야별 전문가 1:1 비대면 상담
          </h3>

          {/* 분야 선택 필터 */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">분야 선택</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['전체', '유언·상속', '세무·증여', '부동산'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: selectedCategory === cat ? 'var(--primary-color)' : 'var(--secondary-color)',
                    color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: selectedCategory === cat ? 600 : 400,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 전문가 카드 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredExperts.map((exp) => (
              <div key={exp.id} style={{
                padding: '1.2rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--secondary-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{exp.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 600 }}>★ {exp.rating}</span>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--point-color)' }}>{exp.category}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{exp.experience} | {exp.available}</p>
                <button 
                  onClick={() => setBookingExpert(exp.name)} 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}
                >
                  <Calendar size={16} /> 상담 일정 예약하기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 상속세 자동 시뮬레이터 */}
        <div style={{
          backgroundColor: 'var(--card-bg)',
          padding: '2rem',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--box-shadow)',
          borderTop: '5px solid var(--point-color)'
        }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator color="var(--point-color)" /> 상속세 간이 시뮬레이터
          </h3>
          <form onSubmit={handleCalculateTax}>
            <div className="form-group">
              <label className="form-label">총 상속 자산 가액 (만원 단위)</label>
              <input
                type="number"
                value={totalAsset}
                onChange={(e) => setTotalAsset(Number(e.target.value))}
                className="form-input"
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>* 약 {(totalAsset / 10000).toFixed(1)}억원</span>
            </div>

            <div className="form-group">
              <label className="form-label">배우자 유무</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" checked={hasSpouse} onChange={() => setHasSpouse(true)} /> 배우자 있음 (최소 5억 추가 공제)
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" checked={!hasSpouse} onChange={() => setHasSpouse(false)} /> 배우자 없음
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-point" style={{ width: '100%' }}>
              상속세 산출하기
            </button>
          </form>

          {calculatedTax !== null && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.2rem',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: '8px',
              borderLeft: '4px solid var(--primary-color)'
            }}>
              <h4 style={{ color: 'var(--primary-color)' }}>📊 예상 상속세 산출 결과</h4>
              <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-red)', margin: '0.5rem 0' }}>
                예상 상속세액: 약 {calculatedTax.toLocaleString()} 만원 ({(calculatedTax / 10000).toFixed(2)} 억원)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 상담 일정 선택 달력 모달 */}
      {bookingExpert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setBookingExpert(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar color="var(--primary-color)" /> {bookingExpert} 상담 일정 선택
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              원하시는 상담 날짜와 시간을 지정해 주세요.
            </p>

            {/* 달력 날짜 선택 */}
            <div className="form-group">
              <label className="form-label">📅 상담 희망 날짜 선택</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* 시간 슬롯 선택 */}
            <div className="form-group">
              <label className="form-label">⏰ 상담 희망 시간 선택</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: selectedTime === time ? 'var(--point-color)' : 'var(--secondary-color)',
                      color: selectedTime === time ? '#FFFFFF' : 'var(--text-main)',
                      fontWeight: selectedTime === time ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {bookingSuccess ? (
              <div style={{ padding: '1rem', backgroundColor: '#D4EDDA', color: '#155724', borderRadius: '8px', textAlign: 'center', marginTop: '1rem' }}>
                <CheckCircle2 size={24} style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                {bookingExpert}님과의 {selectedDate} {selectedTime} 상담 예약이 성공적으로 완료되었습니다!
              </div>
            ) : (
              <button onClick={handleConfirmBooking} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                선택한 일정으로 화상상담 예약 확정
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
