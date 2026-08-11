# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[사용자] `npm run seed:admin`으로 관리자 계정 생성 + `#admin`·`#partner`·`/facility` 브라우저 직접 확인** — DB에 관리자 계정이 지금 하나도 없음. 라우팅이 `/facility` 경로 방식으로 바뀌었으니 URL도 새 형식으로 확인할 것(구 `#facility`는 이제 홈으로 리다이렉트됨). 이 세션엔 브라우저 자동화 도구가 없어 프론트 UI 클릭 테스트를 못 함(백엔드 API·`tsc`/`build`·curl 검증은 전부 통과).

**[Claude:Sonnet] 다음 후보**
- 이미지 스토리지 로컬→S3 교체(배포 전 필수, → 막고 있는 것). 사업자회원+리드수수료 6단계(§10 필요).
- 클레임 반려/정지 경로(승인만 검증됨). 가입서류 업로드(문자열 URL만). 죽은 `FacilityBooking` API 정리 여부.
- docs/05 "보충 설명" 구간 비어있음(JSON 필드 실제 형태 등). **자동생성 표 형식(컬럼|타입|제약조건|설명)은 후속 문서 생성용 고정 계약**(대표 요청) — 바꾸면 파서도 같이 볼 것.
- 태그 카테고리 확장(`tagCatalog.ts`). Vercel 배포 후 `/facility` 딥링크 새로고침 확인 필요.

OAuth 3사 로컬 로그인은 2026-08-10 전부 해결됨(콘솔 등록 완료).
미커밋 변경분 있음 — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Claude:Opus(기획 docs/) → Claude:Sonnet(구현 eobom/·.harness/) → Gemini(reports/·검증)
             사람이 /model 과 창을 전환. 태그·소유권 상세는 roles.md §0·§1
마지막 작업: 2026-08-11 라우팅 HistoryRouter 전환 + 태그 클릭필터(TAG_CATALOG) + DB문서 자동생성(docs/05)
```

- **기획 SSOT**: `docs/` — 마스터 목차 `docs/00_DOCS_INDEX.md` / **보고서**: `reports/`
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` + `에이전트_기록/` / **외부 연동**: → `.harness/systems.md`

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가(→ `systems.md` §5). 이미지 스토리지 로컬 디스크(배포 전 교체 필수, 동일 §5)도 이 배포 게이트에 걸림.
- **승인 대기 4건**: 견적비교 A+C안 / Postgres 만료 / 리드수수료 §10 / 전문가 법적 리스크 — `pending-approvals.md`.
- **`[Gemini]` 게이트 대기 9건**: walkthrough.md 2026-08-10~11 항목 전부 판정 없음.
- **관리자 계정 없음**: `npm run seed:admin`으로 생성 필요.

> 그 외 연동 이슈는 `.harness/systems.md` 참고.
