-- 폐기 컬럼 제거: Facility.vrImages / detailedPrices / priceValue
-- 셋 다 백엔드 src·프론트 src 어디에서도 참조되지 않는 죽은 컬럼이었음(2026-08-12 확인).
ALTER TABLE "Facility" DROP COLUMN "vrImages";
ALTER TABLE "Facility" DROP COLUMN "detailedPrices";
ALTER TABLE "Facility" DROP COLUMN "priceValue";
