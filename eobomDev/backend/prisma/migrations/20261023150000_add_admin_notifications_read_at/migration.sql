-- 디자인 개편 8단계 묶음 12 (10-23) - 추가형 1칸(기존 행 변경 없음). 정본 00-37 §4.1 알림 종.
-- Admin.notificationsReadAt: 운영자별 "알림을 마지막으로 읽은 시각". null = 한 번도 안 읽음.

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "notificationsReadAt" TIMESTAMP(3);
