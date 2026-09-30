import jwt from 'jsonwebtoken';
import { TEST_JWT_SECRET } from './testEnv';

// 4종 aud 토큰 발급기 — 실제 컨트롤러가 발급하는 클레임 모양을 그대로 따른다
// (authController.generateToken · partnerController · expertController · adminController).
// id는 가짜 값이다. 실제 계정·개인정보를 쓰지 않는다(security.md §2).

export type Aud = 'user' | 'partner' | 'expert' | 'admin';

const FAKE_ID = '00000000-0000-4000-8000-000000000000';

export function tokenFor(aud: Aud, opts: { secret?: string; expiresIn?: string | number } = {}): string {
  const secret = opts.secret ?? TEST_JWT_SECRET!;
  const expiresIn = (opts.expiresIn ?? '5m') as jwt.SignOptions['expiresIn'];
  const payloads: Record<Aud, object> = {
    user: { id: FAKE_ID, name: '테스트유저', email: 'user@example.test', provider: 'kakao', aud: 'user' },
    partner: { id: FAKE_ID, companyName: '테스트업체', aud: 'partner' },
    expert: { id: FAKE_ID, name: '테스트전문가', category: 'LAWYER', aud: 'expert' },
    admin: { id: FAKE_ID, name: '테스트운영자', aud: 'admin' },
  };
  return jwt.sign(payloads[aud], secret, { expiresIn });
}

/** aud 필드가 없는 옛 B2C 토큰 — verifyBearerToken은 레거시로 보고 허용한다(authController.ts:129 주석). */
export function legacyUserTokenWithoutAud(): string {
  return jwt.sign({ id: FAKE_ID, name: '테스트유저', provider: 'kakao' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
}
