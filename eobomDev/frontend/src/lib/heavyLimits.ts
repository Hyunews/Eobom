// docs 06-04 §6.4-11-10 — 사진 글자 인식·음성 변환 "작업 중" 화면의 숫자. 🔴 한 곳에 둔다.
// 서버 마감(사진 55초·음성 115초, backend `HEAVY_QUEUE_CONFIG.deadlineMs`)에 여유 10초를 더한 값이다 —
// 서버가 먼저 이유를 알려 주고, 응답이 끝내 안 오면 화면이 스스로 ②를 띄운다. 모두 "업로드가 끝난 뒤"부터 센다.
export const HEAVY_CLIENT_LIMITS = {
  photo: { deadlineMs: 65_000, maxMinutes: 1 },
  audio: { deadlineMs: 125_000, maxMinutes: 2 },
  // 음성 길이 상한(잠정 10분 · 실측 뒤 확정) — backend `audioMaxSeconds`와 같은 값.
  audioMaxSeconds: 600,
} as const;

// 녹음 자동 중지 기준(D-12 #72) — 서버 상한(audioMaxSeconds)에 딱 맞추면 녹음 길이가 600초를 넘어 거절될 수 있어 5초 앞에서 끊는다.
// 화면 문구는 "최대 10분" 그대로.
export const RECORD_AUTO_STOP_SECONDS = HEAVY_CLIENT_LIMITS.audioMaxSeconds - 5;

// 스펙 문구 그대로(§6.4-11-10 대기 상한 줄).
export const HEAVY_TIMEOUT_MESSAGE = {
  photo: '사진 인식이 오래 걸려 중단했습니다. 잠시 후 다시 시도해 주세요.',
  // 🔴 음성은 "다시 시도"를 쓰지 않는다 — 같은 파일은 다시 해도 같은 이유로 멈추고 요금만 또 나간다.
  audio: '음성 변환이 오래 걸려 중단했습니다. 녹음을 나눠 올리거나 직접 입력해 주세요.',
} as const;

export const HEAVY_NETWORK_MESSAGE = {
  photo: '인식 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  audio: '인식 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요. 직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요.',
} as const;

export const AUDIO_TOO_LONG_MESSAGE = `${Math.round(HEAVY_CLIENT_LIMITS.audioMaxSeconds / 60)}분 이하 녹음만 올릴 수 있습니다.`;

// 파일을 풀지 않고 <audio> 메타데이터로 재생 길이만 읽는다. 못 읽으면 null — 그대로 통과(서버 시간 제한이 막는다).
export const readAudioDurationSec = (file: File, waitMs = 3000): Promise<number | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    let done = false;
    const finish = (value: number | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), waitMs);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => finish(null);
    audio.src = url;
  });
