export const BACKEND_URL = 'http://localhost:5000';

export const PROVIDER_LABELS: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
};

export const providerLabel = (provider: string): string => PROVIDER_LABELS[provider.toUpperCase()] || provider;
