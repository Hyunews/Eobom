import 'dotenv/config';
import prisma from '../src/config/prisma';

const KAKAO_KEY = process.env.KAKAO_CLIENT_ID;
const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];
const MAX_PAGES = 10;
const PAGE_SIZE = 15;
const DELAY_MS = 150;

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function searchKeyword(query: string): Promise<KakaoDocument[]> {
  const results: KakaoDocument[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
      query
    )}&size=${PAGE_SIZE}&page=${page}`;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
    if (!res.ok) {
      console.error(`  [경고] ${query} page ${page} 요청 실패: ${res.status}`);
      break;
    }
    const data = (await res.json()) as { documents: KakaoDocument[]; meta: { is_end: boolean } };
    results.push(...data.documents);
    if (data.meta.is_end) break;
    await sleep(DELAY_MS);
  }
  return results;
}

async function main() {
  if (!KAKAO_KEY) {
    throw new Error('KAKAO_CLIENT_ID가 .env에 없습니다.');
  }

  const seen = new Map<string, KakaoDocument>();

  for (const region of REGIONS) {
    const query = `${region} 장례식장`;
    const docs = await searchKeyword(query);
    const filtered = docs.filter((d) => d.category_name.includes('장례식장'));
    console.log(`${region}: ${docs.length}건 검색 -> ${filtered.length}건 채택`);
    for (const doc of filtered) {
      seen.set(doc.id, doc);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n중복 제거 후 총 ${seen.size}건 upsert 시작...`);

  let created = 0;
  let updated = 0;
  for (const doc of seen.values()) {
    const existing = await prisma.facility.findUnique({ where: { kakaoPlaceId: doc.id } });
    await prisma.facility.upsert({
      where: { kakaoPlaceId: doc.id },
      update: {
        name: doc.place_name,
        location: doc.road_address_name || doc.address_name,
        lat: Number(doc.y),
        lng: Number(doc.x),
        phone: doc.phone || null,
      },
      create: {
        id: `kakao_${doc.id}`,
        kakaoPlaceId: doc.id,
        name: doc.place_name,
        type: '장례식장',
        location: doc.road_address_name || doc.address_name,
        lat: Number(doc.y),
        lng: Number(doc.x),
        phone: doc.phone || null,
        price: '가격 정보 준비중',
        priceValue: 0,
        rating: 0,
        religion: '전체 종교',
        guests: '전체 규모',
        tags: [],
        amenities: [],
        detailedPrices: undefined,
      },
    });
    if (existing) updated++;
    else created++;
  }

  console.log(`\n완료: 신규 ${created}건, 갱신 ${updated}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
