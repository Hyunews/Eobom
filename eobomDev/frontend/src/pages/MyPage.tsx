import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Camera, Settings, Lock, UserCircle, Users, Mail, Flower2, MessageCircle, Send, type LucideIcon } from 'lucide-react';
import { PhoneHeartIcon } from '../components/MenuIcons';
import { apiFetchRaw, apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { Badge } from '../components/home/EntryBoxes';
import { useIsMobile } from '../hooks/useIsMobile';

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
  fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.04em', margin: '0 0 0.4rem',
};

// 🔄 2026-09-10 사람 지시(제안안 확정) — 행마다 따로 .card(그림자·테두리)를 두던 걸
// 구간별 패널 하나로 묶는다. 패널 안 각 행은 카드가 아니라 이 스타일 + 아래쪽 구분선(마지막
// 행 제외)만 쓴다. width:100%가 없으면 button 기본폭(content-box)이라 우측 정렬이 깨진다.
const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--card-bg)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--box-shadow)',
  overflow: 'hidden', marginBottom: '0.9rem',
};

const panelRowStyle = (isLast: boolean): React.CSSProperties => ({
  display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.85rem 1rem', cursor: 'pointer', textAlign: 'left', width: '100%', background: 'none', border: 'none',
  borderBottom: isLast ? 'none' : '1px solid var(--secondary-color)',
});

const iconBoxStyle: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: 'var(--r-sm)', backgroundColor: 'var(--secondary-color)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

// 🔴 2026-09-10 — 행 텍스트("디지털 자산 정리" 등)가 배지·아이콘과 한 줄에 있다가 좁은
// 화면에서 줄바꿈되는 걸 막는다. 늘어나지 않게 min-width:0으로 flex 자식을 줄일 수 있게 하고,
// 넘치면 줄바꿈 대신 말줄임(ellipsis)으로 받는다 — 그래도 줄바꿈되는 대신 잘리는 쪽이 낫다.
// 🔄 2026-09-10 — 0.95rem이 데스크탑에서 너무 작다는 지적으로 1rem으로 키움.
const rowLabelStyle: React.CSSProperties = {
  fontWeight: 700, color: 'var(--primary-color)', fontSize: '1rem',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
};

// 🆕 2026-09-10 사람 지시 — 마이페이지가 `.container`(00-38 min-width:1024px) 안에 꽉 차게
// 늘어나 데스크탑에서 히어로·패널이 지나치게 크고 옆으로 넓적하게 보였다. 마이페이지는 목록형
// 메뉴라 좁은 열이 자연스럽다 — 폭을 고정하고 가운데 정렬한다(ObituaryPage 관리 패널과 같은
// 문제, 다른 해법: 거긴 카드 개별 max-width, 여긴 전체를 한 열로 묶음).
const contentColStyle: React.CSSProperties = { maxWidth: '560px', margin: '0 auto' };

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
            부고장 현황, 상담 내역, 엔딩노트 진행 상황을 한눈에 확인하세요.
          </p>
          <button onClick={onOpenLogin} className="btn btn-point">
            🔑 로그인 / 회원가입 하러가기
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || currentUser.split(' (')[0];

  // 🔄 2026-09-10 — 히어로 통계 아이콘이 모바일 고정 14px 그대로 데스크탑까지 가서 1.8rem
  // 큰 숫자 옆에서 작아 보였다(.stat-row__value가 00-29 §6.1로 480px 기준 1.3rem↔1.8rem을
  // 이미 나눠 쓰고 있음 — 아이콘도 같은 기준으로 맞춘다). FacilityPage의 hideImagePlaceholder와
  // 같은 패턴(§5.1, 리터럴만 전달).
  const isCompact = useIsMobile(480);
  const statIconSize = isCompact ? 13 : 18;

  // §1-1 — FacilityBooking이 2026-08-11 폐기돼 "예약"이라는 개념이 DB에 없다.
  // Lead(문의)·ConsultRequest(상담)·Obituary(내 부고장) 3개만 실데이터로 센다.
  // 🔴 wt144 — "내 부고장" 칸이 `/my-obituaries-memorials`(부고장·추모관 반반 화면)의 유일한
  // 진입점이다(헤더 직행 메뉴 삭제됨, 00-36 §3.1). 이 칸의 `to`를 절대 떨어뜨리지 말 것 —
  // 떨어뜨리면 그 화면 전체가 닫힌다. 아래 B구역 카드는 그 진입점을 이중화하는 안전장치일 뿐,
  // 이 대신은 아니다. 문의·상담은 M-2에서 `GET /api/me/leads`가 생기기 전까지 링크 없이 숫자만.
  // 🆕 2026-09-10 사람 지시 — "문의 내역"(시설에 보낸 견적요청, FacilityPage InquiryModal)과
  // "상담 내역"(전문가 1:1 상담 신청, CounselingPage)이 글자만으로는 구분이 잘 안 된다는
  // 지적. 각 기능에서 이미 쓰고 있는 아이콘을 그대로 재사용한다 — Send는 InquiryModal의
  // "업체 상담" 버튼, MessageCircle은 CounselingPage의 "상담 신청" 버튼과 동일한 아이콘이라
  // 사용자가 이미 다른 화면에서 본 것과 연결해서 인식할 수 있다(새 기호를 만들지 않음).
  // 🔄 2026-09-10 — 노출 순서를 상담·문의·부고장으로 정정(사람 지시).
  // 🔴 2026-09-10 사람 정정 — "상담"은 전문가(CounselingPage) 상담뿐 아니라 시설 업체 상담도
  // 포함하는 개념이다. FacilityPage의 "업체 문의" 버튼·InquiryModal 제목을 "업체 상담"으로
  // 개명했고(같은 지시), 그에 맞춰 이 통계도 consultCount(전문가)+leadCount(업체)를 합산해
  // "상담 내역"으로 보여준다. "문의 내역"은 이 leadCount를 더는 쓰지 않는다 — 아직 실제로
  // 연결된 데이터 소스가 없는 별개 채널(예: 향후 카톡 문의) 자리로, 아래 "내 활동과 계정"
  // 패널의 comingSoon 행과 마찬가지로 항상 0으로 둔다.
  const stats: { label: string; value: number; to?: string; Icon: LucideIcon }[] = [
    { label: '상담', value: (summary?.consultCount ?? 0) + (summary?.leadCount ?? 0), Icon: MessageCircle },
    { label: '문의', value: 0, Icon: Send },
    { label: '부고장', value: summary?.obituaryCount ?? 0, to: 'my-obituaries-memorials', Icon: Flower2 },
  ];

  return (
    // 🔴 contentColStyle을 .container 자체에 주면 안 된다 — 그 클래스의 min-width:1024px(00-38)가
    // max-width:560px보다 이겨서(스펙상 min-width가 max-width를 이김) 제약이 그냥 무시된다.
    // 그래서 안쪽에 별도 div로 감싼다.
    <div className="container">
      <div style={contentColStyle}>
      {/* 🔄 2026-09-10 사람 지시 — 프로필 카드(흰색)·통계(남색)가 따로 놀던 걸 하나의 남색
          히어로 패널로 합친다. "계정 연동"은 텍스트 버튼 대신 우상단 아이콘 버튼으로 옮겨서
          — 이름이 길거나 화면이 좁을 때 버튼이 다음 줄로 밀리던 문제(flexWrap) 자체를 없앤다. */}
      <div
        style={{
          background: 'linear-gradient(165deg, var(--primary-color) 0%, #223a63 100%)',
          borderRadius: 'var(--r-lg)',
          padding: '1.25rem',
          marginBottom: '1.1rem',
          position: 'relative',
        }}
      >
        <button
          onClick={onOpenAccountSettings}
          aria-label="계정 연동"
          title="계정 연동"
          style={{
            position: 'absolute', top: '0.9rem', right: '0.9rem', width: '30px', height: '30px',
            borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.14)',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Settings size={15} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', paddingRight: '2.2rem' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* 🔄 2026-09-10 사람 지시 — 원형 프로필 이미지 10% 축소(64px→58px, 배지·이니셜도 비례). */}
            <div
              style={{
                width: '58px', height: '58px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.4)',
              }}
            >
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 'var(--fw-bold)', color: '#FFFFFF' }}>{displayName.charAt(0)}</span>
              )}
            </div>
            <div
              style={{
                position: 'absolute', bottom: '-1px', right: '-1px', width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--primary-color)',
              }}
              title="프로필 사진 변경 (개발중)"
            >
              <Camera size={9} color="#FFFFFF" />
            </div>
          </div>

          {/* minWidth:0이 있어야 자식의 overflow:hidden(ellipsis)이 실제로 먹는다 — flex 기본값
              min-width:auto라 텍스트가 길면 컨테이너가 같이 늘어나며 옆 아이콘 버튼과 겹친다. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'nowrap', minWidth: 0 }}>
              <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{displayName} 님</h2>
              <span
                style={{
                  fontSize: '0.68rem', fontWeight: 'var(--fw-bold)', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-sm)',
                  backgroundColor: 'var(--accent-gold)', color: '#FFFFFF', letterSpacing: '0.02em', flexShrink: 0,
                }}
              >
                {profile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
              </span>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.68)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.email || '이메일 정보 없음'}
            </p>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1.1rem 0 0.9rem' }} />

        {/* 3칸 통계 — 문의/상담을 아이콘으로 구분한다(위 stats 배열 주석 참고: InquiryModal·
            CounselingPage에서 이미 쓰는 아이콘을 그대로 재사용). 00-29 §6.1 .stat-row 대신
            히어로 안에 직접 그려 프로필과 한 덩어리로 보이게 한다. */}
        <div className="stat-row" style={{ padding: 0 }}>
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              onClick={stat.to ? () => setActiveTab?.(stat.to!) : undefined}
              style={{
                textAlign: 'center',
                borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.14)' : 'none',
                cursor: stat.to ? 'pointer' : 'default',
              }}
            >
              {/* 🔄 2026-09-10 사람 지시 — 좌상단 배지 대신, 아이콘을 라벨과 한 묶음으로 붙이고
                  그 묶음을 숫자와 같은 중심축으로 가운데 정렬한다. 숫자는 아이콘 간섭 없이
                  그대로 두고(라벨 없이 순수 텍스트라 자동으로 정중앙), 아이콘+라벨 줄도 flex
                  justify-content:center로 독립적으로 가운데 정렬되므로 둘의 중심이 일치한다. */}
              <div className="stat-row__value" style={{ fontWeight: 'var(--fw-bold)', color: '#FFFFFF' }}>{stat.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', display: 'inline-flex' }}>
                  <stat.Icon size={Math.round(statIconSize * 0.75)} />
                </span>
                <span className="stat-row__label" style={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Archive List — 00-36 §4.1 3구역(A 나 / B 내가 남긴 것 / C 내 활동과 계정).
          🔄 2026-09-10 — 행마다 따로 그림자·테두리를 두던 걸 구간별 흰 패널 하나로 묶고,
          안에서는 얇은 구분선만 쓴다. 전에는 8개 행이 전부 같은 카드로 반복돼 단조로웠다. */}
      <p style={sectionTitleStyle}>나</p>
      <div style={panelStyle}>

        {/* 00-28 §6.3 · 00-27 §8.2 — 내 정보(연락처·주소)와 가족 지정을 마이페이지 안에 나란히 둔다 */}
        <button onClick={onOpenProfile} style={panelRowStyle(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <UserCircle size={18} color="var(--point-color)" />
            </div>
            <div style={rowLabelStyle}>내 정보</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        <button onClick={onOpenFamilyDesignation} style={panelRowStyle(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <Users size={18} color="var(--point-color)" />
            </div>
            <div style={rowLabelStyle}>가족 지정</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>
      </div>

      <p style={sectionTitleStyle}>내가 남긴 것</p>
      <div style={panelStyle}>
        {/* §1-3·00-36 M-1 #5 — EndingNote는 이제 Entry·Grant까지 배선된 실동작 기능이라
            "preview" 배지가 거짓 정보였다(modeNav.ts의 ending-note도 이미 wt131에서
            'active'로 정정됨). 배지를 떼고 다른 활성 카드와 같은 형태로 통일한다. */}
        <button onClick={() => setActiveTab?.('ending-note')} style={panelRowStyle(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <BookOpen size={18} color="var(--accent-gold)" />
            </div>
            <div style={rowLabelStyle}>디지털 엔딩노트</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* 00-36 §3.1 최우선 구멍 — 06-05 D-1~D-11(편지·음성·반출까지)이 다 구현됐는데
            마이페이지엔 입구가 없었다. 사이드바와 같은 라우트로 연결. */}
        <button onClick={() => setActiveTab?.('farewell-messages')} style={panelRowStyle(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <Mail size={18} color="var(--point-color)" />
            </div>
            <div style={rowLabelStyle}>유족 메시지 보관함</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* 🔴 통계 "내 부고장" 칸과 같은 목적지(`/my-obituaries-memorials`)로 가는 두 번째
            입구 — 그 화면의 유일한 통로를 이중화하는 안전장치(00-36 §3.1 마지막 문단).
            통계 칸을 지우거나 링크를 떼도 이 행이 남아 있으면 화면이 닫히지 않는다. */}
        <button onClick={() => setActiveTab?.('my-obituaries-memorials')} style={panelRowStyle(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <Flower2 size={18} color="var(--point-color)" />
            </div>
            <div style={rowLabelStyle}>내 부고장 · 추모관</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* 🔄 2026-09-11 사람 지시 — "미리보기" 배지 제거(모바일 검증 루프 5번). modeNav.ts의
            digital-estate는 여전히 status:'preview'지만, 이 목록에서는 다른 행과 동일하게 보여준다. */}
        <button onClick={() => setActiveTab?.('digital-estate')} style={panelRowStyle(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <PhoneHeartIcon size={18} color="var(--point-color)" />
            </div>
            <div style={rowLabelStyle}>디지털 자산 정리</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>
      </div>

      <p style={sectionTitleStyle}>내 활동과 계정</p>
      <div style={panelStyle}>
        {/* 🔄 2026-09-10 — 히어로 통계와 순서를 맞춰 상담을 먼저 둔다(사람 지시). */}
        <button onClick={() => setActiveTab?.('counseling')} style={panelRowStyle(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <MessageCircle size={18} color="var(--point-color)" />
            </div>
            <div style={rowLabelStyle}>상담 신청 내역</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* 00-36 §6 확정#1 — "나의 예약 현황"(FacilityBooking 폐기로 실체 없음)을 지우는 대신
            "문의 내역"으로 교체해 M-2(`GET /api/me/leads`)가 채울 자리로 전용한다. comingSoon
            배지는 그대로 — 예약과 달리 이건 실제로 곧 나올 기능이라 배지가 다시 정당하다.
            아이콘도 위 히어로 통계와 같은 Send로 맞춰 "이게 그 문의"라는 걸 알 수 있게 한다. */}
        <div style={{ ...panelRowStyle(true), cursor: 'not-allowed', opacity: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div style={iconBoxStyle}>
              <Send size={18} color="var(--text-muted)" />
            </div>
            <div style={rowLabelStyle}>문의 내역</div>
          </div>
          <Badge status="comingSoon" />
        </div>
      </div>
      </div>
    </div>
  );
};
