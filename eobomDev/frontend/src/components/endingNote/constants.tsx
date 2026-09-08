import React from 'react';
import { FileCheck, Flower2, Landmark, Smartphone, ShieldCheck, Users, MapPin, HeartPulse } from 'lucide-react';
import type { SectionMeta } from './types';

// 06-04 §6.1-1·§4.2·§10 Phase 1 — 아코디언 전환 + 실제 저장. ①②④⑤⑥⑦⑧⑩(8개)는 아코디언,
// ⑨(유언장 초안)는 별도 블록(§6.1-1 "⑨는 아코디언에 넣지 않는다"). 섹션 코드는 백엔드
// EndingNoteEntry.section과 1:1로 맞춘다(controllers/endingNoteController.ts SECTION_TIMING과 동일 목록).
// §6.3 금지 항목(비밀번호·PIN·계좌번호·잔액·주민등록번호·서류파일·상속지분·유류분)을 어느
// 섹션에도 다시 들여오지 않는다 — ④는 "소재"만, ⑥은 "가입 사실"만, ⑧은 "소재"만 받는다.
export const DIGITAL_ACCOUNT_CATEGORIES = ['이메일', 'SNS', '클라우드', '구독 서비스'] as const;
export const DIGITAL_ACCOUNT_CHOICES: Record<string, string> = {
  '': '미정',
  DELETE: '삭제',
  MEMORIALIZE: '추모 전환',
  KEEP: '보존',
};

export const INSURANCE_ITEMS = [
  { key: 'life', label: '생명보험' },
  { key: 'pension', label: '연금(개인·퇴직)' },
  { key: 'accident', label: '실손·상해보험' },
] as const;

// 표시 순서 = §6.1 순서(③ 제외). WILL_DRAFT(⑨)는 아코디언에 넣지 않으므로 여기 없다 — 별도 블록.
export const SECTIONS: SectionMeta[] = [
  { code: 'LIFE_SUPPORT', title: '연명의료 의향 메모', icon: <FileCheck color="var(--point-color)" /> },
  { code: 'FUNERAL', title: '장례 희망', icon: <Flower2 color="var(--point-color)" /> },
  { code: 'ASSET', title: '자산 소재 안내', icon: <Landmark color="var(--point-color)" /> },
  { code: 'DIGITAL_ACCOUNTS', title: '디지털 계정 처리 의향', icon: <Smartphone color="var(--point-color)" /> },
  { code: 'INSURANCE', title: '보험·연금 가입 사실', icon: <ShieldCheck color="var(--point-color)" /> },
  { code: 'CONTACTS', title: '중요 연락처·반려동물', icon: <Users color="var(--point-color)" /> },
  { code: 'WILL_LOCATION', title: '유언장 소재 안내', icon: <MapPin color="var(--point-color)" /> },
  { code: 'ORGAN_DONATION', title: '장기·조직 기증 의향', icon: <HeartPulse color="var(--point-color)" /> },
];

// §10 Phase 2 — 섹션별 공개 시점. 백엔드 endingNoteController.ts SECTION_ALLOWED_TIMINGS와
// 동일 목록(§7.1·§13 #5) — EMERGENCY는 Phase 3 전까지 어디에도 없고, WILL_DRAFT는 아예 없다
// (목록에 없는 섹션은 SectionTimingControl이 렌더링하지 않는다).
export const SECTION_ALLOWED_TIMINGS: Record<string, string[]> = {
  LIFE_SUPPORT: ['POSTMORTEM'],
  FUNERAL: ['IMMEDIATE', 'POSTMORTEM'],
  ASSET: ['POSTMORTEM'],
  DIGITAL_ACCOUNTS: ['POSTMORTEM'],
  INSURANCE: ['POSTMORTEM'],
  CONTACTS: ['IMMEDIATE', 'POSTMORTEM'],
  WILL_LOCATION: ['POSTMORTEM'],
  ORGAN_DONATION: ['POSTMORTEM'],
};

export const TIMING_LABEL: Record<string, string> = {
  IMMEDIATE: '지금부터 공개(생전)',
  POSTMORTEM: '사후에만 공개',
};

export const RELATIONSHIP_LABEL: Record<string, string> = {
  SPOUSE: '배우자',
  CHILD: '자녀',
  PARENT: '부모',
  SIBLING: '형제자매',
  OTHER: '기타',
};

export const NOT_A_WILL_NOTICE =
  '이 화면에서 만든 글은 유언장이 아닙니다. 자필증서 유언은 반드시 손으로 직접 쓰셔야 하며, 컴퓨터로 작성한 문서는 효력이 없습니다.';
