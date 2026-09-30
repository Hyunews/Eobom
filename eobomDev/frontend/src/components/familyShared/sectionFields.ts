import { DIGITAL_ACCOUNT_CATEGORIES, DIGITAL_ACCOUNT_CHOICES, INSURANCE_ITEMS } from '../endingNote/constants';

// 00-41 §7 — 개봉 뒤 가족 화면이 섹션 본문을 그린다. 섹션별 저장 모양은 EndingNotePage.tsx sectionPayloads와 같다.
// 🔴 모르는 필드를 추측해 보여주지 않는다 — 아래 표에 없는 섹션·필드는 그리지 않는다(WILL_DRAFT 포함, 서버도 내려주지 않는다).
export interface EntryField {
  label: string;
  text: string;
}

export const entryFields = (section: string, value: unknown): EntryField[] => {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  const keep = (fields: EntryField[]) => fields.filter((f) => f.text);

  switch (section) {
    case 'LIFE_SUPPORT':
      return keep([{ label: '연명의료 의향', text: str(v.lifeSupport) }]);
    case 'FUNERAL':
      return keep([{ label: '장례 희망', text: str(v.funeralType) }]);
    case 'ASSET':
      return keep([{ label: '거래 중인 은행·증권사', text: str(v.assetNote) }]);
    case 'DIGITAL_ACCOUNTS': {
      const prefs = (v.digitalPrefs && typeof v.digitalPrefs === 'object' ? v.digitalPrefs : {}) as Record<string, string>;
      return keep([
        ...DIGITAL_ACCOUNT_CATEGORIES.map((c) => ({ label: c, text: prefs[c] ? DIGITAL_ACCOUNT_CHOICES[prefs[c]] ?? '' : '' })),
        { label: '구독 메모', text: str(v.subscriptionNote) },
      ]);
    }
    case 'INSURANCE': {
      const ins = (v.insurance && typeof v.insurance === 'object' ? v.insurance : {}) as Record<string, { checked?: boolean; company?: string }>;
      return INSURANCE_ITEMS.filter((item) => ins[item.key]?.checked).map((item) => ({
        label: item.label,
        text: str(ins[item.key]?.company) || '가입',
      }));
    }
    case 'CONTACTS':
      return keep([
        { label: '연락처 메모', text: str(v.contactsNote) },
        { label: '반려동물', text: str(v.petCaretaker) },
      ]);
    case 'WILL_LOCATION':
      return keep([{ label: '유언장 소재', text: str(v.willLocation) }]);
    case 'ORGAN_DONATION': {
      const status = str(v.donationStatus);
      const date = str(v.donationDate);
      return keep([{ label: '기증 의향', text: status && status === '등록함' && date ? `${status} (${date})` : status }]);
    }
    default:
      return [];
  }
};
