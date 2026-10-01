import type { Request, RequestHandler, Response } from 'express';
import { verifyAdminBearerToken } from '../controllers/adminController';
import { clientIp, writeAdminAudit, type AuditTarget } from '../services/opsLogService';
import { getRequestId } from './requestLog';

// docs 00-42 §5.1 ② · §7 — 운영자 감사 자동화. adminRoutes.ts에서 requireAdminAuth 바로 다음에 한 번만 건다.
// 이 아래 모든 운영자 요청이 핸들러를 건드리지 않고 AdminAuditLog에 한 줄 남는다(새 엔드포인트가 기록에서 빠질 수 없다).
// 핸들러만 아는 값(대상 회원 id)은 handler가 setAuditTarget(res, …)으로 채운다(opsLogService — 컨트롤러와 순환 import를 피하려고 거기 둔다).
//
// 🔴 개인정보 열람(성공한 GET)은 fail-closed — 기록을 못 쓰면 응답하지 않는다(503). 기록 없는 열람을 만들지 않는다(§5.2 ⑤).
//    구현: 핸들러가 res.send(= res.json 포함)를 부르는 순간 응답을 붙잡고, 기록이 DB에 들어간 뒤에 내보낸다.
//    실패한 응답(4xx·5xx)은 내보낼 개인정보가 없으므로 붙잡지 않고, 쓰기(POST·PATCH·PUT·DELETE)는 응답 뒤에 남긴다(fail-open).
// 🔴 /me는 본인 이름·이메일뿐이라 fail-open이다(페이지 로드마다 부르는 세션 확인이 감사 저장소 장애로 막히면 운영자가 로그인 못 한다).
// 🔴 남기는 칸: 운영자 id·이름 · 행동 · 대상 종류·id · 결과 · IP · 요청 번호. 요청·응답 본문은 담지 않는다.

// 경로 첫 마디 → 대상 종류. 목록에 없으면 첫 마디를 그대로 쓴다(새 경로도 기록에서 빠지지 않는다).
const TARGET_TYPES: Record<string, string> = {
  users: 'User',
  partners: 'Partner',
  experts: 'Expert',
  'consult-requests': 'ConsultRequest',
  claims: 'FacilityClaim',
  'death-verifications': 'DeathVerification',
  memorials: 'Memorial',
  'farewell-purge': 'FarewellPurge',
  me: 'Admin',
};

const WRITE_ACTIONS: Record<string, string> = { POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE' };

const isRead = (method: string) => method === 'GET' || method === 'HEAD';

function describe(req: Request, res: Response) {
  const routePath = typeof req.route?.path === 'string' ? req.route.path : '';
  const first = routePath.split('/').filter(Boolean)[0] ?? req.path.split('/').filter(Boolean)[0] ?? '';
  const override = res.locals.auditTarget as AuditTarget | undefined;
  const hasId = !!(req.params.id || override?.targetId);
  return {
    action: override?.action ?? (isRead(req.method) ? (hasId ? 'VIEW' : 'LIST') : (WRITE_ACTIONS[req.method] ?? req.method)),
    targetType: override?.targetType ?? TARGET_TYPES[first] ?? (first || 'Admin'),
    targetId: override?.targetId ?? req.params.id ?? '',
  };
}

export const adminAudit: RequestHandler = (req, res, next) => {
  const decoded = verifyAdminBearerToken(req);
  if (!decoded) return next(); // requireAdminAuth가 이미 걸렀다 — 여기서 다시 막지 않는다(순서가 바뀌어도 기록만 건너뛴다)

  const failClosed = isRead(req.method) && req.path !== '/me';
  let written = false;

  const write = (status: number) => {
    written = true;
    return writeAdminAudit({
      adminId: decoded.id,
      adminName: decoded.name,
      ...describe(req, res),
      result: status >= 400 ? 'FAIL' : 'SUCCESS',
      ip: clientIp(req),
      requestId: getRequestId(res),
    });
  };

  if (failClosed) {
    const originalSend = res.send.bind(res);
    let intercepted = false;
    res.send = ((body?: unknown) => {
      if (intercepted) return originalSend(body as never); // res.json이 안에서 send를 다시 부른다 — 한 번만 붙잡는다
      intercepted = true;

      if (res.statusCode >= 400) {
        // 내보낼 개인정보가 없다 — 기록은 남기되 실패해도 응답은 그대로(아래 finish 보강이 이어받는다)
        write(res.statusCode).catch((e) => console.error('운영자 감사 기록 실패(오류 응답은 그대로):', (e as Error).message));
        return originalSend(body as never);
      }

      write(res.statusCode)
        .then(() => {
          originalSend(body as never);
        })
        .catch((e) => {
          console.error('운영자 감사 기록 실패 — 개인정보 열람 응답을 거부함:', (e as Error).message);
          res.status(503).type('json');
          originalSend(JSON.stringify({ status: 'error', message: '운영 기록을 남기지 못해 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.', requestId: getRequestId(res) }));
        });
      return res;
    }) as typeof res.send;
  }

  // 쓰기·/me, 그리고 핸들러 없이 끝난 요청(404 등 — finalhandler는 res.send를 안 거친다)
  res.on('finish', () => {
    if (written) return;
    write(res.statusCode).catch((e) => console.error('운영자 감사 기록 실패(요청은 그대로 처리됨):', (e as Error).message));
  });

  next();
};
