# context.md — 지금 상태

> 세션 시작 시 **맨 위 "다음 할 일" 한 줄만** 읽고 바로 작업을 시작할 수 있어야 한다.
> 이 파일은 3KB를 넘기지 않는다. 길어지면 `systems.md`(연동 상태)나 `walkthrough.md`(이력)로 옮긴다.

---

🔒 작업 전 pending-approvals.md 확인

## ▶ 다음 할 일

**[Claude:Sonnet] `Sidebar.tsx` menuItems에서 `ending-note`↔`care-guide` 순서 교체** — 2026-08-11 도메인 번호 재편에 맞춰 메뉴도 같은 순서여야 함.

**[사용자] `npm run seed:admin` + `/admin`·`/partner`·`/facility` 브라우저 확인** — 관리자 계정이 DB에 없음. 라우팅이 경로 방식이라 URL 형식도 바뀜. 브라우저 UI 미검증(API·`tsc`/`build`는 전부 통과).

**[Claude:Sonnet] 다음 후보**
- 이미지 스토리지 로컬→S3(배포 전 필수). 사업자회원+리드수수료 6단계(01-05 §10 필요).
- 클레임 반려/정지 경로(승인만 검증됨). 가입서류 업로드(문자열 URL만). 죽은 `FacilityBooking` API 정리 여부.
- docs 00-05 "보충 설명" 구간 비어있음. **자동생성 표 형식은 후속 문서 생성용 고정 계약**(대표 요청).
- 태그 카테고리 확장(`tagCatalog.ts`). Vercel 배포 후 `/facility` 딥링크 확인.

미커밋 변경분 있음 — 커밋은 사용자가 직접 수행.

---

## 지금 상태

```text
프로젝트   : 이어봄(Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼
워크스페이스: C:\Users\kilak\Desktop\Eobom  (In-Repo Harness Architecture)
협업 체계  : Claude:Opus(기획 docs/) → Claude:Sonnet(구현 eobom/·.harness/) → Gemini(reports/·검증)
             사람이 /model 과 창을 전환. 태그·소유권 상세는 roles.md §0·§1
마지막 작업: 2026-08-11 도메인 번호 재편(메뉴 순서 정렬, 문서 ID `<도메인>-<순번>`) — 구/신 대조표는 DOCS_INDEX 부록
도메인      : 01 장사시설 / 02 전문가 / 03 디지털유품·추모관 / 04 상중행정케어 / 05 엔딩노트·유언
```

- **기획 SSOT**: `docs/` — 마스터 목차 `docs/00_DOCS_INDEX.md` / **보고서**: `reports/`
- **소스코드**: `eobom/frontend` (React 18+Vite 5+TS), `eobom/backend` (Express+Passport+Prisma+JWT)
- **이력 로그**: `docs/작업일지_및_기록/` + `에이전트_기록/` / **외부 연동**: → `.harness/systems.md`

## 지금 막고 있는 것

- **백엔드 미배포**: 실서비스 소셜 로그인 불가(→ `systems.md` §5). 이미지 스토리지 로컬 디스크(배포 전 교체 필수, 동일 §5)도 이 배포 게이트에 걸림.
- **승인 대기 4건**: 견적비교 A+C안 / Postgres 만료 / 리드수수료 §10 / 전문가 법적 리스크 — `pending-approvals.md`.
- **`[Gemini]` 게이트 완료**: walkthrough.md 2026-08-10~11 항목 10건 전부 검증 완료 (✅통과).
- **관리자 계정 없음**: `npm run seed:admin`으로 생성 필요.

> 그 외 연동 이슈는 `.harness/systems.md` 참고.
