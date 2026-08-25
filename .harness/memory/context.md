# context.md — 지금 상태

> 맨 위 한 줄만 보고 바로 시작할 수 있어야 한다. **3KB 초과 금지**(harness-doctor가 잰다).
> 항목이 길어지면 `backlog.md`로, 끝난 항목은 `walkthrough.md`로 옮긴다.

🔒 `pending-approvals.md` 확인 · 진행 중 상세는 `backlog.md`

---

## ▶ 다음 할 일

**1. [사용자] 확정 3건 — 이게 아래 작업들을 막고 있다**
- **`06-05` §10 #1** — 유족 메시지 보관함을 **메인 도메인 슬라이드에 넣을지**(1개 유지 + 사이드바 2개 🟡권고 / 2개로 분리). **Phase A 착수를 막는다.**
- **`00-14` §11-2·11-3·11-11** — 발신번호 실번호 · 사망확인 SLA · 06 수익지점. 3단계 승계 전체가 걸림.
- **`00-20` 보유기간 · 위치정보법 신고 여부** — 처리방침 게시 블로커.

**2. [Claude:Sonnet] `06-05` Phase A — 유족 메시지 보관함 골격**
`FarewellMessagePage.tsx` 신설 + 라우트 + 사이드바 + `EndingNotePage`의 자유 텍스트 ③ 제거 + 크로스링크.
🔴 위 1번 확정 후 착수. 스펙 `06-05` §7·§8.

**3. ✅[Sonnet] 모바일 본문 15px 완료**(08-25, walkthrough 72) — 조치 A는 기존재. 조치 B는
실측 16곳(97 아님)→`0.85rem`. 🟡 `0.82rem` 7곳은 지시 범위 밖이라 남김.

**4. ✅[Sonnet] `07-03` #9 검증 완료 — 이미 수정돼 있었음**(08-25, walkthrough 73). 코드 변경
없음 — 실기동 재현만 미검증.

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
