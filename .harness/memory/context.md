# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[Claude:Sonnet] 사업자 회원 + 리드 수수료 인프라 4단계(파트너 어드민) 이어서**
→ 0~3단계(정책 골격·스키마·사업자 인증·리드 파이프라인) 2026-08-10 완료. 상세: `walkthrough.md` 2026-08-10 항목.
→ 확정 스펙: `docs/01_장례_묘지_매칭/16_장사시설_사업자회원_및_리드_수수료_정산_명세서.md` §11
→ 4) 파트너 어드민(리드 목록·상세·상태 신고) 5) 운영자 어드민(가입·클레임 심사, 요율 등록) — `pending-approvals.md`의 §10 값 확정과 무관하게 진행 가능
→ 백엔드 배포는 **[사용자]** Render Blueprint 생성 대기 중이라 그 전까지 로컬 개발로 진행.

2026-08-07 게이트 3건은 Gemini 판정 완료(전부 ✅통과). **`[Gemini]` 게이트 대기 1건**만 남음 — walkthrough.md 2026-08-10(사업자회원+리드수수료) 항목, 판정 없음.
미커밋 변경분 있음 — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Claude:Opus(기획 docs/) → Claude:Sonnet(구현 eobom/·.harness/) → Gemini(reports/·검증)
             사람이 /model 과 창을 전환. 태그·소유권 상세는 roles.md §0·§1
마지막 작업: 2026-08-10 장사시설 사업자회원+리드수수료 인프라 0~3단계 구현 (docs 16 기반)
```

- **기획 SSOT**: `docs/` — 마스터 목차 `docs/00_DOCS_INDEX.md` / **보고서**: `reports/`
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` + `에이전트_기록/` / **외부 연동**: → `.harness/systems.md`

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가. `render.yaml` 준비 완료 — 사용자가 Render 대시보드에서 Blueprint 생성해야 진행됨(→ `systems.md` §5 체크리스트).
- **장례 견적비교 A+C 하이브리드안**: 대표 컨펌 전이라 착수 금지(→ `pending-approvals.md`).
- **Render 무료 Postgres ~2026-09-07 만료**: 유료 전환/이전 결정 필요(→ `pending-approvals.md`).
- **사업자회원+리드수수료 §10 대표 확정 4건**: 수수료 기준 등(→ `pending-approvals.md`). 구현은 안 막힘.
- **`[Gemini]` 게이트 대기 1건**: walkthrough.md 2026-08-10 항목(사업자회원+리드수수료 0~3단계) 판정 없음.

> 카카오맵 API는 2026-08-07 활성화 완료(해결됨). 그 외 연동 이슈는 `.harness/systems.md` 참고.
