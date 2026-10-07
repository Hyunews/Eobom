import { Request, Response } from 'express';
import { verifyBearerToken } from './authController';
import { isWillPhotoEnabled } from '../config/r2';
import { listWillPhotoSets, readWillPhoto, softDeleteWillPhotoSet } from '../services/willPhotoService';

// docs 06-06 §5-2-4·§5-2-5 — 보관한 유언장 사진의 목록·보기·삭제. 전부 본인 것만.
// 🔴 mediaKey를 파라미터로 받지 않는다 — 키만 알면 남의 사진이 열린다(06-05 §5.6-3과 같다). presigned URL 금지.
// 스위치가 꺼져 있으면 목록·보기·삭제 모두 404 — 화면은 스위치가 꺼졌을 때 지금 화면 그대로다.

const UUID = /^[0-9a-f-]{36}$/i;

const guard = (req: Request, res: Response): { id: string } | null => {
  if (!isWillPhotoEnabled()) {
    res.status(404).json({ status: 'error', message: '사진 보관 기능이 비활성화되어 있습니다.' });
    return null;
  }
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
    return null;
  }
  return { id: decoded.id };
};

// 보관한 사진 묶음 목록 (`GET /api/will-photos`)
export const listMyWillPhotoSets = async (req: Request, res: Response) => {
  const me = guard(req, res);
  if (!me) return;
  try {
    return res.json({ status: 'success', data: await listWillPhotoSets(me.id) });
  } catch (error) {
    console.error('보관 사진 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '목록을 불러오지 못했습니다.' });
  }
};

// 사진 한 쪽 보기 (`GET /api/will-photos/:setId/pages/:index`) — 서버가 복호화해 그대로 내보낸다. 화면은 인증 fetch → blob.
export const getMyWillPhotoPage = async (req: Request, res: Response) => {
  const me = guard(req, res);
  if (!me) return;
  const index = Number(req.params.index);
  if (!UUID.test(req.params.setId) || !Number.isInteger(index) || index < 0) {
    return res.status(404).json({ status: 'error', message: '사진을 찾을 수 없습니다.' });
  }
  try {
    const photo = await readWillPhoto(me.id, req.params.setId, index);
    if (!photo) return res.status(404).json({ status: 'error', message: '사진을 찾을 수 없습니다.' });
    res.set('Content-Type', photo.mime);
    res.set('Content-Disposition', 'inline');
    res.set('Cache-Control', 'no-store'); // 🔴 유언 성격의 사진이 디스크 캐시에 남지 않게 한다
    return res.send(photo.buffer);
  } catch (error) {
    console.error('보관 사진 보기 실패:', error);
    return res.status(500).json({ status: 'error', message: '사진을 불러오지 못했습니다.' });
  }
};

// 묶음 삭제 (`DELETE /api/will-photos/:setId`) — 소프트. 30일 뒤 어드민 파기 ④가 R2에서 지운다.
export const deleteMyWillPhotoSet = async (req: Request, res: Response) => {
  const me = guard(req, res);
  if (!me) return;
  if (!UUID.test(req.params.setId)) return res.status(404).json({ status: 'error', message: '사진 묶음을 찾을 수 없습니다.' });
  try {
    const ok = await softDeleteWillPhotoSet(me.id, req.params.setId);
    if (!ok) return res.status(404).json({ status: 'error', message: '사진 묶음을 찾을 수 없습니다.' });
    return res.json({ status: 'success', data: { deleted: true } });
  } catch (error) {
    console.error('보관 사진 삭제 실패:', error);
    return res.status(500).json({ status: 'error', message: '삭제 중 오류가 발생했습니다.' });
  }
};
