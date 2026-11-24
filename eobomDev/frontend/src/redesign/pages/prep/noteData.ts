// 10단계 묶음 10-2 — 엔딩노트 값 목록·저장 모양. 서버 `/api/ending-note`가 정본이고, 값 문자열은 지금 화면(`pages/EndingNotePage.tsx`)이 저장해 온 것과 같아야 한다(이미 저장된 글이 그대로 읽힌다).
// 화면 글은 "섹션"이 아니라 "항목"(00-44 §6-3-10).

export type NoteKind = 'life' | 'funeral' | 'memo-asset' | 'digital' | 'insurance' | 'memo-contacts' | 'memo-will' | 'donation';

export interface NoteSection {
  /** 서버 EndingNoteEntry.section 코드 */
  id: string;
  title: string;
  kind: NoteKind;
}

export const NOTE_SECTIONS: NoteSection[] = [
  { id: 'LIFE_SUPPORT', title: '연명의료 의향 메모', kind: 'life' },
  { id: 'FUNERAL', title: '장례 희망', kind: 'funeral' },
  { id: 'ASSET', title: '자산 소재 안내', kind: 'memo-asset' },
  { id: 'DIGITAL_ACCOUNTS', title: '디지털 계정 처리 의향', kind: 'digital' },
  { id: 'INSURANCE', title: '보험·연금 가입 사실', kind: 'insurance' },
  { id: 'CONTACTS', title: '중요 연락처·반려동물', kind: 'memo-contacts' },
  { id: 'WILL_LOCATION', title: '유언장 소재 안내', kind: 'memo-will' },
  { id: 'ORGAN_DONATION', title: '장기·조직 기증 의향', kind: 'donation' },
];

/** 가족 공개 시점(서버 값). 항목마다 고를 수 있는 시점이 다르다(서버 SECTION_ALLOWED_TIMINGS와 같은 목록). */
export type Timing = 'none' | 'IMMEDIATE' | 'POSTMORTEM';
export const TIMING_LABEL: Record<Timing, string> = {
  none: '비공개',
  IMMEDIATE: '지금부터 공개(생전)',
  POSTMORTEM: '사후에만 공개',
};
export const SECTION_ALLOWED_TIMINGS: Record<string, Timing[]> = {
  LIFE_SUPPORT: ['IMMEDIATE', 'POSTMORTEM'],
  FUNERAL: ['IMMEDIATE', 'POSTMORTEM'],
  ASSET: ['POSTMORTEM'],
  DIGITAL_ACCOUNTS: ['POSTMORTEM'],
  INSURANCE: ['POSTMORTEM'],
  CONTACTS: ['IMMEDIATE', 'POSTMORTEM'],
  WILL_LOCATION: ['POSTMORTEM'],
  ORGAN_DONATION: ['POSTMORTEM'],
};

export const RELATIONSHIP_LABEL: Record<string, string> = {
  SPOUSE: '배우자',
  CHILD: '자녀',
  PARENT: '부모',
  SIBLING: '형제자매',
  OTHER: '기타',
};

/** 서버가 내려주는 지정 가족(DECLINED 제외) */
export interface FamilyItem {
  id: string;
  name: string;
  relationship: string;
  relationshipEtc: string | null;
  /** DRAFT 초대 전 · PENDING/EXPIRED 수락 전 · ACCEPTED 연결됨 */
  status: string;
}
export interface GrantItem {
  id: string;
  designationId: string;
  section: string;
  timing: string;
  revokedAt: string | null;
  updatedAt: string;
}

export const relationLabel = (f: FamilyItem) =>
  f.relationship === 'OTHER' && f.relationshipEtc ? f.relationshipEtc : RELATIONSHIP_LABEL[f.relationship] || f.relationship;

// ── 고르기 선택지 — 값(value)은 서버에 저장되는 문자열, 글(label)은 화면에 보이는 것 ──
export interface Choice {
  value: string;
  label: string;
}
export const LIFE_SUPPORT_CHOICES: Choice[] = [
  { value: '연명의료 중단 희망', label: '임종 시 무의미한 연명의료 중단 희망' },
  { value: '적극적 치료 희망', label: '가능한 모든 의료 조치 시행 희망' },
  { value: '자녀 판단에 위임', label: '가족/자녀의 판단에 위임' },
];
export const REG_CHOICES: Choice[] = ['등록함', '등록하지 않음', '모름'].map((v) => ({ value: v, label: v }));
export const FUNERAL_CHOICES: Choice[] = [
  { value: '가족장 (수목장)', label: '가족장 후 자연 수목장 안치' },
  { value: '일반 장례 (봉안당)', label: '일반 3일장 진행' },
  { value: '조용한 검소장', label: '최소 인원 검소장' },
];
export const DIGITAL_CATEGORIES = ['이메일', 'SNS', '클라우드', '구독 서비스'] as const;
export const DIGITAL_CHOICES: Choice[] = [
  { value: '', label: '미정' },
  { value: 'DELETE', label: '삭제' },
  { value: 'MEMORIALIZE', label: '추모 전환' },
  { value: 'KEEP', label: '보존' },
];
export const INSURANCE_ITEMS = [
  { key: 'life', label: '생명보험' },
  { key: 'pension', label: '연금(개인·퇴직)' },
  { key: 'accident', label: '실손·상해보험' },
] as const;

export const NOT_A_WILL_NOTICE =
  '이 화면에서 만든 글은 유언장이 아닙니다. 자필증서 유언은 반드시 손으로 직접 쓰셔야 하며, 컴퓨터로 작성한 문서는 효력이 없습니다.';

// ── 값 모양 — 서버 항목 value와 1:1 ──
export interface NoteValues {
  lifeSupport: string;
  lifeSupportRegStatus: string;
  lifeSupportRegDate: string;
  funeralType: string;
  assetNote: string;
  digitalPrefs: Record<string, string>;
  subscriptionNote: string;
  insurance: Record<string, { checked: boolean; company: string }>;
  contactsNote: string;
  petCaretaker: string;
  willLocation: string;
  donationStatus: string;
  donationDate: string;
}

/** 한 번도 저장하지 않은 항목의 처음 값 — 지금 화면의 처음 값과 같다 */
export const EMPTY_VALUES: NoteValues = {
  lifeSupport: '연명의료 중단 희망',
  lifeSupportRegStatus: '모름',
  lifeSupportRegDate: '',
  funeralType: '가족장 (수목장)',
  assetNote: '',
  digitalPrefs: {},
  subscriptionNote: '',
  insurance: {},
  contactsNote: '',
  petCaretaker: '',
  willLocation: '',
  donationStatus: '모름',
  donationDate: '',
};

/** 서버에 보내는 항목 값 */
export function payloadOf(section: string, v: NoteValues): unknown {
  switch (section) {
    case 'LIFE_SUPPORT': return { lifeSupport: v.lifeSupport, lifeSupportRegStatus: v.lifeSupportRegStatus, lifeSupportRegDate: v.lifeSupportRegDate };
    case 'FUNERAL': return { funeralType: v.funeralType };
    case 'ASSET': return { assetNote: v.assetNote };
    case 'DIGITAL_ACCOUNTS': return { digitalPrefs: v.digitalPrefs, subscriptionNote: v.subscriptionNote };
    case 'INSURANCE': return { insurance: v.insurance };
    case 'CONTACTS': return { contactsNote: v.contactsNote, petCaretaker: v.petCaretaker };
    case 'WILL_LOCATION': return { willLocation: v.willLocation };
    case 'ORGAN_DONATION': return { donationStatus: v.donationStatus, donationDate: v.donationDate };
    default: return {};
  }
}

/** 저장된 항목 값(없으면 처음 값)으로 한 항목 분의 칸만 덮어쓴 새 값 */
export function applySaved(section: string, base: NoteValues, saved: any): NoteValues {
  const s = saved || {};
  const e = EMPTY_VALUES;
  switch (section) {
    case 'LIFE_SUPPORT':
      return { ...base, lifeSupport: s.lifeSupport ?? e.lifeSupport, lifeSupportRegStatus: s.lifeSupportRegStatus || e.lifeSupportRegStatus, lifeSupportRegDate: s.lifeSupportRegDate ?? '' };
    case 'FUNERAL':
      return { ...base, funeralType: s.funeralType ?? e.funeralType };
    case 'ASSET':
      return { ...base, assetNote: s.assetNote ?? '' };
    case 'DIGITAL_ACCOUNTS':
      return { ...base, digitalPrefs: s.digitalPrefs ?? {}, subscriptionNote: s.subscriptionNote ?? '' };
    case 'INSURANCE':
      return { ...base, insurance: s.insurance ?? {} };
    case 'CONTACTS':
      return { ...base, contactsNote: s.contactsNote ?? '', petCaretaker: s.petCaretaker ?? '' };
    case 'WILL_LOCATION':
      return { ...base, willLocation: s.willLocation ?? '' };
    case 'ORGAN_DONATION':
      return { ...base, donationStatus: s.donationStatus || e.donationStatus, donationDate: s.donationDate ?? '' };
    default:
      return base;
  }
}

/** 첫 줄만 — 자유 글 요약(한눈에 보기) */
export const firstLine = (t: string) => (t || '').trim().split('\n')[0];

/** 한눈에 보기 창의 값 요약 — 🔴 입력 중인 값이 아니라 마지막으로 저장한 값으로 그린다(2026-09-03 사람 지시) */
export function summarize(section: string, saved: any): string {
  const s = saved || {};
  switch (section) {
    case 'LIFE_SUPPORT': {
      const reg = s.lifeSupportRegStatus || '모름';
      const regText = `의향서 ${reg}${reg === '등록함' && s.lifeSupportRegDate ? ` (${s.lifeSupportRegDate})` : ''}`;
      return s.lifeSupport ? `${s.lifeSupport} · ${regText}` : '';
    }
    case 'FUNERAL':
      return s.funeralType || '';
    case 'ASSET':
      return firstLine(s.assetNote);
    case 'DIGITAL_ACCOUNTS': {
      const prefs: Record<string, string> = s.digitalPrefs || {};
      return DIGITAL_CATEGORIES.map((c) => `${c} ${DIGITAL_CHOICES.find((x) => x.value === (prefs[c] || ''))?.label ?? '미정'}`).join(' · ');
    }
    case 'INSURANCE': {
      const ins: Record<string, { checked: boolean; company: string }> = s.insurance || {};
      const picked = INSURANCE_ITEMS.filter((i) => ins[i.key]?.checked).map((i) => i.label + (ins[i.key]?.company ? `(${ins[i.key].company})` : ''));
      return picked.length > 0 ? picked.join(' · ') : '가입 표시 없음';
    }
    case 'CONTACTS': {
      const parts: string[] = [];
      const c = firstLine(s.contactsNote);
      if (c) parts.push(c);
      if ((s.petCaretaker || '').trim()) parts.push(`반려동물: ${s.petCaretaker.trim()}`);
      return parts.join(' · ');
    }
    case 'WILL_LOCATION':
      return (s.willLocation || '').trim();
    case 'ORGAN_DONATION': {
      const st = s.donationStatus || '모름';
      return `${st}${st === '등록함' && s.donationDate ? ` (${s.donationDate})` : ''}`;
    }
    default:
      return '';
  }
}

export const WILL_REQS = ['주소: 번지까지', '연월일', '성명: 본인 서명', '날인: 도장 또는 지장'];
