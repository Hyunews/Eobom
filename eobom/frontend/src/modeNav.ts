import type { ElementType } from 'react';
import { Package, Flower2 } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from './components/MenuIcons';

// docs/00_핵심플랫폼/00-26 §3 — 모드별 맞춤 사이드바 메뉴 정본 데이터.
// 라벨은 00-02 §3.2 정본(00-26 §5가 잡은 사이드바 라벨 불일치 3건 정정 포함) 그대로 쓴다.
// 새 화면 ID는 만들지 않는다(00-26 §7.1) — 기존 라우트 id를 그대로 참조.

export type NavMode = 'prep' | 'bereaved';

export const NAV_MODE_STORAGE_KEY = 'k_ending_nav_mode';

export const MODE_LABELS: Record<NavMode, string> = {
  prep: '생전 준비',
  bereaved: '유가족',
};

export type NavStatus = 'active' | 'preview' | 'comingSoon';

export interface ModeMenuItem {
  id: string;
  label: string;
  icon: ElementType;
  status: NavStatus;
  loginRequired?: boolean;
}

// § 3.1 생전 준비 모드 — 3개. 06을 맨 위에 둔다(이 모드에 들어온 이유 자체가 엔딩노트).
const PREP_MENU: ModeMenuItem[] = [
  { id: 'ending-note', label: '디지털 엔딩노트', icon: NoteKeyIcon, status: 'preview', loginRequired: true },
  { id: 'digital-estate', label: '디지털 자산·계정 정산', icon: PhoneHeartIcon, status: 'preview' },
  { id: 'counseling', label: '전문가 매칭', icon: HandScalesIcon, status: 'active' },
];

// §3.2 유가족 모드 — 6개. "진입 → 미리보기 → 준비 중" 순, 07이 판단 순 원칙상 1순위(07-02).
const BEREAVED_MENU: ModeMenuItem[] = [
  { id: 'care-guide', label: '상중·행정 케어', icon: ChecklistShieldIcon, status: 'active' },
  { id: 'facility', label: '장사시설 매칭', icon: HouseLeafIcon, status: 'active' },
  { id: 'counseling', label: '전문가 매칭', icon: HandScalesIcon, status: 'active' },
  { id: 'digital-estate', label: '디지털 자산·계정 정산', icon: PhoneHeartIcon, status: 'preview' },
  { id: 'memorial', label: '디지털 추모관', icon: Flower2, status: 'comingSoon' },
  { id: 'pickup', label: '현물 유품 수거', icon: Package, status: 'comingSoon' },
];

export const MODE_MENUS: Record<NavMode, ModeMenuItem[]> = {
  prep: PREP_MENU,
  bereaved: BEREAVED_MENU,
};
