import React from 'react';

// 00-42 §5.2 ③ — 공개 링크 화면(부고·추모관·가족 초대)에서 "정말 없음(404)"과 "접속 실패(네트워크·5xx)"를 가르는 문구.
// 카톡으로 링크를 받은 사람이 서버가 잠깐 안 될 때 "부고장이 없다"로 오해하지 않게 한다. 문구는 사실만(00-39).
// 껍데기(.v2-obit-page·.v2-obit-content 등)는 호출하는 화면이 갖고 있어 이 컴포넌트는 안쪽 블록(.v2-obit-notfound)만 그린다.

interface ConnectionFailedProps {
  onRetry: () => void;
}

export const ConnectionFailed: React.FC<ConnectionFailedProps> = ({ onRetry }) => (
  <div className="v2-obit-notfound" role="alert">
    <p className="v2-obit-notfound-title">지금 연결이 원활하지 않습니다.</p>
    <p className="v2-obit-notfound-sub">잠시 후 다시 시도해 주세요.</p>
    <div className="v2-obit-invite-actions is-center v2-obit-invite-body">
      <button type="button" className="v2-btn-primary" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  </div>
);
