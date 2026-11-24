// 8단계 묶음 12 · 운영자 틀 미리보기 값. 정본: 00-37 §4.1 · §3.3 · 판 6-13(로그인) · 6-14(홈) · 6-26(알림 종).
// 🔴 숫자·알림 줄은 미리보기가 지어낸 예시다(10단계 교체 때 서버 응답 GET /admin/dashboard · /admin/notifications 로 바꾼다).
// 아래 타입은 서버 응답 모양(adminDashboardController.ts)과 같다.

export const PV_ADMIN = {
  index: '/preview/admin',
  login: '/preview/admin/login',
  home: '/preview/admin/home',
  site: '/preview',
} as const;

export type AdminRole = 'SUPERADMIN' | 'OPERATOR';

/** 메뉴 key → 미리보기 주소. 홈은 묶음 12, 나머지 메뉴 화면은 묶음 13(AdminRoutes.tsx). */
export const adminPath = (key: string) => (key === 'home' ? PV_ADMIN.home : `${PV_ADMIN.index}/${key}`);

// ───── 메뉴 (00-37 §4.1 표) ─────
export interface AdminMenuItem {
  key: string;
  label: string;
  /** 갈색 숫자(대기 건수) — 사업자 가입 · 전문가 가입 · 시설 연동 · 사망 확인 */
  badge?: number;
  /** 메뉴째 SUPERADMIN만(운영자 계정) — 열쇠. OPERATOR로 들어오면 흐리게 + 눌리지 않음 */
  superOnly?: boolean;
  /** 결정 대기(정산서) — 자물쇠 + 보조 글색 */
  locked?: boolean;
}
export interface AdminMenuGroup {
  title: string;
  items: AdminMenuItem[];
}

export interface AdminBadges {
  partners: number;
  experts: number;
  claims: number;
  death: number;
}

/** 열쇠는 00-37 §3.3 표에 적힌 것에만 — 메뉴 중에서는 운영자 계정뿐이다(요율 메뉴는 OPERATOR도 열어 본다, 파기 메뉴도 같다). */
export const adminMenuGroups = (b: AdminBadges): AdminMenuGroup[] => [
  {
    title: '심사',
    items: [
      { key: 'partners', label: '사업자 가입', badge: b.partners },
      { key: 'experts', label: '전문가 가입', badge: b.experts },
      { key: 'claims', label: '시설 연동', badge: b.claims },
    ],
  },
  {
    title: '시설·상담',
    items: [
      { key: 'facilities', label: '전체 시설' },
      { key: 'leads', label: '업체 문의' },
      { key: 'consults', label: '상담 신청' },
    ],
  },
  { title: '회원', items: [{ key: 'members', label: '회원' }] },
  {
    title: '추모·부고',
    items: [
      { key: 'memorials', label: '추모관' },
      { key: 'obituaries', label: '부고장' },
    ],
  },
  {
    title: '사후 처리',
    items: [
      { key: 'death', label: '사망 확인', badge: b.death },
      { key: 'purge', label: '유족메시지 파기' },
    ],
  },
  {
    title: '정산',
    items: [
      { key: 'rates', label: '요율 등록' },
      { key: 'settlement', label: '정산서', locked: true },
    ],
  },
  {
    title: '기록·설정',
    items: [
      { key: 'audit', label: '감사로그' },
      { key: 'accounts', label: '운영자 계정', superOnly: true },
    ],
  },
];

export const ADMIN_NAME = '[예시] 운영자';

// ───── 홈 건수 (GET /admin/dashboard) ─────
export interface AdminDashboard {
  review: { partners: number; experts: number; claims: number };
  afterDeath: { deathPending: number; deathOverDue: number; deathOverTarget: number; purgeExpired: number };
  recent: { signups: number; errors: number };
}

export const DASHBOARD_READY: AdminDashboard = {
  review: { partners: 2, experts: 1, claims: 3 },
  afterDeath: { deathPending: 2, deathOverDue: 1, deathOverTarget: 1, purgeExpired: 4 },
  recent: { signups: 12, errors: 0 },
};
export const DASHBOARD_ZERO: AdminDashboard = {
  review: { partners: 0, experts: 0, claims: 0 },
  afterDeath: { deathPending: 0, deathOverDue: 0, deathOverTarget: 0, purgeExpired: 0 },
  recent: { signups: 0, errors: 0 },
};

export const badgesOf = (d: AdminDashboard | null): AdminBadges => ({
  partners: d?.review.partners ?? 0,
  experts: d?.review.experts ?? 0,
  claims: d?.review.claims ?? 0,
  death: d?.afterDeath.deathPending ?? 0,
});

// ───── 알림 종 (GET /admin/notifications) ─────
export type NotificationTo = 'partners' | 'experts' | 'claims' | 'death' | 'purge' | 'audit';
export type NotificationKind =
  | 'PARTNER_SIGNUP'
  | 'EXPERT_SIGNUP'
  | 'CLAIM_REQUEST'
  | 'DEATH_RECEIVED'
  | 'DEATH_NEAR_DEADLINE'
  | 'DEATH_OVERDUE'
  | 'PURGE_EXPIRED'
  | 'ARCHIVE_PENDING'
  | 'RECENT_ERRORS';
export interface AdminNotification {
  kind: NotificationKind;
  text: string;
  /** ISO 시각 */
  at: string;
  to: NotificationTo;
  unread: boolean;
}

/** 줄 맨 앞 종류 글 */
export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  PARTNER_SIGNUP: '사업자 가입',
  EXPERT_SIGNUP: '전문가 가입',
  CLAIM_REQUEST: '시설 연동',
  DEATH_RECEIVED: '사망 확인',
  DEATH_NEAR_DEADLINE: '사망 확인',
  DEATH_OVERDUE: '사망 확인',
  PURGE_EXPIRED: '유족메시지 파기',
  ARCHIVE_PENDING: '유족메시지 파기',
  RECENT_ERRORS: '감사로그',
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** 안 읽음 3 · 읽음 2 (판 6-26 — 종 숫자 3) */
export const sampleNotifications = (): AdminNotification[] => [
  { kind: 'DEATH_OVERDUE', text: '사망 확인이 대외 마감을 넘겼습니다.', at: minutesAgo(10), to: 'death', unread: true },
  { kind: 'PARTNER_SIGNUP', text: '새 사업자 가입 신청이 있습니다.', at: minutesAgo(48), to: 'partners', unread: true },
  { kind: 'PURGE_EXPIRED', text: '파기 대상이 4건 생겼습니다.', at: minutesAgo(3 * 60 + 5), to: 'purge', unread: true },
  { kind: 'CLAIM_REQUEST', text: '시설 연동 신청이 있습니다.', at: minutesAgo(26 * 60), to: 'claims', unread: false },
  { kind: 'EXPERT_SIGNUP', text: '새 전문가 가입 신청이 있습니다.', at: minutesAgo(3 * 24 * 60), to: 'experts', unread: false },
];

/** "10분 전" */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}
