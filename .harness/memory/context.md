# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[Claude:Sonnet] Domain 01(장례·묘지 매칭) 개발 재개**
→ 3에이전트 전환은 2026-08-10 승인·반영 완료. 이제 태그는 `[Claude:Opus]`(기획) / `[Claude:Sonnet]`(구현) / `[Gemini]`(문서화·검증) 3종 — 어느 모델로 갈지는 태그가 알려준다(→ `.harness/roles.md` §0).
→ 백엔드 배포는 **[사용자]** Render Blueprint 생성 대기 중이라 그 전까지 로컬 개발로 진행.

하네스 변경분 미커밋 — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Claude:Opus(기획 docs/) → Claude:Sonnet(구현 eobom/·.harness/) → Gemini(reports/·검증)
             사람이 /model 과 창을 전환. 태그·소유권 상세는 roles.md §0·§1
마지막 작업: 2026-08-10 3에이전트 체제 전환 반영 (소유권·태그·harness-doctor·Gemini 핸드오프 스킬)
```

- **기획 SSOT**: `docs/` (도메인별 한글 디렉토리) — 마스터 목차는 `docs/00_DOCS_INDEX.md`
- **보고서**: `reports/` (도메인별 한글 디렉토리 시각화 HTML 포털 + 대외_제출용_보고서)
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` (일지) + `에이전트_기록/` (walkthrough·claude_tasks·gemini_tasks·history)
- **외부 연동 상태**: → `.harness/systems.md` (여기 중복 기재하지 않는다)

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가. `render.yaml` 준비 완료 — 사용자가 Render 대시보드에서 Blueprint 생성해야 진행됨(→ `systems.md` §5 체크리스트).
- **장례 견적비교 A+C 하이브리드안**: 대표 컨펌 전이라 착수 금지(→ `pending-approvals.md`).
- **Render 무료 Postgres ~2026-09-07 만료**: 유료 전환/이전 결정 필요(→ `pending-approvals.md`).

> 카카오맵 API는 2026-08-07 활성화 완료(해결됨). 그 외 연동 이슈는 `.harness/systems.md` 참고.
