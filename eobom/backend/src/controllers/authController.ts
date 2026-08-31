import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SocialProfile } from '../config/passport';
import prisma from '../config/prisma';

export const JWT_SECRET = process.env.JWT_SECRET || 'eobom_jwt_secret_key_2026_well_dying';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 가입 시점 필수 동의(이용약관·개인정보) — 2026-08-24 추가. 마케팅 수신은 선택이라 별도 플래그.
interface ConsentFlags {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
}

interface PendingSocialLinkPayload extends jwt.JwtPayload {
  purpose: 'social_link';
  provider: string;
  providerId: string;
  email?: string;
  name: string;
  profileImage?: string;
  existingUserId: string;
  // [계정 통합/독립 신규 가입] 선택 모달에서 CREATE_NEW를 고르면 그 자리에서 새 User가 생성된다
  // (§confirmLink) — 그것도 실질적인 신규 가입이라, 최초 로그인 시작 시점에 받은 동의를 여기까지
  // 그대로 실어 보낸다.
  consent: ConsentFlags;
}

interface LinkStatePayload extends jwt.JwtPayload {
  purpose: 'link';
  userId: string;
  origin?: string;
}

interface LoginStatePayload extends jwt.JwtPayload {
  purpose: 'login';
  origin?: string;
  // 로그인 시작 라우트(`GET /:provider`)에서 쿼리로 받아 서명해 넣는다 — 기존 유저 재로그인이면
  // 콜백에서 무시되고, 신규 가입(User.create)일 때만 이 값을 termsAgreedAt 등으로 스탬프한다.
  consent: ConsentFlags;
  // 2026-08-25 — LoginModal.tsx의 "로그인"/"회원가입" 탭 구분. "로그인" 탭은 동의 UI가 없으므로
  // 콜백에서 신규 가입으로 판정되면(§handleSocialLoginCallback) 그 자리에서 User를 만들지 않고
  // not_registered로 되돌려 "회원가입" 탭을 열게 한다. 없거나 위조·만료면 'signup'으로 안전
  // 폴백(기존 동작 그대로 — 동의가 있으면 가입시킴).
  mode?: 'login' | 'signup';
}

// 로그인/연동 시작 요청(`GET /:provider`, `/:provider/link`)의 Referer로 프론트 오리진을 캡처한다.
// 콜백 시점(`/:provider/callback`)엔 Referer가 카카오/네이버/구글 도메인이라 그때는 원래 출처를 알 수 없으므로,
// 반드시 시작 시점에 잡아서 OAuth state에 실어 콜백까지 들고 간다.
//
// 보안: Referer를 무조건 신뢰하면 외부 사이트가 우리 로그인 링크를 감싸서 로그인 성공 토큰을
// 자기 도메인으로 새게 만드는 오픈 리다이렉트가 가능해진다. 그래서 사설 대역(LAN)·localhost +
// 알려진 프론트 개발 포트로만 범위를 좁힌다. 이 조건에 안 맞으면(=배포 환경 등) undefined를
// 반환해 resolveFrontendUrl()이 FRONTEND_URL env로 폴백하게 한다.
const DEV_FRONTEND_PORT = '5173';
const isTrustedDevHost = (hostname: string): boolean =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);

export const captureFrontendOrigin = (req: Request): string | undefined => {
  const referer = req.get('referer');
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    if (!isTrustedDevHost(url.hostname)) return undefined;
    if (url.port && url.port !== DEV_FRONTEND_PORT) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
};

// state에서 프론트 오리진을 복원. 없거나(만료·위조·Referer 없음) 실패하면 기본값(FRONTEND_URL)으로 폴백.
export const resolveFrontendUrl = (state: unknown): string => {
  if (typeof state === 'string') {
    try {
      const decoded = jwt.verify(state, JWT_SECRET) as LinkStatePayload | LoginStatePayload;
      if (decoded.origin) return decoded.origin;
    } catch {
      // 무시하고 아래 기본값으로 폴백
    }
  }
  return FRONTEND_URL;
};

// state에서 동의 플래그를 복원한다. `purpose: 'link'`(마이페이지 추가 연동) state에는 애초에
// consent가 없으므로(기존 로그인 유저라 새 동의가 필요 없음), 그 경우와 검증 실패 시 전부
// false로 폴백 — 신규 유저 생성 분기에서 이 값이 false면 동의 없이 가입시키지 않는다(라우트
// 단계에서 이미 걸렀어야 정상이지만, state 위변조·만료에 대비한 2차 방어선).
export const resolveConsent = (state: unknown): ConsentFlags => {
  if (typeof state === 'string') {
    try {
      const decoded = jwt.verify(state, JWT_SECRET) as LinkStatePayload | LoginStatePayload;
      if (decoded.purpose === 'login' && decoded.consent) {
        return {
          terms: !!decoded.consent.terms,
          privacy: !!decoded.consent.privacy,
          marketing: !!decoded.consent.marketing,
        };
      }
    } catch {
      // 무시하고 아래 기본값으로 폴백
    }
  }
  return { terms: false, privacy: false, marketing: false };
};

// state에서 로그인 탭 구분(mode)을 복원. 'link' state·검증 실패·구버전 state(mode 없음)는 전부
// 'signup'으로 폴백 — 기존 동작(동의가 있으면 가입시킴)을 그대로 유지하기 위한 안전한 기본값이다.
export const resolveMode = (state: unknown): 'login' | 'signup' => {
  if (typeof state === 'string') {
    try {
      const decoded = jwt.verify(state, JWT_SECRET) as LinkStatePayload | LoginStatePayload;
      if (decoded.purpose === 'login' && decoded.mode === 'login') {
        return 'login';
      }
    } catch {
      // 무시하고 아래 기본값으로 폴백
    }
  }
  return 'signup';
};

// 헬퍼: Authorization 헤더의 Bearer 토큰 검증 (실패 시 null)
// aud(대상) 클레임으로 B2C ↔ 사업자(Partner) 토큰 교차 사용을 막는다(docs 01-05 §6.4).
// aud가 없는 토큰(이 필드 도입 전에 발급된 것)은 레거시로 간주해 그대로 허용 — 아직 파트너 토큰이
// 존재하지 않던 시절 발급분이라 'partner'로 위조될 수 없었기 때문에 안전하다.
export const verifyBearerToken = (req: Request): (jwt.JwtPayload & { id: string }) | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as jwt.JwtPayload & { id: string; aud?: string };
    if (decoded.aud === 'partner') return null; // 사업자 토큰이 B2C 라우트로 들어옴 — 거부
    return decoded;
  } catch {
    return null;
  }
};

// 헬퍼: JWT 토큰 생성 (로그인 세션용, 12시간 만료)
export const generateToken = (user: { id: string; name: string; email?: string; provider: string }) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      aud: 'user',
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

// 헬퍼: 로그인 성공 시 프론트로 보낼 리다이렉트 URL 생성
const buildLoginSuccessRedirect = (
  user: { id: string; name: string; email: string | null },
  provider: string,
  frontendUrl: string
) => {
  const token = generateToken({ id: user.id, name: user.name, email: user.email ?? undefined, provider });
  return `${frontendUrl}/#loginSuccess?token=${token}&name=${encodeURIComponent(user.name)}&provider=${provider}&email=${encodeURIComponent(
    user.email || ''
  )}`;
};

// 헬퍼: 이메일 중복 시 [계정 통합 vs 독립 가입] 선택을 위한 10분 만료 임시 토큰 발급
// consent — 최초 로그인 시작 시점(state)에 받은 동의를 그대로 실어둔다. [독립 신규 가입]을
// 고르면(confirmLink CREATE_NEW) 실제로 새 User가 생기는데, 그때 다시 동의를 받을 화면이 없어서
// 여기서 미리 들고 가지 않으면 그 경로만 동의 기록이 비게 된다.
const generateTempLinkToken = (socialUser: SocialProfile, existingUserId: string, consent: ConsentFlags) => {
  const payload: Omit<PendingSocialLinkPayload, keyof jwt.JwtPayload> = {
    purpose: 'social_link',
    provider: socialUser.provider,
    providerId: socialUser.providerId,
    email: socialUser.email,
    name: socialUser.name,
    profileImage: socialUser.profileImage,
    existingUserId,
    consent,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
};

// 마이페이지에서 로그인된 상태로 다른 소셜 계정을 추가 연동하는 경우 처리
// (OAuth state 파라미터에 서명된 userId를 실어보내 별도 리다이렉트 URI 등록 없이 기존 콜백을 재사용)
const handleLinkCallback = async (req: Request, res: Response, userId: string, frontendUrl: string) => {
  const socialUser = req.user as SocialProfile;

  if (!socialUser) {
    return res.redirect(`${frontendUrl}/#mypage?linkError=auth_failed`);
  }

  try {
    const existing = await prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider: socialUser.provider, providerId: socialUser.providerId } },
    });

    if (existing) {
      if (existing.userId !== userId) {
        return res.redirect(`${frontendUrl}/#mypage?linkError=already_linked_elsewhere`);
      }
      if (!existing.unlinkedAt) {
        return res.redirect(`${frontendUrl}/#mypage?linkError=already_own`);
      }
      // 과거 본인이 연동 해제했던 소셜 계정 -> 삭제 후 재생성 대신 그대로 복구
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: { unlinkedAt: null, email: socialUser.email },
      });
      return res.redirect(`${frontendUrl}/#mypage?linkSuccess=${socialUser.provider}`);
    }

    await prisma.socialAccount.create({
      data: {
        provider: socialUser.provider,
        providerId: socialUser.providerId,
        email: socialUser.email,
        userId,
      },
    });

    return res.redirect(`${frontendUrl}/#mypage?linkSuccess=${socialUser.provider}`);
  } catch (error) {
    console.error('소셜 계정 추가 연동 실패:', error);
    return res.redirect(`${frontendUrl}/#mypage?linkError=server_error`);
  }
};

// 소셜 로그인 성공 공통 처리 핸들러
export const handleSocialLoginCallback = async (req: Request, res: Response) => {
  const socialUser = req.user as SocialProfile;
  const state = req.query.state;
  // 로그인 시작 시점에 캡처해둔 프론트 오리진(LAN IP 등) 복원 — 없으면 FRONTEND_URL 기본값
  const frontendUrl = resolveFrontendUrl(state);

  // state에 서명된 링크 요청이 실려있으면 "로그인"이 아니라 "기존 로그인 유저에 계정 추가 연동"으로 분기
  if (typeof state === 'string') {
    try {
      const decoded = jwt.verify(state, JWT_SECRET) as LinkStatePayload;
      if (decoded.purpose === 'link' && decoded.userId) {
        return handleLinkCallback(req, res, decoded.userId, frontendUrl);
      }
    } catch {
      // 링크용 state가 아니면(혹은 만료) 무시하고 일반 로그인 흐름으로 계속 진행
    }
  }

  if (!socialUser) {
    return res.redirect(`${frontendUrl}?loginError=auth_failed`);
  }

  // 신규 가입일 때만 쓰인다(1단계 기존 계정 로그인 분기는 이 값을 참조하지 않는다) — 이미
  // 최초 가입 때 동의를 받은 사람에게 재로그인마다 다시 물을 이유가 없다.
  const consent = resolveConsent(state);
  // "로그인" 탭(동의 UI 없음)에서 시작된 요청인지 — 신규 가입 분기(3단계) 직전에만 참조한다.
  const mode = resolveMode(state);

  try {
    // 1단계: 이미 연동된 SocialAccount가 있으면 해당 User로 즉시 로그인
    // §3-1 — 아래에서 userId·unlinkedAt·id(전부 SocialAccount 자체 컬럼)만 쓰고 최신 User 값은
    // 어차피 곧이어 user.update가 다시 써서 돌려주므로, 여기서 User 관계를 함께 읽어올 필요가
    // 없다(include 제거 — 안 쓰는 관계를 매번 실어오지 않는다).
    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: socialUser.provider,
          providerId: socialUser.providerId,
        },
      },
    });

    if (existingAccount) {
      // §3-1 — 로그인 왕복 단축. 백엔드(Render 오리건)↔DB(Supabase 서울)가 왕복당 ~1.3초라
      // user.update와 (조건부) socialAccount.update를 직렬로 두 번 타면 그 자리에서 느려진다.
      // $transaction으로 묶어 한 왕복에 처리한다 — 과거엔 연동 해제 복구 케이스가 3왕복(find+
      // update+update)이었던 걸 2왕복(find+transaction)으로 줄인다.
      type UserUpdateOp = ReturnType<typeof prisma.user.update>;
      const ops: [UserUpdateOp, ...ReturnType<typeof prisma.socialAccount.update>[]] = [
        prisma.user.update({
          where: { id: existingAccount.userId },
          data: {
            name: socialUser.name,
            profileImage: socialUser.profileImage,
          },
        }),
      ];
      // 과거에 연동 해제(소프트 삭제)했던 계정으로 재로그인한 경우 -> 새 계정을 만들지 않고 그대로 복구
      if (existingAccount.unlinkedAt) {
        ops.push(
          prisma.socialAccount.update({
            where: { id: existingAccount.id },
            data: { unlinkedAt: null, email: socialUser.email },
          })
        );
      }
      const [user] = await prisma.$transaction(ops);
      return res.redirect(buildLoginSuccessRedirect(user, socialUser.provider, frontendUrl));
    }

    // 2단계: 연동 기록은 없지만 동일 이메일의 기존 유저가 있으면 -> 계정 통합/독립 가입 선택 모달로 유도
    if (socialUser.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: socialUser.email },
        include: { accounts: { where: { unlinkedAt: null } } },
      });

      if (existingUserByEmail) {
        const tempToken = generateTempLinkToken(socialUser, existingUserByEmail.id, consent);
        const existingProvider = existingUserByEmail.accounts[0]?.provider || 'UNKNOWN';
        const redirectUrl = `${frontendUrl}/#socialLinkPrompt?tempToken=${tempToken}&email=${encodeURIComponent(
          socialUser.email
        )}&existingProvider=${existingProvider}&newProvider=${socialUser.provider}`;
        return res.redirect(redirectUrl);
      }
    }

    // "로그인" 탭(mode=login)으로 여기까지 왔다는 건 이 소셜 계정으로 가입된 적이 없다는 뜻이다.
    // 그 탭엔 동의 체크박스 UI가 아예 없으므로, 동의 없이 조용히 새 User를 만드는 대신 가입
    // 이력이 없다고 알려 프론트가 "회원가입" 탭을 열게 한다(App.tsx loginError 처리부).
    if (mode === 'login') {
      return res.redirect(`${frontendUrl}?loginError=not_registered`);
    }

    // 필수 동의(이용약관·개인정보) 없이는 신규 가입을 만들지 않는다 — `/api/auth/:provider`
    // 시작 라우트에서 이미 걸렀어야 정상이지만, state 위변조·만료에 대비한 2차 방어선이다.
    if (!consent.terms || !consent.privacy) {
      return res.redirect(`${frontendUrl}?loginError=consent_required`);
    }

    // 3단계: 완전 신규 유저 (User + SocialAccount 동시 생성)
    const now = new Date();
    const newUser = await prisma.user.create({
      data: {
        email: socialUser.email,
        name: socialUser.name,
        profileImage: socialUser.profileImage,
        termsAgreedAt: now,
        privacyAgreedAt: now,
        marketingAgreedAt: consent.marketing ? now : null,
        accounts: {
          create: {
            provider: socialUser.provider,
            providerId: socialUser.providerId,
            email: socialUser.email,
          },
        },
      },
    });

    return res.redirect(buildLoginSuccessRedirect(newUser, socialUser.provider, frontendUrl));
  } catch (error) {
    console.error('소셜 로그인 DB 처리 실패:', error);
    return res.redirect(`${frontendUrl}?loginError=server_error`);
  }
};

// 가입 모달에서 [계정 통합] 또는 [독립 신규 가입] 선택 확정 처리 (`POST /api/auth/confirm-link`)
export const confirmLink = async (req: Request, res: Response) => {
  const { tempToken, action } = req.body as { tempToken?: string; action?: 'MERGE' | 'CREATE_NEW' };

  if (!tempToken || !action) {
    return res.status(400).json({ status: 'error', message: 'tempToken과 action이 필요합니다.' });
  }

  let payload: PendingSocialLinkPayload;
  try {
    payload = jwt.verify(tempToken, JWT_SECRET) as PendingSocialLinkPayload;
    if (payload.purpose !== 'social_link') {
      throw new Error('invalid token purpose');
    }
  } catch (err) {
    return res.status(401).json({ status: 'error', message: '유효하지 않거나 만료된 요청입니다. 다시 로그인해주세요.' });
  }

  try {
    if (action === 'MERGE') {
      // 이미 다른 소셜로 SocialAccount가 연동됐을 가능성 대비 (중복 클릭 등) 재확인
      const alreadyLinked = await prisma.socialAccount.findUnique({
        where: { provider_providerId: { provider: payload.provider, providerId: payload.providerId } },
      });
      if (alreadyLinked && !alreadyLinked.unlinkedAt) {
        return res.status(409).json({ status: 'error', message: '이미 연동된 소셜 계정입니다.' });
      }

      // 과거에 연동 해제됐던 행이 남아있으면 삭제 후 재생성 대신 그대로 복구(소유자 재배정 포함)
      const account = alreadyLinked
        ? await prisma.socialAccount.update({
          where: { id: alreadyLinked.id },
          data: { unlinkedAt: null, userId: payload.existingUserId, email: payload.email },
        })
        : await prisma.socialAccount.create({
          data: {
            provider: payload.provider,
            providerId: payload.providerId,
            email: payload.email,
            userId: payload.existingUserId,
          },
        });
      const user = await prisma.user.findUniqueOrThrow({ where: { id: account.userId } });

      return res.json({
        status: 'success',
        token: generateToken({ id: user.id, name: user.name, email: user.email ?? undefined, provider: payload.provider }),
        user: { id: user.id, name: user.name, email: user.email, provider: payload.provider },
      });
    }

    if (action === 'CREATE_NEW') {
      // 여기서도 실질적으로 새 User가 생기므로(독립 신규 가입) 동의가 없으면 만들지 않는다 —
      // 원래 로그인 시작 시점(state)의 동의가 tempToken까지 실려 왔어야 정상(2차 방어선).
      if (!payload.consent?.terms || !payload.consent?.privacy) {
        return res.status(400).json({ status: 'error', message: '이용약관 및 개인정보 수집·이용에 동의가 필요합니다. 다시 로그인해주세요.' });
      }

      // 토큰 발급 후 확정 사이 짧은 틈에 같은 provider+providerId가 이미 (재)연동됐을 가능성 대비
      const alreadyLinked = await prisma.socialAccount.findUnique({
        where: { provider_providerId: { provider: payload.provider, providerId: payload.providerId } },
      });
      if (alreadyLinked && !alreadyLinked.unlinkedAt) {
        return res.status(409).json({ status: 'error', message: '이미 연동된 소셜 계정입니다. 다시 로그인해주세요.' });
      }

      // User.email은 유니크라서 이미 다른 유저가 쓰는 이메일을 대표 이메일로는 못 씀 -> null로 두고
      // 실제 이메일은 SocialAccount.email(제약 없음)에만 보존
      const nowLinked = new Date();
      const newUser = await prisma.user.create({
        data: {
          email: null,
          name: payload.name,
          profileImage: payload.profileImage,
          termsAgreedAt: nowLinked,
          privacyAgreedAt: nowLinked,
          marketingAgreedAt: payload.consent.marketing ? nowLinked : null,
          ...(alreadyLinked
            ? {}
            : {
              accounts: {
                create: {
                  provider: payload.provider,
                  providerId: payload.providerId,
                  email: payload.email,
                },
              },
            }),
        },
      });

      if (alreadyLinked) {
        await prisma.socialAccount.update({
          where: { id: alreadyLinked.id },
          data: { unlinkedAt: null, userId: newUser.id, email: payload.email },
        });
      }

      return res.json({
        status: 'success',
        token: generateToken({ id: newUser.id, name: newUser.name, email: undefined, provider: payload.provider }),
        user: { id: newUser.id, name: newUser.name, email: newUser.email, provider: payload.provider },
      });
    }

    return res.status(400).json({ status: 'error', message: "action은 'MERGE' 또는 'CREATE_NEW'여야 합니다." });
  } catch (error) {
    console.error('계정 연동 확정 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '계정 연동 처리 중 오류가 발생했습니다.' });
  }
};

// 모의 / 데모 로그인 (개발자 및 데모용)
// 2026-08-12 정정: 예전엔 User 테이블에 저장하지 않는 합성 id(`demo_${Date.now()}`)로 토큰만
// 발급했는데, 그 id가 실제 User 행을 가리키지 않아 업체 문의·리뷰 등 User FK를 참조하는 모든
// 액션이 500으로 깨졌다(발견: 프런트의 "[빠른 데모 테스트용 선택]" 버튼이 이 API를 실제로는 호출
// 안 하고 있어서 화면에서는 안 보였을 뿐, API를 직접 두드리면 항상 재현됨). 이제 실제 소셜
// 로그인(User.create)과 동일하게 User 행을 upsert해서 decoded.id가 항상 유효한 FK를 가리키게 한다.
export const demoLogin = async (req: Request, res: Response) => {
  // 이 엔드포인트는 fetch 직접 호출이라 OAuth state 왕복 없이 body로 바로 동의 여부를 받는다
  // (LoginModal.tsx가 실제 소셜 버튼과 같은 체크박스 상태를 그대로 실어보낸다).
  const { provider, termsAgreed, privacyAgreed } = req.body as {
    provider?: string;
    termsAgreed?: boolean;
    privacyAgreed?: boolean;
  }; // 'KAKAO' | 'NAVER' | 'GOOGLE' | 'ADMIN'

  // ADMIN 데모 로그인은 개발용 뒷문이다 — 실서비스에서 살아있으면 누구나 role=ADMIN 토큰을
  // 발급받을 수 있다(docs 01-05 §6.4, §11 "구현 시 반드시 지킬 것" 3항). 배포 시 수동으로
  // 지우는 대신, 프로덕션 환경에서는 구조적으로 막아 사람이 잊어도 안전하도록 한다.
  if (provider === 'ADMIN' && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ status: 'error', message: '허용되지 않는 요청입니다.' });
  }

  // ADMIN 데모는 아래에서 User 행을 만들지 않으므로(순수 토큰 데모) 이 가드 대상이 아니다.
  if (provider !== 'ADMIN' && (!termsAgreed || !privacyAgreed)) {
    return res.status(400).json({ status: 'error', message: '이용약관 및 개인정보 수집·이용에 동의가 필요합니다.' });
  }

  const demoNames: Record<string, string> = {
    KAKAO: '카카오 테스트회원',
    NAVER: '네이버 테스트회원',
    GOOGLE: '구글 테스트회원',
    ADMIN: '관리자 (Admin)',
  };

  const name = (provider && demoNames[provider]) || '테스트 회원';
  const email = `demo_${(provider || 'user').toLowerCase()}@eobom.co.kr`;

  // ADMIN 데모는 B2C User와 무관한 순수 토큰 데모다 — Admin은 별도 모델(§6.4)이라 User 행을
  // 만들어도 실제 관리자 권한과는 상관없고, 어차피 /admin 라우트는 이 토큰을 받지 않는다.
  if (provider === 'ADMIN') {
    const user = { id: `demo_admin_${Date.now()}`, name, email, provider };
    const token = generateToken(user);
    return res.json({ status: 'success', token, user });
  }

  try {
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: { name },
      // update 절에는 안 넣는다 — 이미 존재하는 데모 유저를 재로그인할 때마다 최초 동의 시각을
      // 지금 시각으로 덮어쓰면 안 된다(최초 가입 시점만 기록되는 게 맞다).
      create: { email, name, termsAgreedAt: new Date(), privacyAgreedAt: new Date() },
    });

    const token = generateToken({ id: dbUser.id, name: dbUser.name, email: dbUser.email ?? undefined, provider: provider || 'DEMO' });

    return res.json({
      status: 'success',
      token,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        provider: provider || 'DEMO',
      },
    });
  } catch (error) {
    console.error('데모 로그인 처리 실패:', error);
    return res.status(500).json({ status: 'error', message: '데모 로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 현재 로그인 정보 검증 + 연동된 소셜 계정 목록 반환 (`GET /api/auth/me`)
export const getCurrentUser = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  // 소셜 로그인 회원은 DB에서 최신 정보 조회, 데모 로그인처럼 DB에 없는 토큰은 페이로드 그대로 반환
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { accounts: { where: { unlinkedAt: null }, select: { provider: true, email: true, createdAt: true } } },
  });
  if (!user) {
    return res.json({ status: 'success', user: decoded });
  }

  return res.json({
    status: 'success',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      accounts: user.accounts,
    },
  });
};

// 마이페이지에서 소셜 계정 연동 해제 (최소 1개는 유지) (`DELETE /api/auth/unlink-provider`)
export const unlinkProvider = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { provider } = req.body as { provider?: string };
  if (!provider) {
    return res.status(400).json({ status: 'error', message: 'provider가 필요합니다.' });
  }

  try {
    const accounts = await prisma.socialAccount.findMany({ where: { userId: decoded.id, unlinkedAt: null } });
    if (accounts.length <= 1) {
      return res.status(400).json({ status: 'error', message: '최소 1개의 소셜 계정은 연동되어 있어야 합니다.' });
    }

    const target = accounts.find((account) => account.provider === provider);
    if (!target) {
      return res.status(404).json({ status: 'error', message: '연동된 계정을 찾을 수 없습니다.' });
    }

    // 하드 삭제 대신 소프트 삭제: 이 provider로 재로그인 시 같은 계정으로 복구되도록 이력을 남겨둠
    await prisma.socialAccount.update({ where: { id: target.id }, data: { unlinkedAt: new Date() } });
    return res.json({ status: 'success', message: `${provider} 연동이 해제되었습니다.` });
  } catch (error) {
    console.error('소셜 계정 연동 해제 실패:', error);
    return res.status(500).json({ status: 'error', message: '연동 해제 처리 중 오류가 발생했습니다.' });
  }
};
