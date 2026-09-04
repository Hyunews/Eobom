# context.md — 지금 상태

> 맨 위 한 줄만 보고 바로 시작할 수 있어야 한다. **3KB 초과 금지**(harness-doctor가 잰다).
> 항목이 길어지면 `backlog.md`로, 끝난 항목은 `walkthrough.md`로 옮긴다.

🔒 `pending-approvals.md` 확인 · 상세 `backlog.md`

---

## ▶ 다음 할 일

**0. [사용자] 🔴 R2 dev/운영 분리**(`00-11` §5.4-6-3) — dev 버킷·토큰 3개씩 발급 → 로컬
`.env`=dev·Render=운영. ✅ 가족추가 500 해소(운영 `HASH_INDEX_KEY` 1건 → 🔴 **값 고정**).

**1. [사용자] 남은 확정** — 🔴 **위치정보법 신고**(`00-22` B-1) = `00-19` **유일한 게시
블로커**. · `00-14` §11-3·§11-11 · 법률자문(`00-22` A-5). 🟡 카톡 점심·공휴일(비차단).
⏸ 알림톡 발신번호 사전등록(11-1)은 별건. 🆕 `00-27` §6 `PRIMARY` 복수(비차단). 기술부채
`_meta/…260831.md` — C-1→`00-34`·C-3→`00-35`.

**2. [Sonnet] ✅ wt115~120 완료** — 🔴 **wt112·114·115~120 실기동 대기**(wt115는 §7+체크8 8섹션).
🔵 **실기동 검증은 사람이 한다**(09-03) — dev서버 안 띄움. ⏸ 체크8 재검증 · F(체크상태)는
`00-19` 제4조 = Opus 먼저 · 04 B는 `PreDeathPlatformSetting` 뒤.
✅ `06-05` D-1~D-3(wt120)·아카이브 Worker 배포 완료. 🐛 webm→CLOVA 변환 누락 수정 → 🔵 재검증.
🟡 후속 = 워커 필터에 `CopyObject`·`CompleteMultipartUpload`(§5.4-5-2-1-1).
▶ **다음 = `06-05` D-4+D-6+D-6-1 한 세션**(🆕 §5.6, 09-04) — 음성 **듣기·삭제**.
🔴 `mediaDeletedAt` 스키마변경 = db-safety 선행 · presigned URL 금지 · `mediaKey` null 금지 ·
런타임 `DeleteObject` 금지 · 업로드시점→**확인모달 "저장"**(D-3 변경). D-5는 뒤.

**3. [Gemini]** 게이트 대기 0건(wt102~119 판정 완료) · ✅ reports 재생성 완료.
🟡 옛 스펙갱신 3건 → `backlog.md` ⑭.

🟡 dev DB 삭제분·검증분 7건 — 배치정리 필요(🔴 DB 쓰기 = CONFIRM).

## 지금 상태

```text
프로젝트: 이어봄(Eobom) — 디지털엔딩&웰다잉 토탈케어 플랫폼
마지막  : 2026-09-04 — 아카이브 Worker 배포 완료 / wt112·114·115·120 실기동 검증 대기
```

- 소스 `eobom/frontend`(React18+Vite5+TS) · `eobom/backend`(Express+Prisma+JWT)
- 목차 `docs/00_DOCS_INDEX.md` / 저장위치 `AGENTS.md` §7
- 🔴 **20KB↑ 통독 차단**(훅, 09-02 하향) — `grep -n`→`sed -n` 또는 `limit≤400`.
  🔴 로그 3종(walkthrough·claude_tasks·gemini_tasks)은 **크기 무관**. `AGENTS.md` §10.

## 지금 막고 있는 것

- 🔴 **06 백엔드 — `Entry`+`Grant` 배선됨**(08-27). `Log`만 0건(Phase 3). 가족용 열람
  화면(프론트) 없음 — API만.
- 🟡 **이미지 로컬디스크**: 재배포 시 소실 → 추모관사진 오픈금지(`systems.md` §5).
  ✅ 음성은 R2+아카이브 완료 — **이미지는 여전히 미배선**(같은 R2로 옮기면 풀림).
- **`Deceased` 미확정**: 04·05 묶임(→ `backlog.md` ③).
