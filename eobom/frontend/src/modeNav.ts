import type { ElementType } from 'react';
import { Package, Flower2, MessageSquare } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from './components/MenuIcons';

// docs/00_핵심플랫폼/00-26 §3 — 모드별 맞춤 사이드바 메뉴 정본 데이터.
// 라벨은 00-02 §3.2 정본(00-26 §5가 잡은 사이드바 라벨 불일치 3건 정정 포함) 그대로 쓴다.
// 새 화면 ID는 만들지 않는다(00-26 §7.1) — 기존 라우트 id를 그대로 참조.

export type NavMode = 'prep' | 'bereaved';

export const NAV_MODE_STORAGE_KEY = 'k_ending_nav_mode';

// Header.tsx 모드 드롭다운·EntryBoxes.tsx 박스② 제목과 라벨을 통일한다(08-19 14차).
export const MODE_LABELS: Record<NavMode, string> = {
  prep: '생전 준비',
  bereaved: '임종 및 사후 정리',
};

export type NavStatus = 'active' | 'preview' | 'comingSoon';

export interface ModeMenuItem {
  id: string;
  label: string;
  icon: ElementType;
  status: NavStatus;
  loginRequired?: boolean;
}

// § 3.1 생전 준비 모드 — 2개. 06을 맨 위에 둔다(이 모드에 들어온 이유 자체가 엔딩노트).
// 08-19 9차 — counseling에 loginRequired 누락돼 있던 것 정정(domainSlides.tsx의
// 박스① CTA 게이트와 불일치하던 문제 — 오버레이 CTA와 사이드바 클릭이 다르게 동작했음).
// 08-19 14차(개발자 직접 지시) — 디지털 정산(계정·자산 정산)은 사후 처리 도메인이라 생전
// 준비에 불필요 — 제거. 유가족 모드(BEREAVED_MENU)에는 그대로 남는다.
const PREP_MENU: ModeMenuItem[] = [
  { id: 'ending-note', label: '디지털 엔딩노트', icon: NoteKeyIcon, status: 'preview', loginRequired: true },
  { id: 'counseling', label: '전문가 매칭', icon: HandScalesIcon, status: 'active', loginRequired: true },
];

// §3.2 유가족 모드 — 7개. 08-19 9차(개발자 직접 지시) — 순서 확정 및 pickup·memorial을
// comingSoon → preview로 정정(PickupPage·MemorialPage 분리). facility·counseling·digital-estate에
// loginRequired 누락돼 있던 것도 domainSlides.tsx 박스② CTA 게이트와 맞춰 정정.
// care-guide만 예외(00-26 §7.3·07-02 원칙 — 07 열람은 어느 경로로 들어오든 로그인 없이 가능).
const BEREAVED_MENU: ModeMenuItem[] = [
  { id: 'care-guide', label: '상중·행정 케어', icon: ChecklistShieldIcon, status: 'active' },
  { id: 'facility', label: '장사시설 매칭', icon: HouseLeafIcon, status: 'active', loginRequired: true },
  { id: 'counseling', label: '전문가 매칭', icon: HandScalesIcon, status: 'active', loginRequired: true },
  { id: 'obituary', label: '모바일 부고장', icon: MessageSquare, status: 'active', loginRequired: true },
  { id: 'pickup', label: '유품 수거', icon: Package, status: 'preview', loginRequired: true },
  { id: 'digital-estate', label: '디지털 정산', icon: PhoneHeartIcon, status: 'preview', loginRequired: true },
  { id: 'memorial', label: '디지털 추모관', icon: Flower2, status: 'preview', loginRequired: true },
];

export const MODE_MENUS: Record<NavMode, ModeMenuItem[]> = {
  prep: PREP_MENU,
  bereaved: BEREAVED_MENU,
};
