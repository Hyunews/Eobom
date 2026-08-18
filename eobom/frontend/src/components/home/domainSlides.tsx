import React from 'react';
import { Package, Flower2 } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from '../MenuIcons';

// 박스별 미니 풀스크린 오버레이(BoxDetailOverlay)에 쓰이는 슬라이드 콘텐츠.
// 기존 HomePage 풀페이지 스냅 섹션 1~5(01~05)에 있던 소개 문구를 그대로 옮기되,
// 03(디지털 유품 정리) 섹션에 뒤섞여 있던 03(현물수거)·04(디지털자산)·05(추모관) 내용은
// 항목별로 쪼갰다. 03·05는 아직 실체가 없어(00-23 §3 실측) 새로 썼다 — 가짜 목록·숫자 없이
// "준비 중" 사실만 전달한다(00-23 §8.7).

export type SlideStatus = 'active' | 'preview' | 'comingSoon';

export interface DomainSlide {
  key: string;
  tab?: string;
  badgeLabel: string;
  badgeIcon: React.ReactNode;
  badgeColor: string;
  badgeBg: string;
  titleLine1: string;
  titleLine2: string;
  highlightColor: string;
  description: string;
  bullets: string[];
  featureIcon: React.ReactNode;
  featureIconBg: string;
  featureBorderColor: string;
  featureTitle: string;
  featureDesc: string;
  ctaLabel: string;
  ctaColor?: string;
  status: SlideStatus;
  loginRequired?: boolean;
  note?: string;
}

export const domainSlides: Record<string, DomainSlide> = {
  facility: {
    key: 'facility',
    tab: 'facility',
    badgeLabel: '장사시설 매칭',
    badgeIcon: <HouseLeafIcon size={20} color="#1A2B4C" />,
    badgeColor: '#1A2B4C',
    badgeBg: '#FFFFFF',
    titleLine1: '당신에게 가장 평온한',
    titleLine2: '안식처를 찾아드립니다',
    highlightColor: '#5B7065',
    description:
      '현재 위치 기반 반경 탐색, 카카오맵 LBS 핀 마커 연동, 표준 공시 견적 비교 및 1-Touch 방문 답사 예약을 이용해보세요.',
    bullets: [
      '전국 14개 실제 장례식장 / 봉안당 / 수목장 GPS 연동',
      '보건복지부 e하늘 장사정보 시스템 투명 가격 공시표 팝업',
      '전담 지도사 동행 1:1 방문 답사 예약 신청',
    ],
    featureIcon: <HouseLeafIcon size={36} color="#1A2B4C" />,
    featureIconBg: '#F1F5F9',
    featureBorderColor: '#5B7065',
    featureTitle: '봉안당 · 수목장 맞춤 검색',
    featureDesc:
      '날씨와 상관없는 쾌적한 실내 납골당부터 자연으로 돌아가는 친환경 수목장까지, 예산과 종교에 맞는 최고의 시설을 비교해 드립니다.',
    ctaLabel: '장사시설 매칭 이동하기',
    ctaColor: '#5B7065',
    status: 'active',
  },

  counseling: {
    key: 'counseling',
    tab: 'counseling',
    badgeLabel: '전문가 상담',
    badgeIcon: <HandScalesIcon size={20} color="var(--accent-gold)" />,
    badgeColor: 'var(--accent-gold)',
    badgeBg: '#FEF3C7',
    titleLine1: '복잡하고 막막한 상속세',
    titleLine2: '전문가가 1:1 케어합니다',
    highlightColor: 'var(--accent-gold)',
    description:
      '상속세 자동 시뮬레이터로 공제액을 즉시 계산하고, 분야별 검증된 변호사·세무사와의 비대면 상담을 예약하세요.',
    bullets: [
      '부동산, 예적금 입력 ➔ 예상 상속세액 3초 자동 계산',
      '변호사 / 세무사 월별 상담 달력 예약 시스템',
      '상속 등기·유언장 전문가 연결',
    ],
    featureIcon: <HandScalesIcon size={36} color="var(--accent-gold)" />,
    featureIconBg: '#FEF3C7',
    featureBorderColor: 'var(--accent-gold)',
    featureTitle: '상속세 시뮬레이터 & 1:1 케어',
    featureDesc:
      '배우자 공제, 자녀 일괄 공제를 적용하여 실제 과세 표준액을 미리 확인하고 자산 분쟁 없는 평온한 상속을 준비하세요.',
    ctaLabel: '전문가 상담 이동하기',
    ctaColor: 'var(--accent-gold)',
    status: 'active',
  },

  'care-guide': {
    key: 'care-guide',
    tab: 'care-guide',
    badgeLabel: '상중 케어 및 사망 행정',
    badgeIcon: <ChecklistShieldIcon size={20} color="#03543F" />,
    badgeColor: '#03543F',
    badgeBg: '#DEF7EC',
    titleLine1: '갑작스러운 이별 앞에서도',
    titleLine2: '빠짐없이 챙겨드립니다',
    highlightColor: '#5B7065',
    description: '사망 후 D-Day 필수 행정절차 타임라인과 모바일 부고장 작성을 한 곳에서 확인하세요.',
    bullets: [
      '사망진단서, 사망신고 등 정부24 연계 행정 타임라인',
      '모바일 부고장 간편 작성 & 답례 문자 생성',
      '정부24 안심상속 원스톱 서비스 바로 연결',
    ],
    featureIcon: <ChecklistShieldIcon size={36} color="#03543F" />,
    featureIconBg: '#DEF7EC',
    featureBorderColor: '#5B7065',
    featureTitle: '행정절차 타임라인 & 부고장',
    featureDesc: '사망신고·상속포기 등 법정기한이 있는 절차를 D-Day 타임라인으로 안내하고, 모바일 부고장 작성을 도와드립니다.',
    ctaLabel: '상중 케어 바로 보기',
    ctaColor: '#5B7065',
    status: 'active',
    note: '로그인 없이도 바로 열람하실 수 있습니다',
  },

  'digital-estate': {
    key: 'digital-estate',
    tab: 'digital-estate',
    badgeLabel: '디지털 자산 · 계정 정산',
    badgeIcon: <PhoneHeartIcon size={20} color="#D4A359" />,
    badgeColor: '#D4A359',
    badgeBg: '#FFFFFF',
    titleLine1: '소중한 디지털 흔적에',
    titleLine2: '안전한 마침표를 찍습니다',
    highlightColor: '#D4A359',
    description:
      'SNS·클라우드 계정의 정산과 정리를 도와드립니다. 생전에 미리 위임해두면, 사후에는 유족이 계정마다 직접 해지 절차를 알아보지 않아도 됩니다.',
    bullets: [
      '인스타그램, 페이스북, 카카오 등 계정 영구 삭제 대행',
      '생전에 처리 방식을 미리 지정해두는 사전 위임',
      '정산 진행 상황을 한 화면에서 확인',
    ],
    featureIcon: <PhoneHeartIcon size={36} color="#D4A359" />,
    featureIconBg: '#FEF3C7',
    featureBorderColor: '#D4A359',
    featureTitle: 'SNS · 클라우드 계정 정산',
    featureDesc: '유족이 계정마다 따로 알아보지 않도록, 정산 절차를 안내하고 진행 상황을 관리해 드립니다.',
    ctaLabel: '미리보기로 살펴보기',
    ctaColor: '#D4A359',
    status: 'preview',
  },

  'ending-note': {
    key: 'ending-note',
    tab: 'ending-note',
    badgeLabel: '디지털 엔딩노트 / 유족 메시지',
    badgeIcon: <NoteKeyIcon size={20} color="#1A2B4C" />,
    badgeColor: '#1A2B4C',
    badgeBg: '#FFFFFF',
    titleLine1: '사랑하는 이들에게 남기는',
    titleLine2: '256-bit 비밀 메시지',
    highlightColor: '#5B7065',
    description:
      '연명의료 의향 메모부터 256-bit AES 최고 등급 암호화 금고, 사후 지정 수신 자동 발송까지 소중한 마음을 안전하게 보관하세요.',
    bullets: [
      '연명의료 의향 메모 & 장례 방식 사전 선택',
      '256-bit AES 군사 등급 암호화 메시지 보관함',
      '사후 2인 유족 승인(Multi-Sig) 시 자동 메시지 개봉 및 발송',
    ],
    featureIcon: <NoteKeyIcon size={36} color="#1A2B4C" accentColor="#D4A359" fillColor="#5B7065" />,
    featureIconBg: '#FEF3C7',
    featureBorderColor: '#D4A359',
    featureTitle: '256-bit AES 보안 금고',
    featureDesc: '생전에는 철저히 비밀이 보장되며, 사후 사망진단서 확인 및 지정 유족의 이중 동의 완료 시에만 안전하게 복호화되어 전송됩니다.',
    ctaLabel: '디지털 엔딩노트 작성하기',
    status: 'preview',
    loginRequired: true,
  },

  pickup: {
    key: 'pickup',
    badgeLabel: '현물 유품 수거',
    badgeIcon: <Package size={20} color="#6C7A89" />,
    badgeColor: '#6C7A89',
    badgeBg: '#F1F5F9',
    titleLine1: '고인의 유품을',
    titleLine2: '정중하게 정리해 드릴 예정입니다',
    highlightColor: '#6C7A89',
    description:
      '지역 기반 유품 정리·수거 전문 업체와 연결하는 서비스를 준비하고 있습니다. 아직 제휴된 업체가 없어, 지금은 상담·연결을 도와드릴 수 없습니다.',
    bullets: [],
    featureIcon: <Package size={36} color="#94A3B8" />,
    featureIconBg: '#F1F5F9',
    featureBorderColor: '#CBD5E1',
    featureTitle: '준비 중',
    featureDesc: '제휴 업체 등록이 완료되는 대로 순차 오픈할 예정입니다.',
    ctaLabel: '',
    status: 'comingSoon',
  },

  memorial: {
    key: 'memorial',
    badgeLabel: '디지털 추모관',
    badgeIcon: <Flower2 size={20} color="#6C7A89" />,
    badgeColor: '#6C7A89',
    badgeBg: '#F1F5F9',
    titleLine1: '소중한 기억을 나눌',
    titleLine2: '온라인 추모 공간을 준비하고 있습니다',
    highlightColor: '#6C7A89',
    description:
      '온라인 방명록과 추모 갤러리를 만들 수 있는 디지털 추모관을 준비하고 있습니다. 아직 화면이 열려 있지 않아 지금은 둘러보실 수 없습니다.',
    bullets: [],
    featureIcon: <Flower2 size={36} color="#94A3B8" />,
    featureIconBg: '#F1F5F9',
    featureBorderColor: '#CBD5E1',
    featureTitle: '준비 중',
    featureDesc: '오픈 시기가 정해지면 이 화면에서 가장 먼저 안내해 드리겠습니다.',
    ctaLabel: '',
    status: 'comingSoon',
  },
};
