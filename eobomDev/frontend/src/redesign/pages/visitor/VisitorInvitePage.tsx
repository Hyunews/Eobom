import React, { useState } from 'react';
import { sleep, type DemoOption } from '../../parts/RdDemo';
import { RdButton } from '../../parts/RdButtons';
import { RdField, RdInput } from '../../parts/RdInputs';
import { RdNotice } from '../../parts/RdNotices';
import { RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { VisitorShell, VsConnectionFailed, VsFoot, VsLinkButton, VsLoadingText } from './visitorParts';
import { INVITE_PRIMARY, INVITE_VIEWER, RELATIONSHIP_LABEL, SCOPE_LABEL, type ExInvite } from './visitorData';

// 8단계 묶음 6 · /preview/visitor/invite — 가족 지정 초대 받기(판 3-8 기본·거절 확인 · 3-9 결과·상태).
// 정본: 3단계 캔버스 묶음 2-다 · 00-27 §9.1. 🔴 지정한 분의 연락처는 절대 넣지 않는다(성함·관계·권한 3개뿐, §9.1-3).
// 예시 값은 지어낸 값. 로그인은 미리보기 안에서 눌러 보는 흉내일 뿐이다(수락·거절 모두 서버를 부르지 않는다).

type View =
  | 'out' | 'in' | 'inViewer' | 'nameError' | 'busy'
  | 'declineAsk' | 'declineBusy'
  | 'accepted' | 'declined' | 'expired' | 'notfound' | 'loading' | 'offline';

const DEMOS: DemoOption[] = [
  { value: 'out', label: '로그인 전 — 대표 지정인 (3-8)', group: '기본' },
  { value: 'in', label: '로그인 후 (3-8)', group: '기본' },
  { value: 'inViewer', label: '로그인 후 — 연락 대상 · 기타(친구) (3-8)', group: '기본' },
  { value: 'nameError', label: '로그인 후 — 성함 오류 글 (3-8)', group: '기본' },
  { value: 'busy', label: '[수락] 처리 중... (3-8)', group: '기본' },
  { value: 'declineAsk', label: '거절 확인 창 (3-8)', group: '창' },
  { value: 'declineBusy', label: '거절 확인 창 · 처리 중… (3-8)', group: '창' },
  { value: 'accepted', label: '수락됨 (3-9)', group: '결과·상태' },
  { value: 'declined', label: '거절됨 (3-9)', group: '결과·상태' },
  { value: 'expired', label: '만료 (3-9)', group: '결과·상태' },
  { value: 'notfound', label: '없음 (3-9)', group: '결과·상태' },
  { value: 'loading', label: '불러오는 중 (3-9)', group: '결과·상태' },
  { value: 'offline', label: '접속 실패 (3-9)', group: '결과·상태' },
];

const NAME_REQUIRED = '성함을 입력해 주세요.';

function InviteHead({ data }: { data: ExInvite }) {
  const scope = SCOPE_LABEL[data.scope];
  // 지금 FamilyInvitePage와 같은 조립: 기타면 "기타(직접 쓴 말)"
  const relationship = `${RELATIONSHIP_LABEL[data.relationship] || data.relationship}${data.relationship === 'OTHER' && data.relationshipEtc ? `(${data.relationshipEtc})` : ''}`;
  return (
    <>
      <h1 className="rd-vs-name rd-vs-name--invite">
        <span className="rd-vs-name__line">{data.designatorName}님이 당신을</span>{' '}
        <span className="rd-vs-name__line">가족으로 지정했습니다</span>
      </h1>
      <p className="rd-vs-invite-desc">관계: {relationship}</p>
      {/* 모바일은 권한 줄을 "권한: 대표 지정인" / "(엔딩노트 전달 · 정산 실행 요청)" 두 줄로 끊는다(결정 기록 3-8) */}
      <p className="rd-vs-invite-desc rd-vs-invite-desc--tight">
        <span className="rd-vs-nobr">권한: {scope.label}</span>{' '}
        <span className="rd-vs-nobr">({scope.hint})</span>
      </p>
    </>
  );
}

export function VisitorInvitePage() {
  const [view, setView] = useState<View>('out');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  // 로그인 흉내 — 보기 상태를 고르거나 [로그인하고 계속하기]를 누르면 바뀐다. 거절 창은 열기 전 상태를 그대로 둔다.
  const [loggedIn, setLoggedIn] = useState(false);
  const data = view === 'inViewer' ? INVITE_VIEWER : INVITE_PRIMARY;

  const select = (v: string) => {
    if (v !== 'declineAsk' && v !== 'declineBusy') setLoggedIn(['in', 'inViewer', 'nameError', 'busy'].includes(v));
    setView(v as View);
    setError(v === 'nameError' ? NAME_REQUIRED : undefined);
    setName(v === 'busy' ? '홍길순' : '');
  };

  const accept = async () => {
    if (!name.trim()) {
      setError(NAME_REQUIRED);
      return;
    }
    setError(undefined);
    setView('busy');
    await sleep(700);
    setView('accepted');
  };

  const decline = async () => {
    setView('declineBusy');
    await sleep(700);
    setView('declined');
  };

  let body: React.ReactNode;
  if (view === 'loading') {
    body = <VsLoadingText />;
  } else if (view === 'offline') {
    body = <VsConnectionFailed onRetry={() => select('out')} />;
  } else if (view === 'expired') {
    // 버튼 없음
    body = <RdState kind="expired" title="초대 링크가 만료되었습니다." desc="보내신 분에게 새 링크를 다시 요청해 주세요." />;
  } else if (view === 'notfound') {
    body = (
      <RdState kind="missing" title="초대 링크를 찾을 수 없습니다." desc="이미 처리되었거나 잘못된 주소일 수 있습니다.">
        <VsLinkButton>이어봄 홈으로</VsLinkButton>
      </RdState>
    );
  } else if (view === 'accepted') {
    body = (
      <RdState kind="done" title="수락되었습니다." desc={`${INVITE_PRIMARY.designatorName}님의 가족으로 연결됐습니다.`}>
        <VsLinkButton kind="secondary" href="/preview/ending-note">내 엔딩노트 만들기</VsLinkButton>
        <VsLinkButton>이어봄 홈으로</VsLinkButton>
      </RdState>
    );
  } else if (view === 'declined') {
    // 거절한 분께 서비스 권유를 붙이지 않는다 — 홈으로 하나뿐(00-27 §9.1-4-2)
    body = (
      <RdState kind="declined" title="거절되었습니다." desc="아무 권한도 부여되지 않았습니다.">
        <VsLinkButton kind="secondary">이어봄 홈으로</VsLinkButton>
      </RdState>
    );
  } else {
    body = (
      <>
        <article className="rd-vs-card">
          <InviteHead data={data} />
          <div className="rd-vs-invite-body">
            <RdNotice>수락하시면 사망 통지 등 권한이 생깁니다. 거절하셔도 어떤 불이익도 없습니다.</RdNotice>
            {loggedIn ? (
              <>
                {/* 지정 때 적힌 이름은 화면에 나오지 않는다 — 수락 때 직접 입력(00-27 §9.1-4-3) */}
                <div className="rd-vs-invite-field">
                  <RdField label="성함" error={error}>
                    {(p) => (
                      <RdInput
                        {...p}
                        value={name}
                        placeholder="본인 성함을 입력해 주세요"
                        disabled={view === 'busy'}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError(undefined);
                        }}
                      />
                    )}
                  </RdField>
                </div>
                <div className="rd-vs-invite-btns">
                  <RdButton kind="secondary" place="dialog" disabled={view === 'busy'} onClick={() => setView('declineAsk')}>거절</RdButton>
                  <RdButton place="dialog" busy={view === 'busy'} busyText="처리 중..." onClick={accept}>수락</RdButton>
                </div>
              </>
            ) : (
              <>
                <p className="rd-vs-invite-ask">수락하려면 먼저 로그인해 주세요.</p>
                <RdButton place="dialog" className="rd-vs-invite-cta" onClick={() => select('in')}>로그인하고 계속하기</RdButton>
                <div className="rd-vs-textlink-wrap">
                  <button type="button" className="rd-vs-textlink" onClick={() => setView('declineAsk')}>로그인 없이 거절만 하기</button>
                </div>
              </>
            )}
          </div>
        </article>
        <VsFoot />
      </>
    );
  }

  return (
    <VisitorShell demo={{ value: view, options: DEMOS, onChange: select }}>
      <div className="rd-vs-wrap">{body}</div>
      {(view === 'declineAsk' || view === 'declineBusy') && (
        // 거절 확인 — 위험색을 쓰지 않는다: [거절]은 먹색 주 버튼 그대로(확정 ⑧)
        <RdDialog
          title="이 지정을 거절하시겠어요?"
          onClose={() => view === 'declineAsk' && setView(loggedIn ? 'in' : 'out')}
          // 처리 중에는 닫히지 않는다
          evenButtons
          footer={
            <>
              <RdButton kind="secondary" place="dialog" disabled={view === 'declineBusy'} onClick={() => setView(loggedIn ? 'in' : 'out')}>취소</RdButton>
              <RdButton place="dialog" busy={view === 'declineBusy'} busyText="처리 중…" onClick={decline}>거절</RdButton>
            </>
          }
        />
      )}
    </VisitorShell>
  );
}
