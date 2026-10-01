-- 10-01 개발자 요청 — createdAtKst(20261001180000)와 같은 방식으로 updatedAt이 있는 표에 "updatedAtKst" 보기 전용 칸을 붙인다.
-- 저장은 UTC 그대로(updatedAt). updatedAtKst는 DB 트리거가 updatedAt + 9시간으로 채운다. 앱은 이 칸을 읽지도 쓰지도 않는다.
-- Prisma가 INSERT·UPDATE 문에 넣은 updatedAt 값 뒤에 BEFORE 트리거가 돌므로 값이 따라간다(tests/created-at-kst.test.ts가 확인).
-- 🔴 새 표를 만들 때 updatedAt이 있으면 같은 칸·트리거를 붙인다(.harness/systems.md §4).
-- 🔴 마지막 단계는 기존 행 전체를 UPDATE하는 일괄 쓰기다 — 운영은 migrate-prod.ps1(백업 선행)로만.

-- 칸 추가(보기 전용)
ALTER TABLE "Admin" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "ConsultRequest" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "EndingNote" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "EndingNoteEntry" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "EndingNoteGrant" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "Expert" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "Facility" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "FamilyDesignation" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "FarewellMessage" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "Memorial" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "Obituary" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "Partner" ADD COLUMN "updatedAtKst" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "updatedAtKst" TIMESTAMP(3);

-- 트리거 함수 1개 — 모든 표가 같이 쓴다
CREATE OR REPLACE FUNCTION set_updated_at_kst() RETURNS trigger AS $$
BEGIN
  NEW."updatedAtKst" := NEW."updatedAt" + interval '9 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 표마다 트리거
CREATE TRIGGER "Admin_updated_at_kst" BEFORE INSERT OR UPDATE ON "Admin" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "ConsultRequest_updated_at_kst" BEFORE INSERT OR UPDATE ON "ConsultRequest" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "EndingNote_updated_at_kst" BEFORE INSERT OR UPDATE ON "EndingNote" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "EndingNoteEntry_updated_at_kst" BEFORE INSERT OR UPDATE ON "EndingNoteEntry" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "EndingNoteGrant_updated_at_kst" BEFORE INSERT OR UPDATE ON "EndingNoteGrant" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "Expert_updated_at_kst" BEFORE INSERT OR UPDATE ON "Expert" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "Facility_updated_at_kst" BEFORE INSERT OR UPDATE ON "Facility" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "FamilyDesignation_updated_at_kst" BEFORE INSERT OR UPDATE ON "FamilyDesignation" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "FarewellMessage_updated_at_kst" BEFORE INSERT OR UPDATE ON "FarewellMessage" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "Lead_updated_at_kst" BEFORE INSERT OR UPDATE ON "Lead" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "Memorial_updated_at_kst" BEFORE INSERT OR UPDATE ON "Memorial" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "Obituary_updated_at_kst" BEFORE INSERT OR UPDATE ON "Obituary" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "Partner_updated_at_kst" BEFORE INSERT OR UPDATE ON "Partner" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();
CREATE TRIGGER "User_updated_at_kst" BEFORE INSERT OR UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst();

-- 기존 행 채우기(한 번) — 트리거가 같은 값을 넣는다. updatedAt·createdAt 등 다른 칸은 건드리지 않는다.
UPDATE "Admin" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "ConsultRequest" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "EndingNote" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "EndingNoteEntry" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "EndingNoteGrant" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "Expert" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "Facility" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "FamilyDesignation" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "FarewellMessage" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "Lead" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "Memorial" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "Obituary" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "Partner" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
UPDATE "User" SET "updatedAtKst" = "updatedAt" + interval '9 hours';
