# context.md — 지금 상태

> 맨 위 한 줄만 보고 바로 시작할 수 있어야 한다. **3KB 초과 금지**(harness-doctor가 잰다).
> 항목이 길어지면 `backlog.md`로, 끝난 항목은 `walkthrough.md`로 옮긴다.

🔒 `pending-approvals.md` 확인 · 진행 중 상세는 `backlog.md`

---

## ▶ 다음 할 일

**1. [사용자] 남은 확정** — `00-14` §11-3(사망확인 SLA)·§11-11(06 수익지점) · `00-20` 보유기간 ·
위치정보법 신고. ⏸ 11-1 알림톡은 발신번호 **사전등록**(§11.4 b)이 별건이라 아직 안 열림.

**2. [Sonnet] `06-04` Phase 2** — `EndingNoteGrant`·가족 조회 API(§10, Phase 1 완료로 다음 순번).

**3. [Gemini] 게이트 대기 4건**(walkthrough 79~82, 70~78은 판정 완료). 🔴 나머지 실기동 미검증.

✅ **08-27 완료**(walkthrough 79~82) — 모바일 인트로 배너 · 엔딩노트 섹션 확장+⑨개명+보관함
저장 간소화 · ⑩ 추가+드롭다운 폭 축소 · **아코디언 전환+Phase 1 저장+06 전용 키 분리**.
✅ **08-27 [Opus]** — `00-06` **`SCR-016`(`/prep`)·`SCR-017`(`/bereaved`) 등재**(`00-23` §8.6-1 #1 해소,
미할당 `SCR-018`부터). `SCR-002-B`는 08-25에 이미 등재돼 있었습니다.
🟡 dev DB 테스트 편지 2건 복호화 불가(배치 정리 시 삭제).
✅ **08-26 완료**(walkthrough 74~78) — `06-05` Phase A·B · 초대 흐름 3건 · 발신번호 · 홈 박스③④ ·
STT Ⓐ 배선+보관함 이관+배포본 실사용자 검증. **가족 연결·STT 업로드 둘 다 실기기 확인 완료**(사장님).

## 지금 상태

```text
프로젝트: 이어봄(Eobom) — 디지털엔딩&웰다잉 토탈케어 플랫폼
협업체계: Opus(docs/) → Sonnet(eobom/) → Gemini(reports/·검증) · roles.md §1-1
도메인  : 01장사시설 / 02전문가 / 03현물수거 / 04·05(보류) / 06엔딩노트 / 07상중행정
마지막  : 2026-08-27 [Sonnet] walkthrough 70~82 / 2026-08-27 [Opus] 00-06 SCR-016·017 등재
```

- 소스 `eobom/frontend`(React18+Vite5+TS) · `eobom/backend`(Express+Prisma+JWT)
- 목차 `docs/00_DOCS_INDEX.md` / 저장위치 `AGENTS.md` §7

## 지금 막고 있는 것

- 🔴 **06 백엔드 — `EndingNote`+`Entry`+`FarewellMessage` 배선됨**(08-27). `Grant`·`Log`는
  0건 — Phase 2·3 몫(§10).
- 🔴 **이미지·음성 로컬디스크**: 재배포 시 소실 → 추모관사진 오픈금지 · 보관함 음성 Phase D(`systems.md` §5).
- 🔴 **백엔드 oregon ↔ DB 서울** — 속도·국외이전 논점. 승인 대기(인프라).
- 🔴 **`/m/:slug` 목업** — slug를 안 읽어 아무 slug나 같은 화면. 실사용자 유입 전 차단 필수.
- **`Deceased` 미확정**: 04·05 묶임. ✅ 07은 최소범위 선도입해 해제.
- 🟡 **harness-doctor 예산 2건 초과**(`roles.md` 9.9KB/8KB · `systems.md` 11.3KB/6KB) — 내용을 지우기 전에 *"이 파일에 있을 게 맞나"* 부터(`AGENTS.md` §9).
