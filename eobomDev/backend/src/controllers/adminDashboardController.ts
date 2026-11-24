import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';
import { GRACE_DAYS, findLetterExpired, findMediaExpired, findRetiredExpired, listPendingArchivePurge } from '../services/farewellPurgeService';
import { findWillPhotoExpired } from '../services/willPhotoService';

// 00-37 §4.1 홈(A-3) · 알림 종(§4 #12) — 건수와 시각뿐이다. 🔴 내용(이름·편지·사유)은 담지 않는다(§3.1).
// 알림은 표를 따로 두지 않고 아래 큐들에서 그때그때 계산한다(10-21 확정). 안 읽음 = 줄의 시각이 Admin.notificationsReadAt보다 새 것.

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_SIGNUP_DAYS = 7; // 최근 가입 = 지난 7일 회원 가입 수
const RECENT_ERROR_HOURS = 24; // 최근 오류 = 지난 24시간 감사로그 결과 FAIL 수
const NOTIFICATION_DAYS = 30; // "최근 30일만 보여 줍니다"
const NOTIFICATION_MAX = 50;

export type NotificationTo = 'partners' | 'experts' | 'claims' | 'death' | 'purge' | 'audit';
type NotificationKind =
  | 'PARTNER_SIGNUP'
  | 'EXPERT_SIGNUP'
  | 'CLAIM_REQUEST'
  | 'DEATH_RECEIVED'
  | 'DEATH_NEAR_DEADLINE'
  | 'DEATH_OVERDUE'
  | 'PURGE_EXPIRED'
  | 'ARCHIVE_PENDING'
  | 'RECENT_ERRORS';

const latest = (dates: Date[]): Date | null => (dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null);

// 파기 만료 대상 — 유족메시지 파기 화면 "파기 대기"와 같은 네 갈래(farewellPurgeController.listFarewellPurgeExpired). 각 줄이 만료되는 시각 = 삭제 시각 + 유예.
async function purgeExpiredSummary(): Promise<{ count: number; lastExpiredAt: Date | null }> {
  const [media, letter, retired, willPhoto] = await Promise.all([findMediaExpired(), findLetterExpired(), findRetiredExpired(), findWillPhotoExpired()]);
  const deleted: Date[] = [
    ...media.map((r) => r.mediaDeletedAt),
    ...letter.map((r) => r.deletedAt),
    ...retired.map((r) => r.deletedAt),
    ...willPhoto.map((r) => r.deletedAt),
  ].filter((d): d is Date => d instanceof Date);
  const last = latest(deleted);
  return {
    count: media.length + letter.length + retired.length + willPhoto.length,
    lastExpiredAt: last ? new Date(last.getTime() + GRACE_DAYS * DAY_MS) : null,
  };
}

// 홈 (`GET /api/admin/dashboard`) — 묶음 제목별 건수. 사망 확인은 대외 마감 초과 / 내부 목표 초과(마감은 아직)를 겹치지 않게 센다.
export const getDashboard = async (_req: Request, res: Response) => {
  const now = new Date();
  try {
    const [partners, experts, claims, deathPending, deathOverDue, deathOverTarget, purge, signups, errors] = await Promise.all([
      prisma.partner.count({ where: { status: 'PENDING' } }),
      prisma.expert.count({ where: { status: 'PENDING' } }),
      prisma.facilityClaim.count({ where: { status: 'PENDING' } }),
      prisma.deathVerification.count({ where: { status: 'REQUESTED' } }),
      prisma.deathVerification.count({ where: { status: 'REQUESTED', dueAt: { lt: now } } }),
      prisma.deathVerification.count({ where: { status: 'REQUESTED', targetAt: { lt: now }, dueAt: { gte: now } } }),
      purgeExpiredSummary(),
      prisma.user.count({ where: { createdAt: { gte: new Date(now.getTime() - RECENT_SIGNUP_DAYS * DAY_MS) } } }),
      prisma.adminAuditLog.count({ where: { result: 'FAIL', createdAt: { gte: new Date(now.getTime() - RECENT_ERROR_HOURS * 60 * 60 * 1000) } } }),
    ]);
    return res.json({
      status: 'success',
      data: {
        review: { partners, experts, claims },
        afterDeath: { deathPending, deathOverDue, deathOverTarget, purgeExpired: purge.count },
        recent: { signups, errors },
      },
    });
  } catch (error) {
    console.error('운영자 홈 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '홈 조회 중 오류가 발생했습니다.' });
  }
};

// 알림 목록 (`GET /api/admin/notifications`) — 큐에서 계산, 최근 30일. unreadCount는 목록 전체 기준(상한 50 전).
export const getNotifications = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증
  const now = new Date();
  const since = new Date(now.getTime() - NOTIFICATION_DAYS * DAY_MS);
  try {
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id }, select: { notificationsReadAt: true } });
    const readAt = admin?.notificationsReadAt ?? null;

    const [partners, experts, claims, deaths, purge, pendingArchive, errorRows] = await Promise.all([
      prisma.partner.findMany({ where: { status: 'PENDING', createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.expert.findMany({ where: { status: 'PENDING', createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.facilityClaim.findMany({ where: { status: 'PENDING', createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.deathVerification.findMany({ where: { status: 'REQUESTED' }, select: { requestedAt: true, targetAt: true, dueAt: true } }),
      purgeExpiredSummary(),
      listPendingArchivePurge(),
      prisma.adminAuditLog.findMany({
        where: { result: 'FAIL', createdAt: { gte: new Date(now.getTime() - RECENT_ERROR_HOURS * 60 * 60 * 1000) } },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items: { kind: NotificationKind; text: string; at: Date; to: NotificationTo }[] = [];
    partners.forEach((r) => items.push({ kind: 'PARTNER_SIGNUP', text: '새 사업자 가입 신청이 있습니다.', at: r.createdAt, to: 'partners' }));
    experts.forEach((r) => items.push({ kind: 'EXPERT_SIGNUP', text: '새 전문가 가입 신청이 있습니다.', at: r.createdAt, to: 'experts' }));
    claims.forEach((r) => items.push({ kind: 'CLAIM_REQUEST', text: '시설 연동 신청이 있습니다.', at: r.createdAt, to: 'claims' }));
    deaths.forEach((r) => {
      items.push({ kind: 'DEATH_RECEIVED', text: '사망 확인 요청이 접수되었습니다.', at: r.requestedAt, to: 'death' });
      // 임박 = 내부 목표(targetAt)를 넘긴 때(00-41 §5.1 — 새 기준을 만들지 않는다). 대외 마감을 넘기면 임박 줄은 초과 줄로 바뀐다.
      if (now > r.dueAt) items.push({ kind: 'DEATH_OVERDUE', text: '사망 확인이 대외 마감을 넘겼습니다.', at: r.dueAt, to: 'death' });
      else if (now > r.targetAt) items.push({ kind: 'DEATH_NEAR_DEADLINE', text: '사망 확인이 내부 목표를 넘겼습니다. 대외 마감이 임박했습니다.', at: r.targetAt, to: 'death' });
    });
    if (purge.count > 0 && purge.lastExpiredAt) {
      items.push({ kind: 'PURGE_EXPIRED', text: `파기 대상이 ${purge.count}건 생겼습니다.`, at: purge.lastExpiredAt, to: 'purge' });
    }
    const archiveAt = latest(pendingArchive.map((r) => r.queuedAt));
    if (pendingArchive.length > 0 && archiveAt) {
      items.push({ kind: 'ARCHIVE_PENDING', text: `아카이브 2단계가 ${pendingArchive.length}건 남아 있습니다.`, at: archiveAt, to: 'purge' });
    }
    if (errorRows.length > 0) {
      items.push({ kind: 'RECENT_ERRORS', text: `최근 24시간 동안 오류가 ${errorRows.length}건 있었습니다.`, at: errorRows[0].createdAt, to: 'audit' });
    }

    const recent = items.filter((i) => i.at >= since).sort((a, b) => b.at.getTime() - a.at.getTime());
    const unreadCount = recent.filter((i) => !readAt || i.at > readAt).length;
    return res.json({
      status: 'success',
      data: {
        unreadCount,
        readAt,
        items: recent.slice(0, NOTIFICATION_MAX).map((i) => ({ ...i, unread: !readAt || i.at > readAt })),
      },
    });
  } catch (error) {
    console.error('운영자 알림 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '알림 조회 중 오류가 발생했습니다.' });
  }
};

// 모두 읽음 (`POST /api/admin/notifications/read-all`) — 시각 하나만 갱신한다. 줄 하나만 읽음 처리하지는 않는다(10-21 확정).
export const markNotificationsRead = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req)!; // requireAdminAuth가 이미 검증
  try {
    const readAt = new Date();
    await prisma.admin.update({ where: { id: decoded.id }, data: { notificationsReadAt: readAt }, select: { id: true } });
    return res.json({ status: 'success', data: { readAt } });
  } catch (error) {
    console.error('운영자 알림 읽음 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '읽음 처리 중 오류가 발생했습니다.' });
  }
};
