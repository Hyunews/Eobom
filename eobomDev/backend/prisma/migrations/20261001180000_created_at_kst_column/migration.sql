-- 10-01 개발자 결정 — DB를 사람이 열었을 때(Supabase 표 화면·psql·Prisma Studio) 원래 표에서 바로 한국 시간이 보이게 "createdAtKst" 보기 전용 칸을 붙인다.
-- 저장은 UTC 그대로(createdAt). createdAtKst는 DB 트리거가 createdAt + 9시간으로 채운다. 앱은 이 칸을 읽지도 쓰지도 않는다(schema.prisma에서 @ignore).
-- 🔴 새 표를 만들 때 createdAt이 있으면 같은 칸·트리거를 붙인다(.harness/systems.md §4, tests/created-at-kst.test.ts가 빠진 표를 잡는다).
-- 🔴 마지막 단계는 기존 행 전체를 UPDATE하는 일괄 쓰기다 — 운영은 migrate-prod.ps1(백업 선행)로만.

-- 직전 마이그레이션(20261001170000)이 만든 뷰는 이 칸으로 대체한다.
DROP VIEW IF EXISTS "AccessLog_kst";
DROP VIEW IF EXISTS "ErrorLog_kst";
DROP VIEW IF EXISTS "AdminAuditLog_kst";

-- 칸 추가(보기 전용)
ALTER TABLE "AccessLog" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Admin" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "AdminAuditLog" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "CommissionPolicy" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "ConsultRequest" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Deceased" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "EndingNote" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "EndingNoteEntry" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "EndingNoteGrant" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "ErrorLog" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Expert" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Facility" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "FacilityClaim" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "FacilityReview" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "FamilyDesignation" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "FarewellMessage" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Memorial" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "MemorialGuestbook" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "MemorialPhoto" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "MemorialTribute" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Obituary" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Partner" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "Settlement" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "SocialAccount" ADD COLUMN "createdAtKst" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "createdAtKst" TIMESTAMP(3);

-- 트리거 함수 1개 — 모든 표가 같이 쓴다
CREATE OR REPLACE FUNCTION set_created_at_kst() RETURNS trigger AS $$
BEGIN
  NEW."createdAtKst" := NEW."createdAt" + interval '9 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 표마다 트리거
CREATE TRIGGER "AccessLog_created_at_kst" BEFORE INSERT OR UPDATE ON "AccessLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Admin_created_at_kst" BEFORE INSERT OR UPDATE ON "Admin" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "AdminAuditLog_created_at_kst" BEFORE INSERT OR UPDATE ON "AdminAuditLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "CommissionPolicy_created_at_kst" BEFORE INSERT OR UPDATE ON "CommissionPolicy" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "ConsultRequest_created_at_kst" BEFORE INSERT OR UPDATE ON "ConsultRequest" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Deceased_created_at_kst" BEFORE INSERT OR UPDATE ON "Deceased" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "EndingNote_created_at_kst" BEFORE INSERT OR UPDATE ON "EndingNote" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "EndingNoteEntry_created_at_kst" BEFORE INSERT OR UPDATE ON "EndingNoteEntry" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "EndingNoteGrant_created_at_kst" BEFORE INSERT OR UPDATE ON "EndingNoteGrant" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "ErrorLog_created_at_kst" BEFORE INSERT OR UPDATE ON "ErrorLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Expert_created_at_kst" BEFORE INSERT OR UPDATE ON "Expert" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Facility_created_at_kst" BEFORE INSERT OR UPDATE ON "Facility" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "FacilityClaim_created_at_kst" BEFORE INSERT OR UPDATE ON "FacilityClaim" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "FacilityReview_created_at_kst" BEFORE INSERT OR UPDATE ON "FacilityReview" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "FamilyDesignation_created_at_kst" BEFORE INSERT OR UPDATE ON "FamilyDesignation" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "FarewellMessage_created_at_kst" BEFORE INSERT OR UPDATE ON "FarewellMessage" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Lead_created_at_kst" BEFORE INSERT OR UPDATE ON "Lead" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Memorial_created_at_kst" BEFORE INSERT OR UPDATE ON "Memorial" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "MemorialGuestbook_created_at_kst" BEFORE INSERT OR UPDATE ON "MemorialGuestbook" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "MemorialPhoto_created_at_kst" BEFORE INSERT OR UPDATE ON "MemorialPhoto" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "MemorialTribute_created_at_kst" BEFORE INSERT OR UPDATE ON "MemorialTribute" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Obituary_created_at_kst" BEFORE INSERT OR UPDATE ON "Obituary" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Partner_created_at_kst" BEFORE INSERT OR UPDATE ON "Partner" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "Settlement_created_at_kst" BEFORE INSERT OR UPDATE ON "Settlement" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "SocialAccount_created_at_kst" BEFORE INSERT OR UPDATE ON "SocialAccount" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "User_created_at_kst" BEFORE INSERT OR UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();

-- 기존 행 채우기(한 번) — 트리거가 같은 값을 넣는다. createdAt·updatedAt 등 다른 칸은 건드리지 않는다.
UPDATE "AccessLog" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Admin" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "AdminAuditLog" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "CommissionPolicy" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "ConsultRequest" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Deceased" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "EndingNote" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "EndingNoteEntry" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "EndingNoteGrant" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "ErrorLog" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Expert" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Facility" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "FacilityClaim" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "FacilityReview" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "FamilyDesignation" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "FarewellMessage" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Lead" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Memorial" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "MemorialGuestbook" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "MemorialPhoto" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "MemorialTribute" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Obituary" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Partner" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "Settlement" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "SocialAccount" SET "createdAtKst" = "createdAt" + interval '9 hours';
UPDATE "User" SET "createdAtKst" = "createdAt" + interval '9 hours';
