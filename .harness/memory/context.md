# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[사용자] `PartnerPortalPage`(`#partner`) 브라우저로 직접 확인** — 이 세션엔 브라우저 자동화 도구가 없어 프론트 UI 클릭 테스트를 못 했다. 백엔드 API·`tsc`/`build`는 전부 통과.

**[Claude:Sonnet] 그 다음 후보 2개 중 택1**
1. 사업자회원+리드수수료 4단계(파트너 어드민) — 스펙 `docs/16` §11, §10 미정이어도 착수 가능.
2. 전문가 계정 이어서 — 운영자 승인 화면(지금은 DB 직접 조작), `docs/17` §2 법적 리스크는 사장님 확인 대기(`pending-approvals.md` 미등록, 등록 검토할 것).

OAuth 3사 로컬 로그인은 2026-08-10 전부 해결됨(콘솔 등록 완료).
미커밋 변경분 있음 — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Claude:Opus(기획 docs/) → Claude:Sonnet(구현 eobom/·.harness/) → Gemini(reports/·검증)
             사람이 /model 과 창을 전환. 태그·소유권 상세는 roles.md §0·§1
마지막 작업: 2026-08-10 OAuth 로컬 https 콜백 수정 + 전문가(Expert) 계정 체계 신설 (docs 17 기반)
```

- **기획 SSOT**: `docs/` — 마스터 목차 `docs/00_DOCS_INDEX.md` / **보고서**: `reports/`
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` + `에이전트_기록/` / **외부 연동**: → `.harness/systems.md`

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가(→ `systems.md` §5).
- **승인 대기 3건**: 견적비교 A+C안 / Postgres 만료 대응 / 리드수수료 §10 — 전부 `pending-approvals.md`.
- **`[Gemini]` 게이트 대기 2건**: walkthrough.md 2026-08-10 항목 2개(리드수수료 0~3단계 / 전문가 계정+OAuth 수정).
- **전문가 어드민 없음**: 승인·자격증 검증 화면 미구현, DB 직접 조작으로만 승인 가능.

> 그 외 연동 이슈는 `.harness/systems.md` 참고.
