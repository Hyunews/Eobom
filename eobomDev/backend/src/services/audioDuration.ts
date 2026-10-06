// docs 06-04 §6.4-11-10 "음성 길이 상한" — 서버 재확인용 가벼운 길이 읽기. ffprobe가 없고(ffmpeg-static은
// ffmpeg만 든다) 파일을 풀지도 않는다: 컨테이너 머리말만 본다. 못 읽으면 null — 호출자는 그대로 통과시킨다
// (서버 시간 제한이 막는다). m4a·wav·mp3만 읽고, webm(MediaRecorder는 길이를 안 적는다)은 null.

const readMp4Duration = (b: Buffer): number | null => {
  // 상자 = [크기 4][종류 4]. 크기 1이면 뒤 8바이트가 실제 크기. moov 안의 mvhd에 timescale·duration이 있다.
  const findBox = (start: number, end: number, type: string): { from: number; to: number } | null => {
    let pos = start;
    while (pos + 8 <= end) {
      let size = b.readUInt32BE(pos);
      const name = b.toString('latin1', pos + 4, pos + 8);
      let header = 8;
      if (size === 1) {
        if (pos + 16 > end) return null;
        size = Number(b.readBigUInt64BE(pos + 8));
        header = 16;
      } else if (size === 0) {
        size = end - pos;
      }
      if (size < header) return null;
      if (name === type) return { from: pos + header, to: Math.min(pos + size, end) };
      pos += size;
    }
    return null;
  };
  const moov = findBox(0, b.length, 'moov');
  if (!moov) return null;
  const mvhd = findBox(moov.from, moov.to, 'mvhd');
  if (!mvhd) return null;
  const version = b[mvhd.from];
  let timescale: number;
  let duration: number;
  if (version === 1) {
    if (mvhd.from + 32 > b.length) return null;
    timescale = b.readUInt32BE(mvhd.from + 20);
    duration = Number(b.readBigUInt64BE(mvhd.from + 24));
  } else {
    if (mvhd.from + 20 > b.length) return null;
    timescale = b.readUInt32BE(mvhd.from + 12);
    duration = b.readUInt32BE(mvhd.from + 16);
  }
  return timescale > 0 ? duration / timescale : null;
};

const readWavDuration = (b: Buffer): number | null => {
  let pos = 12;
  let byteRate = 0;
  while (pos + 8 <= b.length) {
    const id = b.toString('latin1', pos, pos + 4);
    const size = b.readUInt32LE(pos + 4);
    if (id === 'fmt ' && pos + 16 <= b.length) byteRate = b.readUInt32LE(pos + 16);
    if (id === 'data') {
      const dataSize = Math.min(size, b.length - (pos + 8)); // 스트리밍 녹음은 크기가 0·최댓값일 수 있다
      return byteRate > 0 ? dataSize / byteRate : null;
    }
    pos += 8 + size + (size % 2);
  }
  return null;
};

// MPEG 오디오 Layer III 비트레이트(kbps) · 표본 속도.
const MP3_BITRATE_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const MP3_BITRATE_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const MP3_RATE: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] }; // 키 = 버전 비트

const readMp3Duration = (b: Buffer): number | null => {
  let pos = 0;
  if (b.toString('latin1', 0, 3) === 'ID3' && b.length >= 10) {
    pos = 10 + ((b[6] & 0x7f) << 21 | (b[7] & 0x7f) << 14 | (b[8] & 0x7f) << 7 | (b[9] & 0x7f));
  }
  // 첫 프레임 머리말(동기 11비트)을 찾는다 — 앞이 깨져 있어도 조금은 찾아본다.
  const limit = Math.min(b.length - 4, pos + 4096);
  for (; pos < limit; pos += 1) {
    if (b[pos] !== 0xff || (b[pos + 1] & 0xe0) !== 0xe0) continue;
    const versionBits = (b[pos + 1] >> 3) & 0x03; // 3=MPEG1 · 2=MPEG2 · 0=MPEG2.5
    const layer = (b[pos + 1] >> 1) & 0x03; // 1=Layer III
    const bitrateIdx = (b[pos + 2] >> 4) & 0x0f;
    const rateIdx = (b[pos + 2] >> 2) & 0x03;
    if (versionBits === 1 || layer !== 1 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) continue;
    const isV1 = versionBits === 3;
    const bitrate = (isV1 ? MP3_BITRATE_V1 : MP3_BITRATE_V2)[bitrateIdx] * 1000;
    const sampleRate = MP3_RATE[versionBits][rateIdx];
    const mono = ((b[pos + 3] >> 6) & 0x03) === 3;
    const samplesPerFrame = isV1 ? 1152 : 576;

    // VBR 머리말(Xing/Info)에 프레임 수가 있으면 그것으로 — 없으면 첫 프레임 비트레이트로 어림(CBR).
    const tagAt = pos + 4 + (isV1 ? (mono ? 17 : 32) : (mono ? 9 : 17));
    const tag = b.toString('latin1', tagAt, tagAt + 4);
    if ((tag === 'Xing' || tag === 'Info') && tagAt + 12 <= b.length && (b[tagAt + 7] & 0x01)) {
      const frames = b.readUInt32BE(tagAt + 8);
      return (frames * samplesPerFrame) / sampleRate;
    }
    return ((b.length - pos) * 8) / bitrate;
  }
  return null;
};

export const getAudioDurationSec = (buf: Buffer): number | null => {
  try {
    if (buf.length < 16) return null;
    if (buf.toString('latin1', 4, 8) === 'ftyp') return readMp4Duration(buf);
    if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WAVE') return readWavDuration(buf);
    if (buf.readUInt32BE(0) === 0x1a45dfa3) return null; // webm — 길이를 안 적는다
    return readMp3Duration(buf);
  } catch {
    return null; // 못 읽으면 통과(§6.4-11-10)
  }
};
