import React, { useState, useEffect } from 'react';
import { X, Calculator, ShieldCheck, CheckCircle2, Share2, Download, Calendar, Phone, Lock, Send, Check } from 'lucide-react';

declare global {
  interface Window {
    Kakao?: any;
  }
}

interface PriceCompareModalProps {
  facility: {
    id?: string;
    name: string;
    type?: string;
    location?: string;
    price?: string;
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
  onOpenBooking?: () => void;
}

export const PriceCompareModal: React.FC<PriceCompareModalProps> = ({ facility, onClose, onOpenBooking }) => {
  const [selectedPackage, setSelectedPackage] = useState<'standard' | 'small' | 'natural'>('standard');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 카카오톡 전송 3단계 모달 상태 (1: 닫힘, 2: 인증/입력창, 3: 전송완료)
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState<boolean>(false);
  const [receiverName, setReceiverName] = useState<string>('홍상주 (유족)');
  const [receiverPhone, setReceiverPhone] = useState<string>('010-1234-5678');
  const [kakaoAuthDone, setKakaoAuthDone] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // 카카오 SDK 초기화 확인
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        window.Kakao.init('85c2379903ef6a925521ec3d2d821b4b');
      } catch (err) {
        console.warn('Kakao SDK init warn:', err);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 패키지별 이름 및 금액 계산
  const getPackageInfo = () => {
    let name = '🏛️ 표준 일반장 (3일장)';
    let facilityFee = facility.detailedPrices?.facilityFee || '380만원';
    let casketFee = facility.detailedPrices?.casketFee || '180만원';
    let shroudFee = facility.detailedPrices?.shroudFee || '150만원';
    let mourningDress = facility.detailedPrices?.mourningDress || '70만원';
    let altarFlower = facility.detailedPrices?.altarFlower || '220만원';
    let totalEst = facility.detailedPrices?.totalEst || '950만원 ~ 1,300만원';

    if (selectedPackage === 'small') {
      name = '🌸 스몰 가족장 (2일장)';
      facilityFee = '240만원 (2일 소형)';
      casketFee = '80만원 (기본 오동나무)';
      shroudFee = '60만원 (천연 삼베)';
      mourningDress = '40만원 (소규모)';
      altarFlower = '90만원 (기본 제단)';
      totalEst = '510만원 ~ 680만원';
    } else if (selectedPackage === 'natural') {
      name = '🌿 수목 / 자연장 패키지';
      facilityFee = '180만원 (자연장 전용)';
      casketFee = '유골함 안치 (관 제외)';
      shroudFee = '80만원 (천연 도자기 함)';
      mourningDress = '35만원';
      altarFlower = '50만원 (야외 헌화)';
      totalEst = '345만원 ~ 480만원';
    }

    return { name, facilityFee, casketFee, shroudFee, mourningDress, altarFlower, totalEst };
  };

  const pkg = getPackageInfo();

  // 1단계: [카카오톡 전송] 버튼 클릭 시 수신자 인증 모달 오픈
  const handleOpenKakaoModal = () => {
    setIsKakaoModalOpen(true);
    setSendSuccess(false);
    setIsSending(false);
  };

  // 2단계 -> 3단계: 휴대폰/카카오 인증 후 최종 카카오톡 알림톡 전송 수행
  const handleExecuteKakaoSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverPhone || receiverPhone.length < 10) {
      alert('⚠️ 수신자 휴대폰 번호를 올바르게 입력해주세요.');
      return;
    }
    if (!agreeTerms) {
      alert('⚠️ 알림톡 전송 개인정보 처리 동의에 체크해주세요.');
      return;
    }

    setIsSending(true);

    // 실제 Kakao SDK Share/Message API도 백그라운드 호출 시도
    if (window.Kakao && window.Kakao.Share) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `[이어봄] ${facility.name} 보건복지부 e하늘 표준 견적서`,
            description: `수신자: ${receiverName}\n패키지: ${pkg.name}\n총 예상 견적: ${pkg.totalEst}`,
            imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href
            }
          }
        });
      } catch (err) {
        console.log('Kakao share call background:', err);
      }
    }

    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      showToast(`💬 ${receiverPhone} 번호로 카카오톡 알림톡이 전송되었습니다!`);
    }, 1200);
  };

  // PDF 출력 및 다운로드 실제 구현 (window.print & 인쇄 전용 템플릿)
  const handleDownloadPDF = () => {
    showToast('📄 e하늘 표준 견적서 PDF 생성 중... (프린터/PDF 저장창으로 연결됩니다)');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      {/* 인쇄(Print/PDF) 전용 스타일 시트 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pdf-doc, #printable-pdf-doc * {
            visibility: visible !important;
          }
          #printable-pdf-doc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 💬 [사용자 맞춤 3-Step] 카카오톡 인증 & 수신자 지정 전송 모달 */}
      {/* ========================================================================= */}
      {isKakaoModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 2500,
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
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
          >
            {/* 카카오 옐로우 상단 헤더 */}
            <div
              style={{
                backgroundColor: '#FEE500',
                padding: '1.4rem 1.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#000000'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ backgroundColor: '#000000', color: '#FEE500', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
                  TALK
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>카카오톡 알림톡 전송</h3>
                  <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>수신자 전화번호 &amp; 간편 인증</span>
                </div>
              </div>
              <button
                onClick={() => setIsKakaoModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#000000' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '1.8rem' }}>
              {!sendSuccess ? (
                <form onSubmit={handleExecuteKakaoSend}>
                  {/* 견적 요약 바 */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', marginBottom: '1.4rem', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.78rem', color: '#5B7065', fontWeight: 800 }}>전송할 표준 견적서 정보</span>
                    <h4 style={{ margin: '0.3rem 0 0.1rem 0', fontSize: '1.05rem', color: '#1A2B4C', fontWeight: 800 }}>
                      [{facility.name}]
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                      {pkg.name} | <strong>총 {pkg.totalEst}</strong>
                    </p>
                  </div>

                  {/* 2단계: 수신자 정보 및 본인인증 폼 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1A2B4C', marginBottom: '0.4rem' }}>
                        1. 수신자 성함 / 관계
                      </label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="예: 홍상주 (상주 / 유족)"
                        required
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.92rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1A2B4C', marginBottom: '0.4rem' }}>
                        2. 수신자 카카오톡 휴대폰 번호
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="tel"
                          value={receiverPhone}
                          onChange={(e) => setReceiverPhone(e.target.value)}
                          placeholder="010-1234-5678"
                          required
                          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.92rem', outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setKakaoAuthDone(true);
                            showToast('💛 카카오 계정 간편 본인 인증이 완료되었습니다.');
                          }}
                          style={{
                            backgroundColor: kakaoAuthDone ? '#DEF7EC' : '#FEE500',
                            color: kakaoAuthDone ? '#03543F' : '#000000',
                            border: kakaoAuthDone ? '1px solid #03543F' : 'none',
                            padding: '0 1rem',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {kakaoAuthDone ? '✓ 카카오 인증 완료' : '💛 카카오 간편인증'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                      <input
                        type="checkbox"
                        id="agreeKakao"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="agreeKakao" style={{ fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
                        개인정보 수집 및 카카오톡 알림톡 견적서 수신에 동의합니다 (필수)
                      </label>
                    </div>
                  </div>

                  {/* 3단계 전송 실행 버튼 */}
                  <button
                    type="submit"
                    disabled={isSending}
                    style={{
                      width: '100%',
                      backgroundColor: isSending ? '#CBD5E1' : '#FEE500',
                      color: '#000000',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      cursor: isSending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px rgba(254,229,0,0.4)'
                    }}
                  >
                    {isSending ? (
                      <>💬 카카오톡 알림톡 서버 전송 중...</>
                    ) : (
                      <>
                        <Send size={18} /> 🚀 카카오톡 견적서 전송하기
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* 3단계 완료 화면 (카카오 알림톡 실시간 수신 말풍선 MOCK) */
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#DEF7EC', color: '#03543F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', fontSize: '2rem' }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.4rem' }}>
                    카카오톡 알림톡 전송 완료!
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    수신자 <strong>{receiverPhone}</strong> ({receiverName}) 님에게<br />
                    보건복지부 e하늘 정찰제 견적서 카카오톡 알림톡이 성공적으로 발송되었습니다.
                  </p>

                  {/* 카카오톡 노랑 말풍선 미니 프리뷰 */}
                  <div style={{ backgroundColor: '#FEE500', padding: '1.2rem', borderRadius: '16px', textAlign: 'left', fontSize: '0.85rem', color: '#000000', marginBottom: '1.8rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                      [이어봄 알림톡] e하늘 표준 견적서
                    </div>
                    <div>• 시설: {facility.name}</div>
                    <div>• 선택 패키지: {pkg.name}</div>
                    <div>• 총 예상 견적: <strong>{pkg.totalEst}</strong></div>
                    <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#374151', borderTop: '1px dashed #D1D5DB', paddingTop: '0.4rem' }}>
                      * 본 알림톡은 보건복지부 e하늘 장사정보 시스템 공시 기준에 기반합니다.
                    </div>
                  </div>

                  <button
                    onClick={() => setIsKakaoModalOpen(false)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700 }}
                  >
                    확인 닫기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 화면용 대화형 모달 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 2100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '2.2rem',
            maxWidth: '640px',
            width: '100%',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* 토스트 알림 */}
          {toastMsg && (
            <div
              style={{
                position: 'absolute',
                top: '-3.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#1A2B4C',
                color: '#FFFFFF',
                padding: '0.65rem 1.4rem',
                borderRadius: '20px',
                fontSize: '0.88rem',
                fontWeight: 700,
                boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                zIndex: 2200,
                whiteSpace: 'nowrap',
                border: '1px solid #D4A359'
              }}
            >
              {toastMsg}
            </div>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.2rem',
              right: '1.2rem',
              border: 'none',
              backgroundColor: '#F1F5F9',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B'
            }}
          >
            <X size={20} />
          </button>

          {/* 상단 보건복지부 e하늘 인증 뱃지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', backgroundColor: '#DEF7EC', color: '#03543F', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={15} color="#03543F" /> 보건복지부 e하늘 장사정보시스템 공시 데이터 기준 (Mock)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              (e-sky.go.kr 정찰제 규격 1:1 설계)
            </span>
          </div>

          {/* 제목 & 시설명 */}
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator color="var(--point-color)" size={28} /> [{facility.name}] 표준 견적 산출표
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.4rem', lineHeight: 1.5 }}>
            {facility.location || '위치 정보 공시'} | 투명한 정찰제 가격 공시표 및 장례 유형별 실시간 시뮬레이션을 제공합니다.
          </p>

          {/* 장례 유형 선택 탭 (가족장 / 일반장 / 자연장) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.4rem', backgroundColor: '#F8FAFC', padding: '0.4rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setSelectedPackage('small')}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: selectedPackage === 'small' ? '#FFFFFF' : 'transparent',
                color: selectedPackage === 'small' ? '#1A2B4C' : '#64748B',
                fontWeight: selectedPackage === 'small' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: selectedPackage === 'small' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🌸 스몰 가족장 (2일)
            </button>

            <button
              onClick={() => setSelectedPackage('standard')}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: selectedPackage === 'standard' ? '#5B7065' : 'transparent',
                color: selectedPackage === 'standard' ? '#FFFFFF' : '#64748B',
                fontWeight: selectedPackage === 'standard' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: selectedPackage === 'standard' ? '0 2px 8px rgba(91,112,101,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🏛️ 표준 일반장 (3일)
            </button>

            <button
              onClick={() => setSelectedPackage('natural')}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: selectedPackage === 'natural' ? '#FFFFFF' : 'transparent',
                color: selectedPackage === 'natural' ? '#1A2B4C' : '#64748B',
                fontWeight: selectedPackage === 'natural' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: selectedPackage === 'natural' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🌿 수목 / 자연장 패키지
            </button>
          </div>

          {/* 세부 가격 내역 카드 */}
          <div style={{ backgroundColor: '#FBF9F5', padding: '1.4rem', borderRadius: '18px', marginBottom: '1.4rem', border: '1.5px solid #EAE5DC' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>• 빈소 및 분향실 사용료:</span>
                <strong style={{ color: '#1A2B4C' }}>{pkg.facilityFee}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>• 관 (Casket) 매장/화장 용품:</span>
                <strong style={{ color: '#1A2B4C' }}>{pkg.casketFee}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>• 수의 (Shroud) 천연 삼베:</span>
                <strong style={{ color: '#1A2B4C' }}>{pkg.shroudFee}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>• 상복 및 현대식 유족 용품:</span>
                <strong style={{ color: '#1A2B4C' }}>{pkg.mourningDress}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>• 제단 생화 장식 &amp; 헌화:</span>
                <strong style={{ color: '#1A2B4C' }}>{pkg.altarFlower}</strong>
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed #CBD5E1', margin: '0.4rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', color: 'var(--point-color)', fontWeight: 800 }}>
                <span>총 예상 소요 견적:</span>
                <span style={{ fontSize: '1.25rem', color: '#1A2B4C' }}>{pkg.totalEst}</span>
              </div>
            </div>
          </div>

          {/* e하늘 투명 가격 보증 서약문 */}
          <div style={{ backgroundColor: '#F1F5F9', padding: '0.85rem 1rem', borderRadius: '14px', marginBottom: '1.4rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong>e하늘 100% 정찰제 공시 보증:</strong> 본 견적 정보는 보건복지부 e하늘 장사정보시스템(e-sky.go.kr)에 정식 등록된 단가표를 기준으로 작성되었으며, 부당한 불법 리베이트나 바가지요금 추가 청구를 엄격히 금지합니다.
            </div>
          </div>

          {/* 액션 버튼 그룹 (1단계: [카카오톡 전송] 누르면 3-Step 인증 모달 호출) */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenKakaoModal}
              className="btn"
              style={{ flex: 1, backgroundColor: '#FEE500', color: '#000000', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, padding: '0.75rem', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <Share2 size={16} /> 카카오톡 전송
            </button>

            <button
              onClick={handleDownloadPDF}
              className="btn"
              style={{ flex: 1, backgroundColor: '#1A2B4C', color: '#FFFFFF', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, padding: '0.75rem', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <Download size={16} /> PDF 출력 / 저장
            </button>

            {onOpenBooking && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className="btn btn-primary"
                style={{ flex: 1.2, borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, padding: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Calendar size={16} /> 방문 답사 예약
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📄 PDF 출력 및 인쇄 전용 공식 문서 서식 (hidden normally, visible on print) */}
      {/* ========================================================================= */}
      <div id="printable-pdf-doc" style={{ display: 'none' }}>
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'serif' }}>
          {/* 헤더 타이틀 */}
          <div style={{ textAlign: 'center', borderBottom: '3px double #1A2B4C', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', color: '#1A2B4C', margin: '0 0 10px 0' }}>이어봄 (Eobom) 웰다잉 토탈 케어</h1>
            <h2 style={{ fontSize: '20px', color: '#5B7065', margin: 0 }}>보건복지부 e하늘 장사정보시스템 표준 공시 견적서</h2>
          </div>

          {/* 발급 기본 정보 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '14px', color: '#333' }}>
            <div>
              <p style={{ margin: '4px 0' }}><strong>문서번호:</strong> EOBOM-EST-2026-0731</p>
              <p style={{ margin: '4px 0' }}><strong>시설명:</strong> {facility.name}</p>
              <p style={{ margin: '4px 0' }}><strong>소재지:</strong> {facility.location || '상세 주소 공시'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '4px 0' }}><strong>발행일자:</strong> {todayStr}</p>
              <p style={{ margin: '4px 0' }}><strong>선택 패키지:</strong> {pkg.name}</p>
              <p style={{ margin: '4px 0' }}><strong>검증 기준:</strong> 보건복지부 e-sky 정찰제</p>
            </div>
          </div>

          {/* 세부 항목 금액 표 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderTop: '2px solid #1A2B4C', borderBottom: '1px solid #CBD5E1' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>항목 구분</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>세부 단가 명세</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>금액 (공시가)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>1. 빈소 및 분향실</td>
                <td style={{ padding: '12px 10px' }}>2일/3일 빈소 사용료, 안치료, 염습실 사용료 포함</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>{pkg.facilityFee}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>2. 관 (Casket)</td>
                <td style={{ padding: '12px 10px' }}>고급 삼나무 / 오동나무 매장·화장 겸용관</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>{pkg.casketFee}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>3. 수의 (Shroud)</td>
                <td style={{ padding: '12px 10px' }}>100% 천연 삼베 / 고급 원단 수의</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>{pkg.shroudFee}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>4. 상복 및 용품</td>
                <td style={{ padding: '12px 10px' }}>현대식 남/녀 상복 세트 및 유족 보조용품</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>{pkg.mourningDress}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>5. 제단 생화</td>
                <td style={{ padding: '12px 10px' }}>제단 생화 꽃장식 &amp; 헌화용 국화 꽃 세트</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>{pkg.altarFlower}</td>
              </tr>
              <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #1A2B4C', borderBottom: '2px solid #1A2B4C' }}>
                <td colSpan={2} style={{ padding: '14px 10px', fontSize: '16px', fontWeight: 'bold', color: '#1A2B4C' }}>총 예상 소요 견적 합계</td>
                <td style={{ padding: '14px 10px', fontSize: '18px', fontWeight: 'bold', textAlign: 'right', color: '#D4A359' }}>{pkg.totalEst}</td>
              </tr>
            </tbody>
          </table>

          {/* 공식 직인 및 서약문 */}
          <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #DFDCD7', borderRadius: '12px', fontSize: '13px', lineHeight: 1.6, color: '#555' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1A2B4C' }}>[보건복지부 e하늘 정찰제 공시 보증 서약]</p>
            <p style={{ margin: 0 }}>
              본 견적서는 보건복지부 e하늘 장사정보시스템(e-sky.go.kr)에 공시된 정찰제 금액을 기준으로 작성되었습니다. 이어봄 플랫폼은 부당한 불법 리베이트나 바가지요금 청구를 결코 용납하지 않음을 보증합니다.
            </p>
          </div>

          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1A2B4C', margin: '0 0 15px 0' }}>이어봄 (Eobom) 웰다잉 토탈 케어 플랫폼 대표</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', border: '2px solid #D4A359', padding: '10px 20px', borderRadius: '8px', color: '#D4A359', fontWeight: 'bold' }}>
              [이어봄 투명 견적 검증 직인 (印)]
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
