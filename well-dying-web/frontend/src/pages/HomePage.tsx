import React from 'react';
import { ShieldCheck, Scale, PackageCheck, ScrollText, CalendarHeart, Sparkles, HeartHandshake } from 'lucide-react';

interface HomePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="container">
      {/* 히어로 비주얼 및 서비스 소개 요약 */}
      <section style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--box-shadow)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        marginBottom: '3rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center'
        }}>
          {/* 좌측 요약 글 */}
          <div style={{ padding: '3rem 2.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--point-color)',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '1rem'
            }}>
              <Sparkles size={16} /> 디지털 엔딩 & 웰다잉 토탈 케어
            </span>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-color)', fontWeight: 700, lineHeight: 1.3, marginBottom: '1.2rem' }}>
              당신과 사랑하는 가족의<br />
              존엄한 마무리를 함께 준비합니다
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              <strong>DEWD 서비스</strong>는 생전의 웰다잉 준비(엔딩노트, 상속)부터 임종 직후의 장례·묘지 매칭, 그리고 사후 디지털 유품 정리와 행정 원스톱 가이드까지 단일 플랫폼에서 완결하는 한국형 디지털 엔딩 정보 서비스입니다.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', color: 'var(--primary-color)', fontWeight: 600 }}>
              <span>✓ 24시간 365일 긴급 지원</span>
              <span>✓ 유족 유언 메시지 & 비밀 보관함</span>
              <span>✓ 전문가 1:1 비대면 상담</span>
            </div>
          </div>

          {/* 우측 어울리는 visual 이미지 */}
          <div style={{
            height: '100%',
            minHeight: '320px',
            backgroundColor: 'var(--secondary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img 
              src="/hero_visual.png" 
              alt="DEWD 웰다잉 토탈 케어 서비스 비주얼" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                maxHeight: '500px'
              }} 
            />
          </div>
        </div>
      </section>

      {/* 5대 플랫폼 주요 기능 요약 세션 (링크 없음, 오직 정보 전달) */}
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <HeartHandshake color="var(--point-color)" /> 플랫폼 핵심 제공 가치
      </h2>
      <div className="grid">
        <div className="card" style={{ borderTop: '5px solid var(--primary-color)' }}>
          <div className="card-title"><ShieldCheck color="var(--primary-color)" /> 장례·묘지 맞춤 비교</div>
          <div className="card-content">
            <p>위치, 예산, 종교, 예상 하객 수에 맞춘 전국 장례식장/봉안당 투명 비교 및 지도 보기 답사 예약 서비스</p>
          </div>
        </div>
        <div className="card" style={{ borderTop: '5px solid var(--point-color)' }}>
          <div className="card-title" style={{ color: 'var(--point-color)' }}><Scale color="var(--point-color)" /> 상속·법률·세무 상담</div>
          <div className="card-content">
            <p>변호사/세무사 1:1 비대면 화상상담, 월별 상담 일정 달력 예약 및 상속세·증여세 자동 시뮬레이터</p>
          </div>
        </div>
        <div className="card" style={{ borderTop: '5px solid var(--primary-light)' }}>
          <div className="card-title" style={{ color: 'var(--primary-light)' }}><PackageCheck color="var(--primary-light)" /> 디지털 유품 정리</div>
          <div className="card-content">
            <p>고인 SNS/클라우드 계정 정산 신청, 지역 기반 현물 유품 수거 업체 및 온라인 디지털 추모관 갤러리</p>
          </div>
        </div>
        <div className="card" style={{ borderTop: '5px solid #D9534F' }}>
          <div className="card-title" style={{ color: '#D9534F' }}><ScrollText color="#D9534F" /> 디지털 엔딩노트</div>
          <div className="card-content">
            <p>사전 연명의료 의향서, 유족 유언 메시지 & 비밀 보관함 및 사후 지정 수신 자동 발송</p>
          </div>
        </div>
        <div className="card" style={{ borderTop: '5px solid #F0AD4E' }}>
          <div className="card-title" style={{ color: '#B47318' }}><CalendarHeart color="#B47318" /> 상중 케어·행정 가이드</div>
          <div className="card-content">
            <p>사망 후 D-Day 행정절차 타임라인, 모바일 부고장 실시간 작성 및 유족 심리 케어 세션</p>
          </div>
        </div>
      </div>
    </div>
  );
};
