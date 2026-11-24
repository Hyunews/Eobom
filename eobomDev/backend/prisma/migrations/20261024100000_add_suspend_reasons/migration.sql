-- 디자인 개편 8단계 묶음 13 (10-23) - 추가형 4칸(기존 행 변경 없음). 정본 00-37 §4.1 회원 정지 · 01-05 §14-9 · 02-03 §7.3-2 #7.
-- User.suspendedAt/suspendReason: 운영자 회원 정지. Partner/Expert.suspendReason: 정지 사유(상태 SUSPENDED는 이미 있음).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3),
ADD COLUMN "suspendReason" TEXT;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "suspendReason" TEXT;

-- AlterTable
ALTER TABLE "Expert" ADD COLUMN "suspendReason" TEXT;
