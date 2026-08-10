# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[사용자] 3에이전트 체제 전환안 승인 여부 결정** (2026-08-07 퇴근으로 중단)
→ 검토 결과·근거: `.harness/_meta/3에이전트_전환안.md`
→ 승인되면 **[Claude]** 하네스 규칙 반영 + Gemini 문서화 스킬 작성, 이후 Domain 01 개발 재개.

미커밋 변경분 있음(mkcert HTTPS + render.yaml) — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Gemini(기획, docs/·reports/) ↔ Claude(구현, eobom/·.harness/) — 사람이 창 전환
마지막 작업: 2026-08-07 mkcert 로컬 HTTPS + 위치 자동감지 실브라우저 검증 완료(권한 프롬프트·실위치·배지 미노출 3항목 사용자 확인)
```

- **기획 SSOT**: `docs/` (도메인별 한글 디렉토리) — 마스터 목차는 `docs/00_DOCS_INDEX.md`
- **보고서**: `reports/` (도메인별 한글 디렉토리 시각화 HTML 포털 + 대외_제출용_보고서)
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` (일지) + `에이전트_기록/` (walkthrough·claude_tasks·gemini_tasks·history)
- **외부 연동 상태**: → `.harness/systems.md` (여기 중복 기재하지 않는다)

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가. `render.yaml` 준비 완료 — 사용자가 Render 대시보드에서 Blueprint 생성해야 진행됨(→ `systems.md` §5 체크리스트).
- **3에이전트 전환안 미승인**: 아래 §전환안. 승인 전까지 현행 2에이전트 체제 유지.

> 카카오맵 API는 2026-08-07 활성화 완료(해결됨). 그 외 연동 이슈는 `.harness/systems.md` 참고.
