import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Mail, CheckCircle2, XCircle, Pencil, Save, X, Search } from 'lucide-react';
import { BACKEND_URL, formatPhoneForDisplay } from '../config';
import { AddressSearchModal } from '../components/AddressSearchModal';

// 운영자 전용 — 사업자(Partner)·전문가(Expert) 가입 심사 + 시설 클레임(연동) 심사.
// docs/01-05 §6.2, docs/02-02. 계정은 seed-admin.ts로만 생성되므로 여기엔 가입 폼이 없다.
// 공개 메뉴·Footer 어디에도 링크하지 않는다 — 직접 URL(#admin)로만 접근.

// 00-37 §6 A-2 — MEMORIALS·DIGITAL_PLATFORMS·CONSULT_REQUESTS·MEMBERS 4개 추가(이미 만든
// API에 화면만 붙인다, 서버 변경 최소).
type QueueTab = 'PARTNERS' | 'EXPERTS' | 'CLAIMS' | 'FACILITIES' | 'FAREWELL_PURGE' | 'MEMORIALS' | 'DIGITAL_PLATFORMS' | 'CONSULT_REQUESTS' | 'MEMBERS';

const TAB_LABELS: Record<QueueTab, string> = {
  PARTNERS: '사업자 가입',
  EXPERTS: '전문가 가입',
  CLAIMS: '시설 연동',
  FACILITIES: '전체 시설',
  FAREWELL_PURGE: '유족메시지 파기',
  MEMORIALS: '추모관',
  DIGITAL_PLATFORMS: '디지털 카탈로그',
  CONSULT_REQUESTS: '상담 신청',
  MEMBERS: '회원',
};

// 06-05 §5.6-8-3 D-11 — 선택 대상 하나(파기 목록의 ①음성/②편지 행)
type PurgeItem = { id: string; type: 'MEDIA' | 'LETTER'; title: string | null; expiredAt: string; hasMedia?: boolean };

const EXPERT_CATEGORY_LABELS: Record<string, string> = {
  LAWYER: '변호사',
  TAX_ACCOUNTANT: '세무사',
  ADMINISTRATIVE_SCRIVENER: '행정사',
  FUNERAL_DIRECTOR: '장례지도사',
};

// 카드 안의 텍스트(0.8~0.85rem)에 맞춘 컴팩트 버튼/입력 크기 — 기본 .btn/.form-select는
// 시니어 접근성용 56px/52px 터치 타겟이라 이 조밀한 운영자 목록 안에서는 과하게 커 보였다.
const SMALL_BTN: React.CSSProperties = { height: '34px', padding: '0 0.9rem', fontSize: '0.85rem', borderRadius: 'var(--r-sm)' };
const TAB_BTN: React.CSSProperties = { height: '38px', padding: '0 1rem', fontSize: '0.85rem', borderRadius: 'var(--r-sm)' };
const SMALL_INPUT: React.CSSProperties = { height: '38px', fontSize: '0.85rem' };

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eobom_admin_token'));
  const [adminName, setAdminName] = useState<string | null>(() => localStorage.getItem('eobom_admin_name'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tab, setTab] = useState<QueueTab>('PARTNERS');
  const [partners, setPartners] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [memberSearch, setMemberSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');

  // 전체 시설 DB 조회 (기존 공개 검색 API `/api/facilities` 재사용 — 새 백엔드 불필요, 1,552건 규모라 페이지네이션)
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityPage, setFacilityPage] = useState(1);
  const [facilityTotalPages, setFacilityTotalPages] = useState(1);
  const [facilityCount, setFacilityCount] = useState(0);
  const [facilityLoading, setFacilityLoading] = useState(false);

  // 사업자 담당자명/연락처, 전문가 연락처/소개 인라인 수정 상태 (검증된 신원 필드는 대상 아님)
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerEditForm, setPartnerEditForm] = useState({ ownerName: '', contactName: '', contactPhone: '' });
  const [editingExpertId, setEditingExpertId] = useState<string | null>(null);
  const [expertEditForm, setExpertEditForm] = useState({ contactPhone: '', officeAddress: '', bio: '' });
  const [showAddressSearch, setShowAddressSearch] = useState(false);

  // 06-05 §5.6-8-3 D-11 — 유족 메시지 파기 화면. 만료분 목록(①음성/②편지) + 선택 파기 +
  // 아카이브 2단계 미이행 목록. 🔴 일괄 버튼 없음 — 건별 선택만(§5.6-8-3-2).
  const [farewellMedia, setFarewellMedia] = useState<PurgeItem[]>([]);
  const [farewellLetter, setFarewellLetter] = useState<PurgeItem[]>([]);
  const [pendingArchive, setPendingArchive] = useState<any[]>([]);
  const [selectedPurge, setSelectedPurge] = useState<Set<string>>(new Set()); // key = `${type}:${id}`
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeCountInput, setPurgeCountInput] = useState('');
  const [purgePassword, setPurgePassword] = useState('');
  const [purgeError, setPurgeError] = useState('');
  const [purgeSubmitting, setPurgeSubmitting] = useState(false);

  // 00-37 §6 A-2 #5 — 추모관 목록 + 방명록 숨김
  // 🔄 09-07 — 조문객 self-report 버튼이 없어져 새 reportedAt이 더 안 채워진다("미확인 신고만
  // 보기" 체크박스 자체를 없앰) — 항상 전체 목록을 본다.
  const [memorials, setMemorials] = useState<any[]>([]);
  const [openGuestbookId, setOpenGuestbookId] = useState<string | null>(null);
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([]);
  const [guestbookLoading, setGuestbookLoading] = useState(false);

  // 00-37 §6 A-2 #6 — 디지털 플랫폼 안내 카탈로그 CRUD
  const [digitalPlatforms, setDigitalPlatforms] = useState<any[]>([]);
  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [platformForm, setPlatformForm] = useState({
    name: '', category: 'EMAIL', actionType: 'DELETE', officialUrl: '', guideSummary: '', estimatedDays: '', needsAgentHelp: false,
  });
  const [platformSubmitting, setPlatformSubmitting] = useState(false);

  // 00-37 §6 A-2 #7 — 상담 신청 전체 조회(읽기 전용)
  const [consultRequests, setConsultRequests] = useState<any[]>([]);
  const [consultStatusFilter, setConsultStatusFilter] = useState('');

  // 00-37 §6 A-2 #8 — 회원 목록 + 상세(열람 시 서버가 AdminAuditLog를 남긴다, §3.2)
  const [members, setMembers] = useState<any[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberCount, setMemberCount] = useState(0);
  const [memberLoading, setMemberLoading] = useState(false);
  const [openMemberDetail, setOpenMemberDetail] = useState<any | null>(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    setSessionNotice('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setLoginError(data.message || '로그인에 실패했습니다.');
        return;
      }
      localStorage.setItem('eobom_admin_token', data.accessToken);
      localStorage.setItem('eobom_admin_refresh_token', data.refreshToken);
      localStorage.setItem('eobom_admin_name', data.admin.name);
      setToken(data.accessToken);
      setAdminName(data.admin.name);
    } catch {
      setLoginError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = (notice?: string) => {
    localStorage.removeItem('eobom_admin_token');
    localStorage.removeItem('eobom_admin_refresh_token');
    localStorage.removeItem('eobom_admin_name');
    setToken(null);
    setAdminName(null);
    setSessionNotice(notice || '');
  };

  // 인증 헤더 fetch 공통 래퍼 — 액세스 토큰(2h) 만료로 401이 오면 로그인 화면으로 되돌리고
  // 세션 만료 안내를 띄운다. 이게 없으면 토큰이 죽어도 화면은 "로그인된 것처럼" 보이면서
  // 데이터만 조용히 비어버린다(실제로 있었던 버그).
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), ...authHeaders } });
    if (res.status === 401) {
      handleLogout('세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.');
      return null;
    }
    return res;
  };

  const loadQueue = async () => {
    if (!token) return;
    setLoadError('');
    try {
      if (tab === 'PARTNERS') {
        const res = await authFetch(`${BACKEND_URL}/api/admin/partners?status=${statusFilter}`);
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') setPartners(data.data);
        else setLoadError(data.message || '조회 실패');
      } else if (tab === 'EXPERTS') {
        const res = await authFetch(`${BACKEND_URL}/api/admin/experts?status=${statusFilter}`);
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') setExperts(data.data);
        else setLoadError(data.message || '조회 실패');
      } else {
        const res = await authFetch(`${BACKEND_URL}/api/admin/claims?status=${statusFilter}`);
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') setClaims(data.data);
        else setLoadError(data.message || '조회 실패');
      }
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 전체 시설 DB 조회/검색 — 공개 API라 인증 헤더 불필요, 관리자 로그인 뒤 화면에서만 노출
  const loadFacilities = async (page = 1) => {
    setFacilityLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (facilitySearch.trim()) params.set('q', facilitySearch.trim());
      const res = await fetch(`${BACKEND_URL}/api/facilities?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setFacilities(data.data);
        setFacilityPage(data.page);
        setFacilityTotalPages(data.totalPages);
        setFacilityCount(data.count);
      } else {
        setLoadError(data.message || '조회 실패');
      }
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setFacilityLoading(false);
    }
  };

  // 06-05 §5.6-8-3-2 D-11 — 만료 대상(①②) + 아카이브 2단계 미이행 목록을 함께 불러온다.
  const loadFarewellPurge = async () => {
    if (!token) return;
    setLoadError('');
    setSelectedPurge(new Set());
    try {
      const [expiredRes, pendingRes] = await Promise.all([
        authFetch(`${BACKEND_URL}/api/admin/farewell-purge/expired`),
        authFetch(`${BACKEND_URL}/api/admin/farewell-purge/pending-archive`),
      ]);
      if (!expiredRes || !pendingRes) return;
      const expiredData = await expiredRes.json();
      const pendingData = await pendingRes.json();
      if (expiredData.status === 'success') {
        setFarewellMedia(
          expiredData.data.media.map((r: any) => ({ id: r.id, type: 'MEDIA', title: r.title, expiredAt: r.mediaDeletedAt })),
        );
        setFarewellLetter(
          expiredData.data.letter.map((r: any) => ({ id: r.id, type: 'LETTER', title: r.title, expiredAt: r.deletedAt, hasMedia: r.hasMedia })),
        );
      } else {
        setLoadError(expiredData.message || '조회 실패');
      }
      if (pendingData.status === 'success') setPendingArchive(pendingData.data);
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 00-37 §6 A-2 #5 — 추모관 전체 목록.
  const loadMemorials = async () => {
    if (!token) return;
    setLoadError('');
    setOpenGuestbookId(null);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/memorials?reported=false`);
      if (!res) return;
      const data = await res.json();
      if (data.status === 'success') setMemorials(data.data);
      else setLoadError(data.message || '조회 실패');
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const decideMemorial = async (id: string, decision: 'RESTORE' | 'CONFIRM', visibility?: 'LINK' | 'PUBLIC') => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/memorials/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, visibility }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) alert(data.message || '처리 실패');
    loadMemorials();
  };

  // 🔵 00-37 문서엔 없던 신규 엔드포인트(GET .../guestbook) — 방명록 숨김을 실제로 쓰려면
  // 어떤 글을 숨길지 봐야 하는데 그 목록을 볼 방법이 없어서 백엔드에 최소로 추가했다(편차).
  const loadGuestbook = async (memorialId: string) => {
    setOpenGuestbookId(memorialId);
    setGuestbookLoading(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/memorials/${memorialId}/guestbook`);
      if (!res) return;
      const data = await res.json();
      if (data.status === 'success') setGuestbookEntries(data.data);
      else setLoadError(data.message || '조회 실패');
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setGuestbookLoading(false);
    }
  };

  // "방명록 보기" 버튼 하나로 여닫는다(사용자 지시, 09-07 재정정) — 열려 있으면 닫고,
  // 닫혀 있으면 loadGuestbook으로 불러와 연다.
  const toggleGuestbook = (memorialId: string) => {
    if (openGuestbookId === memorialId) {
      setOpenGuestbookId(null);
    } else {
      loadGuestbook(memorialId);
    }
  };

  // 🔴 이건 "방명록 보기/닫기"(화면을 여닫는 것)와 다른 기능이다 — 방명록 글 하나를 실제로
  // 비공개 처리하는 모더레이션 액션. 지금은 웹에 신고 버튼이 없으므로(wt151), 유선·카톡 문의
  // 등으로 신고가 들어왔을 때 운영자가 이 버튼으로 대신 처리하라고 있는 것이다(사용자 설명, 09-07).
  const hideGuestbookEntry = async (memorialId: string, gid: string) => {
    if (!window.confirm('이 방명록을 강제로 비공개 처리합니다. 계속하시겠습니까?')) return;
    const res = await authFetch(`${BACKEND_URL}/api/admin/memorials/${memorialId}/guestbook/${gid}/hide`, { method: 'PATCH' });
    if (!res) return;
    loadGuestbook(memorialId);
  };

  // 00-37 §6 A-2 #6 — 디지털 플랫폼 안내 카탈로그
  const loadDigitalPlatforms = async () => {
    if (!token) return;
    setLoadError('');
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/digital-platforms`);
      if (!res) return;
      const data = await res.json();
      if (data.status === 'success') setDigitalPlatforms(data.data);
      else setLoadError(data.message || '조회 실패');
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const submitNewPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformForm.name.trim() || !platformForm.guideSummary.trim()) {
      alert('표시명과 절차 요약은 필수입니다.');
      return;
    }
    setPlatformSubmitting(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/digital-platforms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...platformForm,
          officialUrl: platformForm.officialUrl.trim() || undefined,
          estimatedDays: platformForm.estimatedDays ? Number(platformForm.estimatedDays) : undefined,
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '등록에 실패했습니다.');
        return;
      }
      setPlatformForm({ name: '', category: 'EMAIL', actionType: 'DELETE', officialUrl: '', guideSummary: '', estimatedDays: '', needsAgentHelp: false });
      setShowPlatformForm(false);
      loadDigitalPlatforms();
    } finally {
      setPlatformSubmitting(false);
    }
  };

  // 공개 토글 — 공개로 켜려면 서버가 lastVerifiedAt을 요구한다(§3.1). 켜는 시점에 오늘 날짜로 확인일을 같이 채운다.
  const togglePlatformPublish = async (p: any) => {
    const nextPublished = !p.isPublished;
    if (nextPublished && !p.lastVerifiedAt && !window.confirm('최종 확인일이 없습니다. 오늘 날짜로 확인 처리하고 공개하시겠습니까?')) return;
    const res = await authFetch(`${BACKEND_URL}/api/admin/digital-platforms/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: nextPublished, ...(nextPublished && !p.lastVerifiedAt ? { lastVerifiedAt: new Date().toISOString() } : {}) }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) alert(data.message || '변경 실패');
    loadDigitalPlatforms();
  };

  // 00-37 §6 A-2 #7 — 상담 신청 조회(읽기 전용, 문서에 승인/거절 액션 없음)
  const loadConsultRequests = async () => {
    if (!token) return;
    setLoadError('');
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/consult-requests${consultStatusFilter ? `?status=${consultStatusFilter}` : ''}`);
      if (!res) return;
      const data = await res.json();
      if (data.status === 'success') setConsultRequests(data.data);
      else setLoadError(data.message || '조회 실패');
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 00-37 §6 A-2 #8 — 회원 목록(페이지네이션, FACILITIES 탭과 같은 응답 형태 재사용)
  const loadMembers = async (page = 1) => {
    if (!token) return;
    setMemberLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (memberQuery.trim()) params.set('q', memberQuery.trim());
      const res = await authFetch(`${BACKEND_URL}/api/admin/users?${params.toString()}`);
      if (!res) return;
      const data = await res.json();
      if (data.status === 'success') {
        setMembers(data.data);
        setMemberPage(data.page);
        setMemberTotalPages(data.totalPages);
        setMemberCount(data.count);
      } else {
        setLoadError(data.message || '조회 실패');
      }
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setMemberLoading(false);
    }
  };

  // 🔴 이 조회는 서버가 AdminAuditLog에 VIEW 기록을 남긴다(§3.2) — 클릭할 때마다 기록된다.
  const openMember = async (id: string) => {
    setMemberDetailLoading(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/users/${id}`);
      if (!res) return;
      const data = await res.json();
      if (data.status === 'success') setOpenMemberDetail(data.data);
      else alert(data.message || '조회 실패');
    } finally {
      setMemberDetailLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'FACILITIES') {
      loadFacilities(1);
    } else if (tab === 'FAREWELL_PURGE') {
      loadFarewellPurge();
    } else if (tab === 'MEMORIALS') {
      loadMemorials();
    } else if (tab === 'DIGITAL_PLATFORMS') {
      loadDigitalPlatforms();
    } else if (tab === 'CONSULT_REQUESTS') {
      loadConsultRequests();
    } else if (tab === 'MEMBERS') {
      loadMembers(1);
    } else {
      loadQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab, statusFilter]);

  // 상담 상태 필터는 그 탭에 있을 때만 다시 불러온다(탭 전환 useEffect와 별개)
  useEffect(() => {
    if (tab === 'CONSULT_REQUESTS') loadConsultRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultStatusFilter]);

  const togglePurgeSelection = (key: string) => {
    setSelectedPurge((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openPurgeConfirm = () => {
    if (selectedPurge.size === 0) return;
    setPurgeCountInput('');
    setPurgePassword('');
    setPurgeError('');
    setShowPurgeConfirm(true);
  };

  // 🔴 실행 직전 대상 건수를 사람이 직접 입력해 확인 + 비밀번호 재인증(§5.6-8-3-3 #57·#58).
  const submitPurgeConfirm = async () => {
    setPurgeError('');
    const items: PurgeItem[] = Array.from(selectedPurge).map((key) => {
      const [type, id] = key.split(':');
      return { id, type: type as 'MEDIA' | 'LETTER' } as PurgeItem;
    });
    if (Number(purgeCountInput) !== items.length) {
      setPurgeError(`입력한 건수가 선택된 건수(${items.length}건)와 다릅니다.`);
      return;
    }
    if (!purgePassword) {
      setPurgeError('비밀번호를 입력해주세요.');
      return;
    }
    setPurgeSubmitting(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/admin/farewell-purge/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({ id: it.id, type: it.type })),
          expectedCount: items.length,
          password: purgePassword,
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setPurgeError(data.message || '파기 처리에 실패했습니다.');
        return;
      }
      setShowPurgeConfirm(false);
      loadFarewellPurge();
    } catch {
      setPurgeError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setPurgeSubmitting(false);
    }
  };

  // 아카이브 2단계(사람이 Cloudflare에서 직접 지움) 완료 표시 — 화면은 아카이브를 지우지 않는다(#59).
  const completeArchiveItem = async (id: string) => {
    if (!window.confirm('Cloudflare 대시보드에서 이 키를 이미 지웠습니까? 완료로 표시합니다.')) return;
    const res = await authFetch(`${BACKEND_URL}/api/admin/farewell-purge/pending-archive/${id}/complete`, { method: 'PATCH' });
    if (!res) return;
    loadFarewellPurge();
  };

  // 사업자/전문가 "전체 회원" 검색 — 목록 규모가 작아(수십~수백 건) 클라이언트에서 필터
  const normalizedSearch = memberSearch.trim().toLowerCase();
  const filteredPartners = normalizedSearch
    ? partners.filter((p) => [p.companyName, p.ownerName, p.contactName, p.email].some((v) => (v || '').toLowerCase().includes(normalizedSearch)))
    : partners;
  const filteredExperts = normalizedSearch
    ? experts.filter((ex) => [ex.name, ex.email, ex.licenseNo].some((v) => (v || '').toLowerCase().includes(normalizedSearch)))
    : experts;

  const decidePartner = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const rejectReason = status === 'REJECTED' ? window.prompt('반려 사유를 입력해주세요') || '' : undefined;
    const res = await authFetch(`${BACKEND_URL}/api/admin/partners/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectReason }),
    });
    if (!res) return;
    loadQueue();
  };

  const decideExpert = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const rejectReason = status === 'REJECTED' ? window.prompt('반려 사유를 입력해주세요') || '' : undefined;
    const res = await authFetch(`${BACKEND_URL}/api/admin/experts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectReason }),
    });
    if (!res) return;
    loadQueue();
  };

  const startEditPartner = (p: any) => {
    setEditingPartnerId(p.id);
    setPartnerEditForm({ ownerName: p.ownerName || '', contactName: p.contactName || '', contactPhone: p.contactPhone || '' });
  };

  const saveEditPartner = async (id: string) => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partnerEditForm),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '정보 수정에 실패했습니다.');
      return;
    }
    setEditingPartnerId(null);
    loadQueue();
  };

  const startEditExpert = (ex: any) => {
    setEditingExpertId(ex.id);
    setExpertEditForm({ contactPhone: ex.contactPhone || '', officeAddress: ex.officeAddress || '', bio: ex.bio || '' });
  };

  const saveEditExpert = async (id: string) => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/experts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expertEditForm),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '정보 수정에 실패했습니다.');
      return;
    }
    setEditingExpertId(null);
    loadQueue();
  };

  // 전문가 공개 노출 토글 (docs 02-03 §5.4) — 승인(status)과 별개 축. 승인된 전문가만 켤 수 있다.
  const toggleExpertPublish = async (id: string, isPublished: boolean) => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/experts/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) alert(data.message || '공개 설정 변경에 실패했습니다.');
    loadQueue();
  };

  const decideClaim = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const reviewNote = window.prompt(status === 'APPROVED' ? '승인 메모(선택)' : '반려 사유를 입력해주세요') || '';
    const res = await authFetch(`${BACKEND_URL}/api/admin/claims/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) alert(data.message || '처리 실패');
    loadQueue();
  };

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '420px', padding: '2.75rem 1rem' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--r-lg)', padding: '1.75rem', boxShadow: 'var(--box-shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
            <ShieldCheck size={32} color="var(--point-color)" />
            <h2 style={{ color: 'var(--primary-color)', margin: '0.6rem 0 0 0' }}>운영자 로그인</h2>
          </div>
          {sessionNotice && (
            <div style={{ backgroundColor: 'var(--state-warn-bg)', color: 'var(--state-warn-fg)', padding: '0.7rem 0.9rem', borderRadius: 'var(--r-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {sessionNotice}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">이메일</label>
              <div style={{ position: 'relative' }}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-select" style={{ paddingLeft: '2.4rem' }} />
                <Mail size={16} style={{ position: 'absolute', left: '0.8rem', top: '12px', color: 'var(--text-hint)' }} />
              </div>
            </div>
            <div>
              <label className="form-label">비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="form-select" style={{ paddingLeft: '2.4rem' }} />
                <Lock size={16} style={{ position: 'absolute', left: '0.8rem', top: '12px', color: 'var(--text-hint)' }} />
              </div>
            </div>
            {loginError && <div style={{ color: 'var(--state-danger-fg)', fontSize: '0.85rem' }}>{loginError}</div>}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? '처리 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '1.75rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', fontWeight: 'var(--fw-bold)' }}>운영자 승인 대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{adminName}님</span>
          <button onClick={() => handleLogout()} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--secondary-dark)' }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['PARTNERS', 'EXPERTS', 'CLAIMS', 'FACILITIES', 'FAREWELL_PURGE', 'MEMORIALS', 'DIGITAL_PLATFORMS', 'CONSULT_REQUESTS', 'MEMBERS'] as QueueTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn"
            style={{
              ...TAB_BTN,
              backgroundColor: tab === t ? 'var(--primary-color)' : 'var(--card-bg)',
              color: tab === t ? '#FFFFFF' : 'var(--primary-color)',
              border: '1px solid var(--border-color)',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}

        {tab === 'FACILITIES' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadFacilities(1);
            }}
            style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}
          >
            <input value={facilitySearch} onChange={(e) => setFacilitySearch(e.target.value)} placeholder="시설명 검색" className="form-select" style={{ ...SMALL_INPUT, width: '200px' }} />
            <button type="submit" className="btn btn-primary" style={TAB_BTN}>검색</button>
          </form>
        ) : tab === 'FAREWELL_PURGE' ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>선택 {selectedPurge.size}건</span>
            <button onClick={openPurgeConfirm} disabled={selectedPurge.size === 0} className="btn" style={{ ...TAB_BTN, backgroundColor: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)', opacity: selectedPurge.size === 0 ? 0.5 : 1 }}>
              선택 파기
            </button>
            <button onClick={loadFarewellPurge} className="btn" style={{ ...TAB_BTN, backgroundColor: 'var(--surface-subtle)' }}>
              새로고침
            </button>
          </div>
        ) : tab === 'MEMORIALS' ? null : tab === 'DIGITAL_PLATFORMS' ? (
          <button onClick={() => setShowPlatformForm((v) => !v)} className="btn btn-primary" style={{ ...TAB_BTN, marginLeft: 'auto' }}>
            {showPlatformForm ? '등록 취소' : '신규 등록'}
          </button>
        ) : tab === 'CONSULT_REQUESTS' ? (
          <select value={consultStatusFilter} onChange={(e) => setConsultStatusFilter(e.target.value)} className="form-select" style={{ ...SMALL_INPUT, width: '140px', marginLeft: 'auto' }}>
            <option value="">전체</option>
            <option value="REQUESTED">신청됨</option>
            <option value="ACCEPTED">수락됨</option>
            <option value="COMPLETED">완료됨</option>
            <option value="CANCELLED">취소됨</option>
            <option value="INVALID">무효</option>
          </select>
        ) : tab === 'MEMBERS' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadMembers(1);
            }}
            style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}
          >
            <input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="이름·이메일 검색" className="form-select" style={{ ...SMALL_INPUT, width: '200px' }} />
            <button type="submit" className="btn btn-primary" style={TAB_BTN}>검색</button>
          </form>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="이름·상호·이메일 검색" className="form-select" style={{ ...SMALL_INPUT, width: '200px' }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ ...SMALL_INPUT, width: '140px' }}>
              <option value="">전체</option>
              <option value="PENDING">심사 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">반려됨</option>
              {tab !== 'CLAIMS' && <option value="SUSPENDED">정지됨</option>}
            </select>
          </div>
        )}
      </div>

      {loadError && <div style={{ color: 'var(--state-danger-fg)', marginBottom: '1rem' }}>{loadError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {tab === 'PARTNERS' &&
          (filteredPartners.length === 0 ? (
            <EmptyState />
          ) : (
            filteredPartners.map((p) => (
              <div key={p.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                {editingPartnerId === p.id ? (
                  <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{p.companyName}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                        대표 {p.ownerName} · 사업자번호 {p.bizRegNo} · {p.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <input
                        value={partnerEditForm.ownerName}
                        onChange={(e) => setPartnerEditForm((f) => ({ ...f, ownerName: e.target.value }))}
                        placeholder="대표자명"
                        className="form-select"
                        style={{ ...SMALL_INPUT, flex: 1, minWidth: '140px' }}
                      />
                      <input
                        value={partnerEditForm.contactName}
                        onChange={(e) => setPartnerEditForm((f) => ({ ...f, contactName: e.target.value }))}
                        placeholder="담당자명"
                        className="form-select"
                        style={{ ...SMALL_INPUT, flex: 1, minWidth: '140px' }}
                      />
                      <input
                        value={partnerEditForm.contactPhone}
                        onChange={(e) => setPartnerEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                        placeholder="연락처"
                        className="form-select"
                        style={{ ...SMALL_INPUT, flex: 1, minWidth: '140px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => saveEditPartner(p.id)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Save size={14} /> 저장
                      </button>
                      <button onClick={() => setEditingPartnerId(null)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{p.companyName}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                      대표 {p.ownerName} · 사업자번호 {p.bizRegNo} · 담당 {p.contactName}({formatPhoneForDisplay(p.contactPhone)}) · {p.email}
                    </span>
                    {p.rejectReason && <div style={{ color: 'var(--state-danger-fg)', fontSize: '0.85rem' }}>반려 사유: {p.rejectReason}</div>}
                  </div>
                )}
                {editingPartnerId !== p.id && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEditPartner(p)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Pencil size={14} /> 정보 수정
                    </button>
                    {p.status === 'PENDING' && (
                      <>
                        <ApproveButton onClick={() => decidePartner(p.id, 'APPROVED')} />
                        <RejectButton onClick={() => decidePartner(p.id, 'REJECTED')} />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'EXPERTS' &&
          (filteredExperts.length === 0 ? (
            <EmptyState />
          ) : (
            filteredExperts.map((ex) => (
              <div key={ex.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                {editingExpertId === ex.id ? (
                  <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{ex.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                        자격번호 {ex.licenseNo} {ex.licenseOrg && `(${ex.licenseOrg})`} · {ex.email}
                      </span>
                    </div>
                    <input
                      value={expertEditForm.contactPhone}
                      onChange={(e) => setExpertEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                      placeholder="연락처"
                      className="form-select"
                      style={SMALL_INPUT}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={expertEditForm.officeAddress}
                        onChange={(e) => setExpertEditForm((f) => ({ ...f, officeAddress: e.target.value }))}
                        placeholder="사무실 주소"
                        className="form-select"
                        style={{ ...SMALL_INPUT, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddressSearch(true)}
                        className="btn"
                        style={{ ...SMALL_BTN, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                      >
                        <Search size={14} /> 검색
                      </button>
                    </div>
                    <textarea
                      value={expertEditForm.bio}
                      onChange={(e) => setExpertEditForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="소개"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem', height: '60px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => saveEditExpert(ex.id)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Save size={14} /> 저장
                      </button>
                      <button onClick={() => setEditingExpertId(null)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{ex.name}</strong>
                    <span style={{ fontSize: '0.85rem', backgroundColor: 'var(--secondary-color)', padding: '0.15rem 0.5rem', borderRadius: 'var(--r-sm)', marginLeft: '0.5rem' }}>
                      {EXPERT_CATEGORY_LABELS[ex.category] || ex.category}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                      자격번호 {ex.licenseNo} {ex.licenseOrg && `(${ex.licenseOrg})`} · {formatPhoneForDisplay(ex.contactPhone)} · {ex.email}
                    </span>
                    {ex.officeAddress && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>사무실: {ex.officeAddress}</div>}
                    {ex.bio && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{ex.bio}</div>}
                    {ex.rejectReason && <div style={{ color: 'var(--state-danger-fg)', fontSize: '0.85rem' }}>반려 사유: {ex.rejectReason}</div>}
                  </div>
                )}
                {editingExpertId !== ex.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => startEditExpert(ex)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Pencil size={14} /> 정보 수정
                    </button>
                    {ex.status === 'PENDING' && (
                      <>
                        <ApproveButton onClick={() => decideExpert(ex.id, 'APPROVED')} />
                        <RejectButton onClick={() => decideExpert(ex.id, 'REJECTED')} />
                      </>
                    )}
                    {ex.status === 'APPROVED' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!ex.isPublished} onChange={(e) => toggleExpertPublish(ex.id, e.target.checked)} />
                        소비자 화면 공개
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'CLAIMS' &&
          (claims.length === 0 ? (
            <EmptyState />
          ) : (
            claims.map((c) => (
              <div key={c.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{c.facility?.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                    {c.facility?.location} · 신청 사업자: {c.partner?.companyName}({c.partner?.email})
                  </span>
                  {c.reviewNote && <div style={{ color: 'var(--state-warn-fg)', fontSize: '0.85rem' }}>메모: {c.reviewNote}</div>}
                </div>
                {c.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ApproveButton onClick={() => decideClaim(c.id, 'APPROVED')} />
                    <RejectButton onClick={() => decideClaim(c.id, 'REJECTED')} />
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'FACILITIES' &&
          (facilityLoading ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
          ) : facilities.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                {facilities.map((f) => (
                  <div key={f.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '0.95rem' }}>{f.name}</strong>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--r-sm)',
                          whiteSpace: 'nowrap',
                          backgroundColor: f.isPartner ? 'var(--state-ok-bg)' : 'var(--surface-subtle)',
                          color: f.isPartner ? 'var(--state-ok-fg)' : 'var(--text-muted)',
                        }}
                      >
                        {f.isPartner ? '연동됨' : '미연동'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', backgroundColor: 'var(--secondary-color)', padding: '0.1rem 0.4rem', borderRadius: 'var(--r-sm)' }}>{f.type}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.4rem' }}>{f.location}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginTop: '0.8rem' }}>
                <button disabled={facilityPage <= 1} onClick={() => loadFacilities(facilityPage - 1)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', opacity: facilityPage <= 1 ? 0.5 : 1 }}>
                  이전
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {facilityPage} / {facilityTotalPages} 페이지 (총 {facilityCount}건)
                </span>
                <button disabled={facilityPage >= facilityTotalPages} onClick={() => loadFacilities(facilityPage + 1)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', opacity: facilityPage >= facilityTotalPages ? 0.5 : 1 }}>
                  다음
                </button>
              </div>
            </>
          ))}

        {tab === 'FAREWELL_PURGE' && (
          <>
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                ① 음성만 만료 (유예 30일 경과, 편지는 살아 있음) — {farewellMedia.length}건
              </h3>
              {farewellMedia.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  {farewellMedia.map((item) => {
                    const key = `MEDIA:${item.id}`;
                    return (
                      <label key={key} className="card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedPurge.has(key)} onChange={() => togglePurgeSelection(key)} />
                        <span style={{ fontSize: '0.9rem' }}>{item.title || '(제목 없음)'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          음성 삭제 {item.expiredAt ? new Date(item.expiredAt).toLocaleDateString() : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                ② 편지 전체 만료 (유예 30일 경과, 행 파기 대상) — {farewellLetter.length}건
              </h3>
              {farewellLetter.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  {farewellLetter.map((item) => {
                    const key = `LETTER:${item.id}`;
                    return (
                      <label key={key} className="card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedPurge.has(key)} onChange={() => togglePurgeSelection(key)} />
                        <span style={{ fontSize: '0.9rem' }}>{item.title || '(제목 없음)'}</span>
                        {item.hasMedia && <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--secondary-color)', padding: '0.1rem 0.4rem', borderRadius: 'var(--r-sm)' }}>첨부 포함</span>}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          편지 삭제 {item.expiredAt ? new Date(item.expiredAt).toLocaleDateString() : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                아카이브 2단계 미이행 (Cloudflare 대시보드에서 직접 지운 뒤 완료 표시) — {pendingArchive.length}건
              </h3>
              {pendingArchive.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pendingArchive.map((p) => (
                    <div key={p.id} className="card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{p.mediaKey}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.bucket}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        1단계 {new Date(p.queuedAt).toLocaleDateString()}
                      </span>
                      <button onClick={() => completeArchiveItem(p.id)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)' }}>
                        완료 표시
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'MEMORIALS' &&
          (memorials.length === 0 ? (
            <EmptyState />
          ) : (
            memorials.map((m) => (
              <div key={m.id} className="card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>故 {m.deceasedName}</strong>
                    <span
                      style={{
                        fontSize: '0.8rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 'var(--r-sm)', marginLeft: '0.6rem',
                        backgroundColor: m.visibility === 'PRIVATE' ? 'var(--state-danger-bg)' : 'var(--state-ok-bg)',
                        color: m.visibility === 'PRIVATE' ? 'var(--state-danger-fg)' : 'var(--state-ok-fg)',
                      }}
                    >
                      {m.visibility}
                    </span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      개설자 {m.createdByUser?.name}({m.createdByUser?.email})
                      {m.reportedAt && ` · 신고 접수 ${new Date(m.reportedAt).toLocaleDateString()}`}
                      {m.closedAt && ' · 폐쇄됨'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => toggleGuestbook(m.id)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', color: 'var(--primary-color)' }}>
                      방명록 {openGuestbookId === m.id ? '닫기' : '보기'}
                    </button>
                    {/* 🔄 09-07 사용자 지시 — 이전엔 m.reportedAt이 있을 때만(=웹 신고가 접수된
                        경우만) 이 버튼들이 떴는데, 웹 신고 버튼이 사라져(wt151) 그 조건이 사실상
                        영원히 참이 안 될 뻔했다. 신고 여부와 무관하게 지금 공개범위(visibility)
                        기준으로 항상 노출한다 — 유선·카톡으로 들어온 요청도 운영자가 바로 처리
                        가능해야 한다. 백엔드(`reviewMemorialReport`)는 애초에 reportedAt을
                        검사하지 않아 그대로 재사용된다. */}
                    {m.visibility === 'PRIVATE' ? (
                      <>
                        <button onClick={() => decideMemorial(m.id, 'RESTORE', 'LINK')} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)' }}>
                          복구(링크 공개)
                        </button>
                        <button onClick={() => decideMemorial(m.id, 'RESTORE', 'PUBLIC')} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)' }}>
                          복구(전체 공개)
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`故 ${m.deceasedName}님의 추모관을 비공개로 전환합니다. 계속하시겠습니까?`)) decideMemorial(m.id, 'CONFIRM');
                        }}
                        className="btn"
                        style={{ ...SMALL_BTN, backgroundColor: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)' }}
                      >
                        추모관 숨기기
                      </button>
                    )}
                  </div>
                </div>

                {openGuestbookId === m.id && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {guestbookLoading ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
                    ) : guestbookEntries.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>방명록이 없습니다.</div>
                    ) : (
                      guestbookEntries.map((g) => (
                        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-sm)', padding: '0.6rem 0.8rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.85rem' }}>{g.authorName}</strong>
                            {g.relationToDeceased && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> ({g.relationToDeceased})</span>}
                            <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{g.message}</p>
                          </div>
                          {g.hiddenAt ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>숨김됨</span>
                          ) : (
                            <button
                              onClick={() => hideGuestbookEntry(m.id, g.id)}
                              className="btn"
                              style={{ ...SMALL_BTN, backgroundColor: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)', whiteSpace: 'nowrap' }}
                              title="유선·카톡 등으로 신고가 접수된 글을 비공개 처리합니다(웹 신고 버튼은 없음)"
                            >
                              숨기기
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'DIGITAL_PLATFORMS' && (
          <>
            {showPlatformForm && (
              <form onSubmit={submitNewPlatform} className="card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <input
                    value={platformForm.name}
                    onChange={(e) => setPlatformForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="표시명 (예: 네이버)"
                    className="form-select"
                    style={{ ...SMALL_INPUT, flex: 1, minWidth: '160px' }}
                  />
                  <select value={platformForm.category} onChange={(e) => setPlatformForm((f) => ({ ...f, category: e.target.value }))} className="form-select" style={{ ...SMALL_INPUT, width: '140px' }}>
                    <option value="EMAIL">EMAIL</option>
                    <option value="SNS">SNS</option>
                    <option value="CLOUD">CLOUD</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="ETC">ETC</option>
                  </select>
                  <select value={platformForm.actionType} onChange={(e) => setPlatformForm((f) => ({ ...f, actionType: e.target.value }))} className="form-select" style={{ ...SMALL_INPUT, width: '160px' }}>
                    <option value="DELETE">DELETE(삭제)</option>
                    <option value="MEMORIALIZE">MEMORIALIZE(추모 전환)</option>
                    <option value="CANCEL">CANCEL(해지)</option>
                  </select>
                </div>
                <input
                  value={platformForm.officialUrl}
                  onChange={(e) => setPlatformForm((f) => ({ ...f, officialUrl: e.target.value }))}
                  placeholder="공식 유족 절차 안내 페이지 URL"
                  className="form-select"
                  style={SMALL_INPUT}
                />
                <textarea
                  value={platformForm.guideSummary}
                  onChange={(e) => setPlatformForm((f) => ({ ...f, guideSummary: e.target.value }))}
                  placeholder="절차 요약 (유족이 읽는 본문)"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem', height: '70px' }}
                />
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    value={platformForm.estimatedDays}
                    onChange={(e) => setPlatformForm((f) => ({ ...f, estimatedDays: e.target.value }))}
                    placeholder="예상 소요일"
                    className="form-select"
                    style={{ ...SMALL_INPUT, width: '120px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={platformForm.needsAgentHelp} onChange={(e) => setPlatformForm((f) => ({ ...f, needsAgentHelp: e.target.checked }))} />
                    행정사 상담 유도 필요
                  </label>
                </div>
                <div>
                  <button type="submit" disabled={platformSubmitting} className="btn btn-primary" style={SMALL_BTN}>
                    {platformSubmitting ? '등록 중...' : '등록 (비공개 상태로 생성됨)'}
                  </button>
                </div>
              </form>
            )}

            {digitalPlatforms.length === 0 ? (
              <EmptyState />
            ) : (
              digitalPlatforms.map((p) => (
                <div key={p.id} className="card" style={{ padding: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-color)', fontSize: '1.02rem' }}>{p.name}</strong>
                    <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--secondary-color)', padding: '0.15rem 0.5rem', borderRadius: 'var(--r-sm)', marginLeft: '0.5rem' }}>{p.category}</span>
                    <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--secondary-color)', padding: '0.15rem 0.5rem', borderRadius: 'var(--r-sm)', marginLeft: '0.3rem' }}>{p.actionType}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>{p.guideSummary}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      최종 확인일: {p.lastVerifiedAt ? new Date(p.lastVerifiedAt).toLocaleDateString() : '없음'}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!p.isPublished} onChange={() => togglePlatformPublish(p)} />
                    공개
                  </label>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'CONSULT_REQUESTS' &&
          (consultRequests.length === 0 ? (
            <EmptyState />
          ) : (
            consultRequests.map((c) => (
              <div key={c.id} className="card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>{c.applicantName || '(비회원)'}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                    {formatPhoneForDisplay(c.applicantPhone)} · {c.channel} · 전문가 {c.expert?.name}({c.expert?.category})
                  </span>
                  <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--secondary-color)', padding: '0.1rem 0.4rem', borderRadius: 'var(--r-sm)', marginLeft: '0.5rem' }}>{c.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{c.content}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>신청 {new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))
          ))}

        {tab === 'MEMBERS' &&
          (memberLoading ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
          ) : members.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {members.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openMember(u.id)}
                  className="card"
                  style={{ padding: '1rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>{u.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>{u.email || '(이메일 없음)'}</span>
                    <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--secondary-color)', padding: '0.1rem 0.4rem', borderRadius: 'var(--r-sm)', marginLeft: '0.5rem' }}>{u.role}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>가입 {new Date(u.createdAt).toLocaleDateString()}</span>
                </button>
              ))}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem' }}>
                <button disabled={memberPage <= 1} onClick={() => loadMembers(memberPage - 1)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', opacity: memberPage <= 1 ? 0.5 : 1 }}>
                  이전
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {memberPage} / {memberTotalPages} 페이지 (총 {memberCount}건)
                </span>
                <button disabled={memberPage >= memberTotalPages} onClick={() => loadMembers(memberPage + 1)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)', opacity: memberPage >= memberTotalPages ? 0.5 : 1 }}>
                  다음
                </button>
              </div>
            </>
          ))}
      </div>

      {showPurgeConfirm && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => !purgeSubmitting && setShowPurgeConfirm(false)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--r-lg)', padding: '1.5rem', width: '420px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--state-danger-fg)', fontSize: '1.1rem' }}>파기 실행 확인</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              선택한 <strong>{selectedPurge.size}건</strong>을 지금 파기합니다. 되돌릴 수 없습니다.
              건수를 직접 입력하고 비밀번호를 다시 입력하면 실행됩니다.
            </p>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>대상 건수 입력 ({selectedPurge.size}건)</label>
              <input
                type="number"
                value={purgeCountInput}
                onChange={(e) => setPurgeCountInput(e.target.value)}
                className="form-select"
                style={SMALL_INPUT}
                placeholder={`${selectedPurge.size}`}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>비밀번호 재입력</label>
              <input
                type="password"
                value={purgePassword}
                onChange={(e) => setPurgePassword(e.target.value)}
                className="form-select"
                style={SMALL_INPUT}
              />
            </div>
            {purgeError && <div style={{ color: 'var(--state-danger-fg)', fontSize: '0.85rem' }}>{purgeError}</div>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPurgeConfirm(false)} disabled={purgeSubmitting} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)' }}>
                취소
              </button>
              <button onClick={submitPurgeConfirm} disabled={purgeSubmitting} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-danger-fg)', color: '#FFFFFF' }}>
                {purgeSubmitting ? '처리 중...' : '파기 실행'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddressSearch && (
        <AddressSearchModal
          onSelect={(address) => setExpertEditForm((f) => ({ ...f, officeAddress: address.roadAddress || address.jibunAddress }))}
          onClose={() => setShowAddressSearch(false)}
        />
      )}

      {(openMemberDetail || memberDetailLoading) && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setOpenMemberDetail(null)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--r-lg)', padding: '1.5rem', width: '480px', maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {memberDetailLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: 'var(--primary-color)', fontSize: '1.1rem', margin: 0 }}>{openMemberDetail.name}</h3>
                  <button onClick={() => setOpenMemberDetail(null)} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--surface-subtle)' }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--state-warn-fg)', backgroundColor: 'var(--state-warn-bg)', padding: '0.5rem 0.7rem', borderRadius: 'var(--r-sm)' }}>
                  🔴 이 상세 조회는 감사 로그에 기록됩니다(00-37 §3.2).
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <div>이메일: {openMemberDetail.email || '없음'}</div>
                  <div>가입일: {new Date(openMemberDetail.createdAt).toLocaleString()}</div>
                  <div>방명록 작성 수: {openMemberDetail.guestbookCount}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>추모관 ({openMemberDetail.memorials.length}건)</strong>
                  {openMemberDetail.memorials.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>없음</div>
                  ) : (
                    openMemberDetail.memorials.map((m: any) => (
                      <div key={m.id} style={{ fontSize: '0.85rem', padding: '0.3rem 0' }}>
                        故 {m.deceasedName} · {m.visibility}{m.closedAt ? ' · 폐쇄됨' : ''}
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>디지털 정리 항목 ({openMemberDetail.digitalCleanupItems.length}건)</strong>
                  {openMemberDetail.digitalCleanupItems.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>없음</div>
                  ) : (
                    openMemberDetail.digitalCleanupItems.map((it: any) => (
                      <div key={it.id} style={{ fontSize: '0.85rem', padding: '0.3rem 0' }}>
                        {it.platform?.name || it.customName} · {it.status}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--text-muted)' }}>해당 조건의 항목이 없습니다.</div>
);

const ApproveButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
    <CheckCircle2 size={14} /> 승인
  </button>
);

const RejectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="btn" style={{ ...SMALL_BTN, backgroundColor: 'var(--state-danger-bg)', color: 'var(--state-danger-fg)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
    <XCircle size={14} /> 반려
  </button>
);
