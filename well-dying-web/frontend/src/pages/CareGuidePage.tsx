import React, { useState } from 'react';
import { CalendarHeart, CheckSquare, MessageSquare, HeartHandshake, ExternalLink } from 'lucide-react';

export const CareGuidePage: React.FC = () => {
  const [deceasedName, setDeceasedName] = useState('홍길동');
  const [mournerName, setMournerName] = useState('홍상주');
  const [funeralPlace, setFuneralPlace] = useState('서울 평안 장례식장 201호');

  const [tasks, setTasks] = useState([
    { id: 1, day: 'D-Day', text: '사망진단서 (발급 10부 이상 챙기기)', checked: true },
    { id: 2, day: 'D-Day', text: '장례식장 계약 및 영정사진 전달', checked: true },
    { id: 3, day: 'D+3일', text: '화장장 예약 및 운구차 배정 확인', checked: false },
    { id: 4, day: 'D+14일', text: '읍면동 주민센터 사망 신고 (1개월 내 신고 미완료 시 과태료)', checked: false },
    { id: 5, day: 'D+30일', text: '정부24 안심상속 원스톱 서비스 (금융/토지/세금 조회)', checked: false },
    { id: 6, day: 'D+60일', text: '상속세 신고 및 납부 (상속 개시일이 속하는 달의 말일부터 6개월 내)', checked: false }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarHeart color="var(--primary-color)" /> 5. 상중 케어 & 사망 행정 가이드
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          사망 후 D-Day별 필속 행정절차 타임라인, 모바일 부고장 작성 및 유족 심리 케어
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* D-Day 행정절차 타임라인 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare color="var(--point-color)" /> D-Day별 행정절차 체크리스트
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: t.checked ? 'var(--secondary-color)' : '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <input type="checkbox" checked={t.checked} onChange={() => {}} style={{ width: '20px', height: '20px' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--point-color)', backgroundColor: '#EAE5DC', padding: '0.2rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem' }}>
                    {t.day}
                  </span>
                  <span style={{ textDecoration: t.checked ? 'line-through' : 'none', color: t.checked ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.95rem' }}>
                    {t.text}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <a
            href="https://www.gov.kr"
            target="_blank"
            rel="noreferrer"
            className="btn btn-point"
            style={{ width: '100%', marginTop: '1.5rem', textDecoration: 'none' }}
          >
            🏛️ 정부24 안심상속 원스톱 서비스 바로가기 <ExternalLink size={16} />
          </a>
        </div>

        {/* 모바일 부고장 생성 데모 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare color="var(--primary-color)" /> 모바일 부고장 간편 작성
          </h3>
          
          <div className="form-group">
            <label className="form-label">고인 성함</label>
            <input type="text" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">상주 성함</label>
            <input type="text" value={mournerName} onChange={(e) => setMournerName(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">빈소 위치</label>
            <input type="text" value={funeralPlace} onChange={(e) => setFuneralPlace(e.target.value)} className="form-input" />
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1.2rem',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>📱 생성된 부고장 프리뷰</h4>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              [부고] {deceasedName} 님께서 별세하셨기에 아래와 같이 부고를 전합니다.<br/>
              • 상주: {mournerName}<br/>
              • 빈소: {funeralPlace}<br/>
              • 마음 전하실 곳: 카카오뱅크 3333-xx-xxxx
            </div>
            <button onClick={() => alert('부고장 카카오톡 공유 링크가 생성되었습니다.')} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              카카오톡 부고장 전송하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
