import React from 'react';
import { Home as HouseIcon, Scale, Smartphone, ScrollText, ClipboardCheck, Sparkles, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface HomePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab }) => {
  return (
    <div className="container">
      <section className="hero-section">
        <div className="hero-text">
          <span className="hero-badge">
            <Sparkles size={15} /> 이어봄 (Eobom) 디지털 엔딩 & 웰다잉 토탈 케어
          </span>

          <h1 className="hero-title" style={{ fontFamily: 'var(--font-serif)' }}>
            당신과 사랑하는 가족의<br />
            <span style={{ color: 'var(--point-color)' }}>존엄하고 따뜻한 봄날</span>을 함께 이어갑니다
          </h1>

          <p className="hero-desc">
            <strong style={{ color: 'var(--primary-color)', fontWeight: 700 }}>이어봄 서비스</strong>는 엔딩노트·상속 준비부터 장례·묘지 매칭, 디지털 유품 정리와 행정 원스톱 가이드까지 단일 플랫폼에서 완결합니다.
          </p>

          <div className="hero-checklist">
            <div className="hero-check-item">
              <CheckCircle2 size={16} color="var(--point-color)" /> 24시간 365일 긴급 장례 지도사 즉시 연결
            </div>
            <div className="hero-check-item">
              <CheckCircle2 size={16} color="var(--point-color)" /> 유족 유언 메시지 & 256-bit 암호화 금고
            </div>
            <div className="hero-check-item">
              <CheckCircle2 size={16} color="var(--point-color)" /> 변호사 · 세무사 1:1 비대면 전문 케어
            </div>
          </div>
        </div>

        <div className="hero-image-wrap">
          <img
            src="/calm_boat.png"
            alt="존엄한 마무리를 상징하는 평온한 나룻배"
          />
        </div>
      </section>

      <h2 style={{
        color: 'var(--primary-color)',
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-serif)'
      }}>
        <HeartHandshake color="var(--point-color)" size={26} /> 5대 핵심 서비스 영역
      </h2>

      <div className="grid" style={{ gap: '1.5rem' }}>
        <div 
          className="card" 
          onClick={() => setActiveTab?.('facility')}
          style={{ borderTop: '5px solid var(--primary-color)', padding: '1.8rem', cursor: 'pointer' }}
        >
          <div className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            <HouseIcon color="var(--primary-color)" size={22} /> 장례 · 묘지 매칭
          </div>
          <div className="card-content">
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
              위치, 예산, 종교, 예상 하객 수에 맞춘 전국 장례식장 / 봉안당 / 수목장 투명 비교 및 방문 답사 예약
            </p>
          </div>
        </div>

        <div 
          className="card" 
          onClick={() => setActiveTab?.('counseling')}
          style={{ borderTop: '5px solid var(--point-color)', padding: '1.8rem', cursor: 'pointer' }}
        >
          <div className="card-title" style={{ color: 'var(--point-color)', fontSize: '1.2rem', fontWeight: 700 }}>
            <Scale color="var(--point-color)" size={22} /> 상속 · 법률 케어
          </div>
          <div className="card-content">
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
              변호사 / 세무사 1:1 비대면 화상상담, 월별 상담 일정 달력 예약 및 상속세 · 증여세 자동 시뮬레이터
            </p>
          </div>
        </div>

        <div 
          className="card" 
          onClick={() => setActiveTab?.('digital-estate')}
          style={{ borderTop: '5px solid var(--accent-gold)', padding: '1.8rem', cursor: 'pointer' }}
        >
          <div className="card-title" style={{ color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 700 }}>
            <Smartphone color="var(--accent-gold)" size={22} /> 디지털 유품 정리
          </div>
          <div className="card-content">
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
              고인 SNS / 클라우드 계정 해지 신청, 지역 기반 현물 유품 수거 업체 및 온라인 추모관 갤러리
            </p>
          </div>
        </div>

        <div 
          className="card" 
          onClick={() => setActiveTab?.('ending-note')}
          style={{ borderTop: '5px solid var(--primary-color)', padding: '1.8rem', cursor: 'pointer' }}
        >
          <div className="card-title" style={{ color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 700 }}>
            <ScrollText color="var(--primary-color)" size={22} /> 디지털 엔딩노트
          </div>
          <div className="card-content">
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
              사전 연명의료 의향서, 유족 유언 메시지 & 256-bit AES 암호화 금고 및 사후 지정 수신 자동 발송
            </p>
          </div>
        </div>

        <div 
          className="card" 
          onClick={() => setActiveTab?.('care-guide')}
          style={{ borderTop: '5px solid var(--point-color)', padding: '1.8rem', cursor: 'pointer' }}
        >
          <div className="card-title" style={{ color: 'var(--point-color)', fontSize: '1.2rem', fontWeight: 700 }}>
            <ClipboardCheck color="var(--point-color)" size={22} /> 상중 · 행정 케어
          </div>
          <div className="card-content">
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>
              사망 후 D-Day 필수 행정절차 타임라인, 모바일 부고장 실시간 작성 및 유족 심리 케어 세션
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};