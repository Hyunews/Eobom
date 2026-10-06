-- 99 목록 #17 (2026-10-06) — User.refreshToken은 읽는 곳이 없고 탈퇴 파기 때 null로 비우는 곳뿐이었다. 삭제형.
ALTER TABLE "User" DROP COLUMN "refreshToken";
