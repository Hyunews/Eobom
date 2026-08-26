import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Copy, Plus, X, ChevronDown, ChevronUp, AlertTriangle, LogIn, Heart, PowerOff } from 'lucide-react';
import { BACKEND_URL, OBITUARY_CARD_IMAGE_URL } from '../config';
import { formatObituaryCardTitle, formatObituaryCardDescription, formatKST } from '../utils/obituaryCard';
import { ensureKakaoShareReady, shareViaKakao, shareViaWebShareApi, copyObituaryLink, buildObituarySmsHref } from '../utils/kakaoShare';

// 모바일 부고장 작성 화면(SCR-014 개편) — docs 07-03 §6.2 Phase 1 전면 재작성.
// 이전 목업의 useState('홍길동') 하드코딩 초기값을 전부 제거했다 — 경황 없는 유족이 남의
// 이름이 박힌 부고를 그대로 보낼 위험이 실재하기 때문(§6.2 마지막 문단).

interface ObituaryPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

// GET /api/me/obituaries가 Phase 1 범위 밖(§5.1 중 POST·GET :slug·PATCH만)이라, "내가 이미
// 부고장을 만들었는지"는 이 브라우저에 남겨둔 참조로만 판단한다 — 공개 GET :slug로 다시
// 불러와 편집 모드로 전환한다. 서버 DB가 정본이고 이건 그저 "어느 걸 다시 열지"에 대한
// 로컬 포인터일 뿐이다(§5.4 — 입력값 자체는 서버 Obituary 레코드에 저장됨).
const STORAGE_KEY = 'eobom_my_obituary';

interface StoredObituaryRef {
  obituaryId: string;
  obituarySlug: string;
  memorialSlug: string;
}

interface MournerDraft {
  name: string;
  relationship: string;
}

// 07-03 §5 체감 개선(2026-08-21) — 기존 있던 부고장을 불러오는 동안(DB 왕복 ~1.5초, 인프라
// 제약이라 이번 범위에서 못 줄임) 흰 화면에 "불러오는 중" 대신 실제 관리 화면(폼+공유 패널)과
// 같은 자리에 회색 블록을 먼저 잡아 레이아웃이 안 튀게 한다. 처음 쓰는 사람(로컬 포인터 없음)은
// 이 로딩이 사실상 순간이라 체감 대상이 아니다 — 느린 경로(기존 부고장 재조회)를 기준으로 짰다.
const ObituaryManageSkeleton: React.FC = () => (
  <div className="container" style={{ paddingBottom: '3rem' }}>
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="skeleton-block" style={{ width: '150px', height: '26px', borderRadius: '16px', marginBottom: '0.6rem' }} />
      <div className="skeleton-block" style={{ width: '260px', height: '32px', marginBottom: '0.5rem' }} />
      <div className="skeleton-block" style={{ width: '380px', maxWidth: '90%', height: '16px' }} />
    </div>

    <div className="auto-grid" style={{ alignItems: 'start' }}>
      {/* 작성 폼 자리 */}
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <div className="skeleton-block" style={{ width: '80px', height: '12px', marginBottom: '0.5rem' }} />
            <div className="skeleton-block" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
          </div>
        ))}
      </div>

      {/* 카드 미리보기 + 공유 패널 자리 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ backgroundColor: '#1A2B4C', borderRadius: '16px', padding: '1.25rem' }}>
          <div className="skeleton-block" style={{ width: '100%', height: '160px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <div className="skeleton-block" style={{ width: '100%', height: '48px', borderRadius: '8px', marginBottom: '0.6rem' }} />
          <div className="skeleton-block" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  </div>
);

export const ObituaryPage: React.FC<ObituaryPageProps> = ({ currentUser, onOpenLogin }) => {
  const [loading, setLoading] = useState(true);
  const [obituaryRef, setObituaryRef] = useState<StoredObituaryRef | null>(null);
  // §5.3-2 — 종료·수정은 이 값(서버가 매번 응답으로 확인해준 id)만 쓴다. localStorage의
  // obituaryId는 "힌트"일 뿐이라 이 값이 없어도(예: 그 필드만 지워졌어도) 동작해야 한다.
  const [obituaryId, setObituaryId] = useState<string | null>(null);
  const [showMoreFields, setShowMoreFields] = useState(false);

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  // 클릭 핸들러 안에서 동기 호출해야 팝업 차단을 피한다(§7) — 그래서 로드는 마운트 시점에 미리 시작.
  useEffect(() => {
    ensureKakaoShareReady();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }

    let ref: StoredObituaryRef;
    try {
      ref = JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY); // 파싱조차 안 되면 힌트로도 못 쓰므로 이건 지운다
      setLoading(false);
      return;
    }

    // §5.3-2 — localStorage 포인터는 "어느 slug를 열어볼지" 힌트일 뿐, 권한 신호가 아니다.
    // 다른 계정으로 로그인해 있어도 이 fetch 자체는 그대로 나가고, 그 사람 것인지는 서버의
    // isOwner로만 판정한다(아래). 종료된 뒤에도 개설자 본인은 계속 볼 수 있어야 하므로(§5.3-1)
    // 토큰을 실어 보낸다 — 없으면 서버가 익명 조회로 보고 종료 시 404를 준다.
    const meToken = sessionStorage.getItem('k_ending_token');
    fetch(`${BACKEND_URL}/api/obituaries/${ref.obituarySlug}`, {
      headers: meToken ? { Authorization: `Bearer ${meToken}` } : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'success') {
          // 실제로 없어진 경우(삭제 등)만 여기로 온다 — 남의 것이라 막힌 경우는 200 + isOwner:false로
          // 오므로 이 분기를 안 탄다(§5.3-2). 진짜 없는 것만 정리한다.
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        const o = data.data;

        // 🔴 §5.3-2 핵심 — 서버가 "당신 것"이라고 확인해준 경우에만 관리 모드로 들어간다.
        // 아니면 폼을 채우지 않고(남의 데이터를 화면에 띄우는 것이 이번 사고의 본질) 조용히
        // 개설 화면(초기 상태)에 남는다. 포인터는 지우지 않는다 — 원래 주인이 다시 로그인하면
        // 살아나야 한다(§5.3-2 마지막 줄).
        if (!o.isOwner) return;

        setObituaryRef(ref);
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
        setObituaryUrl(`${window.location.origin}/o/${ref.obituarySlug}`);
        setMemorialUrl(`${window.location.origin}/m/${o.memorialSlug}`);
        // 개설 시 이미 완료한 동의 — 수정 화면에서 다시 요구하지 않는다(체크된 상태로 표시).
        setFalseReportAgreed(true);
        setResharedNoticeAck(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const addMourner = () => setMourners((prev) => [...prev, { name: '', relationship: '' }]);
  const updateMourner = (idx: number, field: keyof MournerDraft, value: string) =>
    setMourners((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  const removeMourner = (idx: number) => setMourners((prev) => prev.filter((_, i) => i !== idx));

  const requiredMissing = !deceasedName.trim() || !chiefMournerName.trim() || !funeralHall.trim() || !funeralAt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin?.();
      return;
    }
    if (requiredMissing) {
      setErrorMsg('고인 성함 · 상주 성함 · 빈소 위치 · 발인 일시는 필수입니다.');
      return;
    }
    if (!obituaryRef && (!falseReportAgreed || !resharedNoticeAck)) {
      setErrorMsg('허위 개설 고지와 재전파 고지에 모두 동의해야 합니다.');
      return;
    }
    if (accountEnabled && (!accountBankCode.trim() || !accountNumber.trim() || !accountHolder.trim())) {
      setErrorMsg('마음 전하실 곳을 켰다면 은행 · 계좌번호 · 예금주를 모두 입력해야 합니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setCopyFeedback(null);

    const token = sessionStorage.getItem('k_ending_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
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
    };

    try {
      if (!obituaryRef) {
        const res = await fetch(`${BACKEND_URL}/api/obituaries`, { method: 'POST', headers, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') {
          setErrorMsg(data.message || '부고장 개설에 실패했습니다.');
          return;
        }
        const ref: StoredObituaryRef = {
          obituaryId: data.data.obituaryId,
          obituarySlug: data.data.obituarySlug,
          memorialSlug: data.data.memorialSlug,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
        setObituaryRef(ref);
        setObituaryId(data.data.obituaryId);
        setObituaryUrl(data.data.obituaryUrl);
        setMemorialUrl(data.data.memorialUrl);
        setCardFieldsUpdatedAt(null);
        setUpdatedAt(new Date().toISOString());
      } else {
        // §5.3-2 — localStorage가 아니라 서버가 확인해준 obituaryId로 수정한다(obituaryRef가
        // 있다는 것 자체가 마운트 시 isOwner:true를 이미 통과했다는 뜻이라 obituaryId도 같이 있다).
        const res = await fetch(`${BACKEND_URL}/api/obituaries/${obituaryId}`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') {
          setErrorMsg(data.message || '부고장 수정에 실패했습니다.');
          return;
        }
        setUpdatedAt(data.data.updatedAt);
        if (data.data.cardFieldsChanged) {
          setCardFieldsUpdatedAt(data.data.cardFieldsUpdatedAt);
        }
      }
    } catch {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardInput = { deceasedName, funeralHall, mourningRoom, funeralAt, cardFieldsUpdatedAt };
  const cardTitle = formatObituaryCardTitle(cardInput);
  const cardDescription = formatObituaryCardDescription(cardInput);

  // 폴백 사다리(§7): 1순위 Kakao.Share → 2순위 Web Share API → 3순위 링크 복사.
  const handleShare = async () => {
    if (!obituaryUrl) return;
    setCopyFeedback(null);
    const params = { title: cardTitle, description: cardDescription, imageUrl: OBITUARY_CARD_IMAGE_URL, url: obituaryUrl, buttonLabel: '부고 보기' };
    if (shareViaKakao(params)) return;
    if (await shareViaWebShareApi(params)) return;
    const copied = await copyObituaryLink(obituaryUrl);
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
    const token = sessionStorage.getItem('k_ending_token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/obituaries/${obituaryId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setErrorMsg(data.message || '부고장 종료에 실패했습니다.');
        return;
      }
      setIsClosed(true);
      setClosedAt(data.data.closedAt);
    } catch {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsClosing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
          <MessageSquare color="var(--point-color)" size={40} style={{ marginBottom: '0.75rem' }} />
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

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#DEF7EC', color: '#03543F', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <MessageSquare size={18} color="#03543F" /> 모바일 부고장
        </div>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <MessageSquare color="var(--point-color)" size={32} /> {obituaryRef ? '내 부고장 관리' : '모바일 부고장 작성'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          {obituaryRef ? '입력한 내용은 즉시 부고장 페이지에 반영됩니다. 빈소·발인 등이 바뀌면 아래에서 고쳐주세요.' : '고인 성함, 상주, 빈소, 발인 일시만 입력하면 3분 안에 부고장을 만들 수 있습니다.'}
        </p>
      </div>

      {/* 00-29 §6.1 .auto-grid — 개설 전(단일 폼)은 강제 1열 유지, 관리 모드(2단)만 auto-fit로
          바꿔 min(280px,100%) 폴백을 태운다(기존 minmax(340px,1fr) 고정값은 375px에서 가로 스크롤 유발). */}
      <div
        className={obituaryRef ? 'auto-grid' : undefined}
        style={obituaryRef ? { alignItems: 'start' } : { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', alignItems: 'start' }}
      >
        {/* 작성 폼 */}
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <div className="form-group">
            <label className="form-label">고인 성함 *</label>
            <input value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="form-input" placeholder="예: 홍길동" required />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">상주 성함 *</label>
              <input value={chiefMournerName} onChange={(e) => setChiefMournerName(e.target.value)} className="form-input" placeholder="예: 홍상주" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">고인과의 관계</label>
              <input value={chiefMournerRelationship} onChange={(e) => setChiefMournerRelationship(e.target.value)} className="form-input" placeholder="상주" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">빈소 위치 *</label>
            <input value={funeralHall} onChange={(e) => setFuneralHall(e.target.value)} className="form-input" placeholder="예: 서울 평안 장례식장" required />
          </div>

          <div className="form-group">
            <label className="form-label">발인 일시 *</label>
            <input type="datetime-local" value={funeralAt} onChange={(e) => setFuneralAt(e.target.value)} className="form-input" required />
          </div>

          <div className="form-group">
            <label className="form-label">연락처</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="form-input" placeholder="010-0000-0000 (입력하면 부고장에 노출됩니다)" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              입력하신 번호는 부고장을 받은 모든 분에게 보입니다.
            </p>
          </div>

          {/* 마음 전하실 곳 — 명시적 토글, 기본 OFF(§6.2-2). 연락처와 달리 "입력=노출"이 아니라
              토글 자체가 경고를 띄울 자리다 — 켜는 순간 재전파 경고를 보여준다. */}
          <div className="form-group" style={{ backgroundColor: 'var(--secondary-color)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: accountEnabled ? '0.8rem' : 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.92rem' }}>
                <Heart size={16} color="var(--point-color)" /> 마음 전하실 곳
              </span>
              <input type="checkbox" checked={accountEnabled} onChange={(e) => setAccountEnabled(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            </label>

            {accountEnabled && (
              <>
                <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.7rem', lineHeight: 1.5 }}>
                  이 계좌번호는 부고장을 받은 분이 다시 공유할 수 있습니다.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input value={accountBankCode} onChange={(e) => setAccountBankCode(e.target.value)} className="form-input" placeholder="은행명 (예: 국민은행)" style={{ flex: 1 }} />
                  <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="form-input" placeholder="예금주" style={{ flex: 1 }} />
                </div>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="form-input" placeholder="계좌번호" />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMoreFields((v) => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--point-color)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: 0, marginBottom: '1rem' }}
          >
            {showMoreFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 선택 정보 더보기 (별세 일시·호실·입관·장지·유족 추가)
          </button>

          {showMoreFields && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">별세 일시</label>
                <input type="datetime-local" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">빈소 주소 (길찾기용)</label>
                <input value={funeralHallAddr} onChange={(e) => setFuneralHallAddr(e.target.value)} className="form-input" placeholder="예: 서울특별시 강남구 ..." />
              </div>
              <div className="form-group">
                <label className="form-label">호실</label>
                <input value={mourningRoom} onChange={(e) => setMourningRoom(e.target.value)} className="form-input" placeholder="예: 201호" />
              </div>
              <div className="form-group">
                <label className="form-label">입관</label>
                <input type="datetime-local" value={coffinAt} onChange={(e) => setCoffinAt(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">장지</label>
                <input value={burialSite} onChange={(e) => setBurialSite(e.target.value)} className="form-input" placeholder="예: OO추모공원" />
              </div>

              <div className="form-group">
                <label className="form-label">유족 추가</label>
                {mourners.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input value={m.relationship} onChange={(e) => updateMourner(idx, 'relationship', e.target.value)} className="form-input" placeholder="관계 (예: 장남)" style={{ flex: 1 }} />
                    <input value={m.name} onChange={(e) => updateMourner(idx, 'name', e.target.value)} className="form-input" placeholder="성함" style={{ flex: 1.5 }} />
                    <button type="button" onClick={() => removeMourner(idx)} className="btn" style={{ backgroundColor: 'var(--secondary-color)', padding: '0 0.8rem' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addMourner} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.85rem', height: '40px' }}>
                  <Plus size={16} /> 유족 추가
                </button>
              </div>
            </div>
          )}

          {!obituaryRef && (
            <div style={{ backgroundColor: 'var(--secondary-color)', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={falseReportAgreed} onChange={(e) => setFalseReportAgreed(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                <span>[필수] 허위로 부고장을 개설할 경우 법적 책임을 질 수 있다는 점에 동의합니다.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={resharedNoticeAck} onChange={(e) => setResharedNoticeAck(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                <span>[필수] 이 부고장을 전달받은 분이 다시 다른 곳에 공유할 수 있다는 점을 확인했습니다.</span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div style={{ fontSize: '0.85rem', color: '#991B1B', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
            {isSubmitting ? '처리 중...' : obituaryRef ? '수정 사항 저장' : '부고장 만들기'}
          </button>
        </form>

        {/* 미리보기 + (개설 후) 공유/관리 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#1A2B4C', color: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--box-shadow)' }}>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>카카오톡 카드 미리보기</p>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', overflow: 'hidden' }}>
              <img src={OBITUARY_CARD_IMAGE_URL} alt="근조 카드 이미지" style={{ width: '100%', height: '120px', objectFit: 'cover', backgroundColor: '#F1F5F9' }} />
              <div style={{ padding: '0.8rem 0.9rem' }}>
                <p style={{ color: '#1A2B4C', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.3rem 0' }}>
                  {cardTitle || '[부고] 故 ○○○ 님'}
                </p>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0, whiteSpace: 'pre-line' }}>
                  {cardDescription || '빈소·발인 정보를 입력하면 여기에 표시됩니다.'}
                </p>
              </div>
            </div>
          </div>

          {obituaryRef && (
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
              {isClosed ? (
                <>
                  <div style={{ display: 'flex', gap: '0.6rem', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.8rem 0.9rem', marginBottom: '1.1rem' }}>
                    <PowerOff size={18} color="#475569" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                      종료된 부고장입니다. 조문객은 더 이상 이 링크로 볼 수 없습니다{closedAt ? ` (${formatKST(closedAt)} 종료)` : ' (발인 3일 경과로 자동 종료)'}.
                    </p>
                  </div>
                  <a href={memorialUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'underline' }}>
                    연결된 추모관은 계속 열람할 수 있습니다 →
                  </a>
                </>
              ) : (
                <>
                  {cardFieldsUpdatedAt && (
                    <div style={{ display: 'flex', gap: '0.6rem', backgroundColor: '#FFEDD5', border: '1px solid #FDBA74', borderRadius: '8px', padding: '0.8rem 0.9rem', marginBottom: '1.1rem' }}>
                      <AlertTriangle size={18} color="#9A3412" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <p style={{ fontSize: '0.85rem', color: '#7C2D12', margin: 0, lineHeight: 1.5 }}>
                        이미 보낸 카드에는 반영되지 않습니다. 아래 버튼으로 다시 공유해 주세요.
                      </p>
                    </div>
                  )}

                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.9rem', fontSize: '1.05rem' }}>부고장 공유</h3>

                  <button onClick={handleShare} className="btn btn-point" style={{ width: '100%', marginBottom: '0.6rem' }}>
                    <Send size={16} /> 카카오톡으로 부고 알리기
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <button onClick={handleCopyLink} className="btn" style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.85rem' }}>
                      <Copy size={15} /> 링크 복사
                    </button>
                    <a href={buildObituarySmsHref(obituaryUrl, deceasedName)} className="btn" style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none' }}>
                      문자로 보내기
                    </a>
                  </div>
                  {copyFeedback && <p style={{ fontSize: '0.85rem', color: 'var(--point-color)', margin: '0 0 0.6rem 0' }}>{copyFeedback}</p>}

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', wordBreak: 'break-all', backgroundColor: 'var(--secondary-color)', borderRadius: '6px', padding: '0.6rem 0.7rem', marginBottom: '0.6rem' }}>
                    {obituaryUrl}
                  </div>

                  <a href={memorialUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'underline' }}>
                    연결된 추모관 미리 보기 →
                  </a>

                  {updatedAt && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
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
                      style={{ width: '100%', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                    >
                      <PowerOff size={16} /> {isClosing ? '종료 중...' : '부고장 종료'}
                    </button>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
                      종료하면 조문객이 더 이상 이 링크로 볼 수 없습니다(연락처·계좌 노출 방지, 되돌릴 수 없음). 종료하지 않아도 발인 3일 후 자동으로 종료됩니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
