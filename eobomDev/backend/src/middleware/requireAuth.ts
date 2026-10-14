import type { NextFunction, Request, Response } from 'express';
import { verifyBearerToken } from '../controllers/authController';
import { verifyPartnerBearerToken } from '../controllers/partnerController';
import { verifyExpertBearerToken } from '../controllers/expertController';

// 라우터 단위 로그인 검사 — 운영자 묶음의 `requireAdminAuth`(adminController)와 같은 방식(R300 Ⅳ장 3 · Ⅹ장 8번).
// 예전엔 핸들러마다 `verifyXxxBearerToken` + 401 분기를 따로 불렀다. 새 엔드포인트에서 한 줄 빠지면 그대로 공개되는 구조였다.
// 🔴 동작 불변 리팩터링 — 401 문구는 핸들러가 돌려주던 것과 한 글자도 다르지 않아야 한다(묶음마다 다르다).
// 핸들러 안의 검증은 신원(id)을 꺼내려고 그대로 둔다(admin도 `verifyAdminBearerToken(req)!`로 다시 꺼낸다).
// 🔴 기능 스위치 판정이 인증보다 앞서는 라우트(stt·ocr·will-photos: 꺼짐이면 404)는 일부러 묶지 않았다 —
//    묶으면 스위치가 꺼진 환경에서 404가 401로 바뀐다.
// 쓰는 법: 공개 라우트를 먼저 등록하고, 그 아래에서 `router.use(requireUserAuth)`. 섞인 라우터는 위쪽에 공개를 모은다.

const LOGIN_REQUIRED = '로그인이 필요합니다.';
const TOKEN_INVALID = '인증 토큰이 없거나 유효하지 않습니다.';

const guard = (verify: (req: Request) => unknown, message: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!verify(req)) {
      return res.status(401).json({ status: 'error', message });
    }
    next();
  };

// B2C 회원 — 핸들러 문구가 '로그인이 필요합니다.'인 묶음(me · farewell-messages · ending-note · family-designations · memorials · obituaries)
export const requireUserAuth = guard(verifyBearerToken, LOGIN_REQUIRED);
// B2C 회원이되 기능별 문구를 쓰던 곳(방명록 작성 · 업체 문의 · 전문가 상담 신청)
export const requireUserAuthWith = (message: string) => guard(verifyBearerToken, message);
// B2C 회원이되 문구가 '인증 토큰이 없거나…'인 곳(/api/auth/me · /api/auth/unlink-provider)
export const requireUserTokenAuth = guard(verifyBearerToken, TOKEN_INVALID);
export const requirePartnerAuth = guard(verifyPartnerBearerToken, TOKEN_INVALID);
export const requireExpertAuth = guard(verifyExpertBearerToken, TOKEN_INVALID);
