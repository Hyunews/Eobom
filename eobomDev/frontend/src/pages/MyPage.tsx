import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Settings, UserCircle, Users, Mail, Flower2, MessageCircle, Send, Inbox, LogOut, ExternalLink, type LucideIcon } from 'lucide-react';
import { PhoneHeartIcon } from '../components/MenuIcons';
import { apiFetchRaw, apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { KAKAO_CHANNEL_CHAT_URL } from '../config';
import '../styles/design-v2.css';

interface MyPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  onOpenAccountSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenFamilyDesignation?: () => void;
  onLogout?: () => void;
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

// 🔄 2026-09-21 M-1.5(00-36 §5) — 그룹② 허브형 재구성. 시안: Design 캔버스 "그룹② mypage 시안" v4.
// 규칙 정본은 00-39 §6 "훑는 목록" — 카드·그림자 없이 1px 구분선 행, 명조 구간 제목, 읽기 폭 764px.
// 구조는 00-36 §4.1(4구역): 나 / 내가 남긴 것 / 나에게 공유된 것 / 내 활동과 계정.
// 이번 범위(M-1.5, 서버 0건)에 없는 자리 — 내가 남긴 방명록·내 상담 내역 목록(M-2), 개인정보·동의·
// 내 데이터 반출·회원 탈퇴(M-3) — 는 아직 그리지 않는다. 눌러도 아무 일도 없는 행을 만들지 않는다.
//
// 🔴 "부고장" 통계 칸과 아래 "내 부고장 · 추모관" 행은 같은 목적지(`/my-obituaries-memorials`)로 가는
// 두 입구다 — 그 화면의 유일한 통로를 이중화하는 안전장치(00-36 §3.1 마지막 문단). 통계 칸을 지우거나
// 링크를 떼도 이 행이 남아 있으면 화면이 닫히지 않는다. 둘 다 떨어뜨리지 말 것.

interface NavRowProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  // 외부 링크(새 창) — <a>로 그리고 › 대신 외부 링크 아이콘을 단다
  href?: string;
}

const NavRow: React.FC<NavRowProps> = ({ icon, label, onClick, href }) => {
  const inner = (
    <>
      <span className="v2-nav-row-icon">{icon}</span>
      <span className="v2-nav-row-label">{label}</span>
      <span className="v2-nav-row-arrow">{href ? <ExternalLink size={16} /> : <ChevronRight size={18} />}</span>
    </>
  );
  if (href) {
    return (
      <a className="v2-nav-row" href={href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className="v2-nav-row" onClick={onClick}>
      {inner}
    </button>
  );
};

const HubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="v2-hub-section">
    <div className="v2-section-head">
      <h2 className="v2-section-title">{title}</h2>
    </div>
    {children}
  </section>
);

export const MyPage: React.FC<MyPageProps> = ({ currentUser, onOpenLogin, onOpenAccountSettings, onOpenProfile, onOpenFamilyDesignation, onLogout, setActiveTab }) => {
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

    // §1-2 — 통계 실데이터. 하드코딩 제거.
    apiFetch<MySummary>('/api/me/summary', 'USER')
      .then((data) => setSummary(data))
      .catch(() => {
        // 조회 실패 시 0으로 표시(아래 ?? 0) — 화면이 깨지지 않게
      });
  }, [currentUser]);

  // 비회원: 로그인 유도
  if (!currentUser) {
    return (
      <div className="v2-page">
        <div className="v2-content">
          <h1 className="v2-page-title">마이페이지</h1>
          <p className="v2-empty">마이페이지는 로그인 후 이용하실 수 있습니다.</p>
          <button type="button" className="v2-btn-primary" onClick={onOpenLogin}>로그인 / 회원가입</button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || currentUser.split(' (')[0];

  // §1-1 — FacilityBooking이 2026-08-11 폐기돼 "예약"이라는 개념이 DB에 없다.
  // 🔴 2026-09-10 사람 정정 — "상담"은 전문가 상담(consultCount)뿐 아니라 시설 업체 상담(leadCount)도
  // 포함하므로 합산해 보여준다. 🔄 2026-09-21(00-36 §6 #5) — "문의" 칸은 없앴다: 문의는 카카오톡
  // 채널 안에서 끝나 우리 DB에 남지 않으므로 셀 수 없다. 아이콘은 상담=Send(편지비행기)·문의=말풍선.
  const stats: { label: string; value: number; to?: string; Icon: LucideIcon }[] = [
    { label: '상담', value: (summary?.consultCount ?? 0) + (summary?.leadCount ?? 0), Icon: Send },
    { label: '부고장', value: summary?.obituaryCount ?? 0, to: 'my-obituaries-memorials', Icon: Flower2 },
  ];

  const go = (tab: string) => () => setActiveTab?.(tab);

  return (
    <div className="v2-page">
      <div className="v2-content">
        <div className="v2-profile">
          <div className="v2-profile-avatar">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt={displayName} />
            ) : (
              displayName.charAt(0)
            )}
          </div>
          <div className="v2-profile-body">
            <div className="v2-profile-name">
              <h1 className="v2-page-title">{displayName} 님</h1>
              <span className="v2-badge-neutral">{profile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}</span>
            </div>
            <p className="v2-profile-email">{profile?.email || '이메일 정보 없음'}</p>
          </div>
          {/* 계정 연동 — 웹은 글자 버튼, 모바일은 아이콘만(제목 줄이 밀리지 않게) */}
          <button type="button" className="v2-btn-outline" onClick={onOpenAccountSettings} aria-label="계정 연동" title="계정 연동">
            <Settings size={16} />
            <span className="v2-desktop-only">계정 연동</span>
          </button>
        </div>

        <div className="v2-stat-row">
          {stats.map((stat) => {
            const body = (
              <>
                <span className="v2-stat-value">{stat.value}</span>
                <span className="v2-stat-label">
                  <stat.Icon size={16} color="var(--v2-text-faint)" />
                  {stat.label}
                  {stat.to && <ChevronRight size={14} color="var(--v2-text-faint)" />}
                </span>
              </>
            );
            return stat.to ? (
              <button type="button" key={stat.label} className="v2-stat" onClick={go(stat.to)}>{body}</button>
            ) : (
              <div key={stat.label} className="v2-stat">{body}</div>
            );
          })}
        </div>

        <HubSection title="나">
          {/* 00-28 §6.3 · 00-27 §8.2 — 내 정보(연락처·주소)와 가족 지정을 마이페이지 안에 나란히 둔다 */}
          <NavRow icon={<UserCircle size={20} />} label="내 정보" onClick={onOpenProfile} />
          <NavRow icon={<Users size={20} />} label="가족 지정" onClick={onOpenFamilyDesignation} />
        </HubSection>

        <HubSection title="내가 남긴 것">
          <NavRow icon={<BookOpen size={20} />} label="디지털 엔딩노트" onClick={go('ending-note')} />
          {/* 00-36 §3.1 최우선 구멍 — 06-05 D-1~D-11(편지·음성·반출까지)이 다 구현됐는데
              마이페이지엔 입구가 없었다. 사이드바와 같은 라우트로 연결. */}
          <NavRow icon={<Mail size={20} />} label="유족 메시지 보관함" onClick={go('farewell-messages')} />
          <NavRow icon={<Flower2 size={20} />} label="내 부고장 · 추모관" onClick={go('my-obituaries-memorials')} />
          {/* 🔄 2026-09-21 사람 지시 — "디지털 자산 정리" → "디지털 정산"(modeNav.ts 라벨과 일치) */}
          <NavRow icon={<PhoneHeartIcon size={20} color="currentColor" />} label="디지털 정산" onClick={go('digital-estate')} />
        </HubSection>

        {/* 00-36 §4.6(SCR-020) — 행은 하나다. 공유된 엔딩노트와 수락한 가족 지정은 같은
            FamilyDesignation 한 줄에서 나오므로 두 행으로 나누면 같은 것을 두 번 보여준다.
            🔴 건수 배지·"n건 공유됨" 같은 기대를 만드는 표기를 달지 않는다. */}
        <HubSection title="나에게 공유된 것">
          <NavRow icon={<Inbox size={20} />} label="나를 가족으로 지정한 분" onClick={go('family-shared')} />
        </HubSection>

        <HubSection title="내 활동과 계정">
          {/* 🔴 "상담 신청 내역"은 지금 신청 화면(counseling)을 연다 — 이름과 목적지가 어긋난 오연결이다.
              M-2가 내 상담 내역 목록(SCR-019)을 만들 때 함께 고친다(00-36 §5 M-2 #7). */}
          <NavRow icon={<Send size={20} />} label="상담 신청 내역" onClick={go('counseling')} />
          {/* 5-1 — 푸터와 같은 URL·같은 말풍선 아이콘, 새 창. 문의는 카톡 안에서 끝나므로 숫자·배지를 달지 않는다 */}
          <NavRow icon={<MessageCircle size={20} />} label="카카오톡으로 문의하기" href={KAKAO_CHANNEL_CHAT_URL} />
          {/* 5-3 — 사이드바 폐지(00-39 §6 규칙 3) 뒤 모바일에는 로그아웃 진입점이 헤더 드롭다운뿐이다 */}
          <NavRow icon={<LogOut size={20} />} label="로그아웃" onClick={onLogout} />
        </HubSection>
      </div>
    </div>
  );
};
