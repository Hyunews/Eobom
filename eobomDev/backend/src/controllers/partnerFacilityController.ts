import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyPartnerBearerToken } from './partnerController';
import {
  AMENITY_OPTIONS,
  CAPACITY_MAX,
  INTRO_MAX_LENGTH,
  RELIGION_OPTIONS,
  findBlockedIntroMessage,
} from '../utils/facilityIntro';

// 사업자 "내 시설 정보" 수정 (docs 01-05 §14-5, 디자인 개편 8단계 묶음 10).
// 고칠 수 있는 칸 = 소개 글 · 종교 · 수용 규모 · 부대시설 4개. 공공 데이터 기준 칸(시설명·종류·주소·전화·운영주체)은 고치지 못한다.
// 🔴 가격 글 칸은 만들지 않는다(2026-09-10 지시 · 01-01 §2.3).

// 내 시설 목록·수정 응답이 같이 쓰는 select. 지금 화면(BizDashboard)이 읽는 id·name·type·location·isPartner·images는 그대로 두고 칸만 더한다.
export const MY_FACILITY_SELECT = {
  id: true,
  name: true,
  type: true,
  location: true,
  isPartner: true,
  images: true,
  phone: true,
  tags: true,
  religion: true,
  guests: true,
  amenities: true,
  intro: true,
  introHiddenAt: true,
  introHiddenReason: true,
  introHiddenNote: true,
  partnerEditedAt: true,
} as const;

// 수정 (`PATCH /api/partner/facilities/:id`) — 본인 연동 시설만. 남의 시설은 404로 존재를 숨긴다.
export const updateMyFacility = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { intro, religion, capacity, amenities } = req.body as {
    intro?: unknown;
    religion?: unknown;
    capacity?: unknown;
    amenities?: unknown;
  };

  // 칸별 오류 글 — 화면이 칸 아래에 그대로 보여준다(키 = 칸 이름).
  const fieldErrors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  let nextIntro: string | null | undefined;
  if (intro !== undefined) {
    if (typeof intro !== 'string') {
      fieldErrors.intro = '소개 글은 글자로 입력해주세요.';
    } else {
      const trimmed = intro.trim();
      if (trimmed.length > INTRO_MAX_LENGTH) {
        fieldErrors.intro = `소개 글은 ${INTRO_MAX_LENGTH}자까지 쓸 수 있습니다.`;
      } else {
        const blocked = trimmed ? findBlockedIntroMessage(trimmed) : null;
        if (blocked) fieldErrors.intro = blocked;
        else nextIntro = trimmed || null;
      }
    }
  }

  if (religion !== undefined) {
    if (typeof religion !== 'string' || !(RELIGION_OPTIONS as readonly string[]).includes(religion)) {
      fieldErrors.religion = '종교를 목록에서 골라주세요.';
    } else {
      data.religion = religion;
    }
  }

  if (capacity !== undefined) {
    const n = typeof capacity === 'number' ? capacity : Number(String(capacity).replace(/[^0-9]/g, ''));
    if (!Number.isInteger(n) || n < 1 || n > CAPACITY_MAX) {
      fieldErrors.capacity = `수용 규모는 1~${CAPACITY_MAX}명 사이 숫자로 입력해주세요.`;
    } else {
      data.guests = `${n}명`; // DB 값은 글 — "N명"으로 저장한다(01-05 §14-5)
    }
  }

  if (amenities !== undefined) {
    if (!Array.isArray(amenities) || amenities.some((a) => typeof a !== 'string' || !(AMENITY_OPTIONS as readonly string[]).includes(a))) {
      fieldErrors.amenities = '부대시설은 목록에 있는 항목만 고를 수 있습니다.';
    } else {
      // 목록 순서로 정렬해 저장 — 화면이 항상 같은 순서로 보이게 한다.
      data.amenities = AMENITY_OPTIONS.filter((a) => (amenities as string[]).includes(a));
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ status: 'error', message: '입력한 내용을 확인해주세요.', fieldErrors });
  }
  if (Object.keys(data).length === 0 && nextIntro === undefined) {
    return res.status(400).json({ status: 'error', message: '고칠 내용이 없습니다.' });
  }

  try {
    const facility = await prisma.facility.findFirst({
      where: { id: req.params.id, partnerId: decoded.id },
      select: { id: true, intro: true },
    });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }

    if (nextIntro !== undefined) {
      data.intro = nextIntro;
      // 소개 글을 고쳐 저장하면 운영자가 숨긴 것이 풀리고 다시 바로 반영된다(01-05 §14-5). 같은 글을 그대로 저장하면 숨김은 그대로.
      if (nextIntro !== (facility.intro ?? null)) {
        data.introHiddenAt = null;
        data.introHiddenReason = null;
        data.introHiddenNote = null;
      }
    }
    data.partnerEditedAt = new Date();

    const updated = await prisma.facility.update({
      where: { id: facility.id },
      data,
      select: MY_FACILITY_SELECT,
    });
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('내 시설 정보 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '시설 정보 수정 중 오류가 발생했습니다.' });
  }
};
