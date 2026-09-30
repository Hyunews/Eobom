import React, { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import { RELATIONSHIP_LABEL } from '../endingNote/constants';

// 00-41 §7.3 — 열린(VERIFIED) 뒤, 이미 수락한 유족 화면에 "아직 수락하지 않은 가족"을 **이름·관계만** 보여주고
// [초대 링크 다시 만들기]를 준다. 🔴 전화번호·이메일은 서버가 내려주지 않는다. 링크는 유족이 아는 경로(단톡방 등)로 직접 전한다.
// 생전에 거절(DECLINED)한 가족은 서버가 목록에서 뺀다.

interface PendingItem {
  designationId: string;
  name: string;
  relationship: string;
  relationshipEtc: string | null;
  linkExpired: boolean;
}

interface Props {
  verificationId: string;
}

const relationLabel = (p: PendingItem): string =>
  p.relationship === 'OTHER' && p.relationshipEtc ? p.relationshipEtc : RELATIONSHIP_LABEL[p.relationship] ?? p.relationship;

export const PendingFamilyPanel: React.FC<Props> = ({ verificationId }) => {
  const [items, setItems] = useState<PendingItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [link, setLink] = useState<{ designationId: string; url: string } | null>(null);
  const [message, setMessage] = useState('');

  const load = () =>
    apiFetch<PendingItem[]>(`/api/ending-note/release-requests/${verificationId}/pending-family`, 'USER')
      .then(setItems)
      .catch(() => setItems([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);

  const reinvite = async (p: PendingItem) => {
    setBusyId(p.designationId);
    setMessage('');
    try {
      const data = await apiFetch<{ inviteToken: string }>(
        `/api/ending-note/release-requests/${verificationId}/pending-family/${p.designationId}/reinvite`,
        'USER',
        { method: 'POST' }
      );
      setLink({ designationId: p.designationId, url: `${window.location.origin}/invite/${data.inviteToken}` });
      await load();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('링크를 복사했습니다.');
    } catch {
      setMessage('복사하지 못했습니다. 아래 주소를 직접 복사해 주세요.');
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 className="v2-section-title" style={{ marginBottom: '8px' }}>아직 수락하지 않은 가족</h3>
      <p className="v2-notice">초대를 수락하면 그 가족도 고인이 정해 둔 항목을 볼 수 있습니다. 새 링크를 만들면 이전 링크는 쓸 수 없습니다.</p>
      {items.map((p) => (
        <div key={p.designationId} style={{ padding: '12px 0', borderBottom: '1px solid var(--v2-divider)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span>
              {p.name} ({relationLabel(p)})
              <span style={{ marginLeft: '8px', color: 'var(--v2-text-muted)' }}>{p.linkExpired ? '링크 만료' : '링크 유효'}</span>
            </span>
            <button type="button" className="v2-btn-outline" onClick={() => reinvite(p)} disabled={busyId === p.designationId}>
              {busyId === p.designationId ? '만드는 중…' : '초대 링크 다시 만들기'}
            </button>
          </div>
          {link?.designationId === p.designationId && (
            <div style={{ marginTop: '10px' }}>
              <input readOnly className="v2-input" value={link.url} onFocus={(e) => e.currentTarget.select()} aria-label={`${p.name} 초대 링크`} />
              <button type="button" className="v2-btn-outline" style={{ marginTop: '8px' }} onClick={() => copy(link.url)}>
                링크 복사
              </button>
            </div>
          )}
        </div>
      ))}
      {message && <p className="v2-notice" style={{ marginTop: '8px' }}>{message}</p>}
    </div>
  );
};
