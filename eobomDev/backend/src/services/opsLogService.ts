import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { JWT_SECRET } from '../config/jwt';
import { maskText, safeErrorMessage, stackHead, stripQuery } from '../utils/logMask';

// docs 00-42 §5 — 운영 기록 3종(접속기록·운영자 감사·에러 기록)을 쓰는 곳.
// 🔴 허용 목록 방식: 아래 함수의 인자 타입에 없는 값은 기록할 방법이 없다(요청·응답 본문, 헤더, 쿼리 문자열 포함).
// 🔴 추가만 한다 — 이 파일에는 update·delete가 없다(§5.2 ⑥). 지우는 건 opsLogPurgeService의 보관기간 파기뿐이다.
// 🔴 접속기록·에러 기록은 실패해도 서비스를 멈추지 않는다(§5.2 ⑤) — writeAccessLog·writeErrorLog는 절대 throw하지 않는다.
//    운영자 감사(writeAdminAudit)만 throw한다 — 호출한 쪽이 "기록 없는 열람 금지"를 정한다(middleware/adminAudit.ts).

export type SubjectType = 'anonymous' | 'user' | 'partner' | 'expert' | 'admin';
export type Subject = { type: SubjectType; id: string | null };

// 접속기록에 남기는 주체 — Authorization 헤더의 토큰을 **검증해서** 읽는다(위조 토큰으로 남의 id를 찍지 못하게).
// 토큰이 없거나 틀리면 익명. aud가 없는 옛 토큰은 B2C 회원(authController.isB2cAud와 같은 규칙).
export function subjectFromRequest(req: Request): Subject {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return { type: 'anonymous', id: null };
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as jwt.JwtPayload & { id?: string; aud?: string };
    const type: SubjectType =
      decoded.aud === 'admin' ? 'admin' : decoded.aud === 'partner' ? 'partner' : decoded.aud === 'expert' ? 'expert' : 'user';
    return { type, id: typeof decoded.id === 'string' ? decoded.id : null };
  } catch {
    return { type: 'anonymous', id: null };
  }
}

// 요청의 실제 접속 주소 — app.set('trust proxy', 1) 덕에 req.ip가 프록시 뒤 실제 주소다.
export const clientIp = (req: Request): string | null => req.ip ?? null;

// 요청 경로 — 쿼리 제거(§5.2 ②). originalUrl은 라우터 안에서도 전체 경로를 유지한다.
export const requestPath = (req: Request): string => stripQuery(req.originalUrl);

export async function writeAccessLog(entry: {
  requestId: string;
  subject: Subject;
  ip: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
}): Promise<void> {
  try {
    await prisma.accessLog.create({
      data: {
        requestId: entry.requestId,
        subjectType: entry.subject.type,
        subjectId: entry.subject.id,
        ip: entry.ip,
        method: entry.method,
        path: entry.path,
        status: entry.status,
        durationMs: entry.durationMs,
      },
    });
  } catch (e) {
    console.error('접속기록 쓰기 실패(요청은 그대로 처리됨):', (e as Error).message);
  }
}

export async function writeErrorLog(entry: {
  requestId: string | null;
  path: string | null;
  status: number | null;
  errorName: string;
  error: unknown; // 메시지·스택은 여기서 정리해 담는다 — 호출한 쪽이 따로 가공하지 않는다
}): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        requestId: entry.requestId,
        path: entry.path,
        status: entry.status,
        errorName: entry.errorName,
        message: safeErrorMessage(entry.error),
        stackHead: stackHead(entry.error),
      },
    });
  } catch (e) {
    console.error('에러 기록 쓰기 실패(요청은 그대로 처리됨):', (e as Error).message);
  }
}

export type AdminAuditEntry = {
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  result: 'SUCCESS' | 'FAIL';
  ip: string | null;
  requestId: string | null;
  reason?: string | null;
};

// 운영자 감사 한 줄. 🔴 throw한다 — 개인정보 열람 경로는 이게 실패하면 응답하지 않아야 한다(§5.2 ⑤ 예외).
export async function writeAdminAudit(entry: AdminAuditEntry): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminId: entry.adminId,
      adminName: entry.adminName,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      result: entry.result,
      ip: entry.ip,
      requestId: entry.requestId,
      reason: entry.reason ? maskText(entry.reason).slice(0, 200) : null,
    },
  });
}

export type AuditTarget = { targetType?: string; targetId?: string; action?: string };

// 핸들러가 호출 — 대상 회원 id처럼 라우터가 알 수 없는 값을 채운다. 안 부르면 경로의 :id가 쓰인다(middleware/adminAudit.ts가 읽는다).
export const setAuditTarget = (res: Response, target: AuditTarget): void => {
  res.locals.auditTarget = { ...(res.locals.auditTarget as AuditTarget | undefined), ...target };
};

// 로그인 성공·실패·잠금은 접속 자체의 사건이라 실패해도 로그인을 막지 않는다(fail-open).
export async function writeAdminLoginAudit(
  req: Request,
  entry: { adminId: string; adminName: string; action: 'LOGIN' | 'LOGIN_FAIL' | 'LOCKED'; result: 'SUCCESS' | 'FAIL'; reason?: string },
): Promise<void> {
  try {
    await writeAdminAudit({
      ...entry,
      // 🔴 로그인 시도에 쓴 이메일은 남기지 않는다(§4.9) — 계정을 찾았을 때만 id로 남기고, 못 찾으면 빈 값.
      targetType: 'Admin',
      targetId: entry.adminId,
      ip: clientIp(req),
      requestId: typeof req.res?.locals.requestId === 'string' ? req.res.locals.requestId : null,
    });
  } catch (e) {
    console.error('운영자 로그인 감사 기록 실패(로그인은 그대로 처리됨):', (e as Error).message);
  }
}
