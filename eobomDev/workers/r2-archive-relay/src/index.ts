// docs 00-11 §5.4-5-2 ② · §5.4-5-3 · 06-05 §8 D-2 #15 — R2 Event Notification이 원본 버킷
// (eobom-farewell-voice) 쓰기를 이 큐로 보내면, 그 오브젝트를 그대로 아카이브 버킷에 복제한다.
// 이미 앱단에서 암호화된 상태로 올라온 객체를 바이트 그대로 복사할 뿐이라 이 워커는 복호화
// 키를 알 필요가 없다. 삭제는 여기서 다루지 않는다 — 파기는 사람 승인 배치의 몫이다
// (§5.4-5-3, 06-05 §5.4-2-1).

export interface Env {
  SOURCE_BUCKET: R2Bucket;
  ARCHIVE_BUCKET: R2Bucket;
}

interface R2EventNotification {
  account: string;
  bucket: string;
  eventTime: string;
  action: string;
  object: { key: string; size: number; eTag: string };
}

export default {
  async queue(batch: MessageBatch<R2EventNotification>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body;
      // PutObject(신규 업로드)만 복제한다 — 소프트 삭제 정책상 런타임 경로는 DeleteObject를
      // 부르지 않으므로(00-11 §5.4-5-3) 이 워커가 삭제 이벤트를 받을 일은 정상 동작 중에는 없다.
      if (event.action !== 'PutObject') {
        message.ack();
        continue;
      }
      try {
        const object = await env.SOURCE_BUCKET.get(event.object.key);
        if (!object) {
          message.ack(); // 원본이 이미 없다 — 재시도해도 결과가 달라지지 않는다
          continue;
        }
        await env.ARCHIVE_BUCKET.put(event.object.key, object.body, {
          httpMetadata: object.httpMetadata,
        });
        message.ack();
      } catch (err) {
        console.error('아카이브 복제 실패:', event.object.key, err);
        message.retry();
      }
    }
  },
};
