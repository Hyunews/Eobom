import React, { useEffect, useState } from 'react';
import { Calendar, MessageSquare, BookOpen, ChevronRight, Camera, Settings, Lock, UserCircle, Users } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { Badge } from '../components/home/EntryBoxes';

interface MyPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  onOpenAccountSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenFamilyDesignation?: () => void;
  setActiveTab?: (tab: string) => void;
}

interface MyProfile {
  name: string;
  email: string | null;
  profileImage: string | null;
  role: string;
}

interface MySummary {
  leadCount: number;
  consultCount: number;
  obituaryCount: number;
}

export const MyPage: React.FC<MyPageProps> = ({ currentUser, onOpenLogin, onOpenAccountSettings, onOpenProfile, onOpenFamilyDesignation, setActiveTab }) => {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [summary, setSummary] = useState<MySummary | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('k_ending_token');
    if (!currentUser || !token) return;

    fetch(`${BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setProfile({
            name: data.user.name,
            email: data.user.email ?? null,
            profileImage: data.user.profileImage ?? null,
            role: data.user.role || 'USER',
          });
        }
      })
      .catch(() => {
        // 조회 실패 시 헤더에 이미 표시 중인 currentUser 문자열만으로 화면을 유지
      });

    // §1-2 — 3칸 카운터 실데이터. 하드코딩 제거.
    fetch(`${BACKEND_URL}/api/me/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setSummary(data.data);
      })
      .catch(() => {
        // 조회 실패 시 0으로 표시(아래 ?? 0) — 화면이 깨지지 않게
      });
  }, [currentUser]);

  // 비회원: 로그인 유도 (Auth Guard & Blur Lock Overlay)
  if (!currentUser) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div
          style={{
            backgroundColor: 'rgba(26, 43, 76, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--border-radius)',
            padding: '2.2rem 1.75rem',
            textAlign: 'center',
            maxWidth: '420px'
          }}
        >
          <Lock size={36} color="#FFFFFF" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#FFFFFF', margin: '0 0 0.6rem 0', fontSize: '1.3rem' }}>마이페이지는 로그인 후 이용하실 수 있어요</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: '1.1rem' }}>
            예약 현황, 상담 내역, 엔딩노트 진행 상황을 한눈에 확인하세요.
          </p>
          <button onClick={onOpenLogin} className="btn btn-point">
            🔑 로그인 / 회원가입 하러가기
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || currentUser.split(' (')[0];

  // §1-1 — FacilityBooking이 2026-08-11 폐기돼 "예약"이라는 개념이 DB에 없다.
  // Lead(문의)·ConsultRequest(상담)·Obituary(내 부고장) 3개만 실데이터로 센다.
  const stats = [
    { label: '문의 내역', value: summary?.leadCount ?? 0 },
    { label: '상담 내역', value: summary?.consultCount ?? 0 },
    { label: '내 부고장', value: summary?.obituaryCount ?? 0 },
  ];

  return (
    <div className="container">
      {/* Profile Summary Card */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--box-shadow)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.1rem',
          marginBottom: '1.1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: 'var(--secondary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid var(--border-color)'
            }}
          >
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color)' }}>{displayName.charAt(0)}</span>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--point-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF'
            }}
            title="프로필 사진 변경 (개발중)"
          >
            <Camera size={13} color="#FFFFFF" />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.4rem' }}>{displayName} 님</h2>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-gold)',
                color: '#FFFFFF',
                letterSpacing: '0.03em'
              }}
            >
              {profile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile?.email || '이메일 정보 없음'}</p>
        </div>

        <button
          onClick={onOpenAccountSettings}
          className="btn"
          style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', flexShrink: 0 }}
        >
          <Settings size={16} /> 계정 연동
        </button>
      </div>

      {/* 3-Column Stat Counter Box (Dark Navy Surface) — 00-29 §6.1 .stat-row: 375px에서
          숫자·라벨이 한 글자씩 세로로 쪼개지던 고정 repeat(3,1fr)+큰 폰트를 대체 */}
      <div
        className="stat-row"
        style={{
          backgroundColor: 'var(--primary-color)',
          borderRadius: 'var(--border-radius)',
          padding: '1.3rem 1rem',
          marginBottom: '1.5rem'
        }}
      >
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none'
            }}
          >
            <div className="stat-row__value" style={{ fontWeight: 800, color: '#FFFFFF' }}>{stat.value}</div>
            <div className="stat-row__label" style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Archive List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {/* 00-28 §6.3 · 00-27 §8.2 — 내 정보(연락처·주소)와 가족 지정을 마이페이지 안에 나란히 둔다 */}
        <button
          onClick={onOpenProfile}
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.1rem',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <UserCircle size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>내 정보</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>연락처 · 주소 · 연락 가능 시간대</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <button
          onClick={onOpenFamilyDesignation}
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.1rem',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Users size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>가족 지정</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>생전 준비를 함께할 가족 기록</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* §1-4 — FacilityBooking 폐기로 실체가 없는 기능이라 클릭(alert)을 없애고 준비 중 배지로
            고정한다(§1-3과 같은 처리 — 감추지 않고 준비 중임을 명시, 00-23 §2.2). */}
        <div
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.1rem',
            cursor: 'not-allowed',
            width: '100%',
            opacity: 0.7,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Calendar size={20} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>나의 예약 현황</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>장례 및 장지 예약 정보 확인</div>
            </div>
          </div>
          <Badge status="comingSoon" />
        </div>

        <button
          onClick={() => setActiveTab?.('counseling')}
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.1rem',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <MessageSquare size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>상담 신청 내역</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>법률, 세무 및 심리 케어 기록</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <div
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={20} color="var(--accent-gold)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>디지털 엔딩노트</span>
                <Badge status="preview" />
              </div>
              {/* §1-3 — EndingNote 모델이 없어 진행률 자체가 존재하지 않는 값이었다. 숫자를
                  지어내는 대신 modeNav.ts의 status:'preview'와 같은 표시(미리보기)로 통일한다. */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>연명의료·유족 메시지 등을 미리 작성해 볼 수 있어요</div>
            </div>
          </div>
          <button onClick={() => setActiveTab?.('ending-note')} className="btn btn-primary" style={{ height: '40px', padding: '0 1.2rem', fontSize: '0.9rem' }}>
            미리보기
          </button>
        </div>
      </div>
    </div>
  );
};
