import prisma from '../config/prisma';

// docs 00-41 §7.2 — 🔴 EndingNote가 RELEASED면 본인 쪽 쓰기 API는 전부 거부한다(409). 고인 휴대폰
// (자동 로그인)으로 누군가 내용을 고치는 것을 막는다. 읽기·반출은 그대로 열어둔다.
// 되돌리기(잘못 연 경우)는 1차 범위 밖 — 개발자 수동 처리(db-safety.md).
export const RELEASED_LOCK_MESSAGE = '이미 개봉된 엔딩노트는 수정할 수 없습니다. 본인이시면 대표번호로 연락해 주세요.';

export const isEndingNoteReleased = async (userId: string): Promise<boolean> => {
  const note = await prisma.endingNote.findUnique({ where: { userId }, select: { status: true } });
  return note?.status === 'RELEASED';
};
