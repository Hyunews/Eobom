import type { RecipientItem, MessageItem } from '../FarewellMessageCard';

// 00-38 §6.1 — Desktop/Mobile 뷰가 공유하는 뷰모델 타입. 상태·핸들러는 FarewellMessagePage.tsx에
// 1벌만 있고(§6.2 #1·#2), 두 뷰는 이 타입만 받아 표현만 한다.
export interface FarewellViewProps {
  loading: boolean;
  recipients: RecipientItem[];
  messages: MessageItem[];
  selectedRecipientId: string | null;
  onSelectRecipient: (id: string | null) => void;
  onOpenFamilyDesignation?: () => void;
  setActiveTab?: (tab: string) => void;
  token: string | null;
  onSaved: () => void;
  onExportAll: () => void;
  exportingAll: boolean;
}
