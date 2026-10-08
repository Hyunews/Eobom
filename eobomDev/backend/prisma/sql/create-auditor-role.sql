-- docs 00-43 §10.3 — 접속기록 점검 전용 조회 계정. 기록 표 3개만 읽을 수 있다(User·엔딩노트 등은 읽기도 불가).
-- 🔴 이 파일은 실행하지 않고 둔다. 계정 만들기는 DB 쓰기다 — 로컬·운영 모두
--    ① 백업 먼저(powershell -File .harness/tools/backup-db.ps1 -Target local|prod)
--    ② 사람이 실행. 대상 DB 와 -Target 이 같은지 확인할 것(.harness/db-safety.md).
-- <비밀번호>는 개발자가 정해 실행하는 자리에서만 바꿔 넣는다. 파일에 실제 비밀번호를 저장하지 않는다.
-- 만든 뒤 OPS_AUDIT_DATABASE_URL 에 이 계정 주소를 넣는다.
--   로컬:  postgresql://eobom_auditor:<비밀번호>@localhost:5433/<DB 이름>
--   운영(Supabase 풀러): 사용자명이 eobom_auditor.<프로젝트 ref> 형식일 수 있다(postgres.<ref> 와 같은 규칙) — 첫 연결 때 확인.

CREATE ROLE eobom_auditor LOGIN PASSWORD '<비밀번호>';
GRANT USAGE ON SCHEMA public TO eobom_auditor;
GRANT SELECT ON "AccessLog", "AdminAuditLog", "ErrorLog" TO eobom_auditor;
ALTER ROLE eobom_auditor SET default_transaction_read_only = on;
