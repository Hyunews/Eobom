import { Prisma } from '@prisma/client';

// 00-28 §6.4 — 문의·상담 폼의 신청자 이름·연락처를 useProfileContact 플래그로 채운다.
// 🔴 클라이언트는 연락처 "값"을 보내지 않는다 — GET /api/me/profile이 마스킹된 값만 주므로
// 프론트에는 애초에 평문이 없다(§6.1). 서버가 로그인 유저의 프로필 평문을 직접 읽어 신청
// 스냅샷 컬럼(Lead.applicantPhone 등)에 복사한다 — §2 스냅샷 원칙이 조인 없이 자동으로 지켜진다.
// leadController.createQuote · expertPublicController.submitConsultRequest 둘 다 같은 규칙을
// 쓴다(⚠️ 두 폼의 동작을 다르게 두지 말 것 — §6.4-1).
export class ProfileContactMissingError extends Error {}

interface ResolveParams {
  useProfileContact: boolean;
  userId: string | null;
  bodyName?: string;
  bodyPhone?: string;
}

// 반드시 트랜잭션 안에서 호출한다 — 프로필 조회와 리드/상담 생성이 같은 스냅샷 시점을 봐야 한다.
export const resolveApplicantContact = async (
  tx: Prisma.TransactionClient,
  { useProfileContact, userId, bodyName, bodyPhone }: ResolveParams
): Promise<{ applicantName: string; applicantPhone: string }> => {
  // 비로그인 신청은 useProfileContact를 무시한다 — 프로필 자체가 없으므로(§6.4 5번)
  if (useProfileContact && userId) {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true, contactPhone: true } });
    if (!user?.contactPhone) {
      // 빈 값이 스냅샷에 들어가면 업체가 연락할 방법이 없어진다(§6.4 4번) — 호출부가 400으로 응답한다.
      throw new ProfileContactMissingError();
    }
    return { applicantName: user.name, applicantPhone: user.contactPhone };
  }
  return { applicantName: bodyName!.trim(), applicantPhone: bodyPhone!.trim() };
};
