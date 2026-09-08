// 시설 태그 분류 화이트리스트 — 여기 등록된 값만 클릭 가능한 필터로 동작한다.
// Facility.tags는 소스별로 성격이 다르다: 공공데이터(CSV) 임포트는 "공-사설 구분" 컬럼값
// ("공설"/"사설")이 그대로 들어오고, 수기 시드(seed-data/facilities.json)는 마케팅 문구
// ("전남대병원", "24시 대기" 등)가 섞여 있다 — 실제 DB 감사(2026-08-10) 기준 1,552건 중
// 분류 가능한 건 "공설"(322)/"사설"(626)뿐이고 나머지 ~50종은 전부 1회성 문구다.
// 그래서 태그 문자열 전체를 필터로 취급하지 않고, 이 화이트리스트에 있는 값만 클릭 필터로
// 승격시키고 나머지는 지금처럼 클릭 안 되는 일반 라벨로 둔다.
//
// 새 카테고리를 추가하려면: (1) 여기 항목만 추가하면 된다. 백엔드 facilityController.ts의
// buildWhere가 이미 범용 `tag` 쿼리파라미터(Prisma `tags: { has }`)를 쓰므로 백엔드 수정은
// 보통 필요 없다. 상세 배경·확장 가이드는 docs/01_장사시설_매칭/01-06 참고.
export interface TagDefinition {
  category: string; // 카테고리명 — 여러 태그를 묶어 보여줄 때 그룹 라벨로 쓴다
  label: string; // 화면 표시 라벨 (지금은 원본 값과 동일하지만, 원본 값이 바뀌어도 화면 문구는 유지하고 싶을 때 분리해서 쓴다)
}

export const TAG_CATALOG: Record<string, TagDefinition> = {
  공설: { category: '운영주체', label: '공설' },
  사설: { category: '운영주체', label: '사설' },
};

export const isFilterableTag = (tag: string): boolean => tag in TAG_CATALOG;
