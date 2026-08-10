import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import prisma from '../src/config/prisma';
import { normalizeAddressProvince } from '../src/utils/address';

const KAKAO_KEY = process.env.KAKAO_CLIENT_ID;
const DELAY_MS = 150;

interface CsvSource {
  file: string;
  idPrefix: string;
  facilityTypeLabel: string; // 로그 출력용
}

const SOURCES: CsvSource[] = [
  { file: '보건복지부_봉안시설 현황_20260531.csv', idPrefix: 'bongan', facilityTypeLabel: '봉안시설' },
  { file: '보건복지부_자연장지 현황_20260531.csv', idPrefix: 'jayeon', facilityTypeLabel: '자연장지' },
];

const AMENITY_COLUMNS = ['식당', '매점', '주차장', '유족대기실', '장애인편의시설'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const geocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { documents: { x: string; y: string }[] };
  if (data.documents.length === 0) return null;
  return { lat: Number(data.documents[0].y), lng: Number(data.documents[0].x) };
};

async function main() {
  if (!KAKAO_KEY) {
    throw new Error('KAKAO_CLIENT_ID가 .env에 없습니다.');
  }

  for (const source of SOURCES) {
    const filePath = join(__dirname, 'seed-data', source.file);
    const buffer = readFileSync(filePath);
    const text = new TextDecoder('euc-kr').decode(buffer);
    const rows: Record<string, string>[] = parse(text, { columns: true, skip_empty_lines: true });

    console.log(`\n=== ${source.facilityTypeLabel} (${rows.length}건) ===`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['시설명']?.trim();
      const address = row['주소']?.trim();
      if (!name || !address) {
        skipped++;
        continue;
      }

      const coords = await geocode(address);
      await sleep(DELAY_MS);
      if (!coords) {
        console.log(`  [스킵] 지오코딩 실패: ${name} / ${address}`);
        skipped++;
        continue;
      }

      const amenities = AMENITY_COLUMNS.filter((col) => row[col]?.trim() === '설치');
      const tags = row['공-사설 구분']?.trim() ? [row['공-사설 구분'].trim()] : [];
      const id = `${source.idPrefix}_${String(i + 1).padStart(3, '0')}`;
      // 지오코딩은 CSV 원본 주소(카카오가 아는 옛 행정구역 표기)로 하고, 화면 표시용
      // location만 병합 시/도 명칭으로 정규화한다(주소 자체가 바뀐 게 아니라 표기만 바뀜).
      const location = normalizeAddressProvince(address);

      const existing = await prisma.facility.findUnique({ where: { id } });
      await prisma.facility.upsert({
        where: { id },
        update: {
          name,
          location,
          lat: coords.lat,
          lng: coords.lng,
          phone: row['전화번호']?.trim() || null,
        },
        create: {
          id,
          name,
          type: '묘지/수목장',
          location,
          lat: coords.lat,
          lng: coords.lng,
          phone: row['전화번호']?.trim() || null,
          price: '가격 정보 준비중',
          priceValue: 0,
          rating: 0,
          religion: '전체 종교',
          guests: '전체 규모',
          tags,
          amenities,
          detailedPrices: undefined,
        },
      });
      if (existing) updated++;
      else created++;
    }

    console.log(`${source.facilityTypeLabel} 완료: 신규 ${created}건, 갱신 ${updated}건, 스킵 ${skipped}건`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
