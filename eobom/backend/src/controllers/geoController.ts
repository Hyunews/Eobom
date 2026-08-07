import { Request, Response } from 'express';
import prisma from '../config/prisma';

const KAKAO_KEY = process.env.KAKAO_CLIENT_ID;

// 시/도 표기 정규화 (CSV 원본은 정식 명칭, 카카오 검색 결과는 축약형이라 하나로 통일)
const PROVINCE_ALIASES: Record<string, string> = {
  서울특별시: '서울', 서울: '서울',
  부산광역시: '부산', 부산: '부산',
  대구광역시: '대구', 대구: '대구',
  인천광역시: '인천', 인천: '인천',
  광주광역시: '광주', 광주: '광주',
  대전광역시: '대전', 대전: '대전',
  울산광역시: '울산', 울산: '울산',
  세종특별자치시: '세종', 세종: '세종',
  경기도: '경기', 경기: '경기',
  강원도: '강원', 강원특별자치도: '강원', 강원: '강원',
  충청북도: '충북', 충북: '충북',
  충청남도: '충남', 충남: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전북: '전북',
  전라남도: '전남', 전남: '전남',
  경상북도: '경북', 경북: '경북',
  경상남도: '경남', 경남: '경남',
  제주특별자치도: '제주', 제주: '제주',
};

// 실제 보유 시설 데이터에서 시/도 -> 시/군/구 목록을 추출 (`GET /api/geo/regions`)
// 하드코딩된 행정구역 목록 대신, 우리가 실제로 가진 시설의 주소에서 뽑아 항상 결과가 있는 지역만 노출
export const getRegions = async (_req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({ select: { location: true } });
    const regionMap = new Map<string, Set<string>>();

    for (const { location } of facilities) {
      const tokens = location.trim().split(/\s+/);
      if (tokens.length < 2) continue;
      const province = PROVINCE_ALIASES[tokens[0]];
      const district = tokens[1];
      if (!province || !district) continue;

      if (!regionMap.has(province)) regionMap.set(province, new Set());
      regionMap.get(province)!.add(district);
    }

    const result: Record<string, string[]> = {};
    for (const [province, districts] of regionMap.entries()) {
      result[province] = Array.from(districts).sort((a, b) => a.localeCompare(b, 'ko'));
    }

    return res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('지역 목록 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '지역 목록을 불러오지 못했습니다.' });
  }
};

// 좌표 -> 대략적인 지역명 (예: "서울 강남구") 변환 (`GET /api/geo/reverse`)
export const reverseGeocode = async (req: Request, res: Response) => {
  const { lat, lng } = req.query as { lat?: string; lng?: string };
  if (!lat || !lng) {
    return res.status(400).json({ status: 'error', message: 'lat, lng가 필요합니다.' });
  }

  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    const kakaoRes = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
    if (!kakaoRes.ok) {
      return res.status(502).json({ status: 'error', message: '위치 조회에 실패했습니다.' });
    }
    const data = (await kakaoRes.json()) as {
      documents: { address: { region_1depth_name: string; region_2depth_name: string } }[];
    };
    if (data.documents.length === 0) {
      return res.status(404).json({ status: 'error', message: '해당 좌표의 지역 정보를 찾을 수 없습니다.' });
    }
    const { region_1depth_name, region_2depth_name } = data.documents[0].address;
    return res.json({ status: 'success', data: { region: `${region_1depth_name} ${region_2depth_name}` } });
  } catch (error) {
    console.error('역지오코딩 실패:', error);
    return res.status(500).json({ status: 'error', message: '위치 조회 중 오류가 발생했습니다.' });
  }
};

// 주소/지역명/장소명 -> 좌표 검색 (`GET /api/geo/geocode`) — 주소 검색 우선, 실패 시 키워드 검색으로 폴백
export const geocode = async (req: Request, res: Response) => {
  const query = req.query.query as string | undefined;
  if (!query?.trim()) {
    return res.status(400).json({ status: 'error', message: 'query가 필요합니다.' });
  }

  try {
    const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const addressRes = await fetch(addressUrl, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
    const addressData = (await addressRes.json()) as { documents: { x: string; y: string; address_name: string }[] };

    if (addressData.documents.length > 0) {
      const doc = addressData.documents[0];
      return res.json({ status: 'success', data: { lat: Number(doc.y), lng: Number(doc.x), name: doc.address_name } });
    }

    // 주소로 못 찾으면 장소명(예: "강남역")으로 키워드 검색 폴백
    const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
    const keywordRes = await fetch(keywordUrl, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
    const keywordData = (await keywordRes.json()) as { documents: { x: string; y: string; place_name: string }[] };

    if (keywordData.documents.length === 0) {
      return res.status(404).json({ status: 'error', message: '해당 위치를 찾을 수 없습니다.' });
    }
    const doc = keywordData.documents[0];
    return res.json({ status: 'success', data: { lat: Number(doc.y), lng: Number(doc.x), name: doc.place_name } });
  } catch (error) {
    console.error('지오코딩 실패:', error);
    return res.status(500).json({ status: 'error', message: '위치 검색 중 오류가 발생했습니다.' });
  }
};
