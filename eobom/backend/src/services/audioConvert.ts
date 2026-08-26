import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

// docs 06-04 §6.4-10-3·§6.4-11-7 — m4a는 CLOVA의 실제 지원 여부와 무관하게 항상 mp3로 변환해
// 올린다. 반드시 stdin→stdout 스트림으로만 처리한다 — 임시 파일을 만들면 §6.4-9-4의
// "디스크에 쓰지 않는다"가 디코더 단계에서 조용히 깨진다.
export const convertToMp3 = (input: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('ffmpeg 바이너리를 찾을 수 없습니다.'));
      return;
    }

    const proc = spawn(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-vn',
      '-c:a', 'libmp3lame',
      '-q:a', '2',
      '-f', 'mp3',
      'pipe:1',
    ]);

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg 변환 실패(exit ${code}): ${Buffer.concat(errChunks).toString('utf8').slice(0, 300)}`));
      }
    });

    // ffmpeg가 입력을 다 읽지 않고 조기 종료하면(잘못된 파일 등) stdin.write가 EPIPE를 던질 수
    // 있다 — 위 'close' 핸들러가 최종 성공/실패를 판정하므로 여기서는 무시만 한다.
    proc.stdin.on('error', () => {});
    proc.stdin.write(input);
    proc.stdin.end();
  });
};
