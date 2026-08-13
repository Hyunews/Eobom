import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyAdminBearerToken } from './adminController';

// 디지털 플랫폼 안내 카탈로그(docs 04-01 §3.1) — 운영자가 관리하는 마스터 데이터.
// 금융·가상자산 플랫폼은 이 테이블에 절대 넣지 않는다(§3.2 C분류) — 관리자 화면에서 등록을
// 막지는 않지만, 등록 전 이 원칙을 반드시 확인할 것.

const VALID_CATEGORIES = ['EMAIL', 'SNS', 'CLOUD', 'SUBSCRIPTION', 'ETC'] as const;
const VALID_ACTION_TYPES = ['DELETE', 'MEMORIALIZE', 'CANCEL'] as const;

const isValidCategory = (v: unknown): v is (typeof VALID_CATEGORIES)[number] =>
  typeof v === 'string' && (VALID_CATEGORIES as readonly string[]).includes(v);
const isValidActionType = (v: unknown): v is (typeof VALID_ACTION_TYPES)[number] =>
  typeof v === 'string' && (VALID_ACTION_TYPES as readonly string[]).includes(v);

// 공개 조회 (`GET /api/digital-platforms`) — isPublished=true만 반환(§6.1). 인증 불필요.
export const listPublicDigitalPlatforms = async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;

  try {
    const platforms = await prisma.digitalPlatform.findMany({
      where: {
        isPublished: true,
        ...(category && isValidCategory(category) ? { category } : {}),
      },
      select: {
        id: true,
        name: true,
        category: true,
        actionType: true,
        officialUrl: true,
        requiredDocs: true,
        guideSummary: true,
        estimatedDays: true,
        needsAgentHelp: true,
        lastVerifiedAt: true, // 화면에 최종 확인일을 함께 노출(§3.1)
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return res.json({ status: 'success', data: platforms });
  } catch (error) {
    console.error('디지털 플랫폼 카탈로그 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '카탈로그 조회 중 오류가 발생했습니다.' });
  }
};

// 운영자 전체 조회 (`GET /api/admin/digital-platforms`) — 미공개 항목도 포함
export const listDigitalPlatformsForAdmin = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  try {
    const platforms = await prisma.digitalPlatform.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return res.json({ status: 'success', data: platforms });
  } catch (error) {
    console.error('디지털 플랫폼 카탈로그(운영자) 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '카탈로그 조회 중 오류가 발생했습니다.' });
  }
};

// 신규 등록 (`POST /api/admin/digital-platforms`) — 등록만으로 공개되지 않는다(isPublished 기본 false).
// §3.1: 공식 고객센터 문서를 확인한 뒤 lastVerifiedAt과 함께 채울 것. 확인 못 했으면 만들지 않는 게 낫다.
export const createDigitalPlatform = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const {
    name,
    category,
    actionType,
    officialUrl,
    requiredDocs,
    guideSummary,
    estimatedDays,
    needsAgentHelp,
    isPublished,
    lastVerifiedAt,
    sortOrder,
  } = req.body as {
    name?: string;
    category?: string;
    actionType?: string;
    officialUrl?: string;
    requiredDocs?: string[];
    guideSummary?: string;
    estimatedDays?: number;
    needsAgentHelp?: boolean;
    isPublished?: boolean;
    lastVerifiedAt?: string;
    sortOrder?: number;
  };

  if (!name?.trim() || !guideSummary?.trim()) {
    return res.status(400).json({ status: 'error', message: '표시명과 절차 요약은 필수입니다.' });
  }
  if (!isValidCategory(category)) {
    return res.status(400).json({ status: 'error', message: `category는 ${VALID_CATEGORIES.join(', ')} 중 하나여야 합니다.` });
  }
  if (!isValidActionType(actionType)) {
    return res.status(400).json({ status: 'error', message: `actionType은 ${VALID_ACTION_TYPES.join(', ')} 중 하나여야 합니다.` });
  }
  // isPublished를 true로 등록하려면 확인일(lastVerifiedAt)이 같이 있어야 한다 — 확인 안 한 채로
  // 공개하는 걸 막는다(§3.1의 "확인 못 한 플랫폼은 만들지 않는 게 낫다" 원칙을 API 레벨에서도 지킴).
  if (isPublished === true && !lastVerifiedAt) {
    return res.status(400).json({ status: 'error', message: '공개(isPublished=true)로 등록하려면 lastVerifiedAt(최종 확인일)이 필요합니다.' });
  }

  try {
    const platform = await prisma.digitalPlatform.create({
      data: {
        name: name.trim(),
        category,
        actionType,
        officialUrl: officialUrl?.trim() || null,
        requiredDocs: Array.isArray(requiredDocs) ? requiredDocs : [],
        guideSummary: guideSummary.trim(),
        estimatedDays: typeof estimatedDays === 'number' ? estimatedDays : null,
        needsAgentHelp: !!needsAgentHelp,
        isPublished: !!isPublished,
        lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });
    return res.status(201).json({ status: 'success', data: platform });
  } catch (error) {
    console.error('디지털 플랫폼 등록 실패:', error);
    return res.status(500).json({ status: 'error', message: '등록 처리 중 오류가 발생했습니다.' });
  }
};

// 수정 (`PATCH /api/admin/digital-platforms/:id`) — lastVerifiedAt 갱신도 이 엔드포인트로 처리(§6.3)
export const updateDigitalPlatform = async (req: Request, res: Response) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const body = req.body as {
    name?: string;
    category?: string;
    actionType?: string;
    officialUrl?: string | null;
    requiredDocs?: string[];
    guideSummary?: string;
    estimatedDays?: number | null;
    needsAgentHelp?: boolean;
    isPublished?: boolean;
    lastVerifiedAt?: string;
    sortOrder?: number;
  };

  if (body.category !== undefined && !isValidCategory(body.category)) {
    return res.status(400).json({ status: 'error', message: `category는 ${VALID_CATEGORIES.join(', ')} 중 하나여야 합니다.` });
  }
  if (body.actionType !== undefined && !isValidActionType(body.actionType)) {
    return res.status(400).json({ status: 'error', message: `actionType은 ${VALID_ACTION_TYPES.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const existing = await prisma.digitalPlatform.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: '플랫폼을 찾을 수 없습니다.' });
    }

    // 공개로 전환하는 시점엔 확인일이 이미 있거나 이번 요청에 같이 와야 한다(위 create와 동일 원칙)
    const willBePublished = body.isPublished ?? existing.isPublished;
    const willHaveVerifiedAt = body.lastVerifiedAt !== undefined ? !!body.lastVerifiedAt : !!existing.lastVerifiedAt;
    if (willBePublished && !willHaveVerifiedAt) {
      return res.status(400).json({ status: 'error', message: '공개 상태로 두려면 lastVerifiedAt(최종 확인일)이 필요합니다.' });
    }

    const platform = await prisma.digitalPlatform.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.actionType !== undefined ? { actionType: body.actionType } : {}),
        ...(body.officialUrl !== undefined ? { officialUrl: body.officialUrl?.trim() || null } : {}),
        ...(body.requiredDocs !== undefined ? { requiredDocs: body.requiredDocs } : {}),
        ...(body.guideSummary !== undefined ? { guideSummary: body.guideSummary.trim() } : {}),
        ...(body.estimatedDays !== undefined ? { estimatedDays: body.estimatedDays } : {}),
        ...(body.needsAgentHelp !== undefined ? { needsAgentHelp: body.needsAgentHelp } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(body.lastVerifiedAt !== undefined ? { lastVerifiedAt: new Date(body.lastVerifiedAt) } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
    return res.json({ status: 'success', data: platform });
  } catch (error) {
    console.error('디지털 플랫폼 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '수정 처리 중 오류가 발생했습니다.' });
  }
};
