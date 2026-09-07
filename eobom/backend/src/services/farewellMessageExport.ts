import archiver from 'archiver';
import type { Writable } from 'stream';
import prisma from '../config/prisma';
import { decryptNoteField } from '../utils/crypto';
import { isR2Enabled } from '../config/r2';
import { downloadVoiceObject } from './r2Storage';
import { convertToMp3 } from './audioConvert';

// docs 06-05 §5.4-3·§8 D-5 — 반출 꾸러미. 탈퇴(§5.4-2, 본인)와 사망(§5.4-4, 유족) 양쪽이
// 같은 zip 구성을 쓴다(§5.4-1) — 소유자 확인만 호출부가 각자 하고, 이 함수는 note.userId
// 기준으로 그 사람의 편지를 묶어 res에 스트리밍한다.

// 파일명에 못 쓰는 문자만 제거 — 원문 유지(한글 파일명 허용, OS 대부분 지원).
const sanitizeForFilename = (raw: string): string =>
  raw.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '무제';

// RFC 5987 — 브라우저 대부분이 filename*를 우선 읽어 한글 파일명이 깨지지 않는다.
const contentDispositionFor = (filename: string): string =>
  `attachment; filename="eobom-export.zip"; filename*=UTF-8''${encodeURIComponent(filename)}`;

export const buildExportZipFilename = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `eobom_유족메시지_${y}${m}${d}.zip`;
};

// 🔴 §5.4-3 — zip에 암호를 걸지 않는다. 방어선은 이 함수를 부르기 전의 로그인·본인확인이다.
// 🔴 §5.4-3 — m4a·webm 원본 그대로 담지 않는다. mediaMime과 무관하게 항상 mp3로 재인코딩해
// 수십 년 뒤에도 흔한 포맷으로 남긴다(audioConvert 재사용).
// 🔴 zip 전체를 메모리에 모으지 않는다 — archiver가 개별 엔트리를 만드는 대로 destination으로
// 스트리밍하고, 원본 음성 버퍼만(단건 20MB 상한, uploadAudio.ts) 그때그때 메모리에 올린다.
export const streamFarewellMessageExportZip = async (
  userId: string,
  destination: Writable,
): Promise<void> => {
  const rows = await prisma.farewellMessage.findMany({
    where: { note: { userId }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      title: true,
      bodyEnc: true,
      mediaKey: true,
      mediaDeletedAt: true,
      recipient: { select: { name: true } },
      createdAt: true,
    },
  });

  const archive = archiver('zip', { zlib: { level: 9 } });
  // archiver는 'error' 이벤트로만 실패를 알린다 — finalize()의 리턴 프로미스만 기다리면
  // 스트리밍 중 오류가 미처리 rejection이 된다.
  const archiveError = new Promise<never>((_resolve, reject) => {
    archive.on('error', reject);
  });
  archive.pipe(destination);

  const guideLines = [
    '이 압축 파일은 이어봄(Eobom)에서 반출한 유족 메시지 백업입니다.',
    `반출 일시: ${new Date().toISOString()}`,
    '',
    '편지 본문은 .txt(평문), 음성은 .mp3로 담겨 있으며 이어봄 없이도 일반 프로그램으로',
    '바로 열립니다. 이 zip에는 암호를 걸지 않았습니다 — 이 파일을 전달받은 경로 자체',
    '(로그인 후 본인확인을 거친 다운로드)가 접근 통제이기 때문입니다.',
    '',
    ...rows.map((r, i) => {
      const idx = String(i + 1).padStart(2, '0');
      const label = sanitizeForFilename(r.title?.trim() || `${r.recipient.name}에게`);
      return `- 편지_${idx}_${label}: 작성일 ${r.createdAt.toISOString().slice(0, 10)}`;
    }),
  ];
  archive.append(guideLines.join('\n'), { name: '안내.txt' });

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const idx = String(i + 1).padStart(2, '0');
    const label = sanitizeForFilename(row.title?.trim() || `${row.recipient.name}에게`);
    const baseName = `편지_${idx}_${label}`;

    archive.append(decryptNoteField(row.bodyEnc), { name: `${baseName}.txt` });

    if (row.mediaKey && !row.mediaDeletedAt && isR2Enabled()) {
      // eslint-disable-next-line no-await-in-loop
      const original = await downloadVoiceObject(row.mediaKey);
      // eslint-disable-next-line no-await-in-loop
      const mp3 = await convertToMp3(original);
      archive.append(mp3, { name: `${baseName}.mp3` });
    }
  }

  await Promise.race([archive.finalize(), archiveError]);
};

export const setExportZipHeaders = (res: { set: (field: string, value: string) => void }): void => {
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', contentDispositionFor(buildExportZipFilename()));
  res.set('Cache-Control', 'no-store');
};
