-- 00-20 §8.1 "expiresAt 계산" (10-07) — 부고 경로(작성 시 함께 개설·사후 연결)로 만든 추모관은 expiresAt이 비어 있었다.
-- 데이터 채우기(스키마 변경 없음): 비어 있고 동결 전인 행만 createdAt + 395일(POLICY.memorial.activeDays와 같은 값).
-- 동결된 행(frozenAt 있음)은 건드리지 않는다. 다시 돌려도 같은 결과(이미 채워진 행은 대상이 아니다).
UPDATE "Memorial"
SET "expiresAt" = "createdAt" + INTERVAL '395 days'
WHERE "expiresAt" IS NULL AND "frozenAt" IS NULL;
