import type { ReactNode } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface SectionMeta {
  code: string;
  title: string;
  icon: ReactNode;
}

export interface FamilyItem {
  id: string;
  name: string;
  relationship: string;
  relationshipEtc: string | null;
  status: string;
}

export interface GrantItem {
  id: string;
  designationId: string;
  section: string;
  timing: string;
  revokedAt: string | null;
  updatedAt: string;
}

export interface SummaryRow {
  code: string;
  title: string;
  completed: boolean;
  valueText: string;
  timingBadge: string | null;
  isWillDraft: boolean;
}
