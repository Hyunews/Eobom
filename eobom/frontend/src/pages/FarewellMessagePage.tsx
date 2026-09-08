import React, { useCallback, useEffect, useState } from 'react';
import { Mail, LogIn } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';
import { BACKEND_URL } from '../config';
import { RecipientItem, MessageItem } from '../components/FarewellMessageCard';
import { FarewellDesktopView } from '../components/farewell/FarewellDesktopView';
import { FarewellMobileView } from '../components/farewell/FarewellMobileView';
import { useIsMobile } from '../hooks/useIsMobile';

// 06-05 §7·§8 Phase B — docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md.
// Phase A(골격)에서 나아가 FarewellMessage 모델·컨트롤러가 배선됐다 — 이제 실제로 저장된다.
// STT(Ⓐ 파일 업로드·Ⓑ 직접 녹음)도 엔딩노트 ⑨에서 이관되어 FarewellMessageCard 안에서 쓰인다
// (06-05 §4.2 정정, 08-26).
//
// 00-38 §6.1·§8.1-1 — 적응형 뷰 분리 파일럿. 데이터 로딩·상태·핸들러는 전부 여기 1벌만 두고
// (§6.2 #1·#2), 표현은 FarewellDesktopView/FarewellMobileView로 나눈다. URL은 그대로(§6.3).

interface FarewellMessagePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  // 가족이 0명일 때 MyPageFamilyDesignation 모달을 그대로 재사용(§7.3 — 06-04 Phase 2 #6과 같은 진입점).
  onOpenFamilyDesignation?: () => void;
}

export const FarewellMessagePage: React.FC<FarewellMessagePageProps> = ({ currentUser, onOpenLogin, setActiveTab, onOpenFamilyDesignation }) => {
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<RecipientItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const token = currentUser ? getToken('USER') : null;
  const isMobile = useIsMobile();

  // 🆕 07-04 §8-9 후속(09-08, 사이드바+상세 결정) — 왼쪽에서 고른 한 사람만 오른쪽에 펼친다.
  // 🔄 00-38 §8.1-1 ⓕ — 모바일에서는 목록을 보여주기도 전에 2단계로 떨어지면 안 되므로
  // 데스크톱에서만 자동선택한다. deps에 isMobile을 넣어야 폭 전환(모바일→데스크톱) 때도
  // 상세 칸이 빈 채로 남지 않는다.
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  useEffect(() => {
    if (isMobile) return; // 모바일은 사용자가 고를 때까지 null (1단계 목록 유지)
    setSelectedRecipientId((prev) => {
      if (recipients.length === 0) return null;
      if (prev && recipients.some((r) => r.id === prev)) return prev;
      return recipients[0].id;
    });
  }, [recipients, isMobile]);

  // 06-05 §5.4-3 D-5 — 전체 반출(zip). presigned URL이 없어(§5.6-1과 같은 이유) 인증 fetch로
  // 받아 blob URL을 만든 뒤 <a download>로 내려받는다. 실패해도 조용히 두고 버튼을 다시 누르면
  // 재시도되는 보조 기능이라 별도 에러 배너를 두지 않는다.
  const handleExport = useCallback(async () => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/farewell-messages/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eobom_유족메시지_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // 실패는 조용히 삼킨다 — 다시 누르면 재시도된다.
    } finally {
      setExporting(false);
    }
  }, [token]);

  const fetchMessages = useCallback(() => {
    if (!token) return;
    apiFetch<MessageItem[]>('/api/farewell-messages', 'USER')
      .then((data) => setMessages(data))
      .catch(() => { });
  }, [token]);

  useEffect(() => {
    if (!currentUser || !token) {
      setLoading(false);
      return;
    }
    Promise.all([
      apiFetch<RecipientItem[]>('/api/family-designations', 'USER'),
      apiFetch<MessageItem[]>('/api/farewell-messages', 'USER'),
    ])
      .then(([designationsData, messagesData]) => {
        setRecipients(designationsData);
        setMessages(messagesData);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container">
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2.5rem 1.75rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
          <Mail color="var(--point-color)" size={40} style={{ marginBottom: 'var(--fs-caption)' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>유족 메시지 보관함</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>가족에게 남기는 편지는 로그인 후 작성하실 수 있습니다.</p>
          <button onClick={onOpenLogin} className="btn btn-point" style={{ width: '100%' }}>
            <LogIn size={18} /> 로그인 / 회원가입
          </button>
        </div>
      </div>
    );
  }

  const viewProps = {
    loading,
    recipients,
    messages,
    selectedRecipientId,
    onSelectRecipient: setSelectedRecipientId,
    onOpenFamilyDesignation,
    setActiveTab,
    token,
    onSaved: fetchMessages,
    onExportAll: handleExport,
    exportingAll: exporting,
  };

  return isMobile ? <FarewellMobileView {...viewProps} /> : <FarewellDesktopView {...viewProps} />;
};
