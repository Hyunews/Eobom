import React, { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';

// 00-41 §8.3 — 본인이 로그인했는데 자기 앞으로 개봉 요청이 있으면 상단에 알린다.
// 🔴 로그인만으로 자동 취소하지 않는다 — 가족이 고인 휴대폰(자동 로그인)을 쓰는 경우가 흔하다. 취소는 [취소]를 눌렀을 때만.
// REQUESTED = 취소 가능 / VERIFIED = 이미 열림(되돌리기는 개발자 수동 처리라 안내만).

interface AboutMe {
  id: string;
  status: 'REQUESTED' | 'VERIFIED';
  requesterName: string;
  canCancel: boolean;
}

interface Props {
  currentUser: string | null;
}

export const ReleaseRequestBanner: React.FC<Props> = ({ currentUser }) => {
  const [data, setData] = useState<AboutMe | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setData(null);
      return;
    }
    // 배너는 부가 정보다 — 실패해도 화면을 막지 않는다.
    apiFetch<AboutMe | null>('/api/ending-note/release-requests/about-me', 'USER')
      .then(setData)
      .catch(() => setData(null));
  }, [currentUser]);

  if (!data) return null;

  const cancel = async () => {
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/api/ending-note/release-requests/${data.id}/cancel-by-subject`, 'USER', { method: 'POST' });
      setData(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="v2-notice-warn" role="alert" style={{ margin: '0', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <span>
        {data.status === 'REQUESTED'
          ? `${data.requesterName} 님이 엔딩노트 개봉을 요청했습니다. 본인이시면 취소해 주세요.`
          : '개봉되었습니다. 본인이시면 대표번호로 연락해 주세요.'}
        {error && <span style={{ marginLeft: '8px' }}>{error}</span>}
      </span>
      {data.canCancel && (
        <button type="button" className="v2-btn-outline" onClick={cancel} disabled={busy}>
          {busy ? '취소하는 중…' : '취소'}
        </button>
      )}
    </div>
  );
};
