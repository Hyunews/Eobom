// 시설 태그 2분류 — docs 01-06 §2. 태그에는 아래 값만 담고, 전부 누르면 걸러보기가 된다.
// 저장 값(DB tags)은 짧게 두고 화면 이름만 label로 바꾼다(DB 값을 고치지 않는다).
// 서버 허용 목록은 backend facilityController.ts의 TAG_FILTER_VALUES — 값을 더하면 양쪽을 같이 고친다.
export type TagGroup = 'owner' | 'kind';

export interface TagDefinition {
  group: TagGroup; // owner = 운영 주체, kind = 시설 종류 (주소창·API 쿼리 이름과 같다)
  label: string; // 화면 표시 이름
  facilityTypes: string[]; // 이 값이 의미 있는 시설 구분(Facility.type)
}

export const TAG_GROUP_LABEL: Record<TagGroup, string> = {
  owner: '운영 주체',
  kind: '시설 종류',
};

export const TAG_CATALOG: Record<string, TagDefinition> = {
  공설: { group: 'owner', label: '공설', facilityTypes: ['장례식장', '묘지/수목장'] },
  사설: { group: 'owner', label: '사설', facilityTypes: ['장례식장', '묘지/수목장'] },
  병원: { group: 'kind', label: '병원 장례식장', facilityTypes: ['장례식장'] },
  전문: { group: 'kind', label: '전문 장례식장', facilityTypes: ['장례식장'] },
  봉안당: { group: 'kind', label: '봉안당', facilityTypes: ['묘지/수목장'] },
  자연장: { group: 'kind', label: '자연장·수목장', facilityTypes: ['묘지/수목장'] },
};

export const isFilterableTag = (tag: string): boolean => tag in TAG_CATALOG;

// 고른 구분(전체 | 장례식장 | 묘지/수목장)에서 보여줄 칩 값. 전체면 그룹의 값을 모두 보인다.
export const tagsForGroup = (group: TagGroup, category: string): string[] =>
  Object.keys(TAG_CATALOG).filter(
    (tag) => TAG_CATALOG[tag].group === group && (category === '전체' || TAG_CATALOG[tag].facilityTypes.includes(category)),
  );

// 분류마다 여러 값을 고를 수 있다(같은 분류는 또는, 분류끼리는 그리고)
export type SelectedTags = Partial<Record<TagGroup, string[]>>;
