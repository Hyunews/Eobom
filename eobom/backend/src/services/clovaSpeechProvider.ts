import type { SttProvider } from './sttProvider';
import { convertToMp3 } from './audioConvert';

// docs 06-04 §6.4-11 — NCP CLOVA Speech(장문 인식, Long Sentence Recognition) 연동.
// 인증은 Client ID/Secret이 아니라 Invoke URL(도메인 식별자 포함) + Secret Key 헤더 하나다
// (§6.4-11-5-1 — 단문 CSR API와 방식이 다르다).

// 브라우저가 m4a를 audio/mp4 등으로 보고하는 경우가 흔하다 — 이 집합에 걸리면 CLOVA의 실제
// m4a 지원 여부와 무관하게 항상 mp3로 변환해서 올린다(§6.4-11-7).
const M4A_LIKE_MIME_TYPES = new Set(['audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac']);

interface ClovaSegment {
  text?: string;
}

interface ClovaResponse {
  result?: string;
  message?: string;
  text?: string;
  segments?: ClovaSegment[];
}

export class ClovaSpeechProvider implements SttProvider {
  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const invokeUrl = process.env.CLOVA_SPEECH_INVOKE_URL;
    const secret = process.env.CLOVA_SPEECH_SECRET;
    if (!invokeUrl || !secret) {
      throw new Error('CLOVA_SPEECH_INVOKE_URL / CLOVA_SPEECH_SECRET이 설정되지 않았습니다.');
    }

    let uploadBuffer = audio;
    let filename = 'audio.mp3';
    let contentType = 'audio/mpeg';

    if (M4A_LIKE_MIME_TYPES.has(mimeType.toLowerCase())) {
      // §6.4-10-3·§6.4-11-7 — stdin→stdout 스트림 변환만. 디스크에 쓰지 않는다.
      uploadBuffer = await convertToMp3(audio);
    } else if (mimeType.toLowerCase().includes('wav')) {
      filename = 'audio.wav';
      contentType = 'audio/wav';
    }
    // 그 외(mp3 계열)는 원본 그대로 올린다.

    // 2026-08-26 실측(scratchpad 테스트 호출) — 콘솔 도메인 설정("화자 인식 끔")은 기본값에
    // 반영되지 않는다. diarization.enable을 요청에서 명시적으로 꺼주지 않으면 매 요청이
    // "speaker detect is off" 400으로 거부된다 — 콘솔 설정을 믿고 생략했다가 실제로 걸린 지점.
    // completion:'sync' + 직접 업로드 조합에서는 응답에 resultToObs:false가 그대로 echo되는
    // 것도 실측 확인함 — Object Storage 결과 경로를 지나가지 않는다(§4.1 ③, §6.4-11-6-2 실측 ①).
    const params = {
      language: 'ko-KR',
      completion: 'sync',
      diarization: { enable: false },
      sed: { enable: false },
      fullText: true,
    };

    const form = new FormData();
    // Buffer는 ArrayBufferLike(SharedArrayBuffer 포함 가능)를 참조할 수 있어 BlobPart 타입과
    // 안 맞는다 — Uint8Array.from으로 순수 ArrayBuffer 기반 사본을 만들어 넘긴다.
    form.append('media', new Blob([Uint8Array.from(uploadBuffer)], { type: contentType }), filename);
    // 🔴 params는 Blob이 아니라 일반 문자열 필드로 보내야 한다 — Blob(content-type:application/
    // json)으로 감싸면 서버가 "Invalid params: params"로 무조건 거부한다(실측 확인, 2026-08-26).
    form.append('params', JSON.stringify(params));

    const res = await fetch(`${invokeUrl}/recognizer/upload`, {
      method: 'POST',
      headers: {
        'X-CLOVASPEECH-API-KEY': secret,
        Accept: 'application/json;UTF-8',
      },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`CLOVA Speech 요청 실패(${res.status}): ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as ClovaResponse;
    if (data.result && data.result !== 'COMPLETED') {
      throw new Error(`CLOVA Speech 처리 실패: ${data.result} ${data.message ?? ''}`.trim());
    }
    if (typeof data.text === 'string' && data.text.trim()) {
      return data.text.trim();
    }
    if (Array.isArray(data.segments)) {
      const joined = data.segments
        .map((s) => s.text)
        .filter((t): t is string => !!t)
        .join(' ')
        .trim();
      if (joined) return joined;
    }
    // 요청 자체는 COMPLETED이지만(정상 응답) 텍스트가 비어 있는 경우 — 무음·잡음만 있었을 때다.
    throw new Error('음성에서 인식된 내용이 없습니다.');
  }
}
