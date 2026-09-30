import prisma from '../config/prisma';

// §7.1 + §13 #5 — 섹션별로 허용되는 timing. 목록에 없는 값(WILL_DRAFT)은 절대 허용하지 않는다
// (§7.4 모델 레벨 차단). EMERGENCY는 어느 섹션에도 없다 — Phase 3(응급 열람 확정) 전까지는
// 화면에서도 걷어낸다(§13 #1). §7.1 표는 ①②⑦ 모두 즉시 공유가 "🟡 선택"이라 하지만, §13 #5가
// 1차 범위를 "②⑦만"으로 더 좁게 확정했으므로 그 확정을 따른다 — ①은 POSTMORTEM만 허용.
// endingNoteController(권한 지정 검증)와 아래 기본 권한 생성이 같은 표를 쓴다 — 두 곳에 복사해 두지 않는다.
export const SECTION_ALLOWED_TIMINGS: Record<string, string[]> = {
  LIFE_SUPPORT: ['POSTMORTEM'],
  FUNERAL: ['IMMEDIATE', 'POSTMORTEM'],
  ASSET: ['POSTMORTEM'],
  DIGITAL_ACCOUNTS: ['POSTMORTEM'],
  INSURANCE: ['POSTMORTEM'],
  CONTACTS: ['IMMEDIATE', 'POSTMORTEM'],
  WILL_LOCATION: ['POSTMORTEM'],
  ORGAN_DONATION: ['POSTMORTEM'],
};

// 06-04 §8.3-2 — 기본 "사후에만 공개" 권한. POSTMORTEM이 허용되는 섹션 전부(WILL_DRAFT는 표에 없으므로 자동 제외, IMMEDIATE 없음).
const DEFAULT_POSTMORTEM_SECTIONS = Object.entries(SECTION_ALLOWED_TIMINGS)
  .filter(([, timings]) => timings.includes('POSTMORTEM'))
  .map(([section]) => section);

// 지정(designationIds) × 섹션마다 POSTMORTEM 권한 행을 만든다. 🔴 (지정, 섹션)에 권한 행이 **한 번이라도 있었으면(철회 포함)**
// 건너뛴다 — 본인이 비공개로 바꾼 것을 되살리지 않는다. 멱등이다(같은 호출을 반복해도 행이 늘지 않는다).
// 🔴 기존 지정 소급은 하지 않는다 — 호출 지점은 "지정 생성 때"와 "노트가 처음 생길 때" 둘뿐이다(일괄 스크립트 금지).
export const grantDefaultPostmortem = async (noteId: string, designationIds: string[]): Promise<number> => {
  if (designationIds.length === 0) return 0;
  const existing = await prisma.endingNoteGrant.findMany({
    where: { noteId, designationId: { in: designationIds } },
    select: { designationId: true, section: true },
  });
  const had = new Set(existing.map((g) => `${g.designationId}:${g.section}`));
  const data = designationIds.flatMap((designationId) =>
    DEFAULT_POSTMORTEM_SECTIONS.filter((section) => !had.has(`${designationId}:${section}`)).map((section) => ({
      noteId,
      designationId,
      section,
      timing: 'POSTMORTEM',
    }))
  );
  if (data.length === 0) return 0;
  const r = await prisma.endingNoteGrant.createMany({ data, skipDuplicates: true });
  return r.count;
};

// 노트가 처음 생긴 그 시점의 지정 전원(DECLINED 제외)에게 기본 권한을 준다. 이미 개봉된 노트에는 주지 않는다.
export const grantDefaultForAllDesignations = async (userId: string, noteId: string): Promise<void> => {
  const designations = await prisma.familyDesignation.findMany({
    where: { userId, status: { not: 'DECLINED' } },
    select: { id: true },
  });
  await grantDefaultPostmortem(
    noteId,
    designations.map((d) => d.id)
  );
};
