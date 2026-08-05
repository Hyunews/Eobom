import React, { useEffect, useState } from 'react';
import { Calendar, MessageSquare, BookOpen, ChevronRight, Camera, Settings, Lock } from 'lucide-react';
import { BACKEND_URL } from '../config';

interface MyPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  onOpenAccountSettings?: () => void;
  setActiveTab?: (tab: string) => void;
}

interface MyProfile {
  name: string;
  email: string | null;
  profileImage: string | null;
  role: string;
}

export const MyPage: React.FC<MyPageProps> = ({ currentUser, onOpenLogin, onOpenAccountSettings, setActiveTab }) => {
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('k_ending_token');
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
            padding: '3rem 2.5rem',
            textAlign: 'center',
            maxWidth: '420px'
          }}
        >
          <Lock size={36} color="#FFFFFF" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#FFFFFF', margin: '0 0 0.6rem 0', fontSize: '1.3rem' }}>마이페이지는 로그인 후 이용하실 수 있어요</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
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

  const stats = [
    { label: '예약 중', value: 2 },
    { label: '상담 내역', value: 5 },
    { label: '보관 문서', value: 12 },
  ];

  const endingNoteProgress = 75;

  return (
    <div className="container">
      {/* Profile Summary Card */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--box-shadow)',
          border: '1px solid var(--border-color)',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '1.5rem',
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
                fontSize: '0.7rem',
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
          <Settings size={16} /> 계정 설정
        </button>
      </div>

      {/* 3-Column Stat Counter Box (Dark Navy Surface) */}
      <div
        style={{
          backgroundColor: 'var(--primary-color)',
          borderRadius: 'var(--border-radius)',
          padding: '1.75rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: '2rem'
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
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Archive List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <button
          onClick={() => alert('📅 [개발중] 나의 예약 현황 상세 페이지는 준비 중입니다.')}
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
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
              <Calendar size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>나의 예약 현황</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>장례 및 장지 예약 정보 확인</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <button
          onClick={() => setActiveTab?.('counseling')}
          className="card"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
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
            padding: '1.25rem 1.5rem',
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
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>디지털 엔딩노트</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                <span
                  style={{
                    width: '80px',
                    height: '6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--border-color)',
                    overflow: 'hidden',
                    display: 'inline-block'
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: `${endingNoteProgress}%`,
                      height: '100%',
                      backgroundColor: 'var(--point-color)'
                    }}
                  />
                </span>
                진행 중 {endingNoteProgress}%
              </div>
            </div>
          </div>
          <button onClick={() => setActiveTab?.('ending-note')} className="btn btn-primary" style={{ height: '40px', padding: '0 1.2rem', fontSize: '0.9rem' }}>
            이어 쓰기
          </button>
        </div>
      </div>
    </div>
  );
};
