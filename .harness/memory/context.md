# context.md — 지금 상태

> 맨 위 "다음 할 일" 한 줄만 읽고 바로 작업을 시작할 수 있어야 한다. 3KB 초과 금지 —
> 길어지면 `systems.md`(연동)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[Claude:Opus] 완료(2026-08-11)**: docs 6건 정합화(walkthrough (13)) — `01-05`(BOOKING 폐기·운영자 인증
편차 정정·수정범위 원칙) / `02-03` / `00-09`(접근성 토큰 정본) / `00-04`·`00-06` 재작성.

**[Gemini] 완료(2026-08-11)**: `reports/` HTML 5건(`01-05`, `02-03`, `00-04`, `00-06`, `00-09`) 재생성 및 walkthrough (13) 게이트 검증 완료.

**[사용자]** 브라우저 E2E 필요 — `/admin`·`/partner`·`/counseling`·`/facility`. 관리자 계정 있음(`admin@test.com`). **여백 체감·정보수정 폼·대시보드 신규 탭 확인.**

**다음 후보**: 클레임 안 된 시설도 관리자가 대신 편집할지 정책 결정 / 03 도메인 백엔드(현물수거업체 계정형태 기획 보류 중) / Stage2 과금(`02-03` §10 대기) / 이미지 S3 / `vrImages`·`detailedPrices`·`priceValue` 컬럼 정리 / docs 00-05 보충설명 비어있음 / 클레임 반려·정지 경로 / 파트너 리드 조회 화면(`01-05` §11 4단계)

미커밋 변경분 있음 — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트  : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
협업 체계 : Opus(기획 docs/) → Sonnet(구현 eobom/·.harness/) → Gemini(reports/·검증)
            사람이 /model 과 창을 전환. 소유권 상세는 roles.md §0·§1
도메인    : 01 장사시설 / 02 전문가(Stage1 구현완료) / 03 디지털유품·추모관 / 04 상중행정케어 / 05 엔딩노트·유언
마지막    : 2026-08-11 [Gemini] docs 정본 반영 HTML 보고서 5건 재생성 & walkthrough (13) 검증
```

- **기획 SSOT** `docs/`(목차 `00_DOCS_INDEX.md`) / **보고서** `reports/` / **이력** `docs/작업일지_및_기록/`
- **소스** `eobom/frontend`(React18+Vite5+TS), `eobom/backend`(Express+Passport+Prisma+JWT)

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가 + 이미지 로컬 디스크 저장(→ `systems.md` §5).
- **승인 대기 4건**: Postgres 만료 / 리드수수료 01-05 §10 / 전문가 법적 리스크 / 제휴사 혜택·수익구조 재설계 — `pending-approvals.md`.
- **`[Gemini]` 게이트**: 08-10~11 전체 19건 검증 완료(18 ✅ / 1 🔄).

