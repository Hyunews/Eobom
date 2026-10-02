-- 은행명 자유 입력에 맞춰 이름 정정 — DROP+ADD가 아니라 RENAME이라 기존 값이 보존된다.
ALTER TABLE "Obituary" RENAME COLUMN "accountBankCode" TO "accountBankName";
