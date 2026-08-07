# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

## ▶ 다음 할 일

**[Claude] 하네스 재설계 결과 점검 후, Domain 01(장례·묘지 매칭) 기능 개발 재개.**
미커밋 작업분(Facility 도메인 + geo 컨트롤러 + 하네스 재구성)의 git 커밋 여부를 사용자에게 먼저 확인할 것.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Gemini(기획, docs/·reports/) ↔ Claude(구현, eobom/·.harness/) — 사람이 창 전환
마지막 작업: 2026-08-07 하네스 재설계 (부팅 2 + 조건부 4 구조, 소유권 분리, 점검 자동화 복구)
```

- **기획 SSOT**: `docs/` (도메인별 한글 디렉토리) — 마스터 목차는 `docs/00_DOCS_INDEX.md`
- **보고서**: `reports/` (HTML·PDF·DOCX)
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` (일지) + `에이전트_기록/` (walkthrough·claude_tasks·gemini_tasks·history)
- **외부 연동 상태**: → `.harness/systems.md` (여기 중복 기재하지 않는다)

## 지금 막고 있는 것

- **git 미커밋**: `.harness/`·`docs/`·`reports/`·`assets/` 전부 untracked. 7/29 이후 기획 작업 전체가 백업 없는 상태 — 커밋 필요(사용자 승인 대기).
- **카카오맵 API 비활성**: 디벨로퍼 콘솔에서 활성화 ON 필요 → 지도 기능 블로킹.
- **백엔드 미배포**: 실서비스 소셜 로그인 불가.

> 그 외 연동 이슈(공공데이터 배제, 45건 캡, DB 백업 등)는 `.harness/systems.md` 참고.
