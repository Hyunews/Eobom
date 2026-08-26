# context.md — 지금 상태

> 맨 위 한 줄만 보고 바로 시작할 수 있어야 한다. **3KB 초과 금지**(harness-doctor가 잰다).
> 항목이 길어지면 `backlog.md`로, 끝난 항목은 `walkthrough.md`로 옮긴다.

🔒 `pending-approvals.md` 확인 · 진행 중 상세는 `backlog.md`

---

## ▶ 다음 할 일

**1. [Claude:Sonnet] `06-05` Phase A — 유족 메시지 보관함**(✅ 08-26 확정, 착수 가능)
✅ **슬라이드 2개 분리 확정** — `counseling`·`ending-note`와 동급 도메인(`06-05` §7.4).
🔴 기존 `ending-note` 슬라이드 문구 **동반 수정 필수**(badgeLabel·bullet②·titleLine2가 보관함 내용).

**2. [Claude:Sonnet] 초대 흐름 결함 2건**(08-26 사장님 실기기, `00-27` §9.1-4-1·9.1-4-2)
데스크톱 `navigator.share` 분기가 폴백을 죽임 · 수락완료 화면이 막다른 길(CTA 0개).

**3. [Claude:Sonnet] 발신번호** — `Footer.tsx:120` `1588-0000` → **`070-8856-2725`**(`00-14` §11-2 닫힘).

**4. [사용자] 남은 확정** — `00-14` §11-3(사망확인 SLA)·§11-11(06 수익지점) · `00-20` 보유기간 ·
위치정보법 신고. ⏸ 11-1 알림톡은 **발신번호 사전등록**(§11.4 b)이 별건이라 아직 안 열림.

**5. [Claude:Opus] `00-06` 화면ID 신설** — SCR-016·017(`/prep`·`/bereaved`).

**6. [Gemini] 게이트 대기 8건** — walkthrough 70~73 포함.

## 지금 상태

```text
프로젝트: 이어봄(Eobom) — 디지털엔딩&웰다잉 토탈케어 플랫폼
협업체계: Opus(docs/) → Sonnet(eobom/) → Gemini(reports/·검증) · roles.md §1-1
도메인  : 01장사시설 / 02전문가 / 03현물수거 / 04·05(보류) / 06엔딩노트 / 07상중행정
마지막  : 2026-08-25 [Opus] 06-05 도메인분리 + 하네스 결함7건 수정 / [Sonnet] walkthrough 70~73
```

- 소스 `eobom/frontend`(React18+Vite5+TS) · `eobom/backend`(Express+Prisma+JWT)
- 목차 `docs/00_DOCS_INDEX.md` / 저장위치 `AGENTS.md` §7

## 지금 막고 있는 것

- 🔴 **06 백엔드 0건** — 엔딩노트·보관함 둘 다 모델부터. `pg_dump` 선행.
- 🔴 **이미지·음성 로컬디스크**: 재배포 시 소실 → 추모관사진 오픈금지 · 보관함 음성 Phase D(`systems.md` §5).
- 🔴 **백엔드 oregon ↔ DB 서울** — 속도·국외이전 논점. 승인 대기(인프라).
- 🔴 **`/m/:slug` 목업** — slug를 안 읽어 아무 slug나 같은 화면. 실사용자 유입 전 차단 필수.
- **`Deceased` 미확정**: 04·05 묶임. ✅ 07은 최소범위 선도입해 해제.
- 🟡 **harness-doctor 예산 2건 초과**(`roles.md` 9.9KB/8KB · `systems.md` 11.3KB/6KB) — 내용을 지우기 전에 *"이 파일에 있을 게 맞나"* 부터(`AGENTS.md` §9).
