// docs/02_전문가_매칭/02-05 §2.2 ② — 상황 선택 모달의 6줄. 문구는 스펙 표 그대로(00-39 규칙 6-2: 평가·권유 말 금지).
// categories = 그 상황을 골랐을 때 켜지는 직역(GET /api/experts?category=A,B 로 그대로 나간다).

export interface CounselingSituation {
  id: number;
  label: string;
  categories: string[];
  deadline?: string; // 있으면 붉은 글자로 옆에 표시
  deadlineNote?: string; // 고른 뒤 상황 줄 위에 붙는 붉은 12px 한 줄
}

export const COUNSELING_SITUATIONS: CounselingSituation[] = [
  {
    id: 1,
    label: '고인에게 빚이 있을 수 있습니다',
    categories: ['LAWYER', 'JUDICIAL_SCRIVENER'],
    deadline: '기한 3개월',
    deadlineNote: '사망을 안 날부터 3개월 안에 상속포기·한정승인 신청', // 민법 §1019 ①
  },
  { id: 2, label: '부동산·자동차 명의를 바꿔야 합니다', categories: ['JUDICIAL_SCRIVENER'] },
  { id: 3, label: '상속세·취득세를 알아봐야 합니다', categories: ['TAX_ACCOUNTANT'] },
  { id: 4, label: '가족 간에 의견이 다릅니다', categories: ['LAWYER'] },
  { id: 5, label: '행정 서류·신고가 남아 있습니다', categories: ['ADMINISTRATIVE_SCRIVENER'] },
  { id: 6, label: '장례 절차를 상담하고 싶습니다', categories: ['FUNERAL_DIRECTOR'] },
];
