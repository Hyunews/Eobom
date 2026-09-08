import passport from 'passport';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export interface SocialProfile {
  provider: 'KAKAO' | 'NAVER' | 'GOOGLE';
  providerId: string;
  email?: string;
  name: string;
  profileImage?: string;
}

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || 'dummy_kakao_key';
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'dummy_naver_key';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'dummy_naver_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_google_key';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_secret';

// 1. 카카오 전략 (Kakao Strategy)
const kakaoStrategy = new KakaoStrategy(
  {
    clientID: KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:5000/api/auth/kakao/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const kakaoAccount = profile._json?.kakao_account;
      const socialUser: SocialProfile = {
        provider: 'KAKAO',
        providerId: String(profile.id),
        email: kakaoAccount?.email || `${profile.id}@kakao.user`,
        name: profile.displayName || kakaoAccount?.profile?.nickname || '카카오 사용자',
        profileImage: kakaoAccount?.profile?.profile_image_url || '',
      };
      return done(null, socialUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
);

// passport-oauth2 기본 authorizationParams는 빈 객체만 반환해서 prompt 값이 전달 안 됨 → 직접 오버라이드.
// 로그아웃 후 재로그인 시 카카오가 기존 세션을 그대로 재사용하지 않고 매번 로그인 화면을 다시 띄우도록 강제.
(kakaoStrategy as unknown as { authorizationParams: (options: { prompt?: string }) => Record<string, string> }).authorizationParams = (
  options: { prompt?: string }
): Record<string, string> => (options?.prompt ? { prompt: options.prompt } : {});

passport.use(kakaoStrategy);

// 2. 네이버 전략 (Naver Strategy)
passport.use(
  new NaverStrategy(
    {
      clientID: NAVER_CLIENT_ID,
      clientSecret: NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_CALLBACK_URL || 'http://localhost:5000/api/auth/naver/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const socialUser: SocialProfile = {
          provider: 'NAVER',
          providerId: String(profile.id),
          email: profile.email || `${profile.id}@naver.user`,
          name: profile.name || profile.nickname || '네이버 사용자',
          profileImage: profile.profileImage || '',
        };
        return done(null, socialUser);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// 3. 구글 전략 (Google Strategy)
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const socialUser: SocialProfile = {
          provider: 'GOOGLE',
          providerId: String(profile.id),
          email: profile.emails?.[0]?.value || `${profile.id}@google.user`,
          name: profile.displayName || '구글 사용자',
          profileImage: profile.photos?.[0]?.value || '',
        };
        return done(null, socialUser);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
