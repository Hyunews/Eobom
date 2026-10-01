import React from 'react';

// 00-42 §5.2 ③ — 앱 최상단 ErrorBoundary. 화면 코드가 렌더 중 깨지면 빈 화면 대신 안내를 보여 준다.
// 🔴 오류는 서버 에러 기록으로 보내지 않는다(프론트 에러 수집은 00-42 L-3 후순위) — 콘솔에만 남는다.
// 라우터 바깥(main.tsx)에 걸리므로 PageLink·useNavigate를 쓰지 않고 일반 <a>·location을 쓴다.
// 문구는 사실만(00-39) — 원인 추측·사과·평가 없음.

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('화면 오류:', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="v2-obit-page">
        <div className="v2-obit-content v2-obit-notfound" role="alert">
          <p className="v2-obit-notfound-title">일시적인 오류가 발생했습니다.</p>
          <p className="v2-obit-notfound-sub">새로고침해도 같은 화면이 나오면 홈으로 이동해 주세요.</p>
          <div className="v2-obit-invite-actions is-center v2-obit-invite-body">
            <button type="button" className="v2-btn-primary" onClick={() => window.location.reload()}>
              새로고침
            </button>
            <button type="button" className="v2-btn-outline" onClick={() => window.location.assign('/')}>
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }
}
