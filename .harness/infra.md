# infra.md — 인프라 명부 (DB · 배포 · 이미지 저장)

> **언제 읽나**: DB 접속·백업, 배포(Render·Vercel·Supabase), 업로드 파일 저장을 건드리기 직전
> 2026-10-13 `systems.md`에서 §4·§5를 글자 그대로 옮김(상한 85% 재발 → 분리, `AGENTS.md` §9). 절 번호는 다른 문서·코드 주석이 `systems.md` §4·§5로 부르므로 그대로 두었다. 로그인·지도·공공데이터는 `systems.md`.

---

## 4. 데이터베이스

### 🔴 Supabase 설정 — Data API·RLS는 **끈다** (2026-08-20 결정)

Security 3항목(Data API·자동 테이블 노출·자동 RLS) **전부 OFF**. DB 접근은 Prisma 한 경로뿐이고, 켜면 공개 응답 화이트리스트가 통째로 우회된다. 이유·구조 비교 → `_meta/systems_경위.md`.

- 🔴 **언젠가 Data API를 켜야 한다면 RLS를 먼저 켜라.** 순서가 반대면 테이블이 그대로 열린다.
- ⚠️ 대시보드 로그의 `pg_pgrst_no_exposed_schemas does not exist`는 **정상**(08-27). Data API를 껐으니
  PostgREST 노출 스키마가 0개라 나는 로그다. 🔴 **이걸 없애려고 Data API를 켜지 말 것.**

### 🔴 리전 = Seoul (변경 불가)

`00-17` §3.3 — 국외이전 논점을 만들지 않으려고 서울. 🔴 **Supabase는 생성 후 리전 변경 불가.**


| 항목 | 값 |
|---|---|
| 로컬 컨테이너 | Docker `eobom-postgres` |
| 포트 | **5433** (기본 5432 아님) |
| ORM | Prisma |
| 접속 문자열 | `eobomDev/backend/.env`의 `DATABASE_URL` |

- 모델 37개(10-07) — 전체는 `schema.prisma` · 사전은 `00-05`(자동 생성). `FacilityBooking`은 08-11 삭제됨
- 🔴 **DB 쓰기 전 백업 — `db-safety.md`가 정본**(유실 2회).
- 🔵 **백업**: `powershell -File .harness/tools/backup-db.ps1 -Target local|prod`(08-27 신설 — pg_dump가 이 PC에 없어 Docker로 돈다.
  🔴 `-Target` 필수·기본값 없음, 09-30). `eobomDev/backend/backups/`에 `prod-`/`local-` 접두사로 저장(gitignore).
  `-Target prod`엔 `.env`의 **`BACKUP_DATABASE_URL`** 필요 — `DIRECT_URL`은 로컬 Docker DB이고 폴백하지 않는다.
  🔴 **Supabase 접속 3종**: ✅ **Session pooler `aws-0-ap-northeast-2.pooler.supabase.com:5432`** /
  Direct `db.[ref].supabase.co`는 **IPv6 전용**이라 Docker 해석 실패 / Transaction `:6543`은 pg_dump 불가.
  🔴 pooler 유저명은 **`postgres.[ref]`** — `postgres`면 *"password authentication failed"* 가 떠
  **원인이 비밀번호처럼 보인다**. 🔴 클라이언트 **`postgres:17-alpine`**(15·16은 version mismatch).
  ⚠️ 비밀번호의 `#@/?%:` 는 퍼센트 인코딩(`#`는 뒤가 잘림). ⚠️ 같은 시크릿을 `.env`에 두 벌 두지 말 것.
- 🔴 **새 표에 `createdAt`·`updatedAt`이 있으면 한국 시간 보기 칸 + 트리거를 같이 만든다**(10-01) — 절차 `skills/kst-보기칸-추가.md`. 빠뜨리면 시험이 표 이름을 대며 실패한다.
- 🔴 **로그 표 크기 확인(월 1회 점검 때 · 00-42 §6 · 점검 SQL 8종 정본 = `00-43` 담당자 안내서 · 규칙 = `00-22` 부록 1)**: `SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS size, n_live_tup FROM pg_stat_user_tables WHERE relname IN ('AccessLog','ErrorLog','AdminAuditLog');`(10-08 고침 — 옛 쿼리는 `relname` 모호 오류) — Supabase 무료는 DB 500MB, 넘으면 **읽기 전용**이 돼 가입·저장이 멈춘다. **세 표 합계 300MB 넘으면** 유료 전환·보관 단축·외부 이전 중 고른다(10-01 운영 DB 0.03GB).

## 5. 배포

| 대상 | 상태 | 비고 |
|---|---|---|
| 프론트엔드 | ✅ 배포됨 | `https://eobom.vercel.app/` |
| 백엔드 | ✅ **배포됨** (2026-08-20) | `https://eobom-backend.onrender.com` — `/api/health` 200 실측 |
| 저장소 | 🔴 **PUBLIC**(10-07 확인) | `github.com/Hyunews/Eobom` — `security.md` §5 |

- 🔴 **CORS는 허용 목록**(10-01, `00-42` §10) — 기본 `https://eobom.vercel.app` + 로컬 5173(`config/cors.ts`). **Vercel 미리보기 주소·새 도메인에서 API를 부르면 막힌다** → Render 환경변수 `CORS_ORIGINS`에 쉼표로 추가(값을 쓰면 기본 목록을 *대체*하니 운영 주소도 같이 적을 것). 비밀값 아님·`render.yaml`엔 안 넣음(기존 서비스는 대시보드 값이 기준).
- 🔴 **요청 횟수 제한**(같은 IP·메모리·단일 인스턴스): 공개 쓰기 10 · 로그인/갱신 20 · 전체 300 / 분, `/api/health` 제외. 넘으면 429 *"잠시 후 다시 시도해 주세요."* — 경로 목록은 `middleware/rateLimit.ts`(새 공개 POST를 만들면 거기 올릴 것). 로컬 시험 중 429가 나면 1분 기다리거나 서버 재시작.

### 백엔드 배포 — Render 웹서비스 + Supabase DB (2026-08-20 실행)

⚠️ 인프라 전략 정본은 **`docs/00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md`**.
**DB는 Render Postgres가 아니라 Supabase**(§4) — `render.yaml`의 `databases:` 블록은 제거했다.

- 설정: 레포 루트 `render.yaml`(Blueprint), `eobomDev/backend`가 `rootDir`
- 🔴 **`NODE_ENV=production` + 빌드는 `npm ci --include=dev && npm run build`**(10-01). `NODE_ENV=production`이면
  npm이 devDependencies(`typescript`·`prisma`·`@types/*`)를 빼고 설치해 빌드가 깨진다(`TS5108` — 다른 버전 `tsc`가 잡힘).
  `NODE_ENV`는 빼면 안 된다 — 운영 데모 로그인 차단(`authController.ts` demoLogin)이 이 값으로 동작한다(10-01 운영 403 확인).
- 🔴 **리전 = `oregon`(미국), DB는 서울** — DB 타는 API ~1.5초 + **국외이전 문제**(오픈 블로커 → `pending-approvals.md` 인프라). `render.yaml` `region:`은 생성 후 변경 불가(없으면 조용히 oregon). 실측·판단 → `_meta/systems_경위.md`.
- 🔴 **push해도 운영 DB는 안 바뀐다**(09-30부터) — `start`에서 `prisma migrate deploy`를 뺐다.
  운영 스키마 변경 절차는 **`db-safety.md` §2-1**.
- ⚠️ 무료 웹서비스는 **15분 슬립** — 첫 요청이 수십 초 걸린다(부고 링크 첫 방문자가 그대로 겪는다)
  🆕 10-01 대응: 외부 감시 서비스가 `GET /api/health`(`app.ts:72`)를 **5~10분 간격**으로 호출(사람 설정). 무료 750시간/월 안(무료 서비스 1개일 때만).
  익명 GET 성공이라 접속기록에 안 쌓인다(`00-42` §5.1). 🔴 `/api/health`는 **DB를 안 건드림** → Supabase 무료 **7일 무사용 일시정지**는 못 막는다.
- 🔵 **정정(08-27)**: 암호화 키는 **로컬과 운영이 다른 값**이다(옛 지시 *"같은 값"* 은 폐기).
  같으면 로컬 `.env` 유출 = 운영 데이터 유출. **운영 덤프를 로컬에서 못 여는 것이 정상**이고
  그게 `security.md` §1을 강제한다. 🔴 `render.yaml` 주석도 같이 볼 것.
  ✅ **운영 `ENDING_NOTE_ENCRYPTION_KEY`는 Render 환경변수에 있다**(09-30 사람 확인). 🔴 **Render에만 있으면
  사본 0개** — 서비스·계정을 잃으면 운영 엔딩노트·편지·음성을 **아무도 영원히** 못 연다. 오프라인 사본(비밀번호 관리자 등) 권고.
- **배포 후 잔여**: (1)3사 콘솔 콜백 재등록 (2)Vercel `VITE_BACKEND_URL` + 재배포 (3)시설 시딩
  (4)이미지 스토리지 교체(아래)

### 이미지 저장 — ⚠️ 배포 전 필수 교체 (2026-08-10)

업로드 사진이 백엔드 로컬 디스크(`eobomDev/backend/uploads/`)에 저장된다. Render는 재배포 시 디스크
초기화 → **이미지 전부 소실.** 실배포 전 S3 등으로 교체 필수(신규 외부 연동, 승인 필요).
**추모 사진도 여기 묶인다** — 스토리지 교체 전 추모관 오픈 금지(`05-01` §2.6).

---

> **갱신 규칙**: 인프라 상태가 바뀌면 `context.md` 블로커 섹션이 아니라 **이 파일을 먼저** 고친다. `context.md`에는 "지금 당장 막고 있는 것"만 한두 줄 남긴다.
