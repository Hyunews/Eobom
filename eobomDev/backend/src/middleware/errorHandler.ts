import type { ErrorRequestHandler } from 'express';
import { requestPath, writeErrorLog } from '../services/opsLogService';
import { getRequestId } from './requestLog';

// docs 00-42 §5.1 ③ — 전역 에러 처리기. 컨트롤러가 못 잡고 흘린 예외가 여기로 온다.
// 이전에는 처리기가 없어 Express 기본 응답(HTML·스택 노출 가능)이 나갔다 — 이제 JSON으로 통일하고 요청 번호를 돌려준다.
// 🔴 응답 본문에 에러 메시지·스택을 싣지 않는다(사실만 — 00-39 문구 규칙, 내부 정보 노출 방지).

const clientStatus = (err: { status?: unknown; statusCode?: unknown; name?: string }): number => {
  if (err.name === 'MulterError') return 400; // 업로드 크기·형식 위반 — 이전엔 500으로 나갔다
  const s = typeof err.status === 'number' ? err.status : typeof err.statusCode === 'number' ? err.statusCode : 500;
  return s >= 400 && s <= 599 ? s : 500;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err); // 이미 보내기 시작한 응답은 Express 기본 처리에 맡긴다(연결 종료)

  const status = clientStatus(err ?? {});
  const requestId = getRequestId(res);

  if (status >= 500) {
    res.locals.errorLogged = true; // accessLog가 같은 요청을 Http5xx로 한 번 더 남기지 않게
    console.error(`[${requestId}] 처리되지 않은 서버 에러:`, err);
    void writeErrorLog({
      requestId,
      path: requestPath(req),
      status,
      errorName: err instanceof Error ? err.name : 'NonError',
      error: err,
    });
  }

  res.status(status).json({
    status: 'error',
    message: status >= 500 ? '서버 오류가 발생했습니다.' : '요청을 처리할 수 없습니다.',
    requestId,
  });
};
