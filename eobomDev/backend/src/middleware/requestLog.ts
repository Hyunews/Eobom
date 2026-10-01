import { randomBytes } from 'crypto';
import type { RequestHandler } from 'express';
import { clientIp, requestPath, subjectFromRequest, writeAccessLog, writeErrorLog } from '../services/opsLogService';

// docs 00-42 §5 — 요청 번호 + 접속기록(① 묶음) + 핸들러가 직접 돌려준 5xx의 에러 기록(③ 묶음 일부).
// app.ts에서 가장 먼저 건다(cors·body-parser 에러도 번호를 갖도록).

// 요청 번호 — 모든 요청에 붙이고 응답 헤더 X-Request-Id로 돌려준다. 클라이언트가 보낸 값은 믿지 않는다(위조로 기록을 헷갈리게 못 하게).
export const requestId: RequestHandler = (req, res, next) => {
  const id = randomBytes(8).toString('hex');
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export const getRequestId = (res: { locals: Record<string, unknown> }): string | null =>
  typeof res.locals.requestId === 'string' ? res.locals.requestId : null;

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// 축소안(00-42 §9 #1): 로그인한 요청 전부 + 쓰기 + 실패(4xx·5xx). 빠지는 건 비로그인 공개 조회의 성공 응답뿐.
// 🔴 기록은 응답이 끝난 뒤 한다 — 기록이 느리거나 실패해도 요청에는 영향이 없다(writeAccessLog는 throw하지 않는다).
export const accessLog: RequestHandler = (req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    try {
      const id = getRequestId(res);
      if (!id) return;
      const status = res.statusCode;
      const subject = subjectFromRequest(req);
      const path = requestPath(req);

      if (subject.type !== 'anonymous' || !READ_METHODS.has(req.method) || status >= 400) {
        void writeAccessLog({
          requestId: id,
          subject,
          ip: clientIp(req),
          method: req.method,
          path,
          status,
          durationMs: Number((process.hrtime.bigint() - started) / BigInt(1_000_000)),
        });
      }

      // 대부분의 핸들러는 에러를 직접 잡아 500을 돌려준다 — 전역 에러 처리기까지 오지 않는다.
      // 그 5xx도 번호로 찾을 수 있게 한 줄 남긴다(원인은 서버 로그에서 이 번호로 검색).
      if (status >= 500 && !res.locals.errorLogged) {
        void writeErrorLog({
          requestId: id,
          path,
          status,
          errorName: 'Http5xx',
          error: '핸들러가 직접 돌려준 5xx 응답 — 원인은 서버 로그에서 요청 번호로 찾는다',
        });
      }
    } catch (e) {
      console.error('접속기록 처리 실패(요청은 그대로 처리됨):', (e as Error).message);
    }
  });
  next();
};
