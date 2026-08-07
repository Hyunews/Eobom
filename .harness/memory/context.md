# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

## ▶ 다음 할 일

🔒 **작업 전 `.harness/memory/pending-approvals.md` 확인 — 사람 승인 대기 항목은 착수 금지.**

**[Claude] Domain 01(장례·묘지 매칭) 기능 개발 재개**
소셜 로그인 LAN 동적 대응은 완료, 폰 실기기 테스트는 백엔드 배포 후로 보류(→ systems.md §5).

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Gemini(기획, docs/·reports/) ↔ Claude(구현, eobom/·.harness/) — 사람이 창 전환
마지막 작업: 2026-08-08 Domain01 위치오탐지/카카오지도 미작동 조사 — 원인은 각각 브라우저 보안정책·콘솔 미활성(코드 결함 아님), 실패 시 UI 안내만 보강
```

- **기획 SSOT**: `docs/` (도메인별 한글 디렉토리) — 마스터 목차는 `docs/00_DOCS_INDEX.md`
- **보고서**: `reports/` (HTML·PDF·DOCX)
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` (일지) + `에이전트_기록/` (walkthrough·claude_tasks·gemini_tasks·history)
- **외부 연동 상태**: → `.harness/systems.md` (여기 중복 기재하지 않는다)

## 지금 막고 있는 것

- **카카오맵 API 비활성**: 디벨로퍼 콘솔에서 활성화 ON 필요 → 지도 기능 블로킹.
- **백엔드 미배포**: 실서비스 소셜 로그인 불가 + 폰 실기기 OAuth 테스트도 이걸로 보류 중.

> **사람 승인 대기 항목**(임의 착수 금지)은 여기 안 적는다 → `.harness/memory/pending-approvals.md`가 정본(왜 별도 파일인지는 그 파일 참고).
> 그 외 연동 이슈(공공데이터 배제, 45건 캡, DB 백업 등)는 `.harness/systems.md` 참고.
