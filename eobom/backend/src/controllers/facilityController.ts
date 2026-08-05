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

// 기존 프론트 클라이언트 필터 로직을 그대로 옮긴 Prisma where절 구성
const buildWhere = (query: Request['query']): Prisma.FacilityWhereInput => {
  const where: Prisma.FacilityWhereInput = {};

  const category = query.category as string | undefined;
  if (category && category !== '전체') {
    where.type = category;
  }

  const budget = query.budget as string | undefined;
  if (budget === '500이하') where.priceValue = { lte: 500 };
  else if (budget === '500_1000') where.priceValue = { gte: 500, lte: 1000 };
  else if (budget === '1000이상') where.priceValue = { gte: 1000 };

  const region = query.region as string | undefined;
  if (region && region !== '전체') {
    where.location = { contains: region };
  }

  const religion = query.religion as string | undefined;
  if (religion && religion !== '전체') {
    where.OR = [{ religion: { contains: religion } }, { religion: { contains: '전체' } }];
  }

  const guests = query.guests as string | undefined;
  if (guests && guests !== '전체') {
    where.guests = guests;
  }

  return where;
};

const REVIEW_THRESHOLD = 5; // 이 건수 이상 쌓이면 실제 리뷰 평균으로 전환 (docs/10 2.1 정책)

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

    const radius = req.query.radius as string | undefined;
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const hasLocation = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
    const radiusKm = radius && radius !== '전체' ? parseInt(radius.replace('km', ''), 10) : null;

    // 반경 필터가 켜져있으면 거리 계산을 위해 조건에 맞는 전체를 가져온 뒤 메모리에서 거리순 정렬/페이징
    if (radiusKm && hasLocation) {
      const all = await prisma.facility.findMany({ where, include: facilityInclude, orderBy: { createdAt: 'asc' } });
      const withDistance = all
        .map((f) => ({ ...f, distanceKm: haversineKm(lat!, lng!, f.lat, f.lng) }))
        .filter((f) => f.distanceKm <= radiusKm)
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

    // 반경 필터 없음 -> DB 레벨 skip/take로 페이징 (1500건 규모에서도 빠름)
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

    const data = rows.map((f) => {
      const withRating = withEffectiveRating(f);
      if (!hasLocation) return withRating;
      return { ...withRating, distanceKm: Math.round(haversineKm(lat!, lng!, f.lat, f.lng) * 10) / 10 };
    });

    return res.json({
      status: 'success',
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      data,
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

// 답사 예약 신청 (`POST /api/facilities/:id/bookings`)
export const createBooking = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const { bookingDate, bookingTime, bookingCount, bookingNote } = req.body as {
    bookingDate?: string;
    bookingTime?: string;
    bookingCount?: number;
    bookingNote?: string;
  };
  if (!bookingDate || !bookingTime || !bookingCount) {
    return res.status(400).json({ status: 'error', message: '희망일시와 인원은 필수입니다.' });
  }

  try {
    const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }

    const booking = await prisma.facilityBooking.create({
      data: {
        facilityId: facility.id,
        userId: decoded.id,
        bookingDate: new Date(bookingDate),
        bookingTime,
        bookingCount: Number(bookingCount),
        bookingNote,
      },
    });

    return res.json({ status: 'success', data: booking });
  } catch (error) {
    console.error('답사 예약 신청 실패:', error);
    return res.status(500).json({ status: 'error', message: '예약 신청 처리 중 오류가 발생했습니다.' });
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
