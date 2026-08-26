import { KAKAO_JS_KEY, KAKAO_SHARE_SDK_LOAD_TIMEOUT_MS, KAKAO_SHARE_SDK_LOAD_POLL_INTERVAL_MS } from '../config';

// 카카오톡 "공유하기" — docs 07-03 §3.2·§7(폴백 사다리). 지도 SDK(KakaoMapModal.tsx)와 같은
// 폴링+타임아웃 패턴을 쓰되 스크립트·초기화 방식이 다르다(공유는 Kakao.init 필요).

declare global {
  interface Window {
    Kakao: any;
  }
}

const SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';

let loadPromise: Promise<boolean> | null = null;

// SDK 로드 + init을 미리(페이지 마운트 시점) 끝내둔다 — sendDefault는 클릭 핸들러 "안에서
// 동기적으로" 호출해야 팝업 차단을 피한다(§7 구현 주의). await 뒤에 최초 로드를 걸면 안 된다.
export const ensureKakaoShareReady = (): Promise<boolean> => {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (!KAKAO_JS_KEY) {
      resolve(false);
      return;
    }
    if (window.Kakao?.isInitialized?.()) {
      resolve(true);
      return;
    }
    if (!document.querySelector('script[src*="kakao_js_sdk"]')) {
      const script = document.createElement('script');
      script.src = SDK_SRC;
      script.async = true;
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }

    let attempts = 0;
    const maxAttempts = Math.ceil(KAKAO_SHARE_SDK_LOAD_TIMEOUT_MS / KAKAO_SHARE_SDK_LOAD_POLL_INTERVAL_MS);
    const interval = setInterval(() => {
      attempts++;
      if (window.Kakao) {
        clearInterval(interval);
        try {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(KAKAO_JS_KEY);
          }
          resolve(!!window.Kakao.isInitialized());
        } catch (e) {
          console.error('Kakao SDK 초기화 실패:', e);
          resolve(false);
        }
        return;
      }
      if (attempts > maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }
    }, KAKAO_SHARE_SDK_LOAD_POLL_INTERVAL_MS);
  });

  return loadPromise;
};

export const isKakaoShareReady = (): boolean => !!window.Kakao?.isInitialized?.();

interface ShareCardParams {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  // 00-27 §9.1-4-3 — 예전엔 '부고 보기'로 하드코딩돼 있었다. 부고장 외 다른 도메인(가족 초대
  // 등)이 재사용하면서 받는 사람이 죽음과 무관한 카드를 부고로 오인하는 걸 막기 위해 호출부가
  // 문맥에 맞는 라벨을 직접 넘긴다.
  buttonLabel: string;
}

// 1순위: Kakao.Share.sendDefault(§3.2). 클릭 핸들러 안에서 동기 호출되어야 하므로, 호출부는
// ensureKakaoShareReady()를 await하지 않고 isKakaoShareReady()로 사전 로드 여부만 확인할 것.
export const shareViaKakao = (params: ShareCardParams): boolean => {
  if (!isKakaoShareReady()) return false;
  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl,
        link: { mobileWebUrl: params.url, webUrl: params.url },
      },
      buttons: [{ title: params.buttonLabel, link: { mobileWebUrl: params.url, webUrl: params.url } }],
    });
    return true;
  } catch (e) {
    console.error('Kakao.Share 실패:', e);
    return false;
  }
};

// 2순위: Web Share API(§7) — SDK 실패 시 모바일 OS 공유 시트(카톡 포함)로 대체.
export const shareViaWebShareApi = async (params: ShareCardParams): Promise<boolean> => {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: params.title, text: params.description, url: params.url });
    return true;
  } catch {
    // 사용자가 공유 시트를 취소한 경우도 포함 — 시트 자체는 정상적으로 떴으므로 실패로 보지 않는다.
    return true;
  }
};

// 3순위: 링크 복사(§7) — 폴백이 아니라 상시 노출. 이미 열어둔 단톡방에 바로 붙여넣는 경로.
export const copyObituaryLink = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
};

// 4순위: 문자로 보내기(§7) — 카톡을 안 쓰는 조문객용 보조 버튼.
export const buildObituarySmsHref = (url: string, deceasedName: string): string => {
  const body = encodeURIComponent(`[부고] 故 ${deceasedName} 님 - ${url}`);
  return `sms:?body=${body}`;
};
