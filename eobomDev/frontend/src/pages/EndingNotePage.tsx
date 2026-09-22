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
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import { getToken } from '../lib/storage';
import { useIsMobile } from '../hooks/useIsMobile';
import { backdropCloseProps } from '../utils/backdropClose';
import {
  DIGITAL_ACCOUNT_CATEGORIES,
  DIGITAL_ACCOUNT_CHOICES,
  INSURANCE_ITEMS,
  SECTIONS,
  TIMING_LABEL,
  NOT_A_WILL_NOTICE,
} from '../components/endingNote/constants';
import type { SaveState, FamilyItem, GrantItem, SummaryRow } from '../components/endingNote/types';
import { AccordionSection, saveButtonLabel } from '../components/endingNote/AccordionSection';
import { SectionTimingControl } from '../components/endingNote/SectionTimingControl';
import { SummaryModal, summarizeFreeText } from '../components/endingNote/SummaryModal';
import '../styles/design-v2.css';

// 00-39 §9.1 그룹②(폼·입력) — obituary(§6.8·§6.8-1)의 필드 규칙을 그대로 물려받는다(§9.2 표
// "mypage는 같은 그룹이므로 obituary에서 나온 규칙을 적용만 한다"와 같은 원리). 다만 이 화면은
// 하나의 폼이 아니라 "8개 섹션이 각자 접고 펴고 저장되는" 새 형태라 그 틀(.v2-note-shell·
// .v2-accordion-*)만 새로 만들었다 — design-v2.css 참고, §6.7 클래스 등재는 Opus 몫.
// 구조(데스크톱 좌측 목차+아코디언, 모바일 목차 리스트+전체화면 리더, 00-38 §8.1-2)는 그대로
// 두고 토큰·클래스만 옮겼다(§8 #5와 같은 원칙).

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

  // A1 — 아코디언은 한 번에 하나만 펼친다. 00-38 §8.1-2 — 모바일에서는 같은 state를
  // "리더 모달로 연 섹션"으로 재해석한다(목차 리스트 + 그 섹션 하나만 전체화면 모달).
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const consentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // "한눈에 보기" 요약 모달. summaryTriggerRef는 닫을 때 포커스를 되돌리는 용도(접근성).
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryTriggerRef = useRef<HTMLButtonElement>(null);

  // §10 Phase 2 — 공개 시점 지정 대상(ACCEPTED만 — 대기중인 초대에는 권한을 줄 수 없다, 서버도
  // 같은 규칙으로 한 번 더 막는다)과 현재 권한 목록.
  const [family, setFamily] = useState<FamilyItem[]>([]);
  const [grants, setGrants] = useState<GrantItem[]>([]);
  // 서버에 실제로 저장된 grants 스냅샷 — "한눈에 보기"는 이걸로 그린다. grants는 저장 버튼을
  // 누르기 전 선택만 한 상태(대기 중)도 화면 반응을 위해 낙관적으로 섞여 있어서 그대로 쓰면 안 된다.
  const [savedGrants, setSavedGrants] = useState<GrantItem[]>([]);
  // 섹션별 마지막 저장 값 스냅샷 — "한눈에 보기"가 현재 입력 중(미저장)인 값이 아니라 이걸로
  // 그린다(2026-09-03 사람 지시). sectionPayloads()가 만드는 것과 동일한 모양으로 저장한다.
  const [savedSectionValues, setSavedSectionValues] = useState<Record<string, any>>({});

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
        setSavedSectionValues(bySection);

        // §10 Phase 2 #6 — 권한을 줄 수 있는 대상은 ACCEPTED뿐(서버도 upsertEndingNoteGrant에서
        // 같은 규칙으로 다시 막는다). PENDING/DECLINED/EXPIRED를 섞으면 눌러도 되는 것처럼 보인다.
        if (Array.isArray(familyList)) {
          setFamily(familyList.filter((f) => f.status === 'ACCEPTED'));
        }
        if (Array.isArray(grantList)) {
          setGrants(grantList);
          setSavedGrants(grantList);
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
        setSavedSectionValues((prev) => ({ ...prev, [section]: value }));

        const pending = pendingGrantChangesRef.current[section];
        if (pending) {
          await Promise.all(
            Object.entries(pending).map(async ([designationId, change]) => {
              if (change.timing === null) {
                if (!change.grantId) return; // 이미 비공개라 철회할 것이 없음
                await apiFetch(`/api/ending-note/grants/${change.grantId}/revoke`, 'USER', { method: 'PATCH' });
                setSavedGrants((prev) => prev.map((g) => (g.id === change.grantId ? { ...g, revokedAt: new Date().toISOString() } : g)));
              } else {
                const updated = await apiFetch<GrantItem>('/api/ending-note/grants', 'USER', {
                  method: 'PUT',
                  body: JSON.stringify({ designationId, section, timing: change.timing }),
                });
                setGrants((prev) => prev.map((g) => (g.designationId === designationId && g.section === section ? updated : g)));
                setSavedGrants((prev) => {
                  const idx = prev.findIndex((g) => g.designationId === designationId && g.section === section);
                  if (idx === -1) return [...prev, updated];
                  const next = [...prev];
                  next[idx] = updated;
                  return next;
                });
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

  // 00-38 §8.1-2 — 모바일 리더 모달. 같은 패턴(ESC로 닫기·body 스크롤 잠금)을 재사용한다.
  // 데스크톱은 expandedSection이 인라인 아코디언을 펼칠 뿐 모달이 아니므로 isMobile로 가드.
  useEffect(() => {
    if (!isMobile || !expandedSection) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedSection(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isMobile, expandedSection]);

  // 섹션의 현재 공개 시점 배지 — 철회되지 않은 grant 중 IMMEDIATE가 하나라도 있으면 "지금부터
  // 공개"(가장 이른 시점을 대표로 보여준다), 없고 POSTMORTEM만 있으면 "사후에만 공개", 아무
  // grant도 없으면 배지를 표시하지 않는다(가족별 세부 차이는 아코디언 안 SectionTimingControl에서 본다).
  // 🔴 2026-09-03 — grants가 아니라 savedGrants를 본다. grants는 저장 버튼을 누르기 전
  // 선택만 한 상태도 화면 반응을 위해 낙관적으로 섞여 있어서, "한눈에 보기"에 미저장 값이
  // 비칠 수 있다(사람 지시로 저장 버튼 기준으로 통일).
  const sectionTimingBadge = (code: string): string => {
    const active = savedGrants.filter((g) => g.section === code && !g.revokedAt);
    if (active.length === 0) return '비공개';
    return active.some((g) => g.timing === 'IMMEDIATE') ? TIMING_LABEL.IMMEDIATE : TIMING_LABEL.POSTMORTEM;
  };

  // 🔴 2026-09-03 — 각 case는 라이브 입력 상태(lifeSupport 등)가 아니라 savedSectionValues의
  // 마지막 저장 스냅샷을 읽는다. 모양은 sectionPayloads()가 만드는 것과 동일하다.
  const summaryRows: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = SECTIONS.map((s) => {
      const completed = !!sectionState[s.code];
      const saved = savedSectionValues[s.code] || {};
      let valueText = '';
      if (completed) {
        switch (s.code) {
          case 'LIFE_SUPPORT':
            valueText = saved.lifeSupport || '';
            break;
          case 'FUNERAL':
            valueText = saved.funeralType || '';
            break;
          case 'ASSET':
            valueText = summarizeFreeText(saved.assetNote || '');
            break;
          case 'DIGITAL_ACCOUNTS': {
            const savedPrefs: Record<string, string> = saved.digitalPrefs || {};
            valueText = DIGITAL_ACCOUNT_CATEGORIES.map((c) => `${c} ${DIGITAL_ACCOUNT_CHOICES[savedPrefs[c] || '']}`).join(' · ');
            break;
          }
          case 'INSURANCE': {
            const savedInsurance: Record<string, { checked: boolean; company: string }> = saved.insurance || {};
            const picked = INSURANCE_ITEMS.filter((item) => savedInsurance[item.key]?.checked).map(
              (item) => item.label + (savedInsurance[item.key]?.company ? `(${savedInsurance[item.key].company})` : '')
            );
            valueText = picked.length > 0 ? picked.join(' · ') : '가입 표시 없음';
            break;
          }
          case 'CONTACTS': {
            const parts: string[] = [];
            const c = summarizeFreeText(saved.contactsNote || '');
            if (c) parts.push(c);
            if ((saved.petCaretaker || '').trim()) parts.push(`반려동물: ${saved.petCaretaker.trim()}`);
            valueText = parts.join(' · ');
            break;
          }
          case 'WILL_LOCATION':
            valueText = (saved.willLocation || '').trim();
            break;
          case 'ORGAN_DONATION': {
            const status = saved.donationStatus || '모름';
            valueText = `${status}${status === '등록함' && saved.donationDate ? ` (${saved.donationDate})` : ''}`;
            break;
          }
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
  }, [sectionState, savedGrants, savedSectionValues]);

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
    const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    // 개발자 직접 지시(2026-08-31) — 자필증서 4대 요건 중 성명·날인은 화면이 대신 채울 수 없다
    // (위 체크리스트 §1137~1142와 동일 근거). 인쇄물 최하단에 옮겨 쓴 뒤 손으로 채울 성명·날인
    // 칸을 둔다 — 도장·지장 어느 쪽이든 찍을 수 있게 빈 네모칸(seal box)도 같이 준다.
    // 🔴 2026-09-03 — @page margin:0으로 브라우저가 자동으로 붙이는 인쇄 머리글/바닥글(날짜·문서
    // 제목·URL·쪽수, 브라우저 설정에 따라 위치가 제각각)을 없애고, 날짜·제목을 직접 그린다
    // (제목 위치가 "어색하다"는 신고 — 그게 우리 HTML이 아니라 브라우저 기본 헤더였다).
    printWindow.document.write(
      `<html><head><title>유언장 초안</title><style>
        @page { margin: 0; }
        body { font-family: 'Malgun Gothic', sans-serif; font-size: ${largeText ? '22px' : '16px'}; line-height: 1.9; padding: 2.5rem; white-space: pre-wrap; }
        .print-header { margin-bottom: 1.5rem; white-space: normal; }
        .print-date { font-size: 13px; color: #6C7A89; margin-bottom: 0.3rem; }
        .print-title { font-size: 22px; font-weight: 700; color: #1F2937; margin: 0; }
        .notice { font-size: 13px; color: #92400E; border: 1px solid #FEF3C7; background: #FEF3C7; border-radius: 8px; padding: var(--fs-caption) 0.9rem; margin-bottom: 1.5rem; white-space: normal; }
        .signature-box { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #94A3B8; white-space: normal; }
        .signature-row { display: flex; align-items: flex-end; justify-content: flex-end; gap: 1rem; }
        .signature-label { font-weight: 700; }
        .signature-blank { display: inline-block; width: 220px; border-bottom: 1px solid #1F2937; height: 1.4em; }
        .signature-seal { display: inline-flex; align-items: center; justify-content: center; width: 2.4em; height: 2.4em; border: 1px solid #1F2937; font-size: 0.8em; }
      </style></head><body><div class="print-header"><div class="print-date">${todayStr}</div><h1 class="print-title">유언장 초안</h1></div><div class="notice">${safeNotice}</div>${safeText}<div class="signature-box"><div class="signature-row"><span class="signature-label">성명</span><span class="signature-blank"></span><span class="signature-seal">(인)</span></div></div></body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };


  // 00-35 §5.2 — 8개 아코디언 호출부의 본문과 저장 페이로드만 섹션 코드별로 모으고, 나머지
  // (expanded·completed·saveState·onToggle·onSave)는 SECTIONS 배열 순회로 유도한다.
  const sectionBodies: Record<string, React.ReactNode> = {
    LIFE_SUPPORT: (
      <>
        <p className="v2-notice-warn">
          ⚠️ 이 메모는 법적 효력이 없습니다. 법적 효력이 있는 「사전연명의료의향서」는 보건복지부
          지정 등록기관에서 본인이 직접 작성·등록해야 합니다(비용 없음).
        </p>
        <div className="v2-field">
          <label htmlFor="en-life-support">연명의료 중단 의향</label>
          <select id="en-life-support" value={lifeSupport} onChange={(e) => setLifeSupport(e.target.value)} className="v2-select">
            <option value="연명의료 중단 희망">임종 시 무의미한 연명의료 중단 희망</option>
            <option value="적극적 치료 희망">가능한 모든 의료 조치 시행 희망</option>
            <option value="자녀 판단에 위임">가족/자녀의 판단에 위임</option>
          </select>
        </div>
      </>
    ),
    FUNERAL: (
      <div className="v2-field">
        <label htmlFor="en-funeral-type">희망하는 장례 방식</label>
        <select id="en-funeral-type" value={funeralType} onChange={(e) => setFuneralType(e.target.value)} className="v2-select">
          <option value="가족장 (수목장)">가족장 후 자연 수목장 안치</option>
          <option value="일반 장례 (봉안당)">일반 3일장 진행</option>
          <option value="조용한 검소장">최소 인원 검소장</option>
        </select>
      </div>
    ),
    ASSET: (
      <>
        <p className="v2-notice-warn">
          🔴 어느 은행·증권사에 거래가 있는지까지만 적어주세요. 계좌번호·잔액·비밀번호는 절대
          적지 마세요 — 유족은 이 정보 없이도 공적 창구(안심상속 원스톱서비스 등)로 조회할 수 있습니다.
        </p>
        <div className="v2-field">
          <label htmlFor="en-asset-note">거래 중인 은행·증권사</label>
          <textarea
            id="en-asset-note"
            rows={3}
            value={assetNote}
            onChange={(e) => setAssetNote(e.target.value)}
            className="v2-input"
            style={{ height: 'auto', padding: '12px 14px' }}
            placeholder="예: 국민은행에 주거래 계좌가 있고, 통장은 안방 서랍 두 번째 칸에 있습니다. 비밀번호는 적지 마세요 — 유족이 서류로 조회할 수 있습니다."
          />
        </div>
      </>
    ),
    DIGITAL_ACCOUNTS: (
      <>
        <p className="v2-notice">
          자주 쓰시는 디지털 서비스를 사후에 어떻게 처리하고 싶으신지 미리 정해두세요. 실제 처리는
          디지털 정산(04) 화면에서 유족이 진행합니다.
        </p>
        {DIGITAL_ACCOUNT_CATEGORIES.map((category) => (
          <div key={category} className="v2-field">
            <label htmlFor={`en-digital-${category}`}>{category}</label>
            <select
              id={`en-digital-${category}`}
              value={digitalPrefs[category] || ''}
              onChange={(e) => setDigitalPrefs((prev) => ({ ...prev, [category]: e.target.value }))}
              className="v2-select"
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
        <p className="v2-notice">
          유족이 존재를 몰라 청구를 못 하는 경우가 가장 흔한 손실입니다. 회사명만 남겨두세요 —
          증권번호·보장 내역은 받지 않습니다.
        </p>
        {INSURANCE_ITEMS.map((item) => (
          <div key={item.key} style={{ marginBottom: '14px' }}>
            <label className="v2-check" htmlFor={`en-insurance-${item.key}`} style={{ padding: '0 0 6px' }}>
              <input
                id={`en-insurance-${item.key}`}
                type="checkbox"
                checked={!!insurance[item.key]?.checked}
                onChange={(e) =>
                  setInsurance((prev) => ({
                    ...prev,
                    [item.key]: { checked: e.target.checked, company: prev[item.key]?.company || '' },
                  }))
                }
              />
              <span>{item.label} 가입</span>
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
                className="v2-input"
                placeholder="가입 회사명만 (예: OO생명)"
                style={{ marginLeft: '32px', width: 'calc(100% - 32px)' }}
              />
            )}
          </div>
        ))}
      </>
    ),
    CONTACTS: (
      <>
        <div className="v2-field">
          <label htmlFor="en-contacts-note">부고를 꼭 알려야 할 사람</label>
          <textarea
            id="en-contacts-note"
            rows={3}
            value={contactsNote}
            onChange={(e) => setContactsNote(e.target.value)}
            className="v2-input"
            style={{ height: 'auto', padding: '12px 14px' }}
            placeholder="예: 김OO - 대학 동창 - 010-0000-0000 (한 분씩 한 줄로 적어주세요)"
          />
        </div>
        <div className="v2-field">
          <label htmlFor="en-pet-caretaker">반려동물을 부탁하고 싶은 분</label>
          <input
            id="en-pet-caretaker"
            type="text"
            value={petCaretaker}
            onChange={(e) => setPetCaretaker(e.target.value)}
            className="v2-input"
            placeholder="예: 막내 여동생 김OO"
          />
        </div>
      </>
    ),
    WILL_LOCATION: (
      <>
        <div className="v2-field">
          <label htmlFor="en-will-location">자필증서를 어디에 보관했는지 한 줄로</label>
          <input
            id="en-will-location"
            type="text"
            value={willLocation}
            onChange={(e) => setWillLocation(e.target.value)}
            className="v2-input"
            placeholder="예: 안방 화장대 서랍 안쪽 서류 봉투"
          />
          <span className="v2-field-hint">🔴 이어봄은 유언장 원본·사본을 보관하지 않습니다. 보관 장소만 남겨두세요.</span>
        </div>
      </>
    ),
    ORGAN_DONATION: (
      <>
        <p className="v2-notice-warn">
          ⚠️ 이어봄은 등록 여부와 등록일만 보관합니다. 실제 등록은 국립장기조직혈액관리원(사랑의
          장기기증운동본부 등 등록기관)에서 본인이 직접 해야 하며, 이어봄은 등록을 대행하지 않습니다.
          🔴 시신 기증(해부용 시신 기증)은 별도 제도입니다 — 이 항목과 섞지 마세요.
        </p>
        <div className="v2-field">
          <label htmlFor="en-donation-status">장기·조직 기증 등록 여부</label>
          <select id="en-donation-status" value={donationStatus} onChange={(e) => setDonationStatus(e.target.value)} className="v2-select">
            <option value="등록함">등록함</option>
            <option value="등록하지 않음">등록하지 않음</option>
            <option value="모름">모름</option>
          </select>
        </div>
        {donationStatus === '등록함' && (
          <div className="v2-field">
            <label htmlFor="en-donation-date">등록일 (선택)</label>
            <input id="en-donation-date" type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} className="v2-input" />
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

  // "취소" 버튼 — 편집 중인 값과 대기 중인 공개 시점 변경을 마지막 저장 스냅샷으로 되돌린다.
  // 각 case의 기본값은 useState 초기값과 동일하다 — 한 번도 저장된 적 없는 섹션을 취소하면
  // 처음 화면을 열었을 때와 같은 값으로 돌아가야 하기 때문(초기 로드도 같은 fallback을 쓴다).
  const resetSection = (section: string) => {
    const saved: any = savedSectionValues[section] || {};
    switch (section) {
      case 'LIFE_SUPPORT':
        setLifeSupport(saved.lifeSupport ?? '연명의료 중단 희망');
        break;
      case 'FUNERAL':
        setFuneralType(saved.funeralType ?? '가족장 (수목장)');
        break;
      case 'ASSET':
        setAssetNote(saved.assetNote ?? '');
        break;
      case 'DIGITAL_ACCOUNTS':
        setDigitalPrefs(saved.digitalPrefs ?? {});
        break;
      case 'INSURANCE':
        setInsurance(saved.insurance ?? {});
        break;
      case 'CONTACTS':
        setContactsNote(saved.contactsNote ?? '');
        setPetCaretaker(saved.petCaretaker ?? '');
        break;
      case 'WILL_LOCATION':
        setWillLocation(saved.willLocation ?? '');
        break;
      case 'ORGAN_DONATION':
        setDonationStatus(saved.donationStatus ?? '모름');
        setDonationDate(saved.donationDate ?? '');
        break;
    }
    delete pendingGrantChangesRef.current[section];
    setGrants((prev) => [...prev.filter((g) => g.section !== section), ...savedGrants.filter((g) => g.section === section)]);
  };

  return (
    <div className="v2-page" style={{ position: 'relative' }}>
      {!currentUser && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(247, 244, 239, 0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center',
        }}>
          <div style={{
            backgroundColor: 'var(--v2-bg)', padding: '40px 28px', borderRadius: '4px',
            boxShadow: 'var(--v2-modal-shadow)', maxWidth: '520px', border: '2px solid var(--v2-text-main)'
          }}>
            <p style={{ fontSize: '2rem', margin: '0 0 16px' }}>🔒</p>
            <h2 style={{ color: 'var(--v2-text-main)', fontSize: 'var(--v2-fs-page-title)', marginBottom: '12px', fontWeight: 700 }}>
              로그인이 필요한 회원 전용 서비스입니다
            </h2>
            <p style={{ color: 'var(--v2-text-muted)', fontSize: 'var(--v2-fs-body)', lineHeight: 1.6, marginBottom: '24px' }}>
              디지털 엔딩노트는 개인 사전 의향서 및 유족에게 남기는 메시지를 다루는 최고 보안 영역입니다. 로그인 후 안전하게 작성하고 보관하세요.
            </p>
            <button onClick={onOpenLogin} className="v2-btn-primary" style={{ width: '100%', height: '52px' }}>
              <LogIn size={20} /> 로그인 / 회원가입 하러가기
            </button>
          </div>
        </div>
      )}

      <div className="v2-page-head" style={{ filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <h1 className="v2-page-title">디지털 엔딩노트</h1>
        <p className="v2-page-subtitle">연명의료 의향 메모, 장례 희망 방식, 유언장 초안까지 표준화된 항목을 차근차근 채워두세요.</p>
      </div>

      <div style={{ filter: !currentUser ? 'blur(3px)' : 'none' }}>
        {/* §5 동의 안내 — 작성 시작 시점(가입 시점 아님)에 받는다. 이미 동의했으면 요약만 보여준다. */}
        <div id="ending-note-consent" ref={consentRef} className="v2-content" style={{ marginBottom: '32px' }}>
          {policyAgreedAt ? (
            <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--v2-point)" /> 열람 정책에 동의하셨습니다({new Date(policyAgreedAt).toLocaleDateString('ko-KR')}).
            </p>
          ) : (
            <>
              <h3 style={{ fontSize: 'var(--v2-fs-item-title)', fontWeight: 700, color: 'var(--v2-text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
                <AlertTriangle color="var(--v2-point)" size={20} /> 작성을 시작하기 전에 확인해 주세요
              </h3>
              <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-main)', whiteSpace: 'pre-line', lineHeight: 1.7, marginBottom: '16px' }}>
                {/* 2026-09-11 사람 지시 — 줄글 축약. 🟡 서버 policyNotice(06-03 §5 정본)가
                    아직 이 축약본으로 안 바뀌었으면 로드 전 짧은 순간만 보이는 폴백이다 —
                    서버 문구 자체를 바꾸는 건 이번 프론트엔드 작업 범위 밖(백엔드/06-03 소관). */}
                {policyNotice || '작성 내용은 암호화 보관되며, 운영자는 열람하지 않습니다.'}
              </p>
              <button type="button" onClick={handleAgreePolicy} className="v2-btn-primary" disabled={!noteLoaded}>
                동의하고 시작하기
              </button>
            </>
          )}
        </div>

        {/* §10 Phase 2 #6 — 가족이 0명이면 섹션마다 반복해서 안내하지 않고 여기 한 번만 둔다. */}
        {policyAgreedAt && noteLoaded && family.length === 0 && (
          <div className="v2-content" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-main)' }}>
            <UserPlus size={18} color="var(--v2-point)" style={{ flexShrink: 0 }} />
            <span>
              아직 수락된 가족이 없어 섹션을 생전에 공개할 대상을 지정할 수 없습니다.{' '}
              {onOpenFamilyDesignation && (
                <button
                  type="button"
                  onClick={onOpenFamilyDesignation}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--v2-point)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                  가족 지정하기 →
                </button>
              )}
            </span>
          </div>
        )}

        <div className="v2-note-shell">
          {/* A3 — 데스크톱 좌측 섹션 목차 고정. 모바일은 CSS로 숨긴다(design-v2.css). */}
          <aside className="v2-note-toc">
            <div className="v2-note-toc-label">목차</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {SECTIONS.map((s) => (
                <button key={s.code} type="button" onClick={() => openSectionFromToc(s.code)} className="v2-note-toc-link">
                  {sectionState[s.code] ? <CheckCircle2 size={14} color="var(--v2-point)" /> : <Circle size={14} color="var(--v2-text-faint)" />}
                  <span>{s.title}</span>
                </button>
              ))}
              <button type="button" onClick={scrollToWillDraft} className="v2-note-toc-link">
                {sectionState.WILL_DRAFT ? <CheckCircle2 size={14} color="var(--v2-point)" /> : <Circle size={14} color="var(--v2-text-faint)" />}
                <span>유언장 초안</span>
              </button>
            </nav>
            {/* 사용자 지시(2026-08-28)로 목차 박스 최하단에 배치 — 데스크톱 전용(목차와 같은 노출 범위). */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--v2-divider)' }}>
              <button
                type="button"
                ref={summaryTriggerRef}
                onClick={() => setSummaryOpen(true)}
                className="v2-btn-outline"
                style={{ width: '100%' }}
              >
                <ListChecks size={18} /> 한눈에 보기
              </button>
            </div>
          </aside>

          <div className="v2-note-main">
            {/* 00-35 §5.2 — 표시 순서는 SECTIONS 배열 순서(§5.3, 기존 DOM 순서 ①②④⑤⑥⑦⑧⑩와 동일).
                00-38 §8.1-2 — 모바일은 8개 아코디언 동시 스택 대신 목차 리스트(제목+완료 배지만).
                탭하면 그 섹션 하나만 아래 리더 모달로 연다(같은 expandedSection state 재사용). */}
            {isMobile ? (
              // 🔄 2026-09-11 사람 지시 — 모바일 진입 버튼을 한 번 추가했으나("한눈에 보기"가
              // 데스크톱 목차 안에만 있어 모바일에 통로가 없던 문제), 재확인 후 "모바일에는
              // 아예 없는 게 낫다"로 최종 결정. 버튼을 되돌리고 모바일 접근 없음을 의도된
              // 상태로 확정한다 — 되돌린 이력만 남긴다.
              <div>
                {SECTIONS.map((s) => (
                  <div key={s.code} className="v2-list-row">
                    <button type="button" className="v2-list-main" onClick={() => handleToggleSection(s.code)}>
                      {sectionState[s.code] ? <CheckCircle2 size={16} color="var(--v2-point)" /> : <Circle size={16} color="var(--v2-text-faint)" />}
                      <span className="v2-list-title">{s.title}</span>
                    </button>
                    <span className="v2-list-meta">{sectionState[s.code] ? '완료' : '미작성'}</span>
                    <ChevronRight size={16} className="v2-row-chevron" />
                  </div>
                ))}
              </div>
            ) : (
              SECTIONS.map((s) => (
                <AccordionSection
                  key={s.code}
                  meta={s}
                  expanded={expandedSection === s.code}
                  completed={!!sectionState[s.code]}
                  saveState={savingState[s.code]}
                  onToggle={() => handleToggleSection(s.code)}
                  onSave={() => saveSection(s.code, sectionPayloads[s.code]())}
                  onReset={() => resetSection(s.code)}
                >
                  {sectionBodies[s.code]}
                  <SectionTimingControl
                    section={s.code}
                    family={family}
                    grants={grants}
                    onChange={(designationId, timing, grantId) => handleGrantChange(s.code, designationId, timing, grantId)}
                  />
                </AccordionSection>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 00-38 §8.1-2 — 모바일 포커스 리더. 그 섹션 하나만, 저장 버튼 하단 고정. expandedSection은
          위 목차 리스트와 공유하는 같은 state(데스크톱에서는 아코디언 펼침에 쓰인다). 전용 오버레이
          대신 기존 `.v2-modal-overlay`+`.v2-modal.is-scroll`을 재사용한다 — title 고정+body 스크롤
          구조가 이미 이 모양이고, 모바일에서는 CSS가 자동으로 거의 전체화면 바텀시트로 바꾼다. */}
      {isMobile && expandedSection && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(() => setExpandedSection(null))}>
          <div className="v2-modal is-scroll" onClick={(e) => e.stopPropagation()}>
            <h3 className="v2-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button" onClick={() => setExpandedSection(null)} aria-label="목록으로" style={{ background: 'none', border: 'none', padding: 0, display: 'flex', color: 'var(--v2-text-main)', cursor: 'pointer' }}>
                <ChevronLeft size={22} />
              </button>
              {SECTIONS.find((s) => s.code === expandedSection)?.title}
            </h3>
            <div className="v2-modal-body">
              {sectionBodies[expandedSection]}
              <SectionTimingControl
                section={expandedSection}
                family={family}
                grants={grants}
                onChange={(designationId, timing, grantId) => handleGrantChange(expandedSection, designationId, timing, grantId)}
              />
            </div>
            <div className="v2-modal-actions">
              <button
                type="button"
                onClick={() => saveSection(expandedSection, sectionPayloads[expandedSection]())}
                className="v2-btn-primary"
                disabled={savingState[expandedSection] === 'saving'}
                aria-busy={savingState[expandedSection] === 'saving'}
                style={{ flex: 1 }}
              >
                {saveButtonLabel(savingState[expandedSection])}
              </button>
              <button
                type="button"
                // 🔴 2026-09-11 사람 리포트 — 데스크톱 아코디언의 "취소"는 값만 되돌리고 안
                // 접히지만(AccordionSection.tsx), 모바일은 화면 전체를 덮는 시트라 안 닫히면
                // "취소가 반응이 없다"로 느껴진다. 여기만 리더 시트도 함께 닫는다(사람 지시).
                onClick={() => {
                  resetSection(expandedSection);
                  setExpandedSection(null);
                }}
                disabled={savingState[expandedSection] === 'saving'}
                className="v2-btn-outline"
                style={{ flex: 1 }}
              >
                취소
              </button>
            </div>
            {savingState[expandedSection] === 'saved' && (
              <p style={{ textAlign: 'center', fontSize: 'var(--v2-fs-label)', color: 'var(--v2-point)', margin: '8px 0 0' }}>저장되었습니다.</p>
            )}
            {savingState[expandedSection] === 'error' && (
              <p style={{ textAlign: 'center', fontSize: 'var(--v2-fs-label)', color: 'var(--state-danger-fg)', margin: '8px 0 0' }}>저장에 실패했습니다. 다시 시도해 주세요.</p>
            )}
          </div>
        </div>
      )}

      {/* ⑨ 유언장 초안 — A2: 아코디언에 넣지 않는다. §6.4-7 모델이 섰으니 이제 저장을 배선한다. */}
      <div id="ending-note-section-WILL_DRAFT" className="v2-content" style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--v2-divider-strong)', filter: !currentUser ? 'blur(3px)' : 'none' }}>
        <h3 style={{ fontSize: 'var(--v2-fs-item-title)', fontWeight: 700, color: 'var(--v2-text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
          <ScrollText color="var(--v2-point)" /> 유언장 초안
          {sectionState.WILL_DRAFT && <CheckCircle2 size={18} color="var(--v2-point)" />}
        </h3>

        <p className="v2-notice-warn" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 700 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{NOT_A_WILL_NOTICE}</span>
        </p>

        <div className="v2-note-draft-grid">
          <div className="v2-field">
            <label htmlFor="en-draft-text">초안 (직접 입력)</label>
            <textarea
              id="en-draft-text"
              rows={10}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="v2-input"
              style={{ height: 'auto', padding: '12px 14px', fontSize: largeText ? '18px' : '16px', lineHeight: 1.7 }}
              placeholder="유언장 초안 내용을 직접 입력해 주세요."
            />
          </div>

          <div>
            {/* 🔄 09-07 사용자 지시 — ① 문구를 짧게(모바일 줄바꿈으로 가독성 저하) ② 정규식
                기반 자동 검증(hasAddressHint·hasDateHint) 삭제 — 초안 문맥에 따라 오판 가능성이
                커서, 확인됨/빠짐을 판정하지 않고 네 항목을 똑같은 안내로만 둔다. */}
            <h4 style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-main)', fontWeight: 700, marginBottom: '8px' }}>
              자필증서 유언장의 4대 요건
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ fontSize: 'var(--v2-fs-support)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--v2-text-muted)' }}>
                <Circle size={16} /> 주소: 번지까지
              </li>
              <li style={{ fontSize: 'var(--v2-fs-support)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--v2-text-muted)' }}>
                <Circle size={16} /> 연월일: 예: 2026년 8월 25일
              </li>
              <li style={{ fontSize: 'var(--v2-fs-support)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--v2-text-muted)' }}>
                <Circle size={16} /> 성명: 본인 서명
              </li>
              <li style={{ fontSize: 'var(--v2-fs-support)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--v2-text-muted)' }}>
                <Circle size={16} /> 날인: 도장 또는 지장
              </li>
            </ul>
            <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-muted)', marginTop: '8px' }}>
              ※ 이어봄은 위 항목을 자동으로 확인하지 않습니다. 직접 확인해 주세요.
            </p>
            <div style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-text-main)', backgroundColor: 'var(--v2-selected-bg)', borderRadius: '4px', padding: '14px', marginTop: '14px' }}>
              이 초안을 보고 직접 손으로 옮겨 쓰십시오. 컴퓨터로 작성한 문서는 자필증서 유언장으로 인정되지 않습니다.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => saveSection('WILL_DRAFT', { draftText })}
            className="v2-btn-primary"
            disabled={savingState.WILL_DRAFT === 'saving' || !policyAgreedAt}
            aria-busy={savingState.WILL_DRAFT === 'saving'}
            style={{ minWidth: '140px' }}
          >
            {saveButtonLabel(savingState.WILL_DRAFT)}
          </button>
          <button type="button" onClick={() => setLargeText((v) => !v)} className="v2-btn-outline">
            {largeText ? '보통 글씨로' : '큰 글씨로 보기'}
          </button>
          <button type="button" onClick={handlePrintDraft} className="v2-btn-outline">
            <Printer size={18} /> 인쇄하기
          </button>
          <button type="button" onClick={handleCopyDraft} className="v2-btn-outline">
            <Copy size={18} /> 텍스트 복사
          </button>
          <button type="button" onClick={handleDownloadDraft} className="v2-btn-outline">
            <Download size={18} /> .txt 내려받기
          </button>
        </div>
        {savingState.WILL_DRAFT === 'error' && <p className="v2-error-text" style={{ marginTop: '8px' }}>저장에 실패했습니다. 다시 시도해 주세요.</p>}
        {copyFeedback && <p style={{ fontSize: 'var(--v2-fs-support)', color: 'var(--v2-point)', marginTop: '8px' }}>{copyFeedback}</p>}
      </div>

      {summaryOpen && (
        <SummaryModal rows={summaryRows} onClose={() => setSummaryOpen(false)} onSelectRow={handleSummaryRowSelect} />
      )}
    </div>
  );
};
