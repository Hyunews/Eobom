// docs 00-20 §8.1-3 — 통지 발송 provider 경계(이메일·알림톡). STT·OCR provider(sttProvider.ts·ocrProvider.ts)와 같은 구조다:
// 설정값(EMAIL_ENABLED·ALIMTALK_ENABLED, 기본 꺼짐)으로 켜고 끄고, 업체가 정해지면 이 경계 아래 구현체만 붙인다.
// 🔴 실제 발송 업체는 아직 붙이지 않았다(업체·보내는 도메인·알림톡 발신 프로필은 사람이 정한다, §8.1-3).
//    그래서 플래그를 켜도 send는 NOTICE_NOT_CONFIGURED로 실패한다 — "보냈다"고 거짓으로 기록하는 일이 없다.

export type NoticeChannel = 'EMAIL' | 'ALIMTALK';

// 발송 실패. code는 MemorialNotice.failReason에 그대로 들어간다 — 🔴 이메일 주소·번호·본문 같은 개인정보를 넣지 않는다.
export class NoticeSendError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message ?? code);
    this.name = 'NoticeSendError';
  }
}

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface AlimtalkProvider {
  send(phone: string, body: string): Promise<void>;
}

export const isEmailEnabled = (): boolean => process.env.EMAIL_ENABLED === 'true';
export const isAlimtalkEnabled = (): boolean => process.env.ALIMTALK_ENABLED === 'true';

// 업체 구현체가 생기기 전의 자리. 켜져 있어도 보내지 못하고 실패로 알린다.
const notConfiguredEmail: EmailProvider = {
  async send() {
    throw new NoticeSendError('EMAIL_NOT_CONFIGURED');
  },
};
const notConfiguredAlimtalk: AlimtalkProvider = {
  async send() {
    throw new NoticeSendError('ALIMTALK_NOT_CONFIGURED');
  },
};

// 꺼져 있으면 null — 호출하는 쪽이 "EMAIL_DISABLED"로 기록한다.
export const getEmailProvider = (): EmailProvider | null => (isEmailEnabled() ? notConfiguredEmail : null);
export const getAlimtalkProvider = (): AlimtalkProvider | null => (isAlimtalkEnabled() ? notConfiguredAlimtalk : null);
