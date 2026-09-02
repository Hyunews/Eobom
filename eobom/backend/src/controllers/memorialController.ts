import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { uploadMemorialPhoto as uploadMiddleware, MEMORIAL_PHOTO_DIR, toPublicMemorialPhotoPath } from '../config/upload';
import { POLICY } from '../config/policy';
import { validateFalseReportAgreed } from '../utils/consentGates';
import { calculateMemorialExpiresAt } from '../utils/memorialLifecycle';

// 온라인 추모관(docs 05-01 §2, §4). 공개범위 기본값은 LINK(§4.2) — 사망 사실+유족 구성이
// 공개 색인되면 부고 사칭 보이스피싱의 표적 정보가 된다.

const VALID_VISIBILITY = ['PRIVATE', 'LINK', 'PUBLIC'] as const;
const isValidVisibility = (v: unknown): v is (typeof VALID_VISIBILITY)[number] =>
  typeof v === 'string' && (VALID_VISIBILITY as readonly string[]).includes(v);

// 공개 응답 화이트리스트(§6.1) — deceasedBirthDate·개설자 정보·createdByUserId는 절대 포함하지 않는다.
// getMemorialBySlug에서 구조분해로 4필드 + tributeCount(집계 숫자, §4.1)만 뽑아 응답한다.

// slug는 id(UUID)와 별개의 추측 불가 토큰이어야 한다(§4.2, §9.1-2 — "순번·UUID 노출 모두 부적절").
// id를 그대로 slug로 쓰지 않는 이유: id가 다른 경로(로그·내부 API 응답 등)로 노출되면 그게 곧
// 추모관 접근 URL이 되어버린다 — 공개 식별자와 내부 PK를 분리해두면 그 경로가 원천 차단된다.
const generateSlug = () => crypto.randomBytes(16).toString('hex');

// PRIVATE·닫힌 추모관은 존재를 숨긴다(§6.1) — slug로 여는 모든 공개 상호작용(조회/헌화/방명록)이
// 공유하는 판정. 여기서 걸러지면 컨트롤러들은 전부 동일하게 404를 반환한다.
const findViewableMemorialBySlug = (slug: string) =>
  prisma.memorial.findUnique({ where: { slug } }).then((m) => (!m || m.closedAt || m.visibility === 'PRIVATE' ? null : m));

// 비회원 헌화/방명록 중복 억제용 해시(§4.4) — IP는 원문 저장하지 않고 여기서 즉시 해시로만 쓴다.
// visitorToken은 프론트가 localStorage 등으로 관리해 보내는 익명 식별자(선택) — 없어도 동작은 한다.
const hashVisitor = (req: Request, visitorToken?: string) => {
  const ip = req.ip || req.socket.remoteAddress || '';
  return crypto.createHash('sha256').update(`${visitorToken || ''}:${ip}`).digest('hex');
};

// 추모관 조회 (`GET /api/memorials/:slug`) — 공개, 인증 불필요.
// PRIVATE거나 닫힌 추모관은 404로 응답해 존재 자체를 숨긴다(§6.1). LINK는 slug를 아는 사람에게 그대로 노출.
export const getMemorialBySlug = async (req: Request, res: Response) => {
  try {
    const memorial = await findViewableMemorialBySlug(req.params.slug);
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }

    const { deceasedName, deceasedDeathDate, portraitUrl, epitaph } = memorial; // 화이트리스트 4필드만
    // 05-01 §4.1(2026-09-02) — 집계 숫자 1개만 추가. 헌화한 사람의 목록·식별자는 넣지 않는다.
    const tributeCount = await prisma.memorialTribute.count({ where: { memorialId: memorial.id } });
    return res.json({ status: 'success', data: { deceasedName, deceasedDeathDate, portraitUrl, epitaph, tributeCount } });
  } catch (error) {
    console.error('추모관 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '추모관 조회 중 오류가 발생했습니다.' });
  }
};

// 추모관 개설 (`POST /api/memorials`) — 허위 개설 고지 동의 필수(§4.3-4, §6.2)
export const createMemorial = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const {
    deceasedName,
    deceasedBirthDate,
    deceasedDeathDate,
    portraitUrl,
    epitaph,
    visibility,
    falseReportAgreed,
  } = req.body as {
    deceasedName?: string;
    deceasedBirthDate?: string;
    deceasedDeathDate?: string;
    portraitUrl?: string;
    epitaph?: string;
    visibility?: string;
    falseReportAgreed?: boolean;
  };

  if (!deceasedName?.trim()) {
    return res.status(400).json({ status: 'error', message: '고인 성명은 필수입니다.' });
  }
  const falseReportError = validateFalseReportAgreed(falseReportAgreed);
  if (falseReportError) {
    return res.status(400).json({ status: 'error', message: falseReportError });
  }
  if (visibility !== undefined && !isValidVisibility(visibility)) {
    return res.status(400).json({ status: 'error', message: `visibility는 ${VALID_VISIBILITY.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    // 극히 낮은 확률의 slug 충돌 대비 — @unique 제약이 최종 방어선, 재시도는 우연한 실패를 흡수하기 위함
    let memorial;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // docs 07-03 §4.1 — Memorial.deceasedId가 필수 FK가 되면서(Obituary와 같은 고인을
        // 가리켜야 하는 E안 요구), 부고장을 거치지 않고 추모관만 단독 개설하는 이 경로에서도
        // Deceased를 함께 만들어 연결해야 한다. deceasedBirthDate/deceasedDeathDate는 그대로
        // Memorial 자체 필드에도 남긴다 — Deceased 도입 이전부터 있던 필드라 05 쪽 소비자(화이트
        // 리스트 응답 등)를 건드리지 않기 위함이다.
        const deathDate = deceasedDeathDate ? new Date(deceasedDeathDate) : null;
        const openedAt = new Date();
        memorial = await prisma.$transaction(async (tx) => {
          const deceased = await tx.deceased.create({
            data: {
              name: deceasedName.trim(),
              birthDate: deceasedBirthDate ? new Date(deceasedBirthDate) : null,
              deathDate,
              registeredBy: decoded.id,
            },
          });
          return tx.memorial.create({
            data: {
              slug: generateSlug(),
              createdByUserId: decoded.id,
              deceasedId: deceased.id,
              deceasedName: deceasedName.trim(),
              deceasedBirthDate: deceasedBirthDate ? new Date(deceasedBirthDate) : null,
              deceasedDeathDate: deathDate,
              portraitUrl: portraitUrl?.trim() || null,
              epitaph: epitaph?.trim() || null,
              visibility: visibility || 'LINK',
              falseReportAgreedAt: new Date(),
              createdAt: openedAt,
              expiresAt: calculateMemorialExpiresAt(openedAt), // 00-20 §5.2-2 — 개설일 + 395일
            },
          });
        });
        break;
      } catch (e: any) {
        if (e?.code === 'P2002' && attempt < 2) continue; // slug 충돌 — 재시도
        throw e;
      }
    }
    return res.status(201).json({ status: 'success', data: memorial });
  } catch (error) {
    console.error('추모관 개설 실패:', error);
    return res.status(500).json({ status: 'error', message: '추모관 개설 중 오류가 발생했습니다.' });
  }
};

// 내가 개설한 추모관 목록 (`GET /api/me/memorials`)
export const listMyMemorials = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const memorials = await prisma.memorial.findMany({
      where: { createdByUserId: decoded.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: memorials });
  } catch (error) {
    console.error('내 추모관 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록 조회 중 오류가 발생했습니다.' });
  }
};

// 추모관 정보·공개범위 수정 (`PATCH /api/memorials/:id`) — 개설자만(§6.2)
export const updateMemorial = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as {
    deceasedName?: string;
    deceasedBirthDate?: string | null;
    deceasedDeathDate?: string | null;
    portraitUrl?: string | null;
    epitaph?: string | null;
    visibility?: string;
  };

  if (body.visibility !== undefined && !isValidVisibility(body.visibility)) {
    return res.status(400).json({ status: 'error', message: `visibility는 ${VALID_VISIBILITY.join(', ')} 중 하나여야 합니다.` });
  }

  try {
    const existing = await prisma.memorial.findUnique({ where: { id: req.params.id } });
    // 존재하지 않음과 소유권 없음을 동일하게 404로 응답 — 다른 유저의 추모관 존재 여부를 노출하지 않는다
    if (!existing || existing.createdByUserId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }

    const updated = await prisma.memorial.update({
      where: { id: existing.id },
      data: {
        ...(body.deceasedName !== undefined ? { deceasedName: body.deceasedName.trim() } : {}),
        ...(body.deceasedBirthDate !== undefined ? { deceasedBirthDate: body.deceasedBirthDate ? new Date(body.deceasedBirthDate) : null } : {}),
        ...(body.deceasedDeathDate !== undefined ? { deceasedDeathDate: body.deceasedDeathDate ? new Date(body.deceasedDeathDate) : null } : {}),
        ...(body.portraitUrl !== undefined ? { portraitUrl: body.portraitUrl?.trim() || null } : {}),
        ...(body.epitaph !== undefined ? { epitaph: body.epitaph?.trim() || null } : {}),
        ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
      },
    });
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('추모관 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '추모관 수정 중 오류가 발생했습니다.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// 헌화 · 방명록 · 사진 — 비회원 상호작용을 허용하는 구간(§4.4, §4.5). 로그인 여부는 필수가 아니라
// 선택이라 verifyBearerToken 실패를 401로 끊지 않고 "없으면 비회원"으로 흘려보낸다.
// ─────────────────────────────────────────────────────────────────

// 동결 가드(00-20 §5.1, §8.1) — frozenAt 값이 있으면 "추가"만 막는다. 읽기·삭제는 막지 않는다
// (§5.1 — 동결이 막는 것은 추가뿐. 삭제까지 막으면 신고 들어온 동결 추모관을 아무도 손댈 수 없다).
// 🔴 방명록·헌화·사진 3개 쓰기 경로 전부에 걸어야 한다 — 하나라도 빠지면 동결이 동결이 아니다.
const MEMORIAL_FROZEN_MESSAGE = '동결된 추모관입니다. 헌화·방명록·사진을 더 추가할 수 없습니다.';
const isMemorialFrozen = (memorial: { frozenAt: Date | null }) => memorial.frozenAt !== null;

// 헌화 (`POST /api/memorials/:slug/tributes`) — 비회원 허용(§4.4). 로그인 사용자는 1인 1회
// (@@unique([memorialId, userId]))로 DB가 보장, 비회원은 visitorHash로 느슨하게 억제만 한다.
export const createTribute = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  const { visitorToken } = req.body as { visitorToken?: string };

  try {
    const memorial = await findViewableMemorialBySlug(req.params.slug);
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }
    if (isMemorialFrozen(memorial)) {
      return res.status(403).json({ status: 'error', message: MEMORIAL_FROZEN_MESSAGE });
    }

    const tribute = await prisma.memorialTribute.create({
      data: {
        memorialId: memorial.id,
        userId: decoded?.id || null,
        visitorHash: hashVisitor(req, visitorToken),
      },
    });
    const tributeCount = await prisma.memorialTribute.count({ where: { memorialId: memorial.id } });
    return res.status(201).json({ status: 'success', data: { id: tribute.id, tributeCount } });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: '이미 헌화하셨습니다.' });
    }
    console.error('헌화 실패:', error);
    return res.status(500).json({ status: 'error', message: '헌화 처리 중 오류가 발생했습니다.' });
  }
};

// 방명록 목록 (`GET /api/memorials/:slug/guestbook`) — 삭제·비공개 건 제외(§6.1)
export const listGuestbook = async (req: Request, res: Response) => {
  try {
    const memorial = await findViewableMemorialBySlug(req.params.slug);
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }

    const entries = await prisma.memorialGuestbook.findMany({
      where: { memorialId: memorial.id, deletedByOwnerAt: null, hiddenAt: null },
      select: { id: true, authorName: true, relationToDeceased: true, message: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: entries });
  } catch (error) {
    console.error('방명록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '방명록 조회 중 오류가 발생했습니다.' });
  }
};

// 방명록 작성 (`POST /api/memorials/:slug/guestbook`) — 비회원 허용, 작성자명은 스냅샷(§4.5, §5.5)
export const createGuestbookEntry = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  const { authorName, relationToDeceased, message } = req.body as {
    authorName?: string;
    relationToDeceased?: string;
    message?: string;
  };

  if (!authorName?.trim() || !message?.trim()) {
    return res.status(400).json({ status: 'error', message: '작성자 이름과 메시지는 필수입니다.' });
  }

  try {
    const memorial = await findViewableMemorialBySlug(req.params.slug);
    if (!memorial) {
      return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
    }
    if (isMemorialFrozen(memorial)) {
      return res.status(403).json({ status: 'error', message: MEMORIAL_FROZEN_MESSAGE });
    }

    const entry = await prisma.memorialGuestbook.create({
      data: {
        memorialId: memorial.id,
        userId: decoded?.id || null,
        authorName: authorName.trim(),
        relationToDeceased: relationToDeceased?.trim() || null,
        message: message.trim(),
      },
    });
    return res.status(201).json({ status: 'success', data: entry });
  } catch (error) {
    console.error('방명록 작성 실패:', error);
    return res.status(500).json({ status: 'error', message: '방명록 작성 중 오류가 발생했습니다.' });
  }
};

// 방명록 삭제 (`DELETE /api/memorials/:id/guestbook/:gid`) — 개설자만, 소프트 삭제(§4.5)
export const deleteGuestbookEntry = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const entry = await prisma.memorialGuestbook.findUnique({
      where: { id: req.params.gid },
      include: { memorial: { select: { id: true, createdByUserId: true } } },
    });
    // memorialId 불일치(다른 추모관의 방명록 id)도 존재하지 않는 것과 동일하게 처리
    if (!entry || entry.memorialId !== req.params.id || entry.memorial.createdByUserId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '방명록을 찾을 수 없습니다.' });
    }

    await prisma.memorialGuestbook.update({ where: { id: entry.id }, data: { deletedByOwnerAt: new Date() } });
    return res.json({ status: 'success' });
  } catch (error) {
    console.error('방명록 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '방명록 삭제 중 오류가 발생했습니다.' });
  }
};

// 사진 등록 (`POST /api/memorials/:id/photos`, multipart/form-data, field: image, title) —
// 개설자만(§4.6 — "업로드 권한은 개설자로 제한(초기)"). 장수 상한은 policy.ts가 정본(§9.1-9).
export const addMemorialPhoto = (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      const message = err.message === 'INVALID_FILE_TYPE' ? '이미지 파일(jpg/png/webp/gif)만 업로드할 수 있습니다.' : `업로드 중 오류가 발생했습니다. (최대 ${POLICY.memorial.photoMaxSizeBytes / 1024 / 1024}MB)`;
      return res.status(400).json({ status: 'error', message });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: '이미지 파일이 필요합니다.' });
    }

    try {
      const memorial = await prisma.memorial.findUnique({ where: { id: req.params.id } });
      if (!memorial || memorial.createdByUserId !== decoded.id) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ status: 'error', message: '추모관을 찾을 수 없습니다.' });
      }
      if (isMemorialFrozen(memorial)) {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({ status: 'error', message: MEMORIAL_FROZEN_MESSAGE });
      }

      const existingCount = await prisma.memorialPhoto.count({ where: { memorialId: memorial.id } });
      if (existingCount >= POLICY.memorial.photoMaxCountPerMemorial) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ status: 'error', message: `사진은 추모관당 최대 ${POLICY.memorial.photoMaxCountPerMemorial}장까지 등록할 수 있습니다.` });
      }

      const title = (req.body.title as string | undefined)?.trim() || memorial.deceasedName;
      const photo = await prisma.memorialPhoto.create({
        data: {
          memorialId: memorial.id,
          uploadedByUserId: decoded.id,
          url: toPublicMemorialPhotoPath(req.file.filename),
          title,
          sortOrder: existingCount,
        },
      });
      return res.status(201).json({ status: 'success', data: photo });
    } catch (error) {
      console.error('추모 사진 등록 실패:', error);
      return res.status(500).json({ status: 'error', message: '사진 등록 중 오류가 발생했습니다.' });
    }
  });
};

// 사진 삭제 (`DELETE /api/memorials/:id/photos/:photoId`) — 개설자만
export const deleteMemorialPhoto = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const photo = await prisma.memorialPhoto.findUnique({
      where: { id: req.params.photoId },
      include: { memorial: { select: { id: true, createdByUserId: true } } },
    });
    if (!photo || photo.memorialId !== req.params.id || photo.memorial.createdByUserId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '사진을 찾을 수 없습니다.' });
    }

    await prisma.memorialPhoto.delete({ where: { id: photo.id } });

    const filename = path.basename(photo.url);
    fs.unlink(path.join(MEMORIAL_PHOTO_DIR, filename), (err) => {
      if (err) console.warn('추모 사진 파일 삭제 실패(무시):', filename, err.message);
    });

    return res.json({ status: 'success' });
  } catch (error) {
    console.error('추모 사진 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '사진 삭제 중 오류가 발생했습니다.' });
  }
};
