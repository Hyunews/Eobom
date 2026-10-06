import prisma from '../config/prisma';
import { kstYmd } from '../utils/kst';
import {
  AlimtalkProvider,
  EmailProvider,
  NoticeChannel,
  NoticeSendError,
  getAlimtalkProvider,
  getEmailProvider,
} from './noticeProvider';
import { generateExtendToken } from './memorialExtendService';

// docs 00-20 §8.1-3 — 추모관 통지(만료 통지·파기 전 재확인)를 보내고 결과를 MemorialNotice에 남긴다.
// 수단 순서: 개설자 이메일이 있으면 이메일 → (이메일이 없거나 실패하면) 연락처가 있으면 알림톡 → 둘 다 안 되면 FAILED.
// prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 배치)만 부른다. 🔴 런타임 코드(컨트롤러·라우트·스케줄러)는 부르지 않는다.

export type MemorialNoticeKind = 'EXPIRY' | 'RECONFIRM';

export type NoticeTarget = {
  id: string;
  deceasedName: string;
  expiresAt: Date | null;
  purgeAt: Date | null;
};

export type NoticeOwner = { email: string | null; contactPhone: string | null };

export type DeliveryResult = { result: 'SENT' | 'FAILED'; channel: NoticeChannel | null; failReason: string | null };

// 화면 문구 — 사실만 적는다(평가·홍보 투 금지). 링크 두 개: 연장 확인 화면(토큰, 로그인 불필요) · 개설자 전용 목록 화면(§8.1-4).
export function buildMemorialNoticeMessage(
  kind: MemorialNoticeKind,
  m: Pick<NoticeTarget, 'deceasedName' | 'expiresAt' | 'purgeAt'>,
  frontendUrl: string,
  extendToken?: string,
): { subject: string; body: string } {
  const base = frontendUrl.replace(/\/$/, '');
  const listLink = `${base}/my-obituaries-memorials`;
  const extendLine = extendToken ? `\n계속 보존하기: ${base}/memorial-extend/${extendToken}` : '';
  if (kind === 'EXPIRY') {
    const date = m.expiresAt ? kstYmd(m.expiresAt) : '-';
    return {
      subject: `[이어봄] '${m.deceasedName}' 추모관 보존기간 안내`,
      body:
        `'${m.deceasedName}' 추모관의 활성 기간이 ${date}에 끝납니다. ` +
        `이후에는 새 방명록·헌화·사진 등록이 중단되고 기존 내용 열람만 가능합니다.${extendLine}\n추모관 확인: ${listLink}`,
    };
  }
  const date = m.purgeAt ? kstYmd(m.purgeAt) : '-';
  return {
    subject: `[이어봄] '${m.deceasedName}' 추모관 삭제 예정 안내`,
    body: `'${m.deceasedName}' 추모관이 ${date}에 방명록·헌화·사진과 함께 삭제됩니다.${extendLine}\n추모관 확인: ${listLink}`,
  };
}

// 발송만 한다(DB를 건드리지 않는다) — provider를 받아서 테스트가 가짜를 끼울 수 있다.
export async function deliverNotice(
  owner: NoticeOwner,
  message: { subject: string; body: string },
  providers: { email: EmailProvider | null; alimtalk: AlimtalkProvider | null },
): Promise<DeliveryResult> {
  const reasons: string[] = [];
  let lastChannel: NoticeChannel | null = null;

  if (owner.email) {
    lastChannel = 'EMAIL';
    if (!providers.email) {
      reasons.push('EMAIL_DISABLED');
    } else {
      try {
        await providers.email.send(owner.email, message.subject, message.body);
        return { result: 'SENT', channel: 'EMAIL', failReason: null };
      } catch (e) {
        reasons.push(e instanceof NoticeSendError ? e.code : 'EMAIL_SEND_ERROR');
      }
    }
  }

  if (owner.contactPhone) {
    lastChannel = 'ALIMTALK';
    if (!providers.alimtalk) {
      reasons.push('ALIMTALK_DISABLED');
    } else {
      try {
        await providers.alimtalk.send(owner.contactPhone, message.body);
        return { result: 'SENT', channel: 'ALIMTALK', failReason: null };
      } catch (e) {
        reasons.push(e instanceof NoticeSendError ? e.code : 'ALIMTALK_SEND_ERROR');
      }
    }
  }

  if (reasons.length === 0) reasons.push('NO_CONTACT');
  return { result: 'FAILED', channel: lastChannel, failReason: reasons.join(',') };
}

// 보내고 기록한다. 개설자 연락처는 여기서 읽는다(기록에는 남기지 않는다).
export async function sendMemorialNotice(
  memorialId: string,
  kind: MemorialNoticeKind,
  now = new Date(),
): Promise<DeliveryResult> {
  const memorial = await prisma.memorial.findUnique({
    where: { id: memorialId },
    select: {
      id: true,
      deceasedName: true,
      expiresAt: true,
      purgeAt: true,
      createdByUser: { select: { email: true, contactPhone: true } },
    },
  });
  if (!memorial) return { result: 'FAILED', channel: null, failReason: 'MEMORIAL_NOT_FOUND' };

  // 연장 링크 토큰(§8.1-4) — 원문은 이 본문에만, DB엔 해시만. 시도마다 새로 만든다(실패한 시도의 토큰은 아무에게도 안 갔다).
  const { token, tokenHash } = generateExtendToken();
  const message = buildMemorialNoticeMessage(kind, memorial, process.env.FRONTEND_URL || '', token);
  const delivery = await deliverNotice(memorial.createdByUser, message, {
    email: getEmailProvider(),
    alimtalk: getAlimtalkProvider(),
  });
  await prisma.memorialNotice.create({
    data: { memorialId, kind, channel: delivery.channel, result: delivery.result, failReason: delivery.failReason, tokenHash, createdAt: now },
  });
  return delivery;
}
