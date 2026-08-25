import React from 'react';
import { Package, Flower2, MessageSquare } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from '../MenuIcons';

// 박스①②(생전 준비/임종 및 사후 정리) 소개 콘텐츠 — 2026-08-25 이전엔 박스별 미니 풀스크린
// 오버레이(BoxDetailOverlay, 폐지됨)가 썼고, 지금은 DomainOverviewPage(/prep·/bereaved)가 쓴다.
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
      '현재 위치 기반 거리순 정렬, 카카오맵 LBS 핀 마커 연동, 시/도·시/군/구 지역 필터로 원하는 시설을 찾아보세요.',
    bullets: [
      '카카오맵 실시간 연동으로 거리순 정렬 및 위치 확인',
      '시/도·시/군/구 지역 필터 + 태그 필터로 원하는 조건만 빠르게 검색',
      '전화번호 노출 없이 안전한 업체 문의(견적 요청) 폼으로 연결',
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
    loginRequired: true,
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
      '상속세 자동 시뮬레이터로 공제액을 즉시 계산하고, 분야별 검증된 변호사·세무사와의 비대면 상담을 신청하세요.',
    bullets: [
      '변호사·법무사·세무사·행정사·장례지도사 5대 분야 전문가 상담 신청',
      '총자산·채무·배우자 및 자녀 공제 조건 입력 → 예상 상속세 즉시 계산',
      '카카오 알림톡·전화·화상·방문 중 원하는 상담 방식 선택 가능',
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
    loginRequired: true,
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
      '사망진단서·사망신고 등 22개 행정절차를 D-Day 체크리스트로 확인',
      '정부24 안심상속 원스톱 서비스로 고인의 금융·토지·세금 내역 한 번에 조회',
      '상속포기·한정승인 등 되돌릴 수 없는 항목을 1순위로 우선 안내',
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

  obituary: {
    key: 'obituary',
    tab: 'obituary',
    badgeLabel: '모바일 부고장',
    badgeIcon: <MessageSquare size={20} color="#03543F" />,
    badgeColor: '#03543F',
    badgeBg: '#DEF7EC',
    titleLine1: '부고 소식을 빠르고',
    titleLine2: '정중하게 전해드립니다',
    highlightColor: '#5B7065',
    description:
      '고인·상주·빈소 정보를 입력하면 모바일 부고장이 자동으로 만들어집니다. 카카오톡으로 바로 공유하세요.',
    bullets: [
      '고인·상주·빈소 정보 입력 즉시 부고장 미리보기 생성',
      '카카오톡 공유 API로 간편 전송(개발중)',
      '디지털 추모관 오픈 후 추모 페이지 링크 자동 동봉 예정',
    ],
    featureIcon: <MessageSquare size={36} color="#03543F" />,
    featureIconBg: '#DEF7EC',
    featureBorderColor: '#5B7065',
    featureTitle: '부고장 자동 생성 & 공유',
    featureDesc: '입력한 정보로 부고장 프리뷰를 즉시 확인하고, 카카오톡으로 조문객에게 전송할 수 있습니다.',
    ctaLabel: '모바일 부고장 작성하기',
    ctaColor: '#5B7065',
    status: 'active',
    loginRequired: true,
  },

  'digital-estate': {
    key: 'digital-estate',
    tab: 'digital-estate',
    badgeLabel: '디지털 정산',
    badgeIcon: <PhoneHeartIcon size={20} color="#D4A359" />,
    badgeColor: '#D4A359',
    badgeBg: '#FFFFFF',
    titleLine1: '소중한 디지털 흔적에',
    titleLine2: '안전한 마침표를 찍습니다',
    highlightColor: '#D4A359',
    description:
      'SNS·클라우드 계정의 정산과 정리를 도와드립니다. 생전에 미리 위임해두면, 사후에는 유족이 계정마다 직접 해지 절차를 알아보지 않아도 됩니다.',
    bullets: [
      '네이버·카카오·구글 등 10개 주요 계정의 정산/해지 절차를 한 화면에서 확인',
      '가족관계증명서·사망진단서 등 증빙 서류를 먼저 업로드해 상속인 확인 절차 진행',
      '계정별 정산 신청 버튼으로 원하는 계정부터 순서대로 접수(실제 접수는 준비 중)',
    ],
    featureIcon: <PhoneHeartIcon size={36} color="#D4A359" />,
    featureIconBg: '#FEF3C7',
    featureBorderColor: '#D4A359',
    featureTitle: 'SNS · 클라우드 계정 정산',
    featureDesc: '유족이 계정마다 따로 알아보지 않도록, 정산 절차를 안내하고 진행 상황을 관리해 드립니다.',
    ctaLabel: '미리보기로 살펴보기',
    ctaColor: '#D4A359',
    status: 'preview',
    loginRequired: true,
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
      '연명의료 의향 메모 & 희망 장례 방식 사전 선택',
      '유족에게 남기는 메시지 및 비상 자산 정보 암호화 보관',
      '사망 인증 시 지정 수신인에게 알림톡으로 열람 키 자동 발송',
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

  // 08-19 9차(개발자 직접 지시) — 이전엔 domainSlides에서만 comingSoon(잠금)이었지만, 실제로는
  // DigitalEstatePage 서브탭('physical')에 예시 업체 데이터로 구현돼 있었다. 이제 PickupPage로
  // 분리 노출하면서 comingSoon → preview로 정정(제휴 업체는 여전히 없다는 사실은 페이지 내
  // "예시 데이터" 배너로 계속 고지).
  pickup: {
    key: 'pickup',
    tab: 'pickup',
    badgeLabel: '현물 유품 수거',
    badgeIcon: <Package size={20} color="#6C7A89" />,
    badgeColor: '#6C7A89',
    badgeBg: '#F1F5F9',
    titleLine1: '고인의 유품을',
    titleLine2: '정중하게 정리해 드립니다',
    highlightColor: '#6C7A89',
    description:
      '지역 기반 유품 정리·수거 전문 업체와 연결하는 서비스를 준비하고 있습니다. 화면 구성을 먼저 살펴보실 수 있으며, 실제 제휴 업체는 아직 없습니다.',
    bullets: [
      '지역별 유품 정리·특수청소 업체 목록(예시)',
      '정찰제 수거, 소각·기부 대행 안내',
      '무료 방문 견적 신청 폼(실제 접수는 준비 중)',
    ],
    featureIcon: <Package size={36} color="#6C7A89" />,
    featureIconBg: '#F1F5F9',
    featureBorderColor: '#94A3B8',
    featureTitle: '지역 기반 유품 정리 매칭',
    featureDesc: '유품 정찰제 수거, 소각 대행 및 특수 청소 업체 화면 구성을 미리 확인하실 수 있습니다.',
    ctaLabel: '유품 수거 미리보기',
    ctaColor: '#6C7A89',
    status: 'preview',
    loginRequired: true,
  },

  // 08-19 9차 — pickup과 동일한 사유로 comingSoon → preview 정정. DigitalEstatePage 서브탭
  // ('memorial')에 헌화·방명록·앨범 예시 기능이 이미 구현돼 있었다.
  memorial: {
    key: 'memorial',
    tab: 'memorial',
    badgeLabel: '디지털 추모관',
    badgeIcon: <Flower2 size={20} color="#6C7A89" />,
    badgeColor: '#6C7A89',
    badgeBg: '#F1F5F9',
    titleLine1: '소중한 기억을 나눌',
    titleLine2: '온라인 추모 공간입니다',
    highlightColor: '#6C7A89',
    description:
      '온라인 방명록과 추모 갤러리로 소중한 기억을 나눠보세요. 화면 구성을 먼저 살펴보실 수 있습니다.',
    bullets: [
      '온라인 국화꽃 헌화',
      '추모 방명록 작성 및 열람',
      '추모 사진 앨범 등록',
    ],
    featureIcon: <Flower2 size={36} color="#6C7A89" />,
    featureIconBg: '#F1F5F9',
    featureBorderColor: '#94A3B8',
    featureTitle: '온라인 헌화·방명록·앨범',
    featureDesc: '고인을 기리는 온라인 추모 공간에서 헌화, 방명록, 사진 앨범을 함께 나눠보세요.',
    ctaLabel: '디지털 추모관 미리보기',
    ctaColor: '#6C7A89',
    status: 'preview',
    loginRequired: true,
  },
};

// 박스①(생전 준비)·박스②(임종 및 사후 정리) 소개에 넣을 도메인 순서 — EntryBoxes.tsx의 박스
// 카드 요약 칩과 DomainOverviewPage(/prep·/bereaved)가 같은 배열을 공유한다(예전엔 EntryBoxes.tsx
// 안에 로컬로 있었는데, 오버레이 폐지 후 페이지 쪽도 같은 순서가 필요해져 여기로 옮겼다).
// 08-19 14차(개발자 직접 지시) — 디지털 정산은 사후 처리 도메인이라 생전 준비에서 제거.
export const box1Keys = ['counseling', 'ending-note'];
// 08-19 9차(개발자 직접 지시) — 순서 확정: 상중케어·장사시설·전문가상담·모바일부고장·
// 유품수거·디지털정산·디지털추모관.
export const box2Keys = ['care-guide', 'facility', 'counseling', 'obituary', 'pickup', 'digital-estate', 'memorial'];

// 00-23 §8.6-1 확정(2026-08-25) — 박스①②(EntryBoxes.tsx의 BoxHeader subtitle)가 정본 문구다.
// DomainOverviewPage(/prep·/bereaved)의 인트로도 새 문장을 짓지 않고 이 상수를 그대로 재사용한다
// (예전엔 페이지 쪽에 별도로 지어 넣은 문장이 있었는데, /bereaved의 "갑작스러운 이별 앞에서…"가
// 07-02 톤 위반이라 정정 지시를 받았다 — 한 곳만 고치면 되도록 문자열을 여기로 올렸다).
export const box1Intro = '미리 준비해 두면, 남은 가족이 덜 힘듭니다. 엔딩노트와 가족 지정, 상속 사전 상담까지 마음이 편안할 때 하나씩 남겨두세요.';
export const box2Intro = '지금 해야 할 일부터 순서대로 안내해 드립니다. 부고장 발송, 장사시설 매칭부터 22개 행정 체크리스트까지 이어집니다.';
