import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Prisma where절 구성 — 2026-08-10 필터 간소화: 예산/종교/하객수/지역(대분류) 필터 제거,
// 위치는 lat/lng 기반 거리순 정렬(getFacilities)로 대체한다. 남은 건 구분(category)뿐이다.
const buildWhere = (query: Request['query']): Prisma.FacilityWhereInput => {
  const where: Prisma.FacilityWhereInput = {};

  const category = query.category as string | undefined;
  if (category && category !== '전체') {
    where.type = category;
  }

  // 태그 필터 — 프론트 TAG_CATALOG(components/facility/tagCatalog.ts)에 등록된 값만
  // 클릭 가능한 필터로 넘어온다. 여기선 그 화이트리스트를 몰라도 되게 범용으로 처리
  // (Facility.tags는 String[] — Prisma `has`로 배열 포함 여부만 확인).
  const tag = query.tag as string | undefined;
  if (tag && tag.trim()) {
    where.tags = { has: tag.trim() };
  }

  // 이름 검색 — 파트너가 자기 시설을 찾아 클레임 신청할 때 사용(docs 01-05 §3.3)
  const q = query.q as string | undefined;
  if (q && q.trim()) {
    where.name = { contains: q.trim(), mode: 'insensitive' };
  }

  return where;
};

const REVIEW_THRESHOLD = 5; // 이 건수 이상 쌓이면 실제 리뷰 평균으로 전환 (docs/01-01 2.1 정책)

// 리뷰 5건 미만이면 시딩된 기본 평점, 이상이면 리뷰 평균으로 노출 평점을 계산
const withEffectiveRating = <T extends { rating: number; reviews: { rating: number }[] }>(facility: T) => {
  const { reviews, ...rest } = facility;
  const effectiveRating =
    reviews.length >= REVIEW_THRESHOLD
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : facility.rating;
  return { ...rest, reviews, effectiveRating: Math.round(effectiveRating * 10) / 10 };
};

const facilityInclude = {
  reviews: {
    orderBy: { createdAt: 'desc' as const },
    include: { user: { select: { name: true } } },
  },
};

// 시설 목록 (`GET /api/facilities`) — 서버사이드 필터링 + 페이지네이션 (1500건+ 규모라 필수)
export const getFacilities = async (req: Request, res: Response) => {
  try {
    const where = buildWhere(req.query);
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt((req.query.pageSize as string) || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));

    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const hasLocation = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);

    // 위치가 있으면 항상 가까운 순으로 정렬 -> 거리 계산을 위해 조건에 맞는 전체를 가져온 뒤 메모리에서 정렬/페이징
    if (hasLocation) {
      const all = await prisma.facility.findMany({ where, include: facilityInclude });
      const withDistance = all
        .map((f) => ({ ...f, distanceKm: haversineKm(lat!, lng!, f.lat, f.lng) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const totalCount = withDistance.length;
      const paged = withDistance.slice((page - 1) * pageSize, page * pageSize);
      return res.json({
        status: 'success',
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        data: paged.map((f) => ({ ...withEffectiveRating(f), distanceKm: Math.round(f.distanceKm * 10) / 10 })),
      });
    }

    // 위치 정보가 없으면 DB 레벨 skip/take로 페이징 (1500건 규모에서도 빠름)
    const [totalCount, rows] = await Promise.all([
      prisma.facility.count({ where }),
      prisma.facility.findMany({
        where,
        include: facilityInclude,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({
      status: 'success',
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      data: rows.map(withEffectiveRating),
    });
  } catch (error) {
    console.error('시설 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '시설 목록을 불러오지 못했습니다.' });
  }
};

// 시설 단건 상세 (`GET /api/facilities/:id`)
export const getFacilityById = async (req: Request, res: Response) => {
  try {
    const facility = await prisma.facility.findUnique({ where: { id: req.params.id }, include: facilityInclude });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }
    return res.json({ status: 'success', data: withEffectiveRating(facility) });
  } catch (error) {
    console.error('시설 상세 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '시설 정보를 불러오지 못했습니다.' });
  }
};

// 리뷰 작성 (`POST /api/facilities/:id/reviews`) — 로그인 유저 1인 1리뷰
export const createReview = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const { rating, content } = req.body as { rating?: number; content?: string };
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !content?.trim()) {
    return res.status(400).json({ status: 'error', message: '별점(1~5)과 리뷰 내용을 입력해주세요.' });
  }

  try {
    const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }

    const existing = await prisma.facilityReview.findUnique({
      where: { facilityId_userId: { facilityId: facility.id, userId: decoded.id } },
    });
    if (existing) {
      return res.status(409).json({ status: 'error', message: '이미 이 시설에 리뷰를 작성하셨습니다.' });
    }

    await prisma.facilityReview.create({
      data: { facilityId: facility.id, userId: decoded.id, rating, content: content.trim() },
    });

    const updated = await prisma.facility.findUniqueOrThrow({ where: { id: facility.id }, include: facilityInclude });
    return res.json({ status: 'success', data: withEffectiveRating(updated) });
  } catch (error) {
    console.error('리뷰 작성 실패:', error);
    return res.status(500).json({ status: 'error', message: '리뷰 작성 중 오류가 발생했습니다.' });
  }
};
