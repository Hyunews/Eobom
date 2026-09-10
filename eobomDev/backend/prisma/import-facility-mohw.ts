// 장례식장 데이터를 보건복지부 공공데이터(ODMS_DATA_04_1) 기반으로 재적재한다.
// docs 01-02 §2.2 · systems.md §2·§3 · security.md §3 (2026-09-09 확정) — 정본 전환.
//
// 사용법:
//   ts-node prisma/import-facility-mohw.ts --dry-run   ← DB 쓰기 없음. 매칭/신규/삭제 대상만 출력
//   ts-node prisma/import-facility-mohw.ts             ← 실제 반영(트랜잭션)
//
// 🔴 이 스크립트를 실행하기 전에 반드시:
//   1. 스키마 마이그레이션이 이미 적용돼 있을 것 (Facility.publicName/source/sourceRef/syncedAt)
//   2. --dry-run 결과를 사람이 검토·승인했을 것
//   3. (dry-run이 아니면) backup-db.ps1로 백업이 이미 있을 것

import 'dotenv/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import prisma from '../src/config/prisma';
import { normalizeAddressProvince } from '../src/utils/address';
import { normalizePhone } from '../src/utils/phone';

const PUBLIC_DATA_ENDPOINT = process.env.PUBLIC_DATA_ENDPOINT;
const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY;
const KAKAO_KEY = process.env.KAKAO_CLIENT_ID;

const DRY_RUN = process.argv.includes('--dry-run');
const PAGE_SIZE = 500;
const PAGES = [1, 2, 3] as const; // totalCount=1080 실측(§배경) — 페이지당 최대 500건
const GEOCODE_DELAY_MS = 150;

// 기준일자 고정 — 다음 갱신 때는 새 날짜로 새 파일을 만든다(이 파일을 덮어쓰지 않는다).
const XML_OUT_PATH = join(__dirname, '../../../assets/보건복지부_전국 장례식장 현황_20260401.xml');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────
// 1. 공공데이터 수집 — XML 전용(type=json 주면 에러). 응답을 Buffer로 통째로 받은 뒤
//    한 번에 utf8 디코딩한다. res.on('data', c => str += c)로 이어붙이면 chunk 경계에서
//    한글이 깨진다 — 실제로 겪은 버그라 fetch().arrayBuffer()로 우회한다.
// ─────────────────────────────────────────────────────────────────

async function fetchPage(pageNo: number): Promise<string> {
  if (!PUBLIC_DATA_ENDPOINT || !PUBLIC_DATA_API_KEY) {
    throw new Error('PUBLIC_DATA_ENDPOINT / PUBLIC_DATA_API_KEY가 .env에 없습니다.');
  }
  const base = PUBLIC_DATA_ENDPOINT.endsWith('/callData04_1Api')
    ? PUBLIC_DATA_ENDPOINT
    : `${PUBLIC_DATA_ENDPOINT.replace(/\/$/, '')}/callData04_1Api`;
  const url = `${base}?serviceKey=${PUBLIC_DATA_API_KEY}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const text = buf.toString('utf8');
  if (!res.ok || !text.includes('<resultCode>00</resultCode>')) {
    // 🔴 서비스 키 값이 URL 안에 있다 — 에러를 그대로 던지면 로그에 키가 찍힌다.
    throw new Error(`공공데이터 API 페이지 ${pageNo} 요청 실패 (status ${res.status})`);
  }
  return text;
}

// ─────────────────────────────────────────────────────────────────
// 2. XML 파싱 — 알려진 17개 필드만 있는 평평한 구조(중첩 없음, 실측 확인).
//    &amp; 등 표준 엔티티만 쓰고 CDATA는 없다(실측). 라이브러리 없이 정규식으로 충분하다.
// ─────────────────────────────────────────────────────────────────

const MOHW_FIELDS = [
  'ctpv', 'sigungu', 'fcltNm', 'addr', 'telno', 'fxno', 'homepageUrl', 'tpkct',
  'gubun', 'mtaCnt', 'ehrCnt', 'diningFclt', 'store', 'pklt', 'bereavedWaitRm',
  'sdblsPfFclt', 'operType',
] as const;
type MohwField = (typeof MOHW_FIELDS)[number];
type MohwRow = Record<MohwField, string>;

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&'); // 반드시 마지막 — 먼저 풀면 &amp;lt; 같은 이중 인코딩이 깨진다
}

function extractField(block: string, tag: MohwField): string {
  if (new RegExp(`<${tag}\\s*/>`).test(block)) return ''; // 자기닫힘 태그 = 빈 값
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? decodeXmlEntities(m[1].trim()) : '';
}

function parseItems(xml: string): MohwRow[] {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return blocks.map((block) => {
    const row = {} as MohwRow;
    for (const f of MOHW_FIELDS) row[f] = extractField(block, f);
    return row;
  });
}

// ─────────────────────────────────────────────────────────────────
// 3. 매칭 — ① 전화번호 숫자만 비교 → ② `${ctpv} ${sigungu}` 정규화 + 이름 정규화 일치.
//    모호한 다중 매칭(어느 쪽 우선순위든 후보 2건 이상)은 매칭·생성 둘 다 하지 않고 로그만 남긴다.
// ─────────────────────────────────────────────────────────────────

const CORP_PREFIX_RE = /^(의료법인|재단법인|주식회사)/;

function normalizeFacilityName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, '') // 괄호(내용 포함) 제거
    .replace(CORP_PREFIX_RE, '') // 선두 법인 접두 제거
    .replace(/[\s\-·.,]/g, '') // 공백·하이픈·가운뎃점·마침표·쉼표 제거
    .toLowerCase();
}

// 🔴 실측으로 발견 — 카카오가 저장한 DB location은 전부 축약 시/도명이다("서울", "경기", "경북"),
// 공공데이터의 ctpv는 전부 정식 명칭이다("서울특별시", "경기도", "경상북도"). 이 축약표 없이
// normalizeAddressProvince만 태우면(광주·전남 병합만 처리) 나머지 15개 시/도가 전부 매칭
// 실패했다 — 서울아산병원·삼성서울병원 같은 대형 병원장례식장까지 삭제 대상으로 잘못 잡혔다
// (dry-run 1차: 삭제후보 93건 vs 예상 40건, 원인 진단 후 수정).
// sync-kakao-funeral.ts의 REGIONS 배열과 같은 축약형 어휘를 쓴다.
const CTPV_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천',
  '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종',
  '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원',
  '충청북도': '충북', '충청남도': '충남',
  '전북특별자치도': '전북', '전라북도': '전북', '전라남도': '전남',
  '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주',
};

function regionKey(ctpv: string, sigungu: string): string {
  const short = CTPV_SHORT[ctpv] ?? ctpv;
  // DB location은 카카오 임포트 시 이미 normalizeAddressProvince를 거쳤다(전남/광주 병합 표기) —
  // 축약형으로 바꾼 뒤에도 같은 함수에 한 번 더 통과시켜야 광주·전남 두 시/도만 병합 명칭으로 맞는다.
  return normalizeAddressProvince(`${short} ${sigungu}`).trim();
}

interface ExistingFacility {
  id: string;
  name: string;
  publicName: string | null;
  location: string;
  phone: string | null;
  partnerId: string | null;
  images: string[];
}

interface MatchResult {
  db: ExistingFacility | null;
  ambiguous: boolean;
  via: 'phone' | 'region_name' | null;
  candidateIds?: string[];
}

function buildMatcher(existing: ExistingFacility[]) {
  const byPhone = new Map<string, ExistingFacility[]>();
  for (const f of existing) {
    const digits = f.phone ? normalizePhone(f.phone) : '';
    if (!digits) continue;
    if (!byPhone.has(digits)) byPhone.set(digits, []);
    byPhone.get(digits)!.push(f);
  }

  const withNormNames = existing.map((f) => ({
    facility: f,
    normName: normalizeFacilityName(f.name),
    normPublicName: f.publicName ? normalizeFacilityName(f.publicName) : null,
  }));

  return function matchRow(row: MohwRow): MatchResult {
    const phoneDigits = row.telno ? normalizePhone(row.telno) : '';
    if (phoneDigits) {
      const candidates = byPhone.get(phoneDigits) || [];
      if (candidates.length === 1) return { db: candidates[0], ambiguous: false, via: 'phone' };
      if (candidates.length > 1) {
        return { db: null, ambiguous: true, via: 'phone', candidateIds: candidates.map((c) => c.id) };
      }
    }

    const normName = normalizeFacilityName(row.fcltNm);
    const rKey = regionKey(row.ctpv, row.sigungu);
    const candidates2 = withNormNames.filter(
      (w) => w.facility.location.includes(rKey) && (w.normName === normName || w.normPublicName === normName)
    );
    if (candidates2.length === 1) return { db: candidates2[0].facility, ambiguous: false, via: 'region_name' };
    if (candidates2.length > 1) {
      return { db: null, ambiguous: true, via: 'region_name', candidateIds: candidates2.map((c) => c.facility.id) };
    }

    return { db: null, ambiguous: false, via: null };
  };
}

// ─────────────────────────────────────────────────────────────────
// 4. 필드 매핑
// ─────────────────────────────────────────────────────────────────

const AMENITY_MAP: Record<'diningFclt' | 'store' | 'pklt' | 'bereavedWaitRm' | 'sdblsPfFclt', string> = {
  diningFclt: '식당',
  store: '매점',
  pklt: '주차장',
  bereavedWaitRm: '유족대기실',
  sdblsPfFclt: '장애인편의시설',
};

function buildAmenities(row: MohwRow): string[] {
  return (Object.keys(AMENITY_MAP) as (keyof typeof AMENITY_MAP)[])
    .filter((k) => row[k] === '설치')
    .map((k) => AMENITY_MAP[k]);
}

function buildTags(row: MohwRow): string[] {
  return [row.gubun, row.operType].filter((v) => v.trim().length > 0);
}

function buildSourceRef(row: MohwRow): string {
  return `${row.ctpv}|${row.sigungu}|${row.fcltNm}`;
}

// ─────────────────────────────────────────────────────────────────
// 5. 지오코딩 — 카카오 주소검색(건당 조회, 45건 캡 없음). 신규 행에만 필요하다
//    (매칭된 기존 행은 이미 좌표가 있다). 실패는 조용히 버리지 않고 목록으로 남긴다.
// ─────────────────────────────────────────────────────────────────

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!KAKAO_KEY) throw new Error('KAKAO_CLIENT_ID가 .env에 없습니다.');
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { documents: { x: string; y: string }[] };
  if (data.documents.length === 0) return null;
  return { lat: Number(data.documents[0].y), lng: Number(data.documents[0].x) };
}

// ─────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN — DB에 쓰지 않습니다 ===' : '=== 실제 반영 모드 ===');

  // 1) 수집
  const rawPages: string[] = [];
  const rows: MohwRow[] = [];
  for (const pageNo of PAGES) {
    const xml = await fetchPage(pageNo);
    rawPages.push(xml);
    const pageRows = parseItems(xml);
    rows.push(...pageRows);
    console.log(`  페이지 ${pageNo}: ${pageRows.length}건 수집`);
  }
  console.log(`총 ${rows.length}건 수집(totalCount 기대값 1080)`);

  // 실측 검증용 — 시도별 분포(경기 183 / 전남 124 / 경북 121 / 세종 6 이 나와야 한다)
  const byCtpv = new Map<string, number>();
  for (const r of rows) byCtpv.set(r.ctpv, (byCtpv.get(r.ctpv) || 0) + 1);
  console.log('\n시도별 분포:');
  for (const [ctpv, count] of [...byCtpv.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ctpv}: ${count}`);
  }

  if (!DRY_RUN) {
    // 5a — 원본 그대로 보관(다음 갱신 때 대조용). dry-run 반복 실행에 덮이지 않게 실제 반영 때만 쓴다.
    const combined = rawPages
      .map((xml, i) => `<!-- page ${i + 1} of ${rawPages.length} -->\n${xml}`)
      .join('\n');
    writeFileSync(XML_OUT_PATH, combined, 'utf8');
    console.log(`\n원본 XML 저장: ${XML_OUT_PATH}`);
  }

  // 2) 기존 DB 행(type='장례식장') 로드
  const existing = await prisma.facility.findMany({
    where: { type: '장례식장' },
    select: { id: true, name: true, publicName: true, location: true, phone: true, partnerId: true, images: true },
  });
  console.log(`\nDB 기존 장례식장 행: ${existing.length}건`);

  const matchRow = buildMatcher(existing);

  const matchedIds = new Set<string>();
  const updates: { id: string; data: Record<string, unknown> }[] = [];
  const newCreatesPending: { row: MohwRow }[] = [];
  const ambiguous: { row: MohwRow; via: string; candidateIds: string[] }[] = [];

  for (const row of rows) {
    const result = matchRow(row);
    if (result.ambiguous) {
      ambiguous.push({ row, via: result.via || '?', candidateIds: result.candidateIds || [] });
      continue;
    }
    if (result.db) {
      matchedIds.add(result.db.id);
      updates.push({
        id: result.db.id,
        data: {
          location: normalizeAddressProvince(row.addr),
          phone: row.telno || null,
          tags: buildTags(row),
          amenities: buildAmenities(row),
          publicName: row.fcltNm,
          source: 'mohw',
          sourceRef: buildSourceRef(row),
          syncedAt: new Date(),
        },
      });
    } else {
      newCreatesPending.push({ row });
    }
  }

  console.log(`\n매칭됨(update 대상): ${updates.length}건`);
  console.log(`모호한 다중 매칭(스킵, 로그만): ${ambiguous.length}건`);
  for (const a of ambiguous) {
    console.log(`  [모호] ${a.row.ctpv} ${a.row.sigungu} ${a.row.fcltNm} — via=${a.via}, 후보=${a.candidateIds.join(',')}`);
  }
  console.log(`신규 후보(지오코딩 필요): ${newCreatesPending.length}건`);

  // 3) 신규 행 지오코딩
  const creates: { id: string; data: Record<string, unknown> }[] = [];
  const geocodeFailed: MohwRow[] = [];
  let newSeq = 0;
  for (const { row } of newCreatesPending) {
    const address = normalizeAddressProvince(row.addr);
    const coords = await geocode(address);
    await sleep(GEOCODE_DELAY_MS);
    if (!coords) {
      geocodeFailed.push(row);
      continue;
    }
    newSeq += 1;
    creates.push({
      id: `mohw_${String(newSeq).padStart(4, '0')}`,
      data: {
        id: `mohw_${String(newSeq).padStart(4, '0')}`,
        name: row.fcltNm,
        publicName: row.fcltNm,
        type: '장례식장',
        location: address,
        lat: coords.lat,
        lng: coords.lng,
        phone: row.telno || null,
        price: '가격 정보 준비중',
        rating: 0,
        religion: '전체 종교',
        guests: '전체 규모',
        tags: buildTags(row),
        amenities: buildAmenities(row),
        source: 'mohw',
        sourceRef: buildSourceRef(row),
        syncedAt: new Date(),
      },
    });
  }

  console.log(`\n지오코딩 성공(생성 예정): ${creates.length}건`);
  console.log(`지오코딩 실패(적재 보류): ${geocodeFailed.length}건`);
  for (const r of geocodeFailed) {
    console.log(`  [지오코딩 실패] ${r.ctpv} ${r.sigungu} ${r.fcltNm} — ${r.addr}`);
  }

  // 4) 미매칭 기존 행 — 삭제 후보 + 가드
  const unmatchedExisting = existing.filter((f) => !matchedIds.has(f.id));
  console.log(`\n미매칭 기존 행(삭제 후보): ${unmatchedExisting.length}건`);

  const guardResults = await Promise.all(
    unmatchedExisting.map(async (f) => {
      const [reviewCount, claimCount, leadCount] = await Promise.all([
        prisma.facilityReview.count({ where: { facilityId: f.id } }),
        prisma.facilityClaim.count({ where: { facilityId: f.id } }),
        prisma.lead.count({ where: { facilityId: f.id } }),
      ]);
      const blocked = reviewCount > 0 || claimCount > 0 || leadCount > 0 || !!f.partnerId || f.images.length > 0;
      return { facility: f, reviewCount, claimCount, leadCount, blocked };
    })
  );

  const blockedRows = guardResults.filter((g) => g.blocked);
  const deletableIds = guardResults.filter((g) => !g.blocked).map((g) => g.facility.id);

  if (blockedRows.length > 0) {
    console.log(`\n🔴 삭제 중단 — 참조가 있는 미매칭 행 ${blockedRows.length}건 발견(데이터가 스냅샷 이후 바뀐 것으로 보입니다):`);
    for (const b of blockedRows) {
      console.log(
        `  [참조있음] ${b.facility.id} ${b.facility.name} — reviews=${b.reviewCount} claims=${b.claimCount} leads=${b.leadCount} partnerId=${b.facility.partnerId ?? '-'} images=${b.facility.images.length}`
      );
    }
    console.log('  → 이 실행에서는 삭제를 전혀 수행하지 않습니다. 위 목록을 사람이 확인해야 합니다.');
  } else {
    console.log(`\n삭제 대상(참조 0건, 안전): ${deletableIds.length}건`);
    for (const id of deletableIds) {
      const f = existing.find((e) => e.id === id)!;
      console.log(`  [삭제 예정] ${id} ${f.name}`);
    }
  }

  const willDelete = blockedRows.length === 0 ? deletableIds : [];

  console.log('\n=== 요약 ===');
  console.log(`매칭 update: ${updates.length}`);
  console.log(`신규 create: ${creates.length} (지오코딩 실패 보류 ${geocodeFailed.length})`);
  console.log(`모호(스킵): ${ambiguous.length}`);
  console.log(`삭제: ${willDelete.length}${blockedRows.length > 0 ? ' (참조 있는 행이 있어 전체 보류)' : ''}`);

  if (DRY_RUN) {
    console.log('\n=== DRY RUN 종료 — DB에 아무것도 쓰지 않았습니다 ===');
    return;
  }

  if (blockedRows.length > 0) {
    throw new Error('삭제 대상에 참조가 있는 행이 있어 실제 반영을 중단합니다. 위 로그를 확인하고 사람과 상의하세요.');
  }

  // 5) 실제 반영 — 트랜잭션
  await prisma.$transaction(
    async (tx) => {
      for (const u of updates) {
        await tx.facility.update({ where: { id: u.id }, data: u.data });
      }
      for (const c of creates) {
        await tx.facility.create({ data: c.data as never });
      }
      if (willDelete.length > 0) {
        await tx.facility.deleteMany({ where: { id: { in: willDelete }, type: '장례식장' } });
      }
    },
    { timeout: 120_000, maxWait: 10_000 }
  );

  console.log('\n=== 실제 반영 완료 ===');
  console.log(`update ${updates.length} / create ${creates.length} / delete ${willDelete.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
