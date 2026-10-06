import React from 'react';
import { Loader2 } from 'lucide-react';

// docs 06-04 §6.4-11-10 — 사진 글자 인식·음성 변환 "작업 중" 화면과 알림 창. 문구는 스펙 그대로.
// 순번·지난 시간·예상 시간은 보여주지 않는다(개발자 — "최대 ○분" 한 줄로 충분).

// 요청을 보낸 뒤(업로드가 끝난 뒤)부터 마감까지 보여 주는 화면. 사진은 올리기 모달 안에서, 음성은 새 모달로 쓴다.
export const WorkingView: React.FC<{ maxMinutes: number }> = ({ maxMinutes }) => (
  <div className="v2-working" role="status" aria-live="polite">
    <Loader2 className="v2-spin" size={28} color="var(--v2-point)" aria-hidden="true" />
    <p className="v2-working-main">처리하고 있습니다. 최대 {maxMinutes}분까지 걸릴 수 있습니다.</p>
    <p className="v2-working-sub">이 화면을 닫으면 처음부터 다시 해야 합니다.</p>
  </div>
);

// 이유 한 줄(+ 안내) 알림 창. 문구는 서버가 이유별로 보낸 것·화면이 마감으로 만든 것을 그대로 쓴다.
export const HeavyNoticeDialog: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="v2-modal-overlay" role="alertdialog" aria-modal="true" aria-label="알림" onClick={(e) => e.stopPropagation()}>
    <div className="v2-modal is-ocr-confirm" onClick={(e) => e.stopPropagation()}>
      <p className="v2-ocr-confirm-text">{message}</p>
      <div className="v2-ocr-confirm-actions">
        <button type="button" className="v2-btn-primary" onClick={onClose}>확인</button>
      </div>
    </div>
  </div>
);
