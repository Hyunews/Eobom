-- 디자인 개편 8단계 묶음 10 (10-23) — 추가형 6칸(기존 행 변경 없음, 소급 없음). 정본 01-05 §14-5 · §4.3.
-- Facility.intro: 사업자가 쓰는 소개 글. introHidden*: 운영자 숨김 칸 3개. partnerEditedAt: 사업자가 저장한 시각(공공 데이터 재적재가 부대시설을 덮지 않게).
-- Lead.lostReason: 무산 사유 코드(CONDITION | NO_CONTACT | PLAN_CHANGED | OTHER).

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN "intro" TEXT,
ADD COLUMN "introHiddenAt" TIMESTAMP(3),
ADD COLUMN "introHiddenReason" TEXT,
ADD COLUMN "introHiddenNote" TEXT,
ADD COLUMN "partnerEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "lostReason" TEXT;
