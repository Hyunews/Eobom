// 8단계 묶음 4 — 엔딩노트 예시 데이터(전부 가짜). 구간 8개 = 1단계 목록 "본문 섹션 8" · 화면 글은 "항목"(00-44 §6-3-10).

export type NoteKind = 'life' | 'funeral' | 'memo-asset' | 'digital' | 'insurance' | 'memo-contacts' | 'memo-will' | 'donation';

export interface NoteSection {
  id: string;
  title: string;
  kind: NoteKind;
}

export const NOTE_SECTIONS: NoteSection[] = [
  { id: 'life', title: '연명의료 의향 메모', kind: 'life' },
  { id: 'funeral', title: '장례 희망', kind: 'funeral' },
  { id: 'asset', title: '자산 소재 안내', kind: 'memo-asset' },
  { id: 'digital', title: '디지털 계정 처리 의향', kind: 'digital' },
  { id: 'insurance', title: '보험·연금 가입 사실', kind: 'insurance' },
  { id: 'contacts', title: '중요 연락처·반려동물', kind: 'memo-contacts' },
  { id: 'willloc', title: '유언장 소재 안내', kind: 'memo-will' },
  { id: 'donation', title: '장기·조직 기증 의향', kind: 'donation' },
];

export interface Family {
  id: string;
  name: string;
  relation: string;
  /** 초대 전 / 수락 전 / 연결됨 */
  link: 'draft' | 'pending' | 'accepted';
}

export const FAMILIES: Family[] = [
  { id: 'kim', name: '김OO', relation: '자녀', link: 'accepted' },
  { id: 'lee', name: '이OO', relation: '배우자', link: 'pending' },
  { id: 'park', name: '박OO', relation: '자녀', link: 'draft' },
];

export type Timing = 'none' | 'now' | 'after';
export const TIMING_LABEL: Record<Timing, string> = {
  none: '비공개',
  now: '지금부터 공개(생전)',
  after: '사후에만 공개',
};

export type NoteValues = Record<string, string | boolean>;

export const SELECT_OPTIONS: Record<string, string[]> = {
  lifeStop: ['선택하세요', '중단을 원함', '중단을 원하지 않음', '미정'],
  lifeReg: ['선택하세요', '등록함', '등록하지 않음'],
  funeral: ['선택하세요', '화장', '매장', '수목장', '미정'],
  email: ['미정', '삭제', '보존', '추모 전환'],
  sns: ['미정', '삭제', '보존', '추모 전환'],
  cloud: ['미정', '삭제', '보존'],
  subs: ['미정', '삭제', '해지 후 정리'],
  donation: ['선택하세요', '등록함', '등록하지 않음'],
};

/** 처음 예시 값 — 화면에서 "완료" 표시가 섞여 보이도록 일부만 채운다 */
export const INITIAL_VALUES: NoteValues = {
  lifeStop: '중단을 원함',
  lifeReg: '등록함',
  lifeDate: '',
  funeral: '화장',
  asset: '',
  email: '미정',
  sns: '미정',
  cloud: '미정',
  subs: '미정',
  insLife: true,
  insLifeCo: 'OO생명',
  insPension: true,
  insPensionCo: '국민연금공단',
  insMedical: false,
  contacts: '',
  willloc: '',
  donation: '선택하세요',
};

export const INITIAL_TIMINGS: Record<string, Record<string, Timing>> = {
  life: { kim: 'now', lee: 'none', park: 'now' },
  funeral: { kim: 'after', lee: 'none', park: 'none' },
  asset: { kim: 'after', lee: 'none', park: 'none' },
  digital: { kim: 'none', lee: 'none', park: 'none' },
  insurance: { kim: 'after', lee: 'none', park: 'none' },
  contacts: { kim: 'none', lee: 'none', park: 'none' },
  willloc: { kim: 'none', lee: 'none', park: 'none' },
  donation: { kim: 'none', lee: 'none', park: 'none' },
};

export const INITIAL_DONE: Record<string, boolean> = {
  life: true,
  funeral: true,
  asset: false,
  digital: false,
  insurance: true,
  contacts: false,
  willloc: false,
  donation: false,
};

/** 한눈에 보기 창의 값 요약 */
export function summarize(id: string, v: NoteValues): string {
  const pick = (...keys: string[]) => keys.map((k) => v[k]).filter((x) => typeof x === 'string' && x && x !== '선택하세요' && x !== '미정') as string[];
  switch (id) {
    case 'life':
      return pick('lifeStop', 'lifeReg').join(' · ');
    case 'funeral':
      return pick('funeral').join(' · ');
    case 'asset':
      return String(v.asset ?? '').trim().split('\n')[0];
    case 'digital':
      return pick('email', 'sns', 'cloud', 'subs').join(' · ');
    case 'insurance':
      return [v.insLife && '생명보험', v.insPension && '연금', v.insMedical && '실손·상해보험'].filter(Boolean).join(' · ');
    case 'contacts':
      return String(v.contacts ?? '').trim().split('\n')[0];
    case 'willloc':
      return String(v.willloc ?? '').trim().split('\n')[0];
    case 'donation':
      return pick('donation').join(' · ');
    default:
      return '';
  }
}

export const WILL_TEXT = `유언장

유언자 김OO은 다음과 같이 유언한다.

1. 서울특별시 OO구 OO로 12 소재 아파트는 배우자 이OO에게 준다.
2. 예금 전부는 자녀 김OO과 박OO에게 균등하게 준다.

2026년 10월 14일
주소: 서울특별시 OO구 OO로 12
성명: 김OO (인)`;

export const WILL_REQS = ['주소: 번지까지', '연월일', '성명: 본인 서명', '날인: 도장 또는 지장'];

/** 사진 읽기 결과 예시 */
export const OCR_PAGES = [
  '유언장\n유언자 김OO은 다음과 같이 유언한다.',
  '1. 서울특별시 OO구 OO로 12 소재 아파트는 배우자 이OO에게 준다.\n2. 예금 전부는 자녀 김OO과 박OO에게 균등하게 준다.',
  '2026년 10월 14일\n주소: 서울특별시 OO구 OO로 12\n성명: 김OO (인)',
];

export type FoundState = 'found' | 'missing' | 'unsure';
export interface OcrReq {
  id: string;
  name: string;
  state: FoundState;
  /** 사진 위 표시 위치(쪽 번호 1~3, 가로·세로 %) — 없으면 위치 없음 */
  hit?: { page: number; top: number; left: number; w: number; h: number };
}
export const OCR_REQS: OcrReq[] = [
  { id: 'date', name: '연월일', state: 'found', hit: { page: 3, top: 20, left: 12, w: 62, h: 8 } },
  { id: 'addr', name: '주소', state: 'found', hit: { page: 3, top: 34, left: 12, w: 76, h: 8 } },
  { id: 'name', name: '성명', state: 'found', hit: { page: 3, top: 48, left: 12, w: 50, h: 8 } },
  { id: 'seal', name: '날인', state: 'missing' },
  { id: 'hand', name: '전문 자서', state: 'unsure' },
];
export const FOUND_LABEL: Record<FoundState, string> = { found: '찾음', missing: '찾지 못함', unsure: '판단 못 함' };

export interface VaultBundle {
  id: string;
  label: string;
  pages: number | 'pdf';
}
export const VAULT: VaultBundle[] = [
  { id: 'b1', label: '2026.10.14 보관 · 3장', pages: 3 },
  { id: 'b2', label: '2026.10.02 보관 · PDF', pages: 'pdf' },
];
