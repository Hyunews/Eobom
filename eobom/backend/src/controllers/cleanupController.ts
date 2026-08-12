import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';

// 유족 개인의 디지털 정리 진행 추적(docs 03-02 §3, §6.2). 증빙 파일은 받지 않는다(§3.3) —
// 이 컨트롤러에 파일 업로드 관련 로직을 추가하지 않는다.

const VALID_STATUSES = ['TODO', 'PREPARING', 'SUBMITTED', 'DONE', 'BLOCKED'] as const;
const isValidStatus = (v: unknown): v is (typeof VALID_STATUSES)[number] =>
  typeof v === 'string' && (VALID_STATUSES as readonly string[]).includes(v);

// 내 정리 진행 목록 (`GET /api/me/cleanup-items`)
export const listMyCleanupItems = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const status = req.query.status as string | undefined;

  try {
    const items = await prisma.digitalCleanupItem.findMany({
      where: {
        userId: decoded.id,
        ...(status && isValidStatus(status) ? { status } : {}),
      },
      include: { platform: { select: { id: true, name: true, category: true, actionType: true, officialUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: items });
  } catch (error) {
    console.error('정리 진행 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 정리 항목 추가 (`POST /api/me/cleanup-items`) — 카탈로그 항목 또는 직접 입력 둘 다 지원(§5.2)
export const createCleanupItem = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const { platformId, customName, memo } = req.body as { platformId?: string; customName?: string; memo?: string };
  if (!platformId && !customName?.trim()) {
    return res.status(400).json({ status: 'error', message: 'platformId 또는 customName 중 하나는 필요합니다.' });
  }

  try {
    if (platformId) {
      const platform = await prisma.digitalPlatform.findUnique({ where: { id: platformId } });
      if (!platform || !platform.isPublished) {
        return res.status(404).json({ status: 'error', message: '플랫폼을 찾을 수 없습니다.' });
      }
    }

    const item = await prisma.digitalCleanupItem.create({
      data: {
        userId: decoded.id,
        platformId: platformId || null,
        customName: platformId ? null : customName!.trim(),
        memo: memo?.trim() || null,
        statusHistory: [{ status: 'TODO', at: new Date().toISOString() }] as unknown as Prisma.InputJsonValue,
      },
      include: { platform: { select: { id: true, name: true, category: true, actionType: true, officialUrl: true } } },
    });
    return res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    console.error('정리 항목 추가 실패:', error);
    return res.status(500).json({ status: 'error', message: '항목 추가 중 오류가 발생했습니다.' });
  }
};

// 상태·메모 변경 (`PATCH /api/me/cleanup-items/:id`) — 본인 항목만
export const updateCleanupItem = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const { status, memo, note } = req.body as { status?: string; memo?: string; note?: string };
  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json({ status: 'error', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const existing = await prisma.digitalCleanupItem.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== decoded.id) {
      // 존재하지 않음과 소유권 없음을 동일하게 404로 응답 — 다른 유저의 항목 존재 여부를 노출하지 않는다
      return res.status(404).json({ status: 'error', message: '항목을 찾을 수 없습니다.' });
    }

    const history = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
    const nextStatus = status ?? existing.status;

    const updated = await prisma.digitalCleanupItem.update({
      where: { id: existing.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(memo !== undefined ? { memo: memo.trim() || null } : {}),
        ...(status !== undefined
          ? {
              statusHistory: [
                ...history,
                { status: nextStatus, at: new Date().toISOString(), ...(note?.trim() ? { note: note.trim() } : {}) },
              ] as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: { platform: { select: { id: true, name: true, category: true, actionType: true, officialUrl: true } } },
    });
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('정리 항목 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '항목 수정 중 오류가 발생했습니다.' });
  }
};
