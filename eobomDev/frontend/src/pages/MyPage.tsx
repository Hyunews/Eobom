import React, { useEffect, useState } from 'react';
import { MessageSquare, BookOpen, ChevronRight, Camera, Settings, Lock, UserCircle, Users, Mail, Flower2, MessageCircle } from 'lucide-react';
import { PhoneHeartIcon } from '../components/MenuIcons';
import { apiFetchRaw, apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
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

// 00-36 M-1 — 마이페이지를 "내 자산 허브"로 개편(2026-09-07, 서버 변경 0건 · 이미 있는
// 라우트·API를 잇기만 함). §4.1 3구역 구조를 그대로 옮긴다: A=나, B=내가 남긴 것,
// C=내 활동과 계정. B구역이 이번 개편의 핵심 — 유족 메시지 보관함·부고장·추모관처럼 이미
// 구현이 끝난 기능들이 마이페이지에 입구가 없었다(§3.1).
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.04em', margin: '0.6rem 0 0.1rem',
};

const cardButtonStyle: React.CSSProperties = {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  padding: '1rem 1.1rem', cursor: 'pointer', textAlign: 'left', width: '100%',
};

const iconBoxStyle: React.CSSProperties = {
  width: '44px', height: '44px', borderRadius: 'var(--r-md)', backgroundColor: 'var(--secondary-color)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

export const MyPage: React.FC<MyPageProps> = ({ currentUser, onOpenLogin, onOpenAccountSettings, onOpenProfile, onOpenFamilyDesignation, setActiveTab }) => {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [summary, setSummary] = useState<MySummary | null>(null);

  useEffect(() => {
    if (!currentUser || !getToken('USER')) return;

    // /api/auth/me는 {status, user}를 반환해 공통 {status, data} 봉투와 다르다 — apiFetchRaw로 직접 파싱.
    apiFetchRaw('/api/auth/me', 'USER')
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
    apiFetch<MySummary>('/api/me/summary', 'USER')
      .then((data) => setSummary(data))
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
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--fs-body)', marginBottom: '1.1rem' }}>
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
  // 🔴 wt144 — "내 부고장" 칸이 `/my-obituaries-memorials`(부고장·추모관 반반 화면)의 유일한
  // 진입점이다(헤더 직행 메뉴 삭제됨, 00-36 §3.1). 이 칸의 `to`를 절대 떨어뜨리지 말 것 —
  // 떨어뜨리면 그 화면 전체가 닫힌다. 아래 B구역 카드는 그 진입점을 이중화하는 안전장치일 뿐,
  // 이 대신은 아니다. 문의·상담은 M-2에서 `GET /api/me/leads`가 생기기 전까지 링크 없이 숫자만.
  const stats: { label: string; value: number; to?: string }[] = [
    { label: '문의 내역', value: summary?.leadCount ?? 0 },
    { label: '상담 내역', value: summary?.consultCount ?? 0 },
    { label: '내 부고장', value: summary?.obituaryCount ?? 0, to: 'my-obituaries-memorials' },
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
              <span style={{ fontSize: '1.8rem', fontWeight: 'var(--fw-bold)', color: 'var(--primary-color)' }}>{displayName.charAt(0)}</span>
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
                fontSize: 'var(--fs-body)',
                fontWeight: 'var(--fw-bold)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--r-sm)',
                backgroundColor: 'var(--accent-gold)',
                color: '#FFFFFF',
                letterSpacing: '0.03em'
              }}
            >
              {profile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-body)' }}>{profile?.email || '이메일 정보 없음'}</p>
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
            onClick={stat.to ? () => setActiveTab?.(stat.to!) : undefined}
            style={{
              textAlign: 'center',
              borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              cursor: stat.to ? 'pointer' : 'default',
            }}
          >
            <div className="stat-row__value" style={{ fontWeight: 'var(--fw-bold)', color: '#FFFFFF' }}>{stat.value}</div>
            <div className="stat-row__label" style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Archive List — 00-36 §4.1 3구역(A 나 / B 내가 남긴 것 / C 내 활동과 계정) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <p style={sectionTitleStyle}>나</p>

        {/* 00-28 §6.3 · 00-27 §8.2 — 내 정보(연락처·주소)와 가족 지정을 마이페이지 안에 나란히 둔다 */}
        <button onClick={onOpenProfile} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <UserCircle size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>내 정보</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <button onClick={onOpenFamilyDesignation} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <Users size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>가족 지정</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <p style={sectionTitleStyle}>내가 남긴 것</p>

        {/* §1-3·00-36 M-1 #5 — EndingNote는 이제 Entry·Grant까지 배선된 실동작 기능이라
            "preview" 배지가 거짓 정보였다(modeNav.ts의 ending-note도 이미 wt131에서
            'active'로 정정됨). 배지를 떼고 다른 활성 카드와 같은 형태로 통일한다. */}
        <button onClick={() => setActiveTab?.('ending-note')} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <BookOpen size={20} color="var(--accent-gold)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>디지털 엔딩노트</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* 00-36 §3.1 최우선 구멍 — 06-05 D-1~D-11(편지·음성·반출까지)이 다 구현됐는데
            마이페이지엔 입구가 없었다. 사이드바와 같은 라우트로 연결. */}
        <button onClick={() => setActiveTab?.('farewell-messages')} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <Mail size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>유족 메시지 보관함</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* 🔴 통계 "내 부고장" 칸과 같은 목적지(`/my-obituaries-memorials`)로 가는 두 번째
            입구 — 그 화면의 유일한 통로를 이중화하는 안전장치(00-36 §3.1 마지막 문단).
            통계 칸을 지우거나 링크를 떼도 이 카드가 남아 있으면 화면이 닫히지 않는다. */}
        <button onClick={() => setActiveTab?.('my-obituaries-memorials')} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <Flower2 size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>내 부고장 · 추모관</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        {/* modeNav.ts의 digital-estate는 여전히 status:'preview'(제 목업 데이터) — 사이드바와
            같은 배지로 통일해 "곧 나올 기능"이라는 인상을 다르게 주지 않는다. */}
        <button onClick={() => setActiveTab?.('digital-estate')} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <PhoneHeartIcon size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>디지털 자산 정리</span>
                <Badge status="preview" />
              </div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <p style={sectionTitleStyle}>내 활동과 계정</p>

        {/* 00-36 §6 확정#1 — "나의 예약 현황"(FacilityBooking 폐기로 실체 없음)을 지우는 대신
            "문의 내역"으로 교체해 M-2(`GET /api/me/leads`)가 채울 자리로 전용한다. comingSoon
            배지는 그대로 — 예약과 달리 이건 실제로 곧 나올 기능이라 배지가 다시 정당하다. */}
        <div className="card" style={{ ...cardButtonStyle, cursor: 'not-allowed', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <MessageCircle size={20} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>문의 내역</div>
            </div>
          </div>
          <Badge status="comingSoon" />
        </div>

        <button onClick={() => setActiveTab?.('counseling')} className="card" style={cardButtonStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={iconBoxStyle}>
              <MessageSquare size={20} color="var(--point-color)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>상담 신청 내역</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  );
};
