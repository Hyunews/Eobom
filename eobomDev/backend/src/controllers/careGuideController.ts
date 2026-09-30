import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';

// 상중 행정 가이드 체크 상태 — docs 07-04 §3.4·§3.4-2. 회원만 서버에 보존한다(비회원은 프런트 state).
// 🔴 §3.4-1 — "어떤 항목을 체크했는가"는 상속 판단·재산 규모를 읽히는 정보라 운영자 화면·로그·에러
// 리포트에 남기지 않는다. 그래서 catch에서도 taskId·목록을 찍지 않고 고정 문구만 남긴다.
// 🔴 체크 해제 = 행 삭제(false 행을 만들지 않는다). taskId = careGuideTasks.json 정수 id.

const MAX_TASK_ID = 1000; // careGuideTasks.json은 23건 — 터무니없는 값만 막는 상한

const parseTaskId = (raw: string): number | null => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= MAX_TASK_ID ? n : null;
};

// GET /api/me/care-guide → { taskIds: number[] }
export const listMyCareGuideProgress = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const rows = await prisma.careGuideProgress.findMany({ where: { userId: decoded.id }, select: { taskId: true } });
    return res.json({ status: 'success', data: { taskIds: rows.map((r) => r.taskId) } });
  } catch {
    console.error('상중 행정 가이드 체크 조회 실패');
    return res.status(500).json({ status: 'error', message: '체크 상태를 불러오지 못했습니다.' });
  }
};

// PUT /api/me/care-guide/:taskId — 체크(멱등)
export const checkCareGuideTask = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  const taskId = parseTaskId(req.params.taskId);
  if (taskId === null) return res.status(400).json({ status: 'error', message: '올바르지 않은 항목입니다.' });

  try {
    await prisma.careGuideProgress.upsert({
      where: { userId_taskId: { userId: decoded.id, taskId } },
      create: { userId: decoded.id, taskId },
      update: {},
    });
    return res.json({ status: 'success', data: null });
  } catch {
    console.error('상중 행정 가이드 체크 저장 실패');
    return res.status(500).json({ status: 'error', message: '체크 상태를 저장하지 못했습니다.' });
  }
};

// DELETE /api/me/care-guide/:taskId — 체크 해제(행 삭제, 멱등)
export const uncheckCareGuideTask = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  const taskId = parseTaskId(req.params.taskId);
  if (taskId === null) return res.status(400).json({ status: 'error', message: '올바르지 않은 항목입니다.' });

  try {
    await prisma.careGuideProgress.deleteMany({ where: { userId: decoded.id, taskId } });
    return res.json({ status: 'success', data: null });
  } catch {
    console.error('상중 행정 가이드 체크 해제 실패');
    return res.status(500).json({ status: 'error', message: '체크 상태를 저장하지 못했습니다.' });
  }
};
