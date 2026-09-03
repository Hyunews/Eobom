import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollText,
  LogIn,
  Printer,
  Copy,
  Download,
  CheckCircle2,
  Circle,
  AlertTriangle,
  UserPlus,
  ListChecks,
} from 'lucide-react';
import { NoteKeyIcon } from '../components/MenuIcons';
import { apiFetch, ApiError } from '../lib/api';
import { getToken } from '../lib/storage';
import {
  DIGITAL_ACCOUNT_CATEGORIES,
  DIGITAL_ACCOUNT_CHOICES,
  INSURANCE_ITEMS,
  SECTIONS,
  TIMING_LABEL,
  NOT_A_WILL_NOTICE,
} from '../components/endingNote/constants';
import type { SaveState, FamilyItem, GrantItem, SummaryRow } from '../components/endingNote/types';
import { cardStyle, cardTitleStyle } from '../components/endingNote/styles';
import { AccordionSection, saveButtonLabel } from '../components/endingNote/AccordionSection';
import { SectionTimingControl } from '../components/endingNote/SectionTimingControl';
import { SummaryModal, summarizeFreeText } from '../components/endingNote/SummaryModal';

interface EndingNotePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  // 06-04 §10 Phase 2 #6 — 가족이 0명이면 MyPageFamilyDesignation 모달을 그대로 재사용한다
  // (FarewellMessagePage와 같은 진입점 패턴).
  onOpenFamilyDesignation?: () => void;
}

export const EndingNotePage: React.FC<EndingNotePageProps> = ({ currentUser, onOpenLogin, setActiveTab, onOpenFamilyDesignation }) => {
  const token = currentUser ? getToken('USER') : null;

  // §5 — 작성 시작 시점 동의(06-03). null이면 아직 동의 전 — 서버가 GET으로 내려주는 값이 정본이고,
  // 문구(policyNotice)도 서버가 내려준다(화면에 별도로 옮겨 적지 않는다 — 06-03 §5 정본이 한 곳).
  const [policyAgreedAt, setPolicyAgreedAt] = useState<string | null>(null);
  const [policyNotice, setPolicyNotice] = useState<string>('');
  const [noteLoaded, setNoteLoaded] = useState(false);

  // §6.2 — 섹션별 "작성 완료 여부"만. 서버가 저장 성공 시 갱신해 내려준다(클라이언트가 만들지 않는다).
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});
  const [savingState, setSavingState] = useState<Record<string, SaveState>>({});

  // A1 — 아코디언은 한 번에 하나만 펼친다.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const consentRef = useRef<HTMLDivElement>(null);

  // "한눈에 보기" 요약 모달. summaryTriggerRef는 닫을 때 포커스를 되돌리는 용도(접근성).
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryTriggerRef = useRef<HTMLButtonElement>(null);

  // §10 Phase 2 — 공개 시점 지정 대상(ACCEPTED만 — 대기중인 초대에는 권한을 줄 수 없다, 서버도
  // 같은 규칙으로 한 번 더 막는다)과 현재 권한 목록.
  const [family, setFamily] = useState<FamilyItem[]>([]);
  const [grants, setGrants] = useState<GrantItem[]>([]);

  const [lifeSupport, setLifeSupport] = useState<string>('연명의료 중단 희망');
  const [funeralType, setFuneralType] = useState<string>('가족장 (수목장)');
  const [assetNote, setAssetNote] = useState<string>('');
  const [digitalPrefs, setDigitalPrefs] = useState<Record<string, string>>({});
  const [insurance, setInsurance] = useState<Record<string, { checked: boolean; company: string }>>({});
  const [contactsNote, setContactsNote] = useState<string>('');
  const [petCaretaker, setPetCaretaker] = useState<string>('');
  const [willLocation, setWillLocation] = useState<string>('');
  const [donationStatus, setDonationStatus] = useState<string>('모름');
  const [donationDate, setDonationDate] = useState<string>('');

  // ⑨ 유언장 초안 — 06-04 §6.4-7 모델이 섰으니 저장을 배선한다(더 이상 "저장되지 않습니다"가 아니다).
  // 개발자 직접 수정 26.08.31
  const [draftText, setDraftText] = useState<string>(
    `- 주소 : \n- 날짜 : \n- 성명 : \n- 내용 : `
  );
  const [largeText, setLargeText] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // §10 Phase 1·2 — 조회. 서버가 policyAgreedAt·sectionState·문구·본문 전부를 내려준다(재로그인
  // 복원). 가족 목록·권한 목록도 같이 받아 섹션별 공개 시점 UI를 채운다.
  useEffect(() => {
    if (!currentUser || !token) {
      setNoteLoaded(true);
      return;
    }
    Promise.all([
      apiFetch<any>('/api/ending-note', 'USER'),
      apiFetch<FamilyItem[]>('/api/family-designations', 'USER'),
      apiFetch<GrantItem[]>('/api/ending-note/grants', 'USER'),
    ])
      .then(([d, familyList, grantList]) => {
        setPolicyAgreedAt(d.policyAgreedAt);
        setPolicyNotice(d.policyNotice || '');
        setSectionState(d.sectionState || {});

        const bySection: Record<string, any> = {};
        (d.entries || []).forEach((e: { section: string; value: unknown }) => {
          bySection[e.section] = e.value;
        });

        if (bySection.LIFE_SUPPORT?.lifeSupport) setLifeSupport(bySection.LIFE_SUPPORT.lifeSupport);
        if (bySection.FUNERAL?.funeralType) setFuneralType(bySection.FUNERAL.funeralType);
        if (bySection.ASSET) setAssetNote(bySection.ASSET.assetNote || '');
        if (bySection.DIGITAL_ACCOUNTS) setDigitalPrefs(bySection.DIGITAL_ACCOUNTS.digitalPrefs || {});
        if (bySection.INSURANCE) setInsurance(bySection.INSURANCE.insurance || {});
        if (bySection.CONTACTS) {
          setContactsNote(bySection.CONTACTS.contactsNote || '');
          setPetCaretaker(bySection.CONTACTS.petCaretaker || '');
        }
        if (bySection.WILL_LOCATION) setWillLocation(bySection.WILL_LOCATION.willLocation || '');
        if (bySection.ORGAN_DONATION) {
          setDonationStatus(bySection.ORGAN_DONATION.donationStatus || '모름');
          setDonationDate(bySection.ORGAN_DONATION.donationDate || '');
        }
        if (bySection.WILL_DRAFT) setDraftText(bySection.WILL_DRAFT.draftText || '');

        // §10 Phase 2 #6 — 권한을 줄 수 있는 대상은 ACCEPTED뿐(서버도 upsertEndingNoteGrant에서
        // 같은 규칙으로 다시 막는다). PENDING/DECLINED/EXPIRED를 섞으면 눌러도 되는 것처럼 보인다.
        if (Array.isArray(familyList)) {
          setFamily(familyList.filter((f) => f.status === 'ACCEPTED'));
        }
        if (Array.isArray(grantList)) {
          setGrants(grantList);
        }
      })
      .catch(() => { })
      .finally(() => setNoteLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleAgreePolicy = async () => {
    if (!token) return;
    try {
      const data = await apiFetch<{ policyAgreedAt: string }>('/api/ending-note/policy-agree', 'USER', { method: 'POST' });
      setPolicyAgreedAt(data.policyAgreedAt);
    } catch {
      // 실패해도 재시도 버튼이 곧 같은 요청이라 별도 에러 문구를 두지 않는다.
    }
  };

  // 섹션별로 아직 저장 버튼을 안 눌러 서버에 못 나간 "가족 공개 시점" 변경분 — designationId 기준.
  // useState가 아니라 ref인 이유: 이 값 자체가 화면에 그려지지 않는다(화면은 grants로 그린다) —
  // 저장 버튼 클릭 시점에만 참조하면 되므로 리렌더를 유발할 필요가 없다.
  const pendingGrantChangesRef = useRef<Record<string, Record<string, { timing: string | null; grantId?: string }>>>({});

  // §7.4 — timing은 서버가 정한다(클라이언트는 value만 보낸다). §6.2 — 응답의 sectionState로 갱신.
  // 🔴 2026-09-03 — 그 섹션에 대기 중인 "가족 공개 시점" 변경(pendingGrantChangesRef)도 같은
  // 저장 버튼으로 함께 내보낸다. 공개 시점만 별도로 즉시 저장되면 사람이 보기에 "다른 아코디언
  // 저장 버튼을 눌렀더니 반영됐다"처럼 인과관계가 헷갈린다 — 본문과 동일하게 저장 버튼이 기준.
  const saveSection = useCallback(
    async (section: string, value: unknown) => {
      if (!token) return;
      setSavingState((s) => ({ ...s, [section]: 'saving' }));
      try {
        const data = await apiFetch<{ sectionState: Record<string, boolean> }>(`/api/ending-note/sections/${section}`, 'USER', {
          method: 'PUT',
          body: JSON.stringify({ value }),
        });
        setSectionState(data.sectionState || {});

        const pending = pendingGrantChangesRef.current[section];
        if (pending) {
          await Promise.all(
            Object.entries(pending).map(async ([designationId, change]) => {
              if (change.timing === null) {
                if (!change.grantId) return; // 이미 비공개라 철회할 것이 없음
                await apiFetch(`/api/ending-note/grants/${change.grantId}/revoke`, 'USER', { method: 'PATCH' });
              } else {
                const updated = await apiFetch<GrantItem>('/api/ending-note/grants', 'USER', {
                  method: 'PUT',
                  body: JSON.stringify({ designationId, section, timing: change.timing }),
                });
                setGrants((prev) => prev.map((g) => (g.designationId === designationId && g.section === section ? updated : g)));
              }
            })
          );
          delete pendingGrantChangesRef.current[section];
        }

        setSavingState((s) => ({ ...s, [section]: 'saved' }));
        setTimeout(() => setSavingState((s) => ({ ...s, [section]: 'idle' })), 2000);
      } catch {
        setSavingState((s) => ({ ...s, [section]: 'error' }));
      }
    },
    [token]
  );

  // §10 Phase 2 — 공개 시점 변경. select는 즉시 반응하되(화면=grants 낙관적 갱신), 서버 전송은
  // 안 한다 — 그 섹션의 "저장" 버튼을 눌러야 나간다(pendingGrantChangesRef에 쌓아만 둠, 위 saveSection 참고).
  const handleGrantChange = useCallback(
    (section: string, designationId: string, timing: string | null, grantId?: string) => {
      setGrants((prev) => {
        if (timing === null) {
          if (!grantId) return prev; // 이미 비공개라 철회할 것이 없음
          return prev.map((g) => (g.id === grantId ? { ...g, revokedAt: new Date().toISOString() } : g));
        }
        const idx = prev.findIndex((g) => g.designationId === designationId && g.section === section);
        if (idx === -1) {
          return [...prev, { id: `temp-${designationId}-${section}`, designationId, section, timing, revokedAt: null, updatedAt: new Date().toISOString() }];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], timing, revokedAt: null };
        return next;
      });
      pendingGrantChangesRef.current[section] = {
        ...pendingGrantChangesRef.current[section],
        [designationId]: { timing, grantId },
      };
    },
    []
  );

  // 아코디언 헤더 클릭 — 동의 전이면 펼치지 않고 상단 동의 안내로 스크롤한다.
  const handleToggleSection = (code: string) => {
    if (!policyAgreedAt) {
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setExpandedSection((prev) => (prev === code ? null : code));
  };

  // A3 — 데스크톱 좌측 목차 클릭 시 해당 섹션을 펼치고 스크롤한다(닫지 않는다 — 목차는 항상 "열기").
  const openSectionFromToc = (code: string) => {
    if (!policyAgreedAt) {
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setExpandedSection(code);
    requestAnimationFrame(() => {
      document.getElementById(`ending-note-section-${code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const scrollToWillDraft = () => {
    document.getElementById('ending-note-section-WILL_DRAFT')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // "한눈에 보기" 모달 — ESC로 닫기, 열려 있는 동안 body 스크롤 잠금, 닫히면 트리거 버튼으로
  // 포커스 복귀(alert()/confirm() 등 브라우저 모달을 쓰지 않는 대신 이 정도는 직접 구현해야 한다).
  useEffect(() => {
    if (!summaryOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSummaryOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
      summaryTriggerRef.current?.focus();
    };
  }, [summaryOpen]);

  // 섹션의 현재 공개 시점 배지 — 철회되지 않은 grant 중 IMMEDIATE가 하나라도 있으면 "지금부터
  // 공개"(가장 이른 시점을 대표로 보여준다), 없고 POSTMORTEM만 있으면 "사후에만 공개", 아무
  // grant도 없으면 배지를 표시하지 않는다(가족별 세부 차이는 아코디언 안 SectionTimingControl에서 본다).
  const sectionTimingBadge = (code: string): string | null => {
    const active = grants.filter((g) => g.section === code && !g.revokedAt);
    if (active.length === 0) return null;
    return active.some((g) => g.timing === 'IMMEDIATE') ? TIMING_LABEL.IMMEDIATE : TIMING_LABEL.POSTMORTEM;
  };

  const summaryRows: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = SECTIONS.map((s) => {
      const completed = !!sectionState[s.code];
      let valueText = '';
      if (completed) {
        switch (s.code) {
          case 'LIFE_SUPPORT':
            valueText = lifeSupport;
            break;
          case 'FUNERAL':
            valueText = funeralType;
            break;
          case 'ASSET':
            valueText = summarizeFreeText(assetNote);
            break;
          case 'DIGITAL_ACCOUNTS':
            valueText = DIGITAL_ACCOUNT_CATEGORIES.map((c) => `${c} ${DIGITAL_ACCOUNT_CHOICES[digitalPrefs[c] || '']}`).join(' · ');
            break;
          case 'INSURANCE': {
            const picked = INSURANCE_ITEMS.filter((item) => insurance[item.key]?.checked).map(
              (item) => item.label + (insurance[item.key]?.company ? `(${insurance[item.key].company})` : '')
            );
            valueText = picked.length > 0 ? picked.join(' · ') : '가입 표시 없음';
            break;
          }
          case 'CONTACTS': {
            const parts: string[] = [];
            const c = summarizeFreeText(contactsNote);
            if (c) parts.push(c);
            if (petCaretaker.trim()) parts.push(`반려동물: ${petCaretaker.trim()}`);
            valueText = parts.join(' · ');
            break;
          }
          case 'WILL_LOCATION':
            valueText = willLocation.trim();
            break;
          case 'ORGAN_DONATION':
            valueText = `${donationStatus}${donationStatus === '등록함' && donationDate ? ` (${donationDate})` : ''}`;
            break;
        }
      }
      return { code: s.code, title: s.title, completed, valueText, timingBadge: sectionTimingBadge(s.code), isWillDraft: false };
    });
    rows.push({
      code: 'WILL_DRAFT',
      title: '유언장 초안',
      completed: !!sectionState.WILL_DRAFT,
      valueText: '',
      timingBadge: null,
      isWillDraft: true,
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sectionState, grants, lifeSupport, funeralType, assetNote, digitalPrefs, insurance,
    contactsNote, petCaretaker, willLocation, donationStatus, donationDate,
  ]);

  const handleSummaryRowSelect = (code: string) => {
    setSummaryOpen(false);
    if (code === 'WILL_DRAFT') {
      scrollToWillDraft();
    } else {
      openSectionFromToc(code);
    }
  };

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setCopyFeedback('복사되었습니다.');
    } catch {
      setCopyFeedback('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
    }
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleDownloadDraft = () => {
    const blob = new Blob([draftText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '유언장_초안.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintDraft = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const safeText = draftText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeNotice = NOT_A_WILL_NOTICE.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // 개발자 직접 지시(2026-08-31) — 자필증서 4대 요건 중 성명·날인은 화면이 대신 채울 수 없다
    // (위 체크리스트 §1137~1142와 동일 근거). 인쇄물 최하단에 옮겨 쓴 뒤 손으로 채울 성명·날인
    // 칸을 둔다 — 도장·지장 어느 쪽이든 찍을 수 있게 빈 네모칸(seal box)도 같이 준다.
    printWindow.document.write(
      `<html><head><title>유언장 초안</title><style>
        body { font-family: 'Malgun Gothic', sans-serif; font-size: ${largeText ? '22px' : '16px'}; line-height: 1.9; padding: 2.5rem; white-space: pre-wrap; }
        .notice { font-size: 13px; color: #92400E; border: 1px solid #FDE68A; background: #FEF3C7; border-radius: 8px; padding: 0.7rem 0.9rem; margin-bottom: 1.5rem; white-space: normal; }
        .signature-box { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #94A3B8; white-space: normal; }
        .signature-row { display: flex; align-items: flex-end; justify-content: flex-end; gap: 1rem; }
        .signature-label { font-weight: 700; }
        .signature-blank { display: inline-block; width: 220px; border-bottom: 1px solid #1F2937; height: 1.4em; }
        .signature-seal { display: inline-flex; align-items: center; justify-content: center; width: 2.4em; height: 2.4em; border: 1px solid #1F2937; font-size: 0.8em; }
      </style></head><body><div class="notice">${safeNotice}</div>${safeText}<div class="signature-box"><div class="signature-row"><span class="signature-label">성명</span><span class="signature-blank"></span><span class="signature-seal">(인)</span></div></div></body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const hasAddressHint = /\d+(-\d+)?\s*(번지|호)|(로|길)\s*\d+/.test(draftText);
  const hasDateHint = /\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/.test(draftText);

  // 00-35 §5.2 — 8개 아코디언 호출부의 본문과 저장 페이로드만 섹션 코드별로 모으고, 나머지
  // (expanded·completed·saveState·onToggle·onSave)는 SECTIONS 배열 순회로 유도한다.
  const sectionBodies: Record<string, React.ReactNode> = {
    LIFE_SUPPORT: (
      <>
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          ⚠️ 이 메모는 법적 효력이 없습니다. 법적 효력이 있는 「사전연명의료의향서」는 보건복지부
          지정 등록기관에서 본인이 직접 작성·등록해야 합니다(비용 없음).
        </div>
        <div className="form-group">
          <label className="form-label">연명의료 중단 의향</label>
          <select value={lifeSupport} onChange={(e) => setLifeSupport(e.target.value)} className="form-select">
            <option value="연명의료 중단 희망">임종 시 무의미한 연명의료 중단 희망</option>
            <option value="적극적 치료 희망">가능한 모든 의료 조치 시행 희망</option>
            <option value="자녀 판단에 위임">가족/자녀의 판단에 위임</option>
          </select>
        </div>
      </>
    ),
    FUNERAL: (
      <>
        <div className="form-group">
          <label className="form-label">희망하는 장례 방식</label>
          <select value={funeralType} onChange={(e) => setFuneralType(e.target.value)} className="form-select">
            <option value="가족장 (수목장)">가족장 후 자연 수목장 안치</option>
            <option value="일반 장례 (봉안당)">일반 3일장 후 봉안당 안치</option>
            <option value="조용한 검소장">최소 인원 검소장</option>
          </select>
        </div>
      </>
    ),
    ASSET: (
      <>
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          🔴 어느 은행·증권사에 거래가 있는지까지만 적어주세요. 계좌번호·잔액·비밀번호는 절대
          적지 마세요 — 유족은 이 정보 없이도 공적 창구(안심상속 원스톱서비스 등)로 조회할 수 있습니다.
        </div>
        <div className="form-group">
          <label className="form-label">거래 중인 은행·증권사</label>
          <textarea
            rows={3}
            value={assetNote}
            onChange={(e) => setAssetNote(e.target.value)}
            className="form-input"
            style={{ height: 'auto', padding: '1rem' }}
            placeholder="예: 국민은행에 주거래 계좌가 있고, 통장은 안방 서랍 두 번째 칸에 있습니다. 비밀번호는 적지 마세요 — 유족이 서류로 조회할 수 있습니다."
          />
        </div>
      </>
    ),
    DIGITAL_ACCOUNTS: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          자주 쓰시는 디지털 서비스를 사후에 어떻게 처리하고 싶으신지 미리 정해두세요. 실제 처리는
          디지털 정산(04) 화면에서 유족이 진행합니다.
        </p>
        {DIGITAL_ACCOUNT_CATEGORIES.map((category) => (
          <div key={category} className="form-group">
            <label className="form-label">{category}</label>
            <select
              value={digitalPrefs[category] || ''}
              onChange={(e) => setDigitalPrefs((prev) => ({ ...prev, [category]: e.target.value }))}
              className="form-select"
            >
              {Object.entries(DIGITAL_ACCOUNT_CHOICES).map(([value, label]) => (
                <option key={value || 'undecided'} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </>
    ),
    INSURANCE: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          유족이 존재를 몰라 청구를 못 하는 경우가 가장 흔한 손실입니다. 회사명만 남겨두세요 —
          증권번호·보장 내역은 받지 않습니다.
        </p>
        {INSURANCE_ITEMS.map((item) => (
          <div key={item.key} style={{ marginBottom: '0.9rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={!!insurance[item.key]?.checked}
                onChange={(e) =>
                  setInsurance((prev) => ({
                    ...prev,
                    [item.key]: { checked: e.target.checked, company: prev[item.key]?.company || '' },
                  }))
                }
              />
              {item.label} 가입
            </label>
            {insurance[item.key]?.checked && (
              <input
                type="text"
                value={insurance[item.key]?.company || ''}
                onChange={(e) =>
                  setInsurance((prev) => ({
                    ...prev,
                    [item.key]: { checked: true, company: e.target.value },
                  }))
                }
                className="form-input"
                placeholder="가입 회사명만 (예: OO생명)"
                style={{ marginLeft: '1.6rem', width: 'calc(100% - 1.6rem)' }}
              />
            )}
          </div>
        ))}
      </>
    ),
    CONTACTS: (
      <>
        <div className="form-group">
          <label className="form-label">부고를 꼭 알려야 할 사람</label>
          <textarea
            rows={3}
            value={contactsNote}
            onChange={(e) => setContactsNote(e.target.value)}
            className="form-input"
            style={{ height: 'auto', padding: '1rem' }}
            placeholder="예: 김OO - 대학 동창 - 010-0000-0000 (한 분씩 한 줄로 적어주세요)"
          />
        </div>
        <div className="form-group">
          <label className="form-label">반려동물을 부탁하고 싶은 분</label>
          <input
            type="text"
            value={petCaretaker}
            onChange={(e) => setPetCaretaker(e.target.value)}
            className="form-input"
            placeholder="예: 막내 여동생 김OO"
          />
        </div>
      </>
    ),
    WILL_LOCATION: (
      <>
        <div className="form-group">
          <label className="form-label">자필증서를 어디에 보관했는지 한 줄로</label>
          <input
            type="text"
            value={willLocation}
            onChange={(e) => setWillLocation(e.target.value)}
            className="form-input"
            placeholder="예: 안방 화장대 서랍 안쪽 서류 봉투"
          />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🔴 이어봄은 유언장 원본·사본을 보관하지 않습니다. 보관 장소만 남겨두세요.
        </p>
      </>
    ),
    ORGAN_DONATION: (
      <>
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
          ⚠️ 이어봄은 등록 여부와 등록일만 보관합니다. 실제 등록은 국립장기조직혈액관리원(사랑의
          장기기증운동본부 등 등록기관)에서 본인이 직접 해야 하며, 이어봄은 등록을 대행하지 않습니다.
          🔴 시신 기증(해부용 시신 기증)은 별도 제도입니다 — 이 항목과 섞지 마세요.
        </div>
        <div className="form-group">
          <label className="form-label">장기·조직 기증 등록 여부</label>
          <select value={donationStatus} onChange={(e) => setDonationStatus(e.target.value)} className="form-select">
            <option value="등록함">등록함</option>
            <option value="등록하지 않음">등록하지 않음</option>
            <option value="모름">모름</option>
          </select>
        </div>
        {donationStatus === '등록함' && (
          <div className="form-group">
            <label className="form-label">등록일 (선택)</label>
            <input type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} className="form-input" />
          </div>
        )}
      </>
    ),
  };

  // 🔴 00-35 §5.3 — useMemo로 감싸지 않는다. 값이 바뀌어도 최신 상태를 읽어야 하므로 매 렌더
  // 재생성이 맞다. 각 키의 값·형태는 이동 전 onSave가 넘기던 것과 완전히 같다.
  const sectionPayloads: Record<string, () => unknown> = {
    LIFE_SUPPORT: () => ({ lifeSupport }),
    FUNERAL: () => ({ funeralType }),
    ASSET: () => ({ assetNote }),
    DIGITAL_ACCOUNTS: () => ({ digitalPrefs }),
    INSURANCE: () => ({ insurance }),
    CONTACTS: () => ({ contactsNote, petCaretaker }),
    WILL_LOCATION: () => ({ willLocation }),
    ORGAN_DONATION: () => ({ donationStatus, donationDate }),
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      {!currentUser && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(247, 244, 239, 0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--border-radius)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', padding: '2.2rem 1.75rem', borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxWidth: '520px', border: '2px solid var(--primary-color)'
          }}>
            <div style={{
              width: '64px', height: '64px', backgroundColor: 'var(--secondary-color)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', fontSize: '2rem'
            }}>
              🔒
            </div>
            <h2 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              로그인이 필요한 회원 전용 서비스입니다
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              디지털 엔딩노트는 개인 사전 의향서 및 유족에게 남기는 메시지를 다루는 최고 보안 영역입니다. 로그인 후 안전하게 작성하고 보관하세요.
            </p>
            <button onClick={onOpenLogin} className="btn btn-point" style={{ width: '100%', height: '52px', fontSize: '1.05rem', fontWeight: 700 }}>
              <LogIn size={20} /> 로그인 / 회원가입 하러가기
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F1F5F9', color: 'var(--primary-color)', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <NoteKeyIcon size={18} color="var(--primary-color)" /> 남겨야 할 것을 빠짐없이
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <NoteKeyIcon color="var(--primary-color)" size={32} /> 디지털 엔딩노트
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          연명의료 의향 메모, 장례 희망 방식, 유언장 초안까지 표준화된 항목을 차근차근 채워두세요.
        </p>
      </div>

      <div style={{ filter: !currentUser ? 'blur(3px)' : 'none' }}>
        {/* §5 동의 안내 — 작성 시작 시점(가입 시점 아님)에 받는다. 이미 동의했으면 요약만 보여준다. */}
        <div id="ending-note-consent" ref={consentRef} style={{ ...cardStyle, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          {policyAgreedAt ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--point-color)" /> 열람 정책에 동의하셨습니다({new Date(policyAgreedAt).toLocaleDateString('ko-KR')}).
            </p>
          ) : (
            <>
              <h3 style={{ ...cardTitleStyle, marginBottom: '0.75rem' }}>
                <AlertTriangle color="var(--point-color)" size={20} /> 작성을 시작하기 전에 확인해 주세요
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: 1.7, marginBottom: '1rem' }}>
                {policyNotice || '이어봄은 회원님이 작성한 내용을 암호화하여 보관하며, 운영자는 내용을 열람하지 않습니다.'}
              </p>
              <button type="button" onClick={handleAgreePolicy} className="btn btn-point" disabled={!noteLoaded}>
                동의하고 시작하기
              </button>
            </>
          )}
        </div>

        {/* §10 Phase 2 #6 — 가족이 0명이면 섹션마다 반복해서 안내하지 않고 여기 한 번만 둔다. */}
        {policyAgreedAt && noteLoaded && family.length === 0 && (
          <div style={{ ...cardStyle, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <UserPlus size={18} color="var(--point-color)" style={{ flexShrink: 0 }} />
            <span>
              아직 수락된 가족이 없어 섹션을 생전에 공개할 대상을 지정할 수 없습니다.{' '}
              {onOpenFamilyDesignation && (
                <button
                  type="button"
                  onClick={onOpenFamilyDesignation}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                  가족 지정하기 →
                </button>
              )}
            </span>
          </div>
        )}

        <div className="ending-note-layout">
          {/* A3 — 데스크톱 좌측 섹션 목차 고정. 모바일은 CSS로 숨긴다(index.css). */}
          <aside className="ending-note-toc">
            <div style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>목차</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {SECTIONS.map((s) => (
                <button key={s.code} type="button" onClick={() => openSectionFromToc(s.code)} className="ending-note-toc-link">
                  {sectionState[s.code] ? <CheckCircle2 size={14} color="var(--point-color)" /> : <Circle size={14} color="var(--text-muted)" />}
                  <span>{s.title}</span>
                </button>
              ))}
              <button type="button" onClick={scrollToWillDraft} className="ending-note-toc-link">
                {sectionState.WILL_DRAFT ? <CheckCircle2 size={14} color="var(--point-color)" /> : <Circle size={14} color="var(--text-muted)" />}
                <span>유언장 초안</span>
              </button>
            </nav>
            {/* 사용자 지시(2026-08-28)로 목차 박스 최하단에 배치 — 데스크톱 전용(목차와 같은 노출
                범위). 구분선은 별도 wrapper에 둔다 — border-top+padding을 .btn 자체에 얹으면
                고정 높이(--min-touch-target, border-box)가 눌려 내부 콘텐츠가 위아래 비대칭으로
                밀린다. className="btn"이 곧 --min-touch-target(56px, 00-09 §2.3). */}
            <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                ref={summaryTriggerRef}
                onClick={() => setSummaryOpen(true)}
                className="btn"
                style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.9rem' }}
              >
                <ListChecks size={18} /> 한눈에 보기
              </button>
            </div>
          </aside>

          <div className="ending-note-content">
            {/* 00-35 §5.2 — 표시 순서는 SECTIONS 배열 순서(§5.3, 기존 DOM 순서 ①②④⑤⑥⑦⑧⑩와 동일). */}
            {SECTIONS.map((s) => (
              <AccordionSection
                key={s.code}
                meta={s}
                expanded={expandedSection === s.code}
                completed={!!sectionState[s.code]}
                saveState={savingState[s.code]}
                onToggle={() => handleToggleSection(s.code)}
                onSave={() => saveSection(s.code, sectionPayloads[s.code]())}
              >
                {sectionBodies[s.code]}
                <SectionTimingControl
                  section={s.code}
                  family={family}
                  grants={grants}
                  onChange={(designationId, timing, grantId) => handleGrantChange(s.code, designationId, timing, grantId)}
                />
              </AccordionSection>
            ))}
          </div>
        </div>

        {/* 06-05 §7.2 — 크로스 링크는 양방향. */}
        {setActiveTab && (
          <div
            style={{
              marginTop: '1.5rem', padding: '1rem 1.25rem', backgroundColor: 'var(--secondary-color)',
              borderRadius: 'var(--border-radius)', fontSize: '0.9rem', color: 'var(--primary-color)', textAlign: 'center',
            }}
          >
            가족 한 분 한 분께 하고 싶은 말이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('farewell-messages')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
            >
              유족 메시지 보관함 →
            </button>
          </div>
        )}
      </div>

      {/* ⑨ 유언장 초안 — A2: 아코디언에 넣지 않는다. §6.4-7 모델이 섰으니 이제 저장을 배선한다. */}
      <div id="ending-note-section-WILL_DRAFT" style={{ ...cardStyle, padding: '1.5rem', marginTop: '1.5rem', filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <h3 style={cardTitleStyle}>
          <ScrollText color="var(--point-color)" /> 유언장 초안
          {sectionState.WILL_DRAFT && <CheckCircle2 size={18} color="var(--point-color)" />}
        </h3>

        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', margin: '0.75rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontWeight: 700 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span>{NOT_A_WILL_NOTICE}</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          직접 입력한 내용을 자필증서 유언장을 손으로 옮겨 쓸 때 참고하는 초안으로 씁니다.
        </p>

        {/* §6.4-2·§7.1 — 본인 전용, 사후에도 유족에게 전달되지 않는다. 대신 보관함으로 안내한다. */}
        <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span>
            이 초안은 본인만 볼 수 있으며 유족에게 전달되지 않습니다.
            마음을 전하고 싶으시면 유족 메시지 보관함을 이용해 주세요.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">초안 (직접 입력)</label>
            <textarea
              rows={10}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="form-input"
              style={{ height: 'auto', padding: '1rem', fontSize: largeText ? '1.15rem' : '1rem', lineHeight: 1.7 }}
              placeholder="유언장 초안 내용을 직접 입력해 주세요."
            />
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
              자필증서 유언장의 4대 요건 — 옮겨 쓸 때 빠뜨리지 마세요
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasAddressHint ? 'var(--point-color)' : 'var(--text-muted)' }}>
                {hasAddressHint ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                주소 — 번지까지 정확히 {hasAddressHint ? '(초안에서 확인됨)' : '(빠졌을 수 있습니다. 번지까지 쓰셔야 합니다)'}
              </li>
              <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasDateHint ? 'var(--point-color)' : 'var(--text-muted)' }}>
                {hasDateHint ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                연월일 {hasDateHint ? '(초안에서 확인됨)' : '(빠졌을 수 있습니다. "2026년 8월 25일"처럼 정확히 쓰셔야 합니다)'}
              </li>
              <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Circle size={16} /> 성명 — 본인이 직접 확인하세요 (자동으로 확인되지 않습니다)
              </li>
              <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Circle size={16} /> 날인 — 옮겨 쓴 종이에 도장 또는 지장을 찍으세요 (화면에서는 확인할 수 없습니다)
              </li>
            </ul>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              ※ 위 표시는 참고용 안내일 뿐이며, 이어봄이 주소·연월일·성명을 대신 채워 넣지 않습니다.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.9rem', marginTop: '0.9rem' }}>
              이 초안을 보고 직접 손으로 옮겨 쓰십시오. 컴퓨터로 작성한 문서는 자필증서 유언장으로 인정되지 않습니다.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.2rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => saveSection('WILL_DRAFT', { draftText })}
            className="btn btn-point"
            disabled={savingState.WILL_DRAFT === 'saving' || !policyAgreedAt}
          >
            {saveButtonLabel(savingState.WILL_DRAFT)}
          </button>
          <button type="button" onClick={() => setLargeText((v) => !v)} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
            {largeText ? '보통 글씨로' : '큰 글씨로 보기'}
          </button>
          <button type="button" onClick={handlePrintDraft} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
            <Printer size={18} /> 인쇄하기
          </button>
          <button type="button" onClick={handleCopyDraft} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
            <Copy size={18} /> 텍스트 복사
          </button>
          <button type="button" onClick={handleDownloadDraft} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}>
            <Download size={18} /> .txt 내려받기
          </button>
        </div>
        {savingState.WILL_DRAFT === 'error' && (
          <p style={{ fontSize: '0.85rem', color: '#B91C1C', marginTop: '0.5rem' }}>저장에 실패했습니다. 다시 시도해 주세요.</p>
        )}
        {copyFeedback && (
          <p style={{ fontSize: '0.85rem', color: 'var(--point-color)', marginTop: '0.5rem' }}>{copyFeedback}</p>
        )}
      </div>

      {summaryOpen && (
        <SummaryModal rows={summaryRows} onClose={() => setSummaryOpen(false)} onSelectRow={handleSummaryRowSelect} />
      )}
    </div>
  );
};
