# context.md — 지금 상태

> 맨 위 한 줄만 보고 바로 시작할 수 있어야 한다. **3KB 초과 금지**(harness-doctor가 잰다).
> 항목이 길어지면 `backlog.md`로, 끝난 항목은 `walkthrough.md`로 옮긴다.

🔒 `pending-approvals.md` 확인 · 진행 중 상세는 `backlog.md`

---

## ▶ 다음 할 일

**1. STT Ⓐ 파일 업로드 — provider = 🔵 NCP CLOVA Speech**(08-26 사장님 지정, 스펙 §6.4-9·11)
✅ 약관 실독(`assets/CLOVASpeech…pdf`): 4조② 학습활용 **opt-in이라 동의 안 하면 안 쓰임** ·
국내라 국외이전 없음 · 로컬파일 직접업로드 OK. 🔴 **7조① 인식결과 "텍스트"가 7일 보관**(음성 아님).
🔴 **[사장님] 착수 전**: ⓐ4조② 학습동의 끄기 ⓑ위수탁계약. 그 전엔 플래그 안 엶.
🔴 **[Sonnet]**: `memoryStorage`(기존 `upload.ts` 재사용 금지)·m4a 지원 확인(없으면 ffmpeg 스트림
변환)·정확도 약속 문구 금지(9조②가 보증 안 함).

**2. [Claude:Opus] `00-06` 화면ID 신설** — SCR-016·017(`/prep`·`/bereaved`) + `SCR-002-B`(보관함).

**3. [사용자] 남은 확정** — `00-14` §11-3(사망확인 SLA)·§11-11(06 수익지점) · `00-20` 보유기간 ·
위치정보법 신고. ⏸ 11-1 알림톡은 발신번호 **사전등록**(§11.4 b)이 별건이라 아직 안 열림.

**4. [Gemini] 게이트 대기 10건**(walkthrough 70~75). 🔴 실기동 전부 미검증.

✅ **08-26 완료**(walkthrough 74·75) — `06-05` Phase A · 초대 흐름 3건 · 발신번호 · 홈 박스③④.
**가족 연결 실기기 확인 완료**(사장님).

## 지금 상태

```text
프로젝트: 이어봄(Eobom) — 디지털엔딩&웰다잉 토탈케어 플랫폼
협업체계: Opus(docs/) → Sonnet(eobom/) → Gemini(reports/·검증) · roles.md §1-1
도메인  : 01장사시설 / 02전문가 / 03현물수거 / 04·05(보류) / 06엔딩노트 / 07상중행정
마지막  : 2026-08-25 [Opus] 06-05 도메인분리 + 하네스 결함7건 수정 / 2026-08-26 [Sonnet] walkthrough 70~75
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
