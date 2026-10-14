import type { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getRequestId } from '../middleware/requestLog';
import { clientIp } from './opsLogService';

// docs 00-42 §5.3 E — 사후개봉 열람 기록. 지정 가족이 엔딩노트 내용을 응답으로 받기 **전에** 한 줄을 남긴다.
// 🔴 기록을 못 쓰면 던진다 — 호출한 쪽이 503으로 응답을 거부한다(기록 없는 열람을 만들지 않는다, 운영자 열람 §5.2-5와 같은 원칙).
//    접속기록·에러 기록(throw 안 함)과 반대다 — 일부러 다르다.
// 🔴 내용은 남기지 않는다 — 열람자 id·엔딩노트 id·응답에 실린 섹션 종류·IP·요청 번호뿐(§4.9).
// 🔴 추가만 한다 — update·delete 없음. 지우는 건 엔딩노트가 파기될 때 Cascade뿐(accountPurgeService).

export const FAMILY_VIEW_LOG_FAILED_MESSAGE = '열람 기록을 남기지 못해 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.';

// 편지가 응답에 실렸을 때 섹션 목록에 붙이는 종류. 음성은 따로(편지 음성 경로).
export const LETTER_SECTION = 'LETTER';
export const LETTER_AUDIO_SECTION = 'LETTER_AUDIO';

export type ViewLogEntry = { noteId: string; sections: string[] };

export async function writeEndingNoteViewLogs(req: Request, res: Response, viewerId: string, entries: ViewLogEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const ip = clientIp(req);
  const requestId = getRequestId(res) ?? 'unknown';
  await prisma.endingNoteViewLog.createMany({
    data: entries.map((e) => ({ viewerId, noteId: e.noteId, sections: e.sections, ip, requestId })),
  });
}

// 503 응답 — 호출한 쪽이 `return`한다.
export function rejectViewLogFailure(res: Response, error: unknown) {
  console.error('사후개봉 열람 기록 실패 — 열람 응답을 거부함:', (error as Error).message);
  return res.status(503).json({ status: 'error', message: FAMILY_VIEW_LOG_FAILED_MESSAGE, requestId: getRequestId(res) });
}
