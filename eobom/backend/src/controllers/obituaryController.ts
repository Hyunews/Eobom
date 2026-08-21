import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { verifyBearerToken, FRONTEND_URL } from './authController';
import { validateFalseReportAgreed, validateResharedNoticeAck } from '../utils/consentGates';
import { encryptField, decryptField } from '../utils/crypto';

// 모바일 부고장(Domain 07) Phase 1 — docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md
// E안(00-13 §4.5): 부고장(Obituary)=봉투, 추모관(Memorial)=목적지, 배포되는 링크는 부고장 1개뿐이다.

// 부고장 slug — memorialController.ts의 generateSlug와 같은 방식(randomBytes(16))을 쓰되,
// 값을 파생시키지 않고 독립적으로 뽑는다(§4.4 — 두 slug가 서로 유추 가능하면 안 됨).
const generateObituarySlug = () => crypto.randomBytes(16).toString('hex');
const generateMemorialSlug = () => crypto.randomBytes(16).toString('hex');

// PATCH에서 "카드 반영 필드가 바뀌었는지" 판정할 때 쓰는 표 — §5.4-2가 못박은 4개뿐이다.
// ⚠️ 구현자가 임의로 넓히지 않는다(연락처·계좌 등을 넣으면 유족이 불필요하게 재공유하게 된다).
type TriggerSnapshot = {
  deceasedName: string;
  funeralHall: string | null;
  mourningRoom: string | null;
  funeralAt: Date;
};
const triggerFieldsChanged = (before: TriggerSnapshot, after: TriggerSnapshot): boolean =>
  before.deceasedName !== after.deceasedName ||
  before.funeralHall !== after.funeralHall ||
  before.mourningRoom !== after.mourningRoom ||
  before.funeralAt.getTime() !== after.funeralAt.getTime();

// §9 #9 Phase 3 — 발인일(KST 달력 기준) + 3일 자정에 자동 종료(2026-08-20 개발자 확정, §6.2-4).
// 스케줄러를 새로 들이지 않고 조회 시점에 계산한다(closedAt처럼 DB에 쌓아두지 않음).
const AUTO_CLOSE_DAYS = 3;
const isAutoExpired = (funeralAt: Date): boolean => {
  // funeralAt(UTC 저장값)을 KST 벽시계로 옮겨 "발인일" 달력 날짜를 구한 뒤, 그 날짜의
  // KST 자정에서 +3일 되는 순간(역시 KST 자정)을 다시 UTC로 환산해 지금과 비교한다.
  const kst = new Date(funeralAt.getTime() + 9 * 60 * 60 * 1000);
  const kstMidnightAsUtcMs = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
  const cutoffUtcMs = kstMidnightAsUtcMs + AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000 - 9 * 60 * 60 * 1000;
  return Date.now() >= cutoffUtcMs;
};

// 수동 종료(closedAt) 또는 자동 종료(§6.2-4) 둘 중 하나라도 해당하면 닫힌 것으로 본다.
// 공개(익명) 조회는 닫혔으면 404로 존재를 숨기고(§5.3), 개설자 본인은 getObituaryBySlug에서
// 예외적으로 계속 볼 수 있다 — memorialController.findViewableMemorialBySlug와 같은 사상이되
// 여긴 "본인은 예외"가 하나 더 있어 별도 헬퍼(isObituaryClosed)로만 두고 함수는 합치지 않는다.
const isObituaryClosed = (o: { closedAt: Date | null; funeralAt: Date }): boolean => !!o.closedAt || isAutoExpired(o.funeralAt);

interface MournerInput {
  name?: string;
  relationship?: string;
}

// 개설 (`POST /api/obituaries`) — §5.2. Deceased+Memorial+Obituary를 한 트랜잭션으로 생성한다.
// ⚠️ 동의 검증은 utils/consentGates.ts 공용 함수로만 한다 — 여기서 직접 다시 짜면
// POST /api/memorials의 게이트를 우회하는 뒷문이 생긴다(§5.2 구현 주의).
export const createObituary = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as {
    deceasedName?: string;
    deathDate?: string;
    chiefMournerName?: string;
    chiefMournerRelationship?: string;
    mourners?: MournerInput[]; // 유족 추가(선택, §6.2)
    funeralHall?: string;
    funeralHallAddr?: string;
    mourningRoom?: string;
    coffinAt?: string;
    funeralAt?: string;
    burialSite?: string;
    contactPhone?: string;
    facilityId?: string;
    // 마음 전하실 곳(§6.2-2) — Phase 3 → Phase 1 #6으로 이동(07-03 갱신). 기본 OFF + 유족 명시적 토글.
    accountEnabled?: boolean;
    accountBankCode?: string; // 자유 입력 은행명(코드 마스터가 없어 Partner.settlementBank와 동일 방식)
    accountNumber?: string; // 평문으로 받아 encryptField로 암호화해서만 저장한다 — 평문 저장 금지
    accountHolder?: string;
    falseReportAgreed?: boolean;
    resharedNoticeAck?: boolean;
  };

  // 1~2. 동의 게이트(§5.2)
  const falseReportError = validateFalseReportAgreed(body.falseReportAgreed);
  if (falseReportError) {
    return res.status(400).json({ status: 'error', message: falseReportError });
  }
  const resharedError = validateResharedNoticeAck(body.resharedNoticeAck);
  if (resharedError) {
    return res.status(400).json({ status: 'error', message: resharedError });
  }

  // 3. 필수 4개(§6.2) — 고인 성함·상주 성함·빈소 위치·발인 일시
  if (!body.deceasedName?.trim()) {
    return res.status(400).json({ status: 'error', message: '고인 성함은 필수입니다.' });
  }
  if (!body.chiefMournerName?.trim()) {
    return res.status(400).json({ status: 'error', message: '상주 성함은 필수입니다.' });
  }
  if (!body.funeralHall?.trim()) {
    return res.status(400).json({ status: 'error', message: '빈소 위치는 필수입니다.' });
  }
  const funeralAtDate = body.funeralAt ? new Date(body.funeralAt) : null;
  if (!funeralAtDate || Number.isNaN(funeralAtDate.getTime())) {
    return res.status(400).json({ status: 'error', message: '발인 일시는 필수입니다.' });
  }
  // 마음 전하실 곳을 켰다면 은행·계좌번호·예금주가 없는 반쪽 상태로 저장되면 안 된다.
  if (body.accountEnabled && (!body.accountBankCode?.trim() || !body.accountNumber?.trim() || !body.accountHolder?.trim())) {
    return res.status(400).json({ status: 'error', message: '마음 전하실 곳을 켰다면 은행 · 계좌번호 · 예금주를 모두 입력해야 합니다.' });
  }

  const additionalMourners = Array.isArray(body.mourners)
    ? body.mourners.filter((m): m is Required<MournerInput> => !!m?.name?.trim())
    : [];
  const mournerRows = [
    { name: body.chiefMournerName.trim(), relationship: body.chiefMournerRelationship?.trim() || '상주', isChief: true, sortOrder: 0 },
    ...additionalMourners.map((m, i) => ({ name: m.name!.trim(), relationship: m.relationship?.trim() || '유족', isChief: false, sortOrder: i + 1 })),
  ];

  try {
    let result: { memorial: { slug: string }; obituary: { id: string; slug: string } } | undefined;

    // 극히 낮은 확률의 slug 충돌 대비 — memorialController.createMemorial과 동일 재시도 패턴(§4.4).
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const now = new Date();

          const deceased = await tx.deceased.create({
            data: {
              name: body.deceasedName!.trim(),
              deathDate: body.deathDate ? new Date(body.deathDate) : null,
              registeredBy: decoded.id,
            },
          });

          const memorial = await tx.memorial.create({
            data: {
              slug: generateMemorialSlug(),
              createdByUserId: decoded.id,
              deceasedId: deceased.id,
              deceasedName: deceased.name,
              deceasedDeathDate: deceased.deathDate,
              visibility: 'LINK',
              falseReportAgreedAt: now,
            },
          });

          const obituary = await tx.obituary.create({
            data: {
              slug: generateObituarySlug(),
              deceasedId: deceased.id,
              memorialId: memorial.id,
              createdByUserId: decoded.id,
              funeralHall: body.funeralHall!.trim(),
              funeralHallAddr: body.funeralHallAddr?.trim() || null,
              mourningRoom: body.mourningRoom?.trim() || null,
              facilityId: body.facilityId?.trim() || null,
              coffinAt: body.coffinAt ? new Date(body.coffinAt) : null,
              funeralAt: funeralAtDate,
              burialSite: body.burialSite?.trim() || null,
              contactPhone: body.contactPhone?.trim() || null,
              accountEnabled: !!body.accountEnabled,
              accountBankCode: body.accountEnabled ? body.accountBankCode!.trim() : null,
              accountNumberEnc: body.accountEnabled ? encryptField(body.accountNumber!.trim()) : null,
              accountHolder: body.accountEnabled ? body.accountHolder!.trim() : null,
              falseReportAgreedAt: now,
              resharedNoticeAckAt: now,
              mourners: { create: mournerRows },
            },
            select: { id: true, slug: true },
          });

          return { memorial: { slug: memorial.slug }, obituary };
        });
        break;
      } catch (e: any) {
        if (e?.code === 'P2002' && attempt < 2) continue; // slug 충돌 — 재시도
        throw e;
      }
    }

    const { memorial, obituary } = result!;
    return res.status(201).json({
      status: 'success',
      data: {
        // ⚠️ 스펙 §5.2 응답 예시엔 obituaryId가 없지만, PATCH /api/obituaries/:id(§5.1)가
        // id를 요구하고 공개 GET :slug 응답(§5.3)은 내부 PK를 노출하지 않으므로 개설자
        // 본인에게 돌려주는 이 응답에만 추가했다(walkthrough 편차로 기록).
        obituaryId: obituary.id,
        obituarySlug: obituary.slug,
        memorialSlug: memorial.slug,
        obituaryUrl: `${FRONTEND_URL}/o/${obituary.slug}`,
        memorialUrl: `${FRONTEND_URL}/m/${memorial.slug}`,
      },
    });
  } catch (error) {
    console.error('부고장 개설 실패:', error);
    return res.status(500).json({ status: 'error', message: '부고장 개설 중 오류가 발생했습니다.' });
  }
};

// 공개 조회 (`GET /api/obituaries/:slug`) — §5.3 화이트리스트. 닫혔거나 없으면 404(존재 은닉).
// 🔵 §9 #9 Phase 3 — 종료된 뒤에도 개설자 본인은 관리 화면(ObituaryPage.tsx)에서 계속 볼 수 있어야
// 하므로, Authorization 헤더가 있고 본인 것이면 닫혀 있어도 404를 내리지 않는다(다만 익명 조회는
// 그대로 404 — 존재 은닉 원칙은 안 건드린다).
export const getObituaryBySlug = async (req: Request, res: Response) => {
  try {
    const decoded = verifyBearerToken(req); // 선택 — 없어도 공개 조회는 그대로 동작(§5.3)
    const obituary = await prisma.obituary.findUnique({
      where: { slug: req.params.slug },
      include: {
        deceased: { select: { name: true, deathDate: true } },
        memorial: { select: { slug: true, portraitUrl: true } },
        mourners: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const closed = obituary ? isObituaryClosed(obituary) : false;
    const isOwner = !!obituary && !!decoded && obituary.createdByUserId === decoded.id;
    if (!obituary || (closed && !isOwner)) {
      return res.status(404).json({ status: 'error', message: '부고장을 찾을 수 없습니다.' });
    }

    // 조회수 집계만(§8 #8) — IP·UA 원문은 저장하지 않는다. 실패해도 조회 자체는 막지 않는다.
    // 종료된 뒤 개설자 본인이 확인하러 들어온 방문은 세지 않는다(조문객 조회수가 아니므로).
    if (!closed) {
      prisma.obituary.update({ where: { id: obituary.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    }

    const data: Record<string, unknown> = {
      deceasedName: obituary.deceased.name,
      deceasedDeathDate: obituary.deceased.deathDate,
      funeralHall: obituary.funeralHall,
      funeralHallAddr: obituary.funeralHallAddr,
      mourningRoom: obituary.mourningRoom,
      coffinAt: obituary.coffinAt,
      funeralAt: obituary.funeralAt,
      burialSite: obituary.burialSite,
      mourners: obituary.mourners.map((m) => ({ name: m.name, relationship: m.relationship, isChief: m.isChief })),
      memorialSlug: obituary.memorial.slug,
      cardFieldsUpdatedAt: obituary.cardFieldsUpdatedAt,
      updatedAt: obituary.updatedAt, // §5.4-2 — 랜딩 상단 "최종 수정 시각" 표시용
      // §9 #9 — 익명 조회에서는 이 경로에 절대 도달하지 않으므로(닫혔으면 위에서 이미 404)
      // 항상 false/null이라 노출해도 무해하다. 개설자 본인이 볼 때만 실제 값이 들어간다.
      isClosed: closed,
      closedAt: obituary.closedAt,
      // §5.3-1 — isOwner === true일 때만 싣는다. 익명·타인 응답에는 두 필드를 아예 넣지 않는다
      // (null도 넣지 않음, accountEnabled 꺼졌을 때 계좌 필드를 통째로 빼는 것과 같은 방식).
      // 프론트가 이 값으로 관리 모드 진입을 판정한다(§5.3-2 — localStorage는 힌트일 뿐 권한 신호가 아님).
      ...(isOwner ? { isOwner: true, obituaryId: obituary.id } : {}),
    };

    // 연락처 — 입력돼 있으면 그대로 포함(별도 토글 없음, §6.2-2)
    if (obituary.contactPhone) {
      data.contactPhone = obituary.contactPhone;
    }

    // 영정 — Phase 3+ portraitShareEnabled가 켜졌을 때만(§3.3-1). Phase 1~2는 화면에 토글이
    // 없어 obituary.portraitShareEnabled가 항상 false이므로 이 분기는 지금은 절대 안 탄다.
    if (obituary.portraitShareEnabled && obituary.memorial.portraitUrl) {
      data.portraitUrl = obituary.memorial.portraitUrl;
    }

    // 조의금 계좌 — accountEnabled일 때만 복호화해 포함. 꺼져 있으면 필드 자체를 넣지 않는다(§5.3).
    if (obituary.accountEnabled) {
      data.account = {
        bankCode: obituary.accountBankCode,
        accountNumber: obituary.accountNumberEnc ? decryptField(obituary.accountNumberEnc) : null,
        holder: obituary.accountHolder,
      };
    }

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('부고장 조회 실패:', error);
    return res.status(500).json({ status: 'error', message: '부고장 조회 중 오류가 발생했습니다.' });
  }
};

// 수정 (`PATCH /api/obituaries/:id`) — 개설자만. 카드 반영 필드(§5.4-2)가 바뀌면
// cardFieldsUpdatedAt을 갱신해 프론트가 "다시 공유해 주세요" 안내를 띄울 수 있게 한다.
export const updateObituary = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  const body = req.body as {
    deceasedName?: string;
    deathDate?: string | null;
    funeralHall?: string;
    funeralHallAddr?: string | null;
    mourningRoom?: string | null;
    coffinAt?: string | null;
    funeralAt?: string;
    burialSite?: string | null;
    contactPhone?: string | null;
    accountEnabled?: boolean;
    accountBankCode?: string | null;
    accountNumber?: string | null; // 평문 입력 → encryptField로 암호화해서만 저장
    accountHolder?: string | null;
  };

  if (body.accountEnabled && (!body.accountBankCode?.trim() || !body.accountNumber?.trim() || !body.accountHolder?.trim())) {
    return res.status(400).json({ status: 'error', message: '마음 전하실 곳을 켰다면 은행 · 계좌번호 · 예금주를 모두 입력해야 합니다.' });
  }

  try {
    const existing = await prisma.obituary.findUnique({
      where: { id: req.params.id },
      include: { deceased: { select: { id: true, name: true } } },
    });
    // 존재하지 않음과 소유권 없음을 동일하게 404로 응답(memorialController.updateMemorial과 동일 사상)
    if (!existing || existing.createdByUserId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '부고장을 찾을 수 없습니다.' });
    }

    const before: TriggerSnapshot = {
      deceasedName: existing.deceased.name,
      funeralHall: existing.funeralHall,
      mourningRoom: existing.mourningRoom,
      funeralAt: existing.funeralAt,
    };
    const after: TriggerSnapshot = {
      deceasedName: body.deceasedName !== undefined ? body.deceasedName.trim() : before.deceasedName,
      funeralHall: body.funeralHall !== undefined ? body.funeralHall.trim() : before.funeralHall,
      mourningRoom: body.mourningRoom !== undefined ? body.mourningRoom?.trim() || null : before.mourningRoom,
      funeralAt: body.funeralAt !== undefined ? new Date(body.funeralAt) : before.funeralAt,
    };
    const cardFieldsChanged = triggerFieldsChanged(before, after);
    const now = new Date();

    const [, updatedObituary] = await prisma.$transaction([
      prisma.deceased.update({
        where: { id: existing.deceased.id },
        data: {
          ...(body.deceasedName !== undefined ? { name: after.deceasedName } : {}),
          ...(body.deathDate !== undefined ? { deathDate: body.deathDate ? new Date(body.deathDate) : null } : {}),
        },
      }),
      prisma.obituary.update({
        where: { id: existing.id },
        data: {
          ...(body.funeralHall !== undefined ? { funeralHall: after.funeralHall! } : {}),
          ...(body.funeralHallAddr !== undefined ? { funeralHallAddr: body.funeralHallAddr?.trim() || null } : {}),
          ...(body.mourningRoom !== undefined ? { mourningRoom: after.mourningRoom } : {}),
          ...(body.coffinAt !== undefined ? { coffinAt: body.coffinAt ? new Date(body.coffinAt) : null } : {}),
          ...(body.funeralAt !== undefined ? { funeralAt: after.funeralAt } : {}),
          ...(body.burialSite !== undefined ? { burialSite: body.burialSite?.trim() || null } : {}),
          ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone?.trim() || null } : {}),
          // 계좌는 트리거 필드가 아니다(§5.4-2 표 — 안 띄움) — cardFieldsUpdatedAt에 영향 없음.
          ...(body.accountEnabled !== undefined ? { accountEnabled: body.accountEnabled } : {}),
          ...(body.accountBankCode !== undefined ? { accountBankCode: body.accountEnabled ? body.accountBankCode?.trim() || null : null } : {}),
          ...(body.accountNumber !== undefined ? { accountNumberEnc: body.accountEnabled && body.accountNumber ? encryptField(body.accountNumber.trim()) : null } : {}),
          ...(body.accountHolder !== undefined ? { accountHolder: body.accountEnabled ? body.accountHolder?.trim() || null : null } : {}),
          ...(cardFieldsChanged ? { cardFieldsUpdatedAt: now } : {}),
        },
      }),
    ]);

    return res.json({ status: 'success', data: { ...updatedObituary, cardFieldsChanged } });
  } catch (error) {
    console.error('부고장 수정 실패:', error);
    return res.status(500).json({ status: 'error', message: '부고장 수정 중 오류가 발생했습니다.' });
  }
};

// 수동 종료 (`PATCH /api/obituaries/:id/close`) — 개설자만(§9 #9). §6.2-3이 말하는 "실제로 작동하는
// 유일한 완화책" — 닫으면 연락처·계좌가 실린 랜딩이 그 즉시 404가 된다. 되돌리는 기능은 두지 않는다
// (§6.2-4의 발인+3일 자동 종료와 마찬가지로 한 방향으로만 간다). 이미 닫혀 있어도 에러 대신 그대로
// 현재 상태를 돌려준다(버튼을 두 번 눌러도 안전).
export const closeObituary = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    const existing = await prisma.obituary.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.createdByUserId !== decoded.id) {
      return res.status(404).json({ status: 'error', message: '부고장을 찾을 수 없습니다.' });
    }

    const updated = existing.closedAt
      ? existing
      : await prisma.obituary.update({ where: { id: existing.id }, data: { closedAt: new Date() } });

    return res.json({ status: 'success', data: { closedAt: updated.closedAt } });
  } catch (error) {
    console.error('부고장 종료 실패:', error);
    return res.status(500).json({ status: 'error', message: '부고장 종료 중 오류가 발생했습니다.' });
  }
};
