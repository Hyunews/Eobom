import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { verifyPartnerBearerToken } from './partnerController';
import { uploadFacilityImage as uploadMiddleware, FACILITY_IMAGE_DIR, toPublicImagePath } from '../config/upload';

// 시설 이미지 업로드/삭제 — 연동(클레임 승인)된 파트너만, 자기 시설에만 가능.
// 저장은 로컬 디스크(config/upload.ts 참고, 배포 전 교체 필요).

// 이미지 업로드 (`POST /api/partner/facilities/:id/images`, multipart/form-data, field: image)
export const addFacilityImage = (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      const message = err.message === 'INVALID_FILE_TYPE' ? '이미지 파일(jpg/png/webp/gif)만 업로드할 수 있습니다.' : '업로드 중 오류가 발생했습니다. (최대 5MB)';
      return res.status(400).json({ status: 'error', message });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: '이미지 파일이 필요합니다.' });
    }

    try {
      const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
      if (!facility) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
      }
      if (facility.partnerId !== decoded.id) {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({ status: 'error', message: '연동된 본인 시설에만 이미지를 업로드할 수 있습니다.' });
      }

      const imagePath = toPublicImagePath(req.file.filename);
      const updated = await prisma.facility.update({
        where: { id: facility.id },
        data: { images: { push: imagePath } },
      });
      return res.status(201).json({ status: 'success', data: { images: updated.images } });
    } catch (error) {
      console.error('시설 이미지 업로드 실패:', error);
      return res.status(500).json({ status: 'error', message: '이미지 업로드 처리 중 오류가 발생했습니다.' });
    }
  });
};

// 이미지 삭제 (`DELETE /api/partner/facilities/:id/images`) — body: { imagePath }
export const removeFacilityImage = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { imagePath } = req.body as { imagePath?: string };
  if (!imagePath) {
    return res.status(400).json({ status: 'error', message: 'imagePath가 필요합니다.' });
  }

  try {
    const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }
    if (facility.partnerId !== decoded.id) {
      return res.status(403).json({ status: 'error', message: '연동된 본인 시설의 이미지만 삭제할 수 있습니다.' });
    }

    const updated = await prisma.facility.update({
      where: { id: facility.id },
      data: { images: facility.images.filter((img) => img !== imagePath) },
    });

    // 로컬 디스크 파일도 정리 — 실패해도 DB 갱신은 이미 끝났으니 로그만 남기고 무시
    const filename = path.basename(imagePath);
    fs.unlink(path.join(FACILITY_IMAGE_DIR, filename), (err) => {
      if (err) console.warn('이미지 파일 삭제 실패(무시):', filename, err.message);
    });

    return res.json({ status: 'success', data: { images: updated.images } });
  } catch (error) {
    console.error('시설 이미지 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '이미지 삭제 처리 중 오류가 발생했습니다.' });
  }
};

// 대표 사진 지정 (`PATCH /api/partner/facilities/:id/images/cover`, body: { imagePath }) — 별도
// "대표 사진" 컬럼을 새로 만들지 않고, 소비자 화면(FacilityPage.tsx)이 이미 따르는 "images[0]이
// 대표"라는 기존 규칙을 그대로 이용한다. 지정한 이미지를 배열 맨 앞으로 옮기기만 하면 된다 —
// 마이그레이션 없이, 기존 규칙과 항상 일치하게 동작.
export const setCoverImage = async (req: Request, res: Response) => {
  const decoded = verifyPartnerBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '인증 토큰이 없거나 유효하지 않습니다.' });
  }

  const { imagePath } = req.body as { imagePath?: string };
  if (!imagePath) {
    return res.status(400).json({ status: 'error', message: 'imagePath가 필요합니다.' });
  }

  try {
    const facility = await prisma.facility.findUnique({ where: { id: req.params.id } });
    if (!facility) {
      return res.status(404).json({ status: 'error', message: '시설을 찾을 수 없습니다.' });
    }
    if (facility.partnerId !== decoded.id) {
      return res.status(403).json({ status: 'error', message: '연동된 본인 시설의 사진만 대표로 지정할 수 있습니다.' });
    }
    if (!facility.images.includes(imagePath)) {
      return res.status(400).json({ status: 'error', message: '이 시설에 등록된 사진이 아닙니다.' });
    }

    const reordered = [imagePath, ...facility.images.filter((img) => img !== imagePath)];
    const updated = await prisma.facility.update({ where: { id: facility.id }, data: { images: reordered } });

    return res.json({ status: 'success', data: { images: updated.images } });
  } catch (error) {
    console.error('대표 사진 지정 실패:', error);
    return res.status(500).json({ status: 'error', message: '대표 사진 지정 중 오류가 발생했습니다.' });
  }
};
