-- 00 1회차 코드 (10-12) — 추가형 2칸(기존 행 변경 없음, 소급 없음).
-- Memorial.resharedNoticeAckAt: 추모관 단독 개설에도 재전파 고지 확인 시각(00-13 §8 #6).
-- User.memorializedAt: 비활성 계정(로그인 차단만) 표시(00-12 §5.3 1차 스펙).

-- AlterTable
ALTER TABLE "Memorial" ADD COLUMN "resharedNoticeAckAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "memorializedAt" TIMESTAMP(3);
