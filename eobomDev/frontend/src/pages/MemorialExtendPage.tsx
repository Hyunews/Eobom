import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetchRaw, ApiError, apiFetch } from '../lib/api';
import { ConnectionFailed } from '../components/ConnectionFailed';
import { PageLink } from '../components/common/PageLink';
import { formatKstDate } from '../utils/kstDate';

// docs 00-20 §8.1-4 — 추모관 연장 확인 화면(통지 링크 /memorial-extend/:token). 로그인 불필요(§4.3).
// 🔴 링크를 여는 것(GET)은 조회뿐이다 — 연장은 아래 버튼(POST)만 한다. 메일 보안 검사기가 링크를 미리 열어도 저절로 연장되지 않게.
// App.tsx 레이아웃(Header/Sidebar/Footer) 밖의 독립 페이지다(FamilyInvitePage와 같은 처리) — 받는 사람이 어느 계정인지 알 수 없다.
// 문구는 사실만(§8.1-4 "문구").

interface PreviewData {
  deceasedName: string;
  frozen: boolean; // true면 purgeAt이 삭제 예정일, false면 expiresAt이 보존 기간 종료일
  expiresAt: string | null;
  purgeAt: string | null;
}

type ViewState = 'loading' | 'ready' | 'done' | 'invalid' | 'error';

export const MemorialExtendPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<ViewState>('loading');
  const [data, setData] = useState<PreviewData | null>(null);
  const [failMessage, setFailMessage] = useState<string>('유효하지 않은 링크입니다.');
  const [doneUntil, setDoneUntil] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    setView('loading');
    apiFetchRaw(`/api/memorials/extend/${token}`)
      .then(async (res) => {
        if (res.status >= 500 || res.status === 429) {
          setView('error');
          return;
        }
        const json = await res.json();
        if (!res.ok || json.status !== 'success') {
          setFailMessage(json.message || '유효하지 않은 링크입니다.');
          setView('invalid');
          return;
        }
        setData(json.data);
        setView('ready');
      })
      .catch(() => setView('error'));
  }, [token, retryKey]);

  const handleExtend = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const r = await apiFetch<{ expiresAt: string }>(`/api/memorials/extend/${token}`, undefined, { method: 'POST' });
      setDoneUntil(r.expiresAt);
      setView('done');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  let body: React.ReactNode;
  if (view === 'loading') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-sub">불러오는 중...</p>
      </div>
    );
  } else if (view === 'error') {
    body = <ConnectionFailed onRetry={() => setRetryKey((k) => k + 1)} />;
  } else if (view === 'invalid') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-title">연장할 수 없습니다.</p>
        <p className="v2-obit-notfound-sub">{failMessage}</p>
        <PageLink to="/" className="v2-btn-outline v2-obit-invite-cta">
          이어봄 홈으로
        </PageLink>
      </div>
    );
  } else if (view === 'done') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-title">보존이 연장되었습니다.</p>
        <p className="v2-obit-notfound-sub">{doneUntil ? `${formatKstDate(doneUntil)}까지 보존됩니다.` : ''}</p>
        <PageLink to="/" className="v2-btn-outline v2-obit-invite-cta">
          이어봄 홈으로
        </PageLink>
      </div>
    );
  } else {
    // view === 'ready'
    const dateText = data ? formatKstDate((data.frozen ? data.purgeAt : data.expiresAt) ?? '') : '';
    body = (
      <>
        <h1 className="v2-obit-name">故 {data?.deceasedName}님 추모관</h1>
        <p className="v2-obit-invite-desc">
          {data?.frozen
            ? `이 추모관이 ${dateText}에 삭제됩니다. 계속 보존하려면 아래 버튼을 누르세요.`
            : `이 추모관의 활성 기간이 ${dateText}에 끝납니다. 이후에는 새 방명록·헌화·사진 등록이 중단되고 열람만 가능합니다. 계속 보존하려면 아래 버튼을 누르세요.`}
        </p>
        <div className="v2-obit-invite-body">
          {errorMsg && <p className="v2-error-text">{errorMsg}</p>}
          <button type="button" onClick={handleExtend} disabled={isSubmitting} aria-busy={isSubmitting} className="v2-btn-primary v2-obit-invite-cta">
            {isSubmitting ? '처리 중...' : '계속 보존하기'}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="v2-obit-page">
      <div className="v2-obit-content">
        <div className="v2-obit-box">{body}</div>
      </div>
    </div>
  );
};
