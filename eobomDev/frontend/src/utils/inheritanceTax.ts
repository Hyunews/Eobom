// 상속세 간이 계산 로직 — 상속세 및 증여세법 기준 핵심 구조만 반영한다.
// "간이"인 이유: 미성년자공제/장애인공제(기대여명 필요)·동거주택상속공제(거주요건)·
// 가업·영농상속공제·세대생략가산·10년 이내 사전증여재산 합산 등은 반영하지 않는다.
// 반영 범위는 CounselingPage의 참고사항 안내와 반드시 같이 유지할 것 — 계산은 여기서 정확해도
// 화면에 "무엇을 안 넣었는지"가 없으면 사용자가 결과를 과신한다.
//
// ⚠️ 세율·공제액은 법 개정으로 바뀔 수 있다 — 이 파일 값은 작성 시점 기준이며,
// 실제 신고 전 국세청 또는 세무사를 통해 최신 기준을 반드시 확인해야 한다.

export interface InheritanceTaxInput {
  totalAsset: number; // 총 상속재산가액 (만원)
  debtAndFuneralCost: number; // 채무 + 장례비용 (만원, 공제)
  financialAsset: number; // 총 상속재산 중 순수 금융재산가액 (만원) — 예금/보험/주식 등, 부동산 제외
  hasSpouse: boolean; // 배우자 생존 여부
  spouseInheritedAmount: number | null; // 배우자 실제 상속액(만원) — null이면 법정상속분으로 추정
  childrenCount: number; // 자녀 수 (인적공제 자녀공제용)
  elderlyCount: number; // 65세 이상 상속인 수 (배우자·자녀 제외, 연로자공제용)
}

export interface InheritanceTaxBreakdown {
  taxableBase: number; // 상속세 과세가액 (= 총상속재산 - 채무·장례비용)
  basicOrLumpSumDeduction: number; // 기초공제+인적공제 vs 일괄공제(5억) 중 큰 금액
  spouseDeduction: number; // 배우자공제
  spouseDeductionIsEstimated: boolean; // 배우자 실제 상속액을 입력 안 해 법정상속분으로 추정했는지
  financialAssetDeduction: number; // 금융재산 상속공제
  totalDeduction: number; // 공제 합계
  taxBase: number; // 과세표준 (= 과세가액 - 공제 합계, 최소 0)
  bracketRate: number; // 적용된 최고 구간 세율(%) — 참고 표시용
  calculatedTax: number; // 산출세액 (누진세율 적용, 신고세액공제 전)
  reportingDeduction: number; // 신고세액공제(3%, 법정신고기한 내 신고 가정)
  finalTax: number; // 최종 예상세액 (산출세액 - 신고세액공제)
}

const MANWON = 1; // 이 파일 내부 금액 단위는 전부 "만원"
const EOK = 10000 * MANWON; // 1억 = 10,000만원

// 상속세율표(상속세 및 증여세법 제26조) — 5단계 누진세율 + 누진공제액(만원 단위)
const TAX_BRACKETS: { upTo: number; rate: number; deduction: number }[] = [
  { upTo: 1 * EOK, rate: 0.1, deduction: 0 },
  { upTo: 5 * EOK, rate: 0.2, deduction: 1000 },
  { upTo: 10 * EOK, rate: 0.3, deduction: 6000 },
  { upTo: 30 * EOK, rate: 0.4, deduction: 16000 },
  { upTo: Infinity, rate: 0.5, deduction: 46000 },
];

const LUMP_SUM_DEDUCTION = 5 * EOK; // 일괄공제 — 배우자 단독상속이 아닌 경우 기초+인적공제 대신 선택 가능
const BASIC_DEDUCTION = 2 * EOK; // 기초공제
const CHILD_DEDUCTION_PER_PERSON = 5000; // 자녀공제 1인당
const ELDERLY_DEDUCTION_PER_PERSON = 5000; // 연로자공제(65세 이상) 1인당
const SPOUSE_DEDUCTION_MIN = 5 * EOK; // 배우자공제 최소(배우자가 있으면 실제 상속액 무관하게 최소 인정)
const SPOUSE_DEDUCTION_MAX = 30 * EOK; // 배우자공제 최대 한도
const FINANCIAL_DEDUCTION_MIN = 2000; // 금융재산 상속공제 최소
const FINANCIAL_DEDUCTION_MAX = 2 * EOK; // 금융재산 상속공제 한도
const REPORTING_DEDUCTION_RATE = 0.03; // 신고세액공제 — 법정신고기한 내 신고 가정

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// 배우자가 실제 상속액을 밝히지 않았을 때 쓰는 법정상속분 추정치.
// 민법상 배우자:자녀 = 1.5 : 1 지분 — 자녀가 없으면 배우자 단독상속으로 본다(간이 가정).
const estimateSpouseLegalShare = (taxableBase: number, childrenCount: number): number => {
  if (childrenCount <= 0) return taxableBase; // 자녀 없으면 단독상속으로 근사
  const spouseShareRatio = 1.5 / (1.5 + childrenCount);
  return taxableBase * spouseShareRatio;
};

const calculateProgressiveTax = (taxBase: number): { tax: number; bracketRate: number } => {
  if (taxBase <= 0) return { tax: 0, bracketRate: 0 };
  const bracket = TAX_BRACKETS.find((b) => taxBase <= b.upTo)!;
  const tax = Math.max(0, taxBase * bracket.rate - bracket.deduction);
  return { tax, bracketRate: bracket.rate * 100 };
};

export const calculateInheritanceTax = (input: InheritanceTaxInput): InheritanceTaxBreakdown => {
  const taxableBase = Math.max(0, input.totalAsset - input.debtAndFuneralCost);

  // 1) 기초공제+인적공제 vs 일괄공제(5억) 중 큰 금액
  const basicPlusPersonal =
    BASIC_DEDUCTION + input.childrenCount * CHILD_DEDUCTION_PER_PERSON + input.elderlyCount * ELDERLY_DEDUCTION_PER_PERSON;
  const basicOrLumpSumDeduction = Math.max(LUMP_SUM_DEDUCTION, basicPlusPersonal);

  // 2) 배우자공제 — 배우자 없으면 0, 있으면 (실제 상속액 or 법정상속분 추정)을 5억~30억 사이로 clamp
  let spouseDeduction = 0;
  let spouseDeductionIsEstimated = false;
  if (input.hasSpouse) {
    const basis = input.spouseInheritedAmount ?? estimateSpouseLegalShare(taxableBase, input.childrenCount);
    if (input.spouseInheritedAmount === null) spouseDeductionIsEstimated = true;
    spouseDeduction = clamp(basis, SPOUSE_DEDUCTION_MIN, SPOUSE_DEDUCTION_MAX);
  }

  // 3) 금융재산 상속공제 — 순금융재산 2천만원 이하면 전액, 초과면 20%(최소 2천만원, 한도 2억)
  const financialAssetDeduction =
    input.financialAsset <= FINANCIAL_DEDUCTION_MIN
      ? input.financialAsset
      : clamp(input.financialAsset * 0.2, FINANCIAL_DEDUCTION_MIN, FINANCIAL_DEDUCTION_MAX);

  const totalDeduction = basicOrLumpSumDeduction + spouseDeduction + financialAssetDeduction;
  const taxBase = Math.max(0, taxableBase - totalDeduction);

  const { tax: calculatedTax, bracketRate } = calculateProgressiveTax(taxBase);
  const reportingDeduction = calculatedTax * REPORTING_DEDUCTION_RATE;
  const finalTax = Math.max(0, calculatedTax - reportingDeduction);

  return {
    taxableBase,
    basicOrLumpSumDeduction,
    spouseDeduction,
    spouseDeductionIsEstimated,
    financialAssetDeduction,
    totalDeduction,
    taxBase,
    bracketRate,
    calculatedTax,
    reportingDeduction,
    finalTax,
  };
};
