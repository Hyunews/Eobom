import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, MessageCircle, Copy, Plus, X, ChevronDown, ChevronUp, ChevronRight, AlertTriangle, LogIn, PowerOff, Flower2, Loader2, Pencil, Eye } from 'lucide-react';
import { OBITUARY_CARD_IMAGE_URL } from '../config';
import { EobomLogo } from '../components/EobomLogo';
import { ObituaryView, type ObituaryData } from '../components/ObituaryView';
import { apiFetch, ApiError } from '../lib/api';
import { formatObituaryCardTitle, formatObituaryCardDescription, formatKST } from '../utils/obituaryCard';
import { ensureKakaoShareReady, shareViaKakao, shareViaWebShareApi, copyObituaryLink, buildObituarySmsHref, reportObituaryShare } from '../utils/kakaoShare';
import { useIsMobile } from '../hooks/useIsMobile';

// 모바일 부고장 작성 화면(SCR-014 개편) — docs 07-03 §6.2 Phase 1 전면 재작성.
// 이전 목업의 useState('홍길동') 하드코딩 초기값을 전부 제거했다 — 경황 없는 유족이 남의
// 이름이 박힌 부고를 그대로 보낼 위험이 실재하기 때문(§6.2 마지막 문단).

interface ObituaryPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

// 🔄 2026-09-10 — 위 주석은 GET /api/me/obituaries가 Phase 1 범위 밖이던 시절 근거였는데,
// 그 엔드포인트가 이후 승격돼(00-06 §8.3 SCR-018) 이제 계정 기준으로 "내가 이미 부고장을
// 만들었는지"를 물을 수 있다. 그런데도 이 로컬 포인터만으로 targetSlug를 정해서, 같은
// 계정이 다른 기기로 들어오면 그 기기에 남은(혹은 없는) 포인터에 따라 다른 화면이 뜨는
// 문제가 실제로 보고됐다(사람 리포트). 이제 slug 쿼리가 없을 때는 이 포인터 대신
// GET /api/me/obituaries로 계정 기준 targetSlug를 정한다 — 아래 useEffect 참고. 이 상수와
// 포인터 자체는 종료(handleCloseObituary 등, §5.3-2)처럼 "어느 걸 다시 열지" 힌트 용도로는
// 여전히 쓴다(§5.4 — 입력값 자체는 서버 Obituary 레코드에 저장됨).
const STORAGE_KEY = 'eobom_my_obituary';

interface StoredObituaryRef {
  obituaryId: string;
  obituarySlug: string;
  // 🔄 09-07 — 부고장 개설이 더는 추모관을 강제하지 않는다(체크박스로 선택). null이면
  // 연결된 추모관이 없다는 뜻.
  memorialSlug: string | null;
}

interface MournerDraft {
  name: string;
  relationship: string;
}

// 🆕 2026-09-21 그룹② — 폼 공용 조각. 라벨+입력+보조문구/오류를 한 묶음(.v2-field, 00-39 §6.8)으로
// 만들고, id 하나로 라벨·오류문·보조문구를 연결한다(aria). 클래스 정본은 design-v2.css.
type FieldErrorKey = 'deceased' | 'chief' | 'hall' | 'funeral' | 'bank' | 'holder' | 'accountNo' | 'falseReport' | 'reshared';

// 화면 위→아래 순서 — 제출 실패 시 첫 오류 칸으로 포커스를 옮기는 데 쓴다
const FIELD_ERROR_ORDER: { key: FieldErrorKey; id: string }[] = [
  { key: 'deceased', id: 'ob-deceased' },
  { key: 'chief', id: 'ob-chief' },
  { key: 'hall', id: 'ob-hall' },
  { key: 'funeral', id: 'ob-funeral-at' },
  { key: 'bank', id: 'ob-bank' },
  { key: 'holder', id: 'ob-holder' },
  { key: 'accountNo', id: 'ob-account-no' },
  { key: 'falseReport', id: 'ob-false-report' },
  { key: 'reshared', id: 'ob-reshared' },
];

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ id, label, value, onChange, required, type = 'text', placeholder, hint, error }) => (
  <div className="v2-field">
    <label htmlFor={id}>
      {label}
      {required && <span className="v2-req">필수</span>}
    </label>
    <input
      id={id}
      type={type}
      className="v2-input"
      value={value}
      placeholder={placeholder}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
    {error ? (
      <span id={`${id}-err`} className="v2-error-text">{error}</span>
    ) : hint ? (
      <span id={`${id}-hint`} className="v2-field-hint">{hint}</span>
    ) : null}
  </div>
);

// plain=true는 모달(수정) — 구간 제목·선 없이 필드만 나열한다(시안 W3)
const FormSection: React.FC<{ title: string; plain?: boolean; children: React.ReactNode }> = ({ title, plain, children }) => (
  <section className={plain ? 'v2-form-section is-plain' : 'v2-form-section'}>
    {!plain && <h2 className="v2-section-title">{title}</h2>}
    {children}
  </section>
);

// 07-03 §5 체감 개선(2026-08-21) — 기존 있던 부고장을 불러오는 동안(DB 왕복 ~1.5초, 인프라
// 제약이라 이번 범위에서 못 줄임) 흰 화면에 "불러오는 중" 대신 실제 관리 화면(폼+공유 패널)과
// 같은 자리에 회색 블록을 먼저 잡아 레이아웃이 안 튀게 한다. 처음 쓰는 사람(로컬 포인터 없음)은
// 이 로딩이 사실상 순간이라 체감 대상이 아니다 — 느린 경로(기존 부고장 재조회)를 기준으로 짰다.
const ObituaryManageSkeleton: React.FC = () => (
  <div className="container" style={{ paddingBottom: '3rem' }}>
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="skeleton-block" style={{ width: '150px', height: '26px', borderRadius: 'var(--r-lg)', marginBottom: '0.6rem' }} />
      <div className="skeleton-block" style={{ width: '260px', height: '32px', marginBottom: '0.5rem' }} />
      <div className="skeleton-block" style={{ width: '380px', maxWidth: '90%', height: '16px' }} />
    </div>

    <div className="auto-grid" style={{ alignItems: 'start' }}>
      {/* 작성 폼 자리 */}
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <div className="skeleton-block" style={{ width: '80px', height: '12px', marginBottom: '0.5rem' }} />
            <div className="skeleton-block" style={{ width: '100%', height: '48px', borderRadius: 'var(--r-sm)' }} />
          </div>
        ))}
      </div>

      {/* 카드 미리보기 + 공유 패널 자리 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* 🔄 2026-09-09 — 실제 previewCard 배경(#DCE3E8, 쿨톤 대안)·최대폭(360px)·왼쪽 정렬에
            맞춰 스켈레톤도 맞췄다(로딩→실제 전환 시 색·폭·정렬이 튀지 않게). */}
        <div style={{ backgroundColor: '#DCE3E8', borderRadius: 'var(--r-lg)', padding: '1.25rem', maxWidth: '360px', margin: '0' }}>
          <div className="skeleton-block" style={{ width: '67%', minWidth: '220px', height: '160px', borderRadius: 'var(--r-sm)', margin: '0', backgroundColor: 'rgba(255,255,255,0.6)' }} />
        </div>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', maxWidth: '360px', margin: '0', width: '100%' }}>
          <div className="skeleton-block" style={{ width: '100%', height: '48px', borderRadius: 'var(--r-sm)', marginBottom: '0.6rem' }} />
          <div className="skeleton-block" style={{ width: '100%', height: '40px', borderRadius: 'var(--r-sm)' }} />
        </div>
      </div>
    </div>
  </div>
);

export const ObituaryPage: React.FC<ObituaryPageProps> = ({ currentUser, onOpenLogin }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [obituaryRef, setObituaryRef] = useState<StoredObituaryRef | null>(null);
  // §5.3-2 — 종료·수정은 이 값(서버가 매번 응답으로 확인해준 id)만 쓴다. localStorage의
  // obituaryId는 "힌트"일 뿐이라 이 값이 없어도(예: 그 필드만 지워졌어도) 동작해야 한다.
  const [obituaryId, setObituaryId] = useState<string | null>(null);
  const [showMoreFields, setShowMoreFields] = useState(false);
  // sms: 링크는 모바일 OS 문자 앱 핸들러 전제 — 데스크탑엔 핸들러가 없어 눌러도 반응이 없다.
  // §7 폴백 사다리 4번은 원래 "모바일 전용" 보조 버튼이라 데스크탑에선 숨기고 3번(링크 복사)이 대신 채운다.
  const isMobile = useIsMobile();

  // 필수 4(§6.2): 고인 성함 · 상주 성함 · 빈소 위치 · 발인 일시
  const [deceasedName, setDeceasedName] = useState('');
  const [chiefMournerName, setChiefMournerName] = useState('');
  const [chiefMournerRelationship, setChiefMournerRelationship] = useState('');
  const [funeralHall, setFuneralHall] = useState('');
  const [funeralAt, setFuneralAt] = useState('');

  // 연락처 — 개발자 지정, 입력하면 노출(별도 토글 없음, §6.2-2)
  const [contactPhone, setContactPhone] = useState('');

  // 마음 전하실 곳(§6.2-2) — 명시적 토글, 기본 OFF. Phase 3 → Phase 1 #6으로 이동(07-03 갱신).
  const [accountEnabled, setAccountEnabled] = useState(false);
  const [accountBankCode, setAccountBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // 접어둔 선택 항목(§6.2) — 별세 일시·호실·입관·장지·유족 추가. 빈소 주소는 길찾기용으로 함께 둔다.
  const [deathDate, setDeathDate] = useState('');
  const [mourningRoom, setMourningRoom] = useState('');
  const [funeralHallAddr, setFuneralHallAddr] = useState('');
  const [coffinAt, setCoffinAt] = useState('');
  const [burialSite, setBurialSite] = useState('');
  const [mourners, setMourners] = useState<MournerDraft[]>([]);

  // 동의 2건(§6.2 — 05-01 §2.3 승계 + 00-13 §8-6)
  const [falseReportAgreed, setFalseReportAgreed] = useState(false);
  const [resharedNoticeAck, setResharedNoticeAck] = useState(false);
  // 🆕 09-07 — "이 부고장과 함께 추모관도 만들기" 체크박스. 개설(POST)에서만 쓴다 — 수정
  // 화면에서 뒤늦게 추모관을 연결하는 "사후 연결"(`00-13` §4.5-4-2 ㉮)은 체크→저장이 아니라
  // 공유 패널의 버튼 하나(handleCreateMemorial)로 처리한다(사용자 지시 09-07).
  const [createMemorial, setCreateMemorial] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 필드별 오류(붉은 테두리 + 칸 아래 문장). 제출 때 채우고, 그 칸을 고치면 바로 지운다.
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const clearFieldError = (key: FieldErrorKey) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [obituaryUrl, setObituaryUrl] = useState('');
  const [memorialUrl, setMemorialUrl] = useState('');
  const [cardFieldsUpdatedAt, setCardFieldsUpdatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // §9 #9 Phase 3 — 수동 종료(closedAt) 또는 발인+3일 자동 종료(§6.2-4) 둘 중 하나. GET :slug가
  // 개설자 본인에게는 닫혀도 404 대신 이 값들을 실어준다(obituaryController.getObituaryBySlug).
  const [isClosed, setIsClosed] = useState(false);
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // 🆕 2026-09-09 사용자 지시 — 관리 모드(obituaryRef 있음)에서 수정 폼을 모달로 연다.
  const [isEditOpen, setIsEditOpen] = useState(false);
  // 07-03 §6.4 — 조문객 화면 미리보기 모달. fetch 없이 이미 든 폼 state를 그대로 쓴다
  // (수정 즉시 반영·조회수 오염 0, §6.4 ⓑ).
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 🆕 09-07 사용자 지시 — 부고장이 종료된 뒤에도 이 화면에 다시 들어오면 항상 그 종료된
  // 부고장(localStorage 포인터)만 보였다. 새로 하나 더 쓸 방법이 화면에 없었다 — 포인터를
  // 지우고 폼 전체를 개설 화면 초기값으로 되돌린다. `/obituary?new=1`로 들어와도 같은 걸
  // 한다(MyObituaryListPage.tsx의 "새 부고장 만들기"도 이 경로를 쓴다 — 그 링크도 예전엔
  // 포인터가 남아 있으면 마지막으로 본 부고장을 다시 불러와 버그였다).
  const handleStartNew = () => {
    localStorage.removeItem(STORAGE_KEY);
    setObituaryRef(null);
    setObituaryId(null);
    setShowMoreFields(false);
    setDeceasedName('');
    setChiefMournerName('');
    setChiefMournerRelationship('');
    setFuneralHall('');
    setFuneralAt('');
    setContactPhone('');
    setAccountEnabled(false);
    setAccountBankCode('');
    setAccountNumber('');
    setAccountHolder('');
    setDeathDate('');
    setMourningRoom('');
    setFuneralHallAddr('');
    setCoffinAt('');
    setBurialSite('');
    setMourners([]);
    setFalseReportAgreed(false);
    setResharedNoticeAck(false);
    setCreateMemorial(false);
    setObituaryUrl('');
    setMemorialUrl('');
    setCardFieldsUpdatedAt(null);
    setUpdatedAt(null);
    setIsClosed(false);
    setClosedAt(null);
    setErrorMsg(null);
    setCopyFeedback(null);
    if (searchParams.toString()) setSearchParams({}, { replace: true });
  };

  // 클릭 핸들러 안에서 동기 호출해야 팝업 차단을 피한다(§7) — 그래서 로드는 마운트 시점에 미리 시작.
  useEffect(() => {
    ensureKakaoShareReady();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    // 🆕 09-07 — /obituary?new=1로 들어오면 포인터·querySlug를 전부 무시하고 빈 개설 화면으로
    // 시작한다. 이 useEffect는 이미 마운트된 컴포넌트에서 searchParams만 바뀌어도 다시
    // 돌므로(라우트 자체는 그대로라 리마운트가 아님), 이전에 채워졌을 state를 명시적으로
    // 비워야 한다 — handleStartNew를 그대로 재사용.
    if (searchParams.get('new')) {
      handleStartNew();
      setLoading(false);
      return;
    }

    // 00-06 §8(SCR-018) — 목록 화면("관리" 버튼)에서 특정 부고장을 지목해 들어오는 경로.
    // 있으면 아래 계정 기준 조회보다 우선한다(부고장이 2개 이상일 때 특정한 걸 봐야 하므로).
    const querySlug = searchParams.get('slug');

    // §5.3-2 — 어느 경로로 왔든 slug는 "무엇을 열어볼지" 힌트일 뿐, 권한 신호가 아니다.
    // 다른 계정으로 로그인해 있어도 이 fetch 자체는 그대로 나가고, 그 사람 것인지는 서버의
    // isOwner로만 판정한다(아래). 종료된 뒤에도 개설자 본인은 계속 볼 수 있어야 하므로(§5.3-1)
    // 토큰을 실어 보낸다 — 없으면 서버가 익명 조회로 보고 종료 시 404를 준다.
    const loadBySlug = (targetSlug: string) => {
      apiFetch<any>(`/api/obituaries/${targetSlug}`, 'USER')
        .then((o) => {
          // 🔴 §5.3-2 핵심 — 서버가 "당신 것"이라고 확인해준 경우에만 관리 모드로 들어간다.
          // 아니면 폼을 채우지 않고(남의 데이터를 화면에 띄우는 것이 이번 사고의 본질) 조용히
          // 개설 화면(초기 상태)에 남는다. 포인터는 지우지 않는다 — 원래 주인이 다시 로그인하면
          // 살아나야 한다(§5.3-2 마지막 줄).
          if (!o.isOwner) return;

          // 목록 화면에서 지목해 들어온 경우(querySlug)에도 이후 이 화면을 다시 열면 방금 본
          // 부고장이 이어지도록 포인터를 갱신한다 — "마지막으로 연 것" 힌트일 뿐 권한 신호는
          // 아니므로(§5.3-2) 그냥 덮어써도 안전하다.
          const resolvedRef: StoredObituaryRef = { obituaryId: o.obituaryId, obituarySlug: targetSlug, memorialSlug: o.memorialSlug };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedRef));
          setObituaryRef(resolvedRef);
          setObituaryId(o.obituaryId);
          setDeceasedName(o.deceasedName || '');
          setDeathDate(o.deceasedDeathDate ? String(o.deceasedDeathDate).slice(0, 16) : '');
          setFuneralHall(o.funeralHall || '');
          setFuneralHallAddr(o.funeralHallAddr || '');
          setMourningRoom(o.mourningRoom || '');
          setCoffinAt(o.coffinAt ? String(o.coffinAt).slice(0, 16) : '');
          setFuneralAt(o.funeralAt ? String(o.funeralAt).slice(0, 16) : '');
          setBurialSite(o.burialSite || '');
          setContactPhone(o.contactPhone || '');

          if (o.account) {
            setAccountEnabled(true);
            setAccountBankCode(o.account.bankCode || '');
            setAccountNumber(o.account.accountNumber || '');
            setAccountHolder(o.account.holder || '');
          }

          const list = Array.isArray(o.mourners) ? o.mourners : [];
          const chief = list.find((m: any) => m.isChief);
          const rest = list.filter((m: any) => !m.isChief);
          if (chief) {
            setChiefMournerName(chief.name || '');
            setChiefMournerRelationship(chief.relationship || '');
          }
          setMourners(rest.map((m: any) => ({ name: m.name || '', relationship: m.relationship || '' })));

          setCardFieldsUpdatedAt(o.cardFieldsUpdatedAt || null);
          setUpdatedAt(o.updatedAt || null);
          setIsClosed(!!o.isClosed);
          setClosedAt(o.closedAt || null);
          setObituaryUrl(`${window.location.origin}/o/${targetSlug}`);
          setMemorialUrl(o.memorialSlug ? `${window.location.origin}/m/${o.memorialSlug}` : '');
          // 개설 시 이미 완료한 동의 — 수정 화면에서 다시 요구하지 않는다(체크된 상태로 표시).
          setFalseReportAgreed(true);
          setResharedNoticeAck(true);
        })
        .catch(() => {
          // 실제로 없어진 경우(삭제 등)만 여기로 온다 — 남의 것이라 막힌 경우는 200 + isOwner:false로
          // 오므로 이 분기를 안 탄다(§5.3-2). 진짜 없는 것만 정리한다.
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setLoading(false));
    };

    if (querySlug) {
      loadBySlug(querySlug);
      return;
    }

    // 🔴 2026-09-10 사람 리포트 — 여기서부터가 이전엔 localStorage 포인터로만 targetSlug를
    // 정하던 자리다. 같은 계정이 기기를 바꿔 들어오면 그 기기의 로컬 포인터(없거나, 다른
    // 부고장을 가리키거나)에 따라 다른 화면이 떴다. GET /api/me/obituaries로 계정 기준
    // 목록을 받아와 targetSlug를 정한다 — 진행 중(안 닫힌) 것 중 가장 최근 걸 우선한다.
    // 🆕 2026-09-10 사람 지시 — 종료된 것까지 이 바로가기로 계속 뜨면 안 된다. 종료 후
    // 일주일이 지난 건 더는 후보에 넣지 않고(최근 일주일 이내 종료된 것만 후보), 그마저도
    // 없으면 빈 개설 화면으로 보낸다. 일주일이 지난 종료 부고장은 여전히 존재하고 "내 부고장
    // 목록"에서 slug를 지정해 들어가면(querySlug 경로) 그대로 열람·재확인할 수 있다 — 여기서
    // 막는 건 "바로가기 기본값"일 뿐이다.
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    apiFetch<{ slug: string; isClosed: boolean; closedAt: string | null }[]>('/api/me/obituaries', 'USER')
      .then((list) => {
        if (!Array.isArray(list) || list.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }
        const active = list.find((o) => !o.isClosed);
        if (active) {
          loadBySlug(active.slug);
          return;
        }
        const recentlyClosed = list
          .filter((o) => o.isClosed && o.closedAt && Date.now() - new Date(o.closedAt).getTime() <= SEVEN_DAYS_MS)
          .sort((a, b) => new Date(b.closedAt as string).getTime() - new Date(a.closedAt as string).getTime())[0];
        if (recentlyClosed) {
          loadBySlug(recentlyClosed.slug);
          return;
        }
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentUser, searchParams]);

  const addMourner = () => setMourners((prev) => [...prev, { name: '', relationship: '' }]);
  const updateMourner = (idx: number, field: keyof MournerDraft, value: string) =>
    setMourners((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  const removeMourner = (idx: number) => setMourners((prev) => prev.filter((_, i) => i !== idx));


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin?.();
      return;
    }
    // 🔄 2026-09-21 그룹② — 브라우저 기본 검증(required) 대신 칸마다 오류를 붙인다(00-39 §6.8 확장).
    const errs: Partial<Record<FieldErrorKey, string>> = {};
    if (!deceasedName.trim()) errs.deceased = '고인 성함을 입력해 주세요.';
    if (!chiefMournerName.trim()) errs.chief = '상주 성함을 입력해 주세요.';
    if (!funeralHall.trim()) errs.hall = '빈소 위치를 입력해 주세요.';
    if (!funeralAt) errs.funeral = '발인 일시를 선택해 주세요.';
    if (accountEnabled) {
      if (!accountBankCode.trim()) errs.bank = '은행을 입력해 주세요.';
      if (!accountHolder.trim()) errs.holder = '예금주를 입력해 주세요.';
      if (!accountNumber.trim()) errs.accountNo = '계좌번호를 입력해 주세요.';
    }
    if (!obituaryRef) {
      if (!falseReportAgreed) errs.falseReport = '확인이 필요한 항목입니다.';
      if (!resharedNoticeAck) errs.reshared = '확인이 필요한 항목입니다.';
    }
    const errCount = Object.keys(errs).length;
    if (errCount > 0) {
      setFieldErrors(errs);
      setErrorMsg(`확인이 필요한 항목이 ${errCount}개 있습니다. 붉게 표시된 곳을 확인해 주세요.`);
      const first = FIELD_ERROR_ORDER.find((f) => errs[f.key]);
      if (first) document.getElementById(first.id)?.focus();
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    setErrorMsg(null);
    setCopyFeedback(null);

    const payload = {
      deceasedName: deceasedName.trim(),
      deathDate: deathDate || undefined,
      chiefMournerName: chiefMournerName.trim(),
      chiefMournerRelationship: chiefMournerRelationship.trim() || undefined,
      mourners: mourners.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), relationship: m.relationship.trim() || undefined })),
      funeralHall: funeralHall.trim(),
      funeralHallAddr: funeralHallAddr.trim() || undefined,
      mourningRoom: mourningRoom.trim() || undefined,
      coffinAt: coffinAt || undefined,
      funeralAt,
      burialSite: burialSite.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      accountEnabled,
      accountBankCode: accountEnabled ? accountBankCode.trim() : undefined,
      accountNumber: accountEnabled ? accountNumber.trim() : undefined,
      accountHolder: accountEnabled ? accountHolder.trim() : undefined,
      falseReportAgreed,
      resharedNoticeAck,
      // 개설(POST)에서만 의미가 있다 — 수정 화면의 "사후 연결"은 이 폼이 아니라 공유 패널의
      // 전용 버튼(handleCreateMemorial)으로 처리한다(사용자 지시 09-07 — 체크→저장 형태 대신
      // 버튼 하나로).
      ...(obituaryRef ? {} : { createMemorial }),
    };

    try {
      if (!obituaryRef) {
        const data = await apiFetch<any>('/api/obituaries', 'USER', { method: 'POST', body: JSON.stringify(payload) });
        const ref: StoredObituaryRef = {
          obituaryId: data.obituaryId,
          obituarySlug: data.obituarySlug,
          memorialSlug: data.memorialSlug,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
        setObituaryRef(ref);
        setObituaryId(data.obituaryId);
        setObituaryUrl(data.obituaryUrl);
        setMemorialUrl(data.memorialUrl || '');
        setCardFieldsUpdatedAt(null);
        setUpdatedAt(new Date().toISOString());
      } else {
        // §5.3-2 — localStorage가 아니라 서버가 확인해준 obituaryId로 수정한다(obituaryRef가
        // 있다는 것 자체가 마운트 시 isOwner:true를 이미 통과했다는 뜻이라 obituaryId도 같이 있다).
        const data = await apiFetch<any>(`/api/obituaries/${obituaryId}`, 'USER', { method: 'PATCH', body: JSON.stringify(payload) });
        setUpdatedAt(data.updatedAt);
        if (data.cardFieldsChanged) {
          setCardFieldsUpdatedAt(data.cardFieldsUpdatedAt);
        }
        setIsEditOpen(false);
      }
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🆕 09-07 사용자 지시 — 사후 연결(`00-13` §4.5-4-2 ㉮)을 "체크박스 → 폼 저장"이 아니라
  // 공유 패널의 버튼 하나로 처리한다. 다른 필드는 건드리지 않도록 최소 payload만 보낸다
  // (updateObituary는 각 필드를 `!== undefined`로만 갱신하므로 나머지는 그대로 남는다).
  // 동의는 별도 화면을 만들지 않고 confirm 다이얼로그로 받는다(deleteObituary 등과 같은 패턴).
  const [linkingMemorial, setLinkingMemorial] = useState(false);
  const handleCreateMemorial = async () => {
    if (!obituaryId || linkingMemorial) return;
    if (!window.confirm('추모관을 만들어 이 부고장에 연결합니다.\n\n허위로 추모관을 개설할 경우 법적 책임을 질 수 있다는 점에 동의하십니까?')) return;
    setLinkingMemorial(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<any>(`/api/obituaries/${obituaryId}`, 'USER', {
        method: 'PATCH',
        body: JSON.stringify({ createMemorial: true, falseReportAgreed: true }),
      });
      if (data.memorialUrl) {
        setMemorialUrl(data.memorialUrl);
        setObituaryRef((prev) => (prev ? { ...prev, memorialSlug: data.memorialSlug } : prev));
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const stored: StoredObituaryRef = JSON.parse(raw);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, memorialSlug: data.memorialSlug }));
          } catch {
            // 파싱 안 되면 힌트로도 못 쓰던 상태 — 여기서 새로 만들지 않는다.
          }
        }
      }
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : '추모관 연결 중 오류가 발생했습니다.');
    } finally {
      setLinkingMemorial(false);
    }
  };

  const cardInput = { deceasedName, funeralHall, mourningRoom, funeralAt, cardFieldsUpdatedAt };
  const cardTitle = formatObituaryCardTitle(cardInput);
  const cardDescription = formatObituaryCardDescription(cardInput);

  // 폴백 사다리(§7): 1순위 Kakao.Share → 2순위 Web Share API → 3순위 링크 복사.
  // 셋 중 하나라도 성공하면 공유 집계(§9 9-1)를 호출한다 — handleShare는 obituaryRef가 있을
  // 때만(관리 모드 패널) 렌더되는 버튼에서 호출되므로 obituarySlug가 항상 있다.
  const handleShare = async () => {
    if (!obituaryUrl) return;
    setCopyFeedback(null);
    const params = { title: cardTitle, description: cardDescription, imageUrl: OBITUARY_CARD_IMAGE_URL, url: obituaryUrl, buttonLabel: '부고 보기' };
    if (shareViaKakao(params)) {
      if (obituaryRef) reportObituaryShare(obituaryRef.obituarySlug);
      return;
    }
    if (await shareViaWebShareApi(params)) {
      if (obituaryRef) reportObituaryShare(obituaryRef.obituarySlug);
      return;
    }
    const copied = await copyObituaryLink(obituaryUrl);
    if (copied && obituaryRef) reportObituaryShare(obituaryRef.obituarySlug);
    setCopyFeedback(copied ? '카카오톡 공유를 열 수 없어 링크를 복사했습니다. 대화방에 붙여넣어 전달해 주세요.' : '공유에 실패했습니다. 아래 링크를 직접 복사해 주세요.');
  };

  const handleCopyLink = async () => {
    if (!obituaryUrl) return;
    const ok = await copyObituaryLink(obituaryUrl);
    setCopyFeedback(ok ? '링크가 복사되었습니다.' : '복사에 실패했습니다. 링크를 직접 선택해 복사해 주세요.');
  };

  // §6.2-3·§9 #9 — 연락처·계좌 노출을 실제로 막는 유일한 완화책. 되돌릴 수 없다.
  // §5.3-2 — localStorage의 obituaryId가 아니라 서버가 준 obituaryId로 종료한다. 그래야
  // 유족이 기기를 바꿔도(로컬 포인터가 없어도) 종료라는 유일한 회수 수단이 살아 있다.
  const handleCloseObituary = async () => {
    if (!obituaryId || isClosed) return;
    if (!window.confirm('부고장을 종료하시겠어요? 종료하면 조문객은 더 이상 이 링크로 볼 수 없습니다. 되돌릴 수 없습니다.')) return;

    setIsClosing(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<{ closedAt: string }>(`/api/obituaries/${obituaryId}/close`, 'USER', { method: 'PATCH' });
      setIsClosed(true);
      setClosedAt(data.closedAt);
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsClosing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
          <MessageSquare color="var(--point-color)" size={40} style={{ marginBottom: 'var(--sp-3)' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>모바일 부고장 작성</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>부고장 작성 및 관리는 로그인 후 이용하실 수 있습니다.</p>
          <button onClick={onOpenLogin} className="btn btn-point" style={{ width: '100%' }}>
            <LogIn size={18} /> 로그인 / 회원가입
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <ObituaryManageSkeleton />;
  }

  // 🔄 2026-09-09 사용자 지시 — 부고장이 이미 있으면(obituaryRef) 미리보기·공유가 먼저 보이고,
  // 수정 폼은 "수정" 버튼으로 여는 모달 안으로 옮긴다. 개설 전(폼만 있는 상태)은 기존 2열
  // 그리드를 그대로 쓴다. formCard·previewCard·managePanel을 변수로 빼서 두 레이아웃에서
  // 같은 JSX를 재사용한다(중복 없이, 데스크톱·모바일 공통).
  // 🔄 2026-09-21 그룹② — 카드 자체(.v2-kakao-card)와 바깥 면(.v2-kakao-stage)을 클래스로 옮겼다.
  // 개설 전(작성)은 previewSection이 오른쪽 열/폼 안에서, 관리 모드는 previewCard가 그대로 쓴다.
  // 제목 폴백: formatObituaryCardTitle은 이름이 비어도 "[부고] 故  님"을 돌려줘서 아래 폴백이
  // 죽은 코드였다 — 이름이 비었을 때만 "故 ○○○ 님"을 보이게 여기서 판단한다.
  const kakaoCard = (
    <div className="v2-kakao-card">
      {/* 🔄 2026-09-09 — "수정" 버튼을 카드 우상단 아이콘 칩으로(버튼 크기 시안 5개 중 사용자 선택).
          obituaryRef가 있을 때(관리 모드)만 뜬다. 🔴 40×40px는 --min-touch-target(56px) 미만 —
          사용자에게 알리고 선택받았다. 마우스오버 시 "수정하기" 라벨이 펼쳐진다(.obituary-edit-chip). */}
      {obituaryRef && (
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          aria-label="부고장 정보 수정"
          className="obituary-edit-chip"
          style={{
            position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 1,
            height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#E3E8E1', color: 'var(--point-color)',
            border: '1px solid rgba(91, 112, 101, 0.3)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          <Pencil size={16} style={{ flexShrink: 0 }} />
          <span className="chip-label">수정하기</span>
        </button>
      )}
      <div className="v2-kakao-card-image">
        <img src={OBITUARY_CARD_IMAGE_URL} alt="근조 카드 이미지" />
      </div>
      <div className="v2-kakao-card-body">
        <p className="v2-kakao-card-title">{deceasedName.trim() ? cardTitle : '[부고] 故 ○○○ 님'}</p>
        <p className="v2-kakao-card-desc">{cardDescription || '빈소·발인 정보를 입력하면 여기에 표시됩니다.'}</p>
      </div>
      <div className="v2-kakao-card-cta">부고장 보기</div>
      <div className="v2-kakao-card-foot">
        이어봄
        <ChevronRight size={14} color="#9CA3AF" />
      </div>
    </div>
  );

  // 관리 모드(부고장이 이미 있을 때)의 미리보기 — 라벨은 면(stage) 안쪽 맨 위에 둔다. 밖에 두면
  // 면의 윗선이 라벨 높이만큼 내려가 오른쪽 공유 패널과 위쪽이 어긋난다(2026-09-21 사용자 지시).
  const previewCard = (
    <div className="v2-kakao-stage" style={{ maxWidth: '432px' }}>
      <p className="v2-field-hint" style={{ margin: '0 0 8px' }}>카카오톡 카드 미리보기</p>
      {kakaoCard}
    </div>
  );

  // 개설 전(작성) 미리보기 — 웹은 오른쪽 열(스크롤을 따라옴), 모바일은 폼 안. 안내 문장은 두지 않는다.
  const previewSection = (
    <section className="v2-form-section" aria-label="카카오톡 카드 미리보기">
      <h2 className="v2-section-title">카드 미리보기</h2>
      <div className="v2-kakao-stage">{kakaoCard}</div>
    </section>
  );

  const isEdit = !!obituaryRef;
  const formCard = (
    <form onSubmit={handleSubmit} noValidate className="v2-form">
      <FormSection title="기본 정보" plain={isEdit}>
        <FormField
          id="ob-deceased" label="고인 성함" required placeholder="예: 홍길동"
          value={deceasedName} error={fieldErrors.deceased}
          onChange={(v) => { setDeceasedName(v); clearFieldError('deceased'); }}
        />
        {/* 00-38 §6.5 ⓒ 이후 — 가로 2:1은 웹, 모바일 세로 스택은 .v2-form-row가 CSS로 처리 */}
        <div className="v2-form-row is-wide-first">
          <FormField
            id="ob-chief" label="상주 성함" required placeholder="예: 홍상주"
            value={chiefMournerName} error={fieldErrors.chief}
            onChange={(v) => { setChiefMournerName(v); clearFieldError('chief'); }}
          />
          <FormField
            id="ob-relation" label="고인과의 관계" placeholder="상주"
            value={chiefMournerRelationship} onChange={setChiefMournerRelationship}
          />
        </div>
      </FormSection>

      <FormSection title="빈소와 발인" plain={isEdit}>
        <FormField
          id="ob-hall" label="빈소 위치" required placeholder="예: 서울 평안 장례식장"
          value={funeralHall} error={fieldErrors.hall}
          onChange={(v) => { setFuneralHall(v); clearFieldError('hall'); }}
        />
        <FormField
          id="ob-funeral-at" label="발인 일시" required type="datetime-local"
          value={funeralAt} error={fieldErrors.funeral}
          onChange={(v) => { setFuneralAt(v); clearFieldError('funeral'); }}
        />
      </FormSection>

      <FormSection title="연락처와 마음 전하실 곳" plain={isEdit}>
        <FormField
          id="ob-phone" label="연락처" type="tel" placeholder="010-0000-0000"
          hint="입력하신 번호는 부고장을 받은 모든 분에게 보입니다."
          value={contactPhone} onChange={setContactPhone}
        />
        {/* 마음 전하실 곳 — 명시적 토글, 기본 OFF(§6.2-2). 연락처와 달리 "입력=노출"이 아니라
            토글 자체가 경고를 띄울 자리다 — 켜는 순간 재전파 경고를 보여준다. */}
        <label className="v2-check" htmlFor="ob-account-enabled">
          <input id="ob-account-enabled" type="checkbox" checked={accountEnabled} onChange={(e) => setAccountEnabled(e.target.checked)} />
          <span>
            마음 전하실 곳 표시
            <span className="v2-check-sub">조문객에게 계좌번호를 보여줍니다.</span>
          </span>
        </label>
        {accountEnabled && (
          <>
            <div className="v2-notice-warn" role="note">이 계좌번호는 부고장을 받은 분이 다시 공유할 수 있습니다.</div>
            <div className="v2-form-row">
              <FormField
                id="ob-bank" label="은행" placeholder="예: 국민은행"
                value={accountBankCode} error={fieldErrors.bank}
                onChange={(v) => { setAccountBankCode(v); clearFieldError('bank'); }}
              />
              <FormField
                id="ob-holder" label="예금주" placeholder="예금주"
                value={accountHolder} error={fieldErrors.holder}
                onChange={(v) => { setAccountHolder(v); clearFieldError('holder'); }}
              />
            </div>
            <FormField
              id="ob-account-no" label="계좌번호" placeholder="계좌번호"
              value={accountNumber} error={fieldErrors.accountNo}
              onChange={(v) => { setAccountNumber(v); clearFieldError('accountNo'); }}
            />
          </>
        )}
      </FormSection>

      <div className="v2-more">
        <button type="button" className="v2-more-toggle" aria-expanded={showMoreFields} onClick={() => setShowMoreFields((v) => !v)}>
          <span className="v2-more-toggle-text">
            <span className="v2-section-title">선택 정보</span>
            <span className="v2-field-hint">별세 일시 · 빈소 주소 · 호실 · 입관 · 장지 · 유족</span>
          </span>
          {showMoreFields ? <ChevronUp size={20} color="var(--v2-text-muted)" /> : <ChevronDown size={20} color="var(--v2-text-muted)" />}
        </button>

        {showMoreFields && (
          <div className="v2-more-body">
            <FormField id="ob-death-date" label="별세 일시" type="datetime-local" value={deathDate} onChange={setDeathDate} />
            <FormField id="ob-hall-addr" label="빈소 주소 (길찾기용)" placeholder="예: 서울특별시 강남구 ..." value={funeralHallAddr} onChange={setFuneralHallAddr} />
            <div className="v2-form-row">
              <FormField id="ob-room" label="호실" placeholder="예: 201호" value={mourningRoom} onChange={setMourningRoom} />
              <FormField id="ob-coffin-at" label="입관" type="datetime-local" value={coffinAt} onChange={setCoffinAt} />
            </div>
            <FormField id="ob-burial" label="장지" placeholder="예: OO추모공원" value={burialSite} onChange={setBurialSite} />

            <div className="v2-field">
              <span className="v2-field-hint">유족 추가</span>
              {mourners.map((m, idx) => (
                <div key={idx} className="v2-form-row is-keep" style={{ alignItems: 'flex-end' }}>
                  <FormField id={`ob-mourner-rel-${idx}`} label="관계" placeholder="예: 장남" value={m.relationship} onChange={(v) => updateMourner(idx, 'relationship', v)} />
                  <FormField id={`ob-mourner-name-${idx}`} label="성함" placeholder="성함" value={m.name} onChange={(v) => updateMourner(idx, 'name', v)} />
                  <button type="button" className="v2-btn-outline v2-icon-btn" aria-label="유족 삭제" onClick={() => removeMourner(idx)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="v2-btn-outline" style={{ alignSelf: 'flex-start' }} onClick={addMourner}>
                <Plus size={16} /> 유족 추가
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 모바일은 옆 열이 없어 카드 미리보기를 확인 사항 앞에 둔다(웹은 오른쪽 열, .v2-form-aside) */}
      {!isEdit && <div className="v2-form-preview-inline">{previewSection}</div>}

      {!isEdit && (
        <FormSection title="확인 사항">
          {/* 🔄 09-07 사용자 지시 — 부고장 개설이 더는 추모관을 자동으로 만들지 않는다.
              이 체크박스를 켜야만 개설 시 추모관도 함께 만들어 연결한다. 꺼두면 나중에
              공유 패널의 "추모관 만들기" 버튼(사후 연결, `00-13` §4.5-4-2 ㉮)이나
              /memorial에서 독립적으로 만들 수 있다. */}
          <div>
            <label className="v2-check" htmlFor="ob-false-report">
              <input id="ob-false-report" type="checkbox" checked={falseReportAgreed} aria-invalid={!!fieldErrors.falseReport}
                onChange={(e) => { setFalseReportAgreed(e.target.checked); clearFieldError('falseReport'); }} />
              <span><span className="v2-req">필수</span> 허위로 부고장을 개설할 경우 법적 책임을 질 수 있다는 점에 동의합니다.</span>
            </label>
            {fieldErrors.falseReport && <p className="v2-error-text v2-check-error" style={{ margin: 0 }}>{fieldErrors.falseReport}</p>}
          </div>
          <div>
            <label className="v2-check" htmlFor="ob-reshared">
              <input id="ob-reshared" type="checkbox" checked={resharedNoticeAck} aria-invalid={!!fieldErrors.reshared}
                onChange={(e) => { setResharedNoticeAck(e.target.checked); clearFieldError('reshared'); }} />
              <span><span className="v2-req">필수</span> 이 부고장을 전달받은 분이 다시 다른 곳에 공유할 수 있다는 점을 확인했습니다.</span>
            </label>
            {fieldErrors.reshared && <p className="v2-error-text v2-check-error" style={{ margin: 0 }}>{fieldErrors.reshared}</p>}
          </div>
          <label className="v2-check" htmlFor="ob-create-memorial">
            <input id="ob-create-memorial" type="checkbox" checked={createMemorial} onChange={(e) => setCreateMemorial(e.target.checked)} />
            <span><span className="v2-opt">선택</span> 추모관도 함께 만들기 — 헌화·방명록 공간 (나중에 따로 만들 수 있습니다.)</span>
          </label>
        </FormSection>
      )}

      {isEdit ? (
        <div>
          {errorMsg && <p role="alert" className="v2-error-text" style={{ margin: '0 0 12px' }}>{errorMsg}</p>}
          <div className="v2-modal-actions is-form-actions">
            <button type="button" className="v2-btn-outline" onClick={() => setIsEditOpen(false)}>취소</button>
            <button type="submit" className="v2-btn-primary" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? '저장 중…' : '수정 사항 저장'}
            </button>
          </div>
        </div>
      ) : (
        <div className="v2-form-submit">
          {errorMsg && <p role="alert" className="v2-error-text" style={{ margin: 0 }}>{errorMsg}</p>}
          <button type="submit" className="v2-btn-primary" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? '처리 중…' : '부고장 만들기'}
          </button>
        </div>
      )}
    </form>
  );
  // 07-03 §6.4 ⓑ — 폼 state → ObituaryData 변환 어댑터. 미리보기 모달 한 곳에서만 부른다 —
  // 두 곳에서 각자 변환하면 미리보기와 실제 카드가 어긋난다.
  const buildPreviewData = (): ObituaryData => ({
    deceasedName,
    deceasedDeathDate: deathDate || null,
    funeralHall: funeralHall || null,
    funeralHallAddr: funeralHallAddr || null,
    mourningRoom: mourningRoom || null,
    coffinAt: coffinAt || null,
    funeralAt,
    burialSite: burialSite || null,
    mourners: [
      ...(chiefMournerName.trim() ? [{ name: chiefMournerName, relationship: chiefMournerRelationship, isChief: true }] : []),
      ...mourners.filter((m) => m.name.trim()).map((m) => ({ ...m, isChief: false })),
    ],
    contactPhone: contactPhone || undefined,
    // 🔴 사용자 지시(2026-09-09) — 이 미리보기에서는 추모관 관련(들어가기 바)을 뺀다.
    // 실제 /o/{slug}는 그대로 memorialSlug가 있으면 노출한다 — ObituaryView 자체는 안 건드리고
    // 이 어댑터에서만 null로 고정한다.
    memorialSlug: null,
    cardFieldsUpdatedAt,
    updatedAt: updatedAt ?? new Date().toISOString(),
    account: accountEnabled ? { bankCode: accountBankCode || null, accountNumber: accountNumber || null, holder: accountHolder || null } : undefined,
  });

  const managePanel = (
    // 🔄 2026-09-09 — 왼쪽 미리보기 섹션 폭을 줄인 것과 맞춰 공유 섹션도 maxWidth:420px로
    // 줄였다(사용자 지시 "공유 섹션도 줄인다"). 이후 미리보기 섹션만 360px로 한 번 더 줄었는데
    // (왼쪽 정렬로 바뀌며), 공유 섹션은 별도 지시가 없어 420px 그대로 뒀다.
    // 🆕 2026-09-09 — "섹션 폭이 줄어든 만큼 버튼·내부 폰트도 줄여라"(사용자 지시)에 따라
    // 이 패널 안의 본문 텍스트는 --fs-body(16px)→--fs-caption(14px)로, 버튼류는
    // 좌우 패딩을 1.8rem(.btn 기본)→1.2rem으로 줄였다. 🔴 버튼 높이(--min-touch-target)는
    // 접근성 터치 타깃 규정(§4.5-5 논의)이라 손대지 않았다 — 폭·글자만 줄인다.
    // 🔄 2026-09-09 — flex-wrap 레이아웃으로 바뀌며 `margin:0 auto`·`width:100%`(그리드 컬럼
    // 중앙정렬·꽉채우기용)는 더 이상 안 맞는다 — flex 아이템이 `width:100%`면 부모 행 전체를
    // 차지하려 들어 옆 섹션이 못 붙는다. 콘텐츠 폭대로 놓이게 두고 maxWidth만 상한으로 둔다.
    <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', flex: '0 1 420px' }}>
      {isClosed ? (
        <>
          <div style={{ display: 'flex', gap: '0.6rem', backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-4) 0.9rem', marginBottom: '1.1rem' }}>
            <PowerOff size={18} color="#475569" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <p style={{ fontSize: 'var(--fs-caption)', color: '#334155', margin: 0, lineHeight: 1.5 }}>
              종료된 부고장입니다. 조문객은 더 이상 이 링크로 볼 수 없습니다{closedAt ? ` (${formatKST(closedAt)} 종료)` : ' (발인 3일 경과로 자동 종료)'}.
            </p>
          </div>
          {/* 🆕 09-07 사용자 지시 — 종료된 부고장 화면에 다시 들어와도 새로 하나 쓸
                      방법이 없었다. 눈에 띄게 위에 둔다. */}
          <button type="button" onClick={handleStartNew} className="btn btn-point" style={{ width: '100%', marginBottom: '1.1rem', fontSize: 'var(--fs-caption)', padding: '0 1.2rem' }}>
            <Plus size={16} /> 새 부고장 작성하기
          </button>
          {memorialUrl ? (
            <a href={memorialUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--fs-caption)', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'underline' }}>
              연결된 추모관은 계속 열람할 수 있습니다 →
            </a>
          ) : (
            <button type="button" onClick={handleCreateMemorial} disabled={linkingMemorial} className="btn" style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: 'var(--fs-caption)', padding: '0 1.2rem' }}>
              {linkingMemorial ? <><Loader2 size={15} /> 만드는 중...</> : <><Flower2 size={15} /> 추모관 만들기</>}
            </button>
          )}
        </>
      ) : (
        <>
          {cardFieldsUpdatedAt && (
            <div style={{ display: 'flex', gap: '0.6rem', backgroundColor: 'var(--state-critical-bg)', border: '1px solid var(--state-critical-bg)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-4) 0.9rem', marginBottom: '1.1rem' }}>
              <AlertTriangle size={18} color="var(--state-critical-fg)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ fontSize: 'var(--fs-caption)', color: '#7C2D12', margin: 0, lineHeight: 1.5 }}>
                이미 보낸 카드에는 반영되지 않습니다. 아래 버튼으로 다시 공유해 주세요.
              </p>
            </div>
          )}

          <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.9rem', fontSize: '0.95rem' }}>부고장 공유</h3>

          {/* 카카오 브랜드 노랑(#FEE500) + 검정 계열 글자(#191919) — 카카오 공유 버튼 가이드 색 */}
          <button onClick={handleShare} className="btn" style={{ width: '100%', marginBottom: '0.6rem', fontSize: 'var(--fs-caption)', padding: '0 1.2rem', backgroundColor: '#FEE500', color: '#191919', border: '1px solid #FEE500' }}>
            {/* 푸터의 "카카오톡으로 문의하기"(Footer.tsx·FooterMobile.tsx)와 같은 말풍선 아이콘 */}
            <MessageCircle size={16} /> 카카오톡으로 부고 알리기
          </button>
          {/* 07-03 §6.4 ⓐ — 조문객 화면 미리보기는 링크복사·문자로보내기와 같은 보조 버튼 군. 1순위
          (카카오톡) 버튼보다 위에 두지 않는다 — 이 화면의 목적은 공유다. 🔄 09-21 사용자 지시 —
          미리보기를 링크 복사 위로 옮겼고, 실링크 문자열 박스는 뺐다(복사 버튼으로 충분). */}
          <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn" style={{ width: '100%', marginBottom: '0.6rem', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: 'var(--fs-caption)', padding: '0 1.2rem' }}>
            <Eye size={15} /> 조문객 화면 미리보기
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <button onClick={handleCopyLink} className="btn" style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: 'var(--fs-caption)', padding: '0 1.2rem' }}>
              <Copy size={15} /> 링크 복사
            </button>
            {isMobile && (
              <a href={buildObituarySmsHref(obituaryUrl, deceasedName)} className="btn" style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: 'var(--fs-caption)', padding: '0 1.2rem', textDecoration: 'none' }}>
                문자로 보내기
              </a>
            )}
          </div>
          {copyFeedback && <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--point-color)', margin: '0 0 0.6rem 0' }}>{copyFeedback}</p>}

          {/* 🔄 09-07 — 추모관은 이제 선택이라 없을 수 있다("있다면"만 보여준다).
                      없으면 "사후 연결"(`00-13` §4.5-4-2 ㉮) 버튼 하나로 바로 만든다 —
                      체크박스→저장 형태가 아니라 버튼 하나로(사용자 지시). */}
          {memorialUrl ? (
            <a href={memorialUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--fs-caption)', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'underline' }}>
              연결된 추모관 미리 보기 →
            </a>
          ) : (
            <button type="button" onClick={handleCreateMemorial} disabled={linkingMemorial} className="btn" style={{ width: '100%', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: 'var(--fs-caption)', padding: '0 1.2rem' }}>
              {linkingMemorial ? <><Loader2 size={15} /> 만드는 중...</> : <><Flower2 size={15} /> 추모관 만들기</>}
            </button>
          )}

          {updatedAt && (
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: '1rem' }}>
              최종 수정: {formatKST(updatedAt)}
            </p>
          )}

          {/* §6.2-3·§9 #9 — 연락처·계좌 노출을 실제로 막는 유일한 완화책. 눈에 띄게 둔다. */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.2rem', paddingTop: '1.1rem' }}>
            <button
              type="button"
              onClick={handleCloseObituary}
              disabled={isClosing}
              className="btn"
              style={{ width: '100%', backgroundColor: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)', border: '1px solid var(--state-danger-bg)', fontSize: 'var(--fs-caption)', padding: '0 1.2rem' }}
            >
              <PowerOff size={16} /> {isClosing ? '종료 중...' : '부고장 종료'}
            </button>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
              종료하지 않아도 발인 3일 후 자동으로 종료됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">{obituaryRef ? '부고장 관리' : '모바일 부고장 작성'}</h1>
        <p className="v2-page-subtitle">
          {obituaryRef ? '입력한 내용은 즉시 부고장 페이지에 반영됩니다. 빈소·발인 등이 바뀌면 아래에서 고쳐주세요.' : '고인 성함, 상주, 빈소, 발인 일시만 입력하면 3분 안에 부고장을 만들 수 있습니다.'}
        </p>
      </div>

      {obituaryRef ? (
        <>
          {/* 🔄 2026-09-09 — 관리 모드: 왼쪽(미리보기+수정)·오른쪽(공유). 수정은 버튼→모달.
              🔴 간격 버그 진단: `.auto-grid`는 컬럼을 `1fr`로 늘려 채우는 그리드라(00-29 §6.1),
              `.container` min-width:1024px(00-38) 이후 각 컬럼이 콘텐츠(432px/420px)보다
              훨씬 넓어졌다. 그 안에서 콘텐츠를 `margin:0 auto`로 "컬럼 중앙 정렬"해 뒀던 탓에
              두 컨텐츠 사이에 (컬럼 여유폭 + grid gap)만큼 넓은 여백이 생겼다 — gap 자체를
              줄여도 컬럼 안쪽 여백은 그대로라 안 좁아졌던 것. `.auto-grid`(1fr 스트레치) 대신
              flex-wrap으로 바꿔 컨텐츠 폭만큼만 차지하게 하고, 남는 공간은 오른쪽(줄 끝)으로
              보낸다 — 두 섹션 사이는 정확히 gap만큼만 남는다. 768px 이하에서는 두 섹션 폭
              합(432+420+16)이 뷰포트를 넘어서 자동으로 줄바꿈(세로 스택)된다. */}
          {/* 🔄 2026-09-09 — 두 섹션 그룹 전체가 컨테이너 안에서 왼쪽으로 치우쳐 보인다는
              지적으로 justifyContent:center 추가 — .container가 넓어도(00-38 min-width:1024px)
              두 섹션(432+420+gap)이 가운데로 모인다. */}
          {/* 🔄 2026-09-09 — 수정 버튼을 카드 아래 별도 버튼에서 카드 우상단 아이콘 칩으로
              옮기면서(사용자가 시안 5개 중 선택) 이 왼쪽 칸엔 이제 previewCard 하나뿐이다. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ flex: '0 1 432px' }}>
              {previewCard}
            </div>
            {managePanel}
          </div>

          {isEditOpen && (
            <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ob-edit-title" onClick={() => setIsEditOpen(false)}>
              <div className="v2-modal is-form" onClick={(e) => e.stopPropagation()}>
                <h2 id="ob-edit-title" className="v2-modal-title">부고장 수정</h2>
                {formCard}
              </div>
            </div>
          )}

          {/* 07-03 §6.4 ⓐ·ⓓ — 조문객 화면 미리보기. 수정 모달과 같은 배경/블러/zIndex 패턴을
          재사용하되, 🔴 이 모달은 90dvh를 쓴다(수정 모달의 90vh는 Phase 3에서 모달 5종과
          함께 통일 — 지금 건드리지 않는다). */}
          {isPreviewOpen && (
            <div
              onClick={() => setIsPreviewOpen(false)}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                zIndex: 3000, padding: '2rem 1rem', overflowY: 'auto'
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', maxWidth: '460px', width: '100%', maxHeight: '90dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--r-lg)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'var(--surface-subtle)', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)', zIndex: 1
                  }}
                >
                  <X size={18} />
                </button>
                {/* §6.4 ⓐ 배경 — 랜딩 껍데기의 #FBF9F5 + 좌우 여백을 모달 안에서 재현한다.
                카드만 떠 있으면 실제 화면과 인상이 다르다. */}
                <div style={{ backgroundColor: '#FBF9F5', padding: '2.5rem 1rem', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '460px' }}>
                    {/* §6.4 ⓓ — §5.4-2의 책임 경계를 미리보기를 보는 순간에도 말한다. */}
                    <div style={{ display: 'flex', gap: '0.6rem', backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-4) 0.9rem', marginBottom: '1.25rem' }}>
                      <Eye size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        조문객에게 보이는 화면입니다.<br />
                        수정하면 이 화면은 바로 바뀌지만, 이미 보낸 카카오톡 카드는 바뀌지 않습니다.
                      </p>
                    </div>
                    <ObituaryView data={buildPreviewData()} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // 🔄 2026-09-21 그룹② — 입력(560) | 미리보기 2단(.v2-form-shell, 00-39 §6.8 확장). 미리보기 열은
        // sticky라 폼이 길어져 아래로 스크롤해도 따라온다. ≤767px에서는 옆 열이 숨고 폼 안(확인 사항
        // 앞)에 나온다.
        <div className="v2-form-shell is-2col">
          <div>{formCard}</div>
          <aside className="v2-form-aside">{previewSection}</aside>
        </div>
      )}
    </div>
  );
};
