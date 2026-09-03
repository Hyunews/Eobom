# eobom-r2-archive-relay

docs `00-11` §5.4-5-2 ②·§5.4-5-3, `06-05` §8 D-2 #15 — 유족 메시지 음성 버킷
(`eobom-farewell-voice`) 쓰기를 아카이브 버킷(`eobom-farewell-voice-archive`)에 복제하는
Cloudflare Worker. 두 버킷 모두 R2 바인딩으로 접근하며 S3 액세스 키를 쓰지 않는다 — Node
백엔드(`eobom/backend`)는 이 워커의 바인딩에 접근할 방법이 없다.

## 🔴 이 폴더는 코드만 준비돼 있고 배포되지 않았다

배포에는 Cloudflare 계정 인증(`wrangler login`)과 대시보드 조작이 필요해 에이전트가 대신할 수
없다. 아래 순서로 사람이 직접 배포해야 D-2 #15("아카이브 버킷 복제 = Phase D 필수")가
완성된다.

1. `npm install` (이 폴더에서)
2. 아카이브 버킷 생성: `npx wrangler r2 bucket create eobom-farewell-voice-archive --location apac`
3. 큐 생성: `npx wrangler queues create eobom-r2-archive-queue --message-retention-period-secs 86400`
4. 워커 배포: `npm run deploy`
5. 원본 버킷(`eobom-farewell-voice`)에 Event Notification 규칙 연결 — 대시보드
   (R2 → 버킷 선택 → Settings → Event Notifications → PutObject → 위 큐 지정) 또는
   `npx wrangler r2 bucket notification create eobom-farewell-voice --event-type object-create --queue eobom-r2-archive-queue`
6. 확인: 음성 하나를 실제로 올려 아카이브 버킷에도 같은 키로 나타나는지 대시보드에서 확인

## 하지 않는 것

- 삭제 이벤트 처리 — 정상 경로에서는 애초에 발생하지 않는다(소프트 삭제,
  `00-11` §5.4-5-3). 실삭제는 사람 승인 배치가 원본·아카이브를 함께 지운다
  (`06-05` §5.4-2-1).
- 복호화 — 이미 앱단에서 암호화된 바이트를 그대로 복사할 뿐이다.
