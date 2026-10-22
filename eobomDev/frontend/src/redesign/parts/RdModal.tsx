import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RdButton, RdIconButton } from './RdButtons';
import { IconCheck, IconClose, IconWarn } from './icons';

// 00-44 §7-6 창 — 브라우저 기본 창(alert·confirm·prompt) 대신 이어봄 창.
// 데스크톱: 가운데 창 / 모바일(≤767): 아래에서 올라오는 판. 둘 다 같은 부품이고 CSS가 갈라 준다.

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** 창을 .rd-root 안에 그린다(색·글자 값이 .rd-root 아래에만 있어서). */
function useHost(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost((document.querySelector('.rd-root') as HTMLElement | null) ?? document.body);
  }, []);
  return host;
}

export interface RdDialogProps {
  /** 데스크톱 폭. 입력 창 560 · 그 밖 420(§7-6) · 960 = 입력과 결과를 나란히 두는 2단 창(1-8 사진 읽기 결과 · 1-19 상속세, 묶음 4에서 옵션 추가) */
  width?: 420 | 560 | 720 | 960;
  /** 윗글(업체명 등) */
  eyebrow?: string;
  title: string;
  /** 제목 위 경고 줄("되돌릴 수 없습니다") — 위험 확인 창 */
  warning?: string;
  /**
   * Esc · × · (입력 창이 아닐 때) 바깥 누르기. 두 버튼 중 하나를 고르는 창은 "취소"에 해당하는 동작을 넘긴다.
   * 🔴 입력 창(form)은 바깥 누르기로 닫지 않는다 — 데스크톱은 Esc·×·[취소], 모바일은 [취소]만(§7-6)
   */
  onClose: () => void;
  /** 오른쪽 위 × (입력 창만, 데스크톱에서만 보임) */
  closeX?: boolean;
  /** 버튼 줄: [보조][주]. 모바일 1 : 2 */
  footer: React.ReactNode;
  /** 모바일 버튼 1 : 1 (두 글자 길이가 비슷할 때) */
  evenButtons?: boolean;
  /** 위험 확인 창: 위험 테두리 */
  danger?: boolean;
  /** 처음 초점을 줄 칸/버튼의 선택자. 기본 = 첫 입력칸 또는 첫 버튼 */
  initialFocus?: string;
  /** 입력 창: 안 입력칸 바탕을 흰색으로 · 바깥 누르기로 닫지 않음 · 모바일 손잡이 */
  form?: boolean;
  /** 버튼 줄 위에 실선 + 안 입력칸 흰색 + 바깥 누르기로 닫지 않음(같은 창에서 내용 바꾸기 — 판 07 ⑥. 입력값이 들어 있다) */
  footLine?: boolean;
  children?: React.ReactNode;
}

export function RdDialog({
  width = 420,
  eyebrow,
  title,
  warning,
  onClose,
  closeX,
  footer,
  evenButtons,
  danger,
  initialFocus,
  form,
  footLine,
  children,
}: RdDialogProps) {
  const host = useHost();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!host) return;
    const node = ref.current;
    if (!node) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const target =
      (initialFocus ? node.querySelector<HTMLElement>(initialFocus) : null) ??
      node.querySelector<HTMLElement>('.rd-dialog__body input,.rd-dialog__body select,.rd-dialog__body textarea') ??
      node.querySelector<HTMLElement>('.rd-dialog__foot button') ??
      node;
    target.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [host, initialFocus]);

  if (!host) return null;
  return createPortal(
    <div
      className="rd-backdrop"
      onMouseDown={(e) => {
        // 입력 창은 바깥 누르기로 닫지 않는다(쓰던 내용 보호, §7-6). 그 밖의 창은 [취소]와 같은 동작.
        if (!form && !footLine && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={['rd-dialog', danger && 'rd-dialog--danger', form && 'rd-dialog--form', footLine && 'rd-dialog--line', evenButtons && 'rd-dialog--even'].filter(Boolean).join(' ')}
        style={{ ['--rd-dialog-w' as string]: `${width}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <span className="rd-dialog__handle" aria-hidden="true" />
        <div className="rd-dialog__head">
          <div className="rd-dialog__headtext">
            {warning && (
              <p className="rd-dialog__warning">
                <IconWarn size={16} />
                <span>{warning}</span>
              </p>
            )}
            {eyebrow && <p className="rd-t-eyebrow">{eyebrow}</p>}
            <h2 className="rd-dialog__title" id={titleId}>{title}</h2>
          </div>
          {closeX && (
            <RdIconButton label="닫기" className="rd-dialog__x" onClick={onClose}>
              <IconClose />
            </RdIconButton>
          )}
        </div>
        {children && <div className="rd-dialog__body">{children}</div>}
        <div className="rd-dialog__foot">{footer}</div>
      </div>
    </div>,
    host,
  );
}

/** ② 확인 창 — confirm() 자리. × 없음, 버튼 글자는 하는 일("그대로 두기 / 요청 취소"). */
export function RdConfirmDialog({
  title,
  desc,
  keepLabel,
  doLabel,
  onKeep,
  onDo,
}: {
  title: string;
  desc?: string;
  /** 보조(왼쪽): 하지 않고 닫기 */
  keepLabel: string;
  /** 주(오른쪽): 실행 */
  doLabel: string;
  onKeep: () => void;
  onDo: () => void;
}) {
  return (
    <RdDialog
      title={title}
      onClose={onKeep}
      evenButtons
      footer={
        <>
          <RdButton kind="secondary" place="dialog" onClick={onKeep}>{keepLabel}</RdButton>
          <RdButton place="dialog" onClick={onDo}>{doLabel}</RdButton>
        </>
      }
    >
      {desc && <p className="rd-dialog__desc">{desc}</p>}
    </RdDialog>
  );
}

/** ③ 위험 확인 창 — 지우기 전. 본문은 두 가지: 목록형(lost) · 한 줄 설명형(desc). 처음 초점은 [취소]. */
export function RdDangerDialog({
  title,
  desc,
  lost,
  cancelLabel = '취소',
  doLabel,
  doKind = 'danger',
  busyText = '삭제하는 중',
  busy,
  onCancel,
  onDo,
}: {
  title: string;
  /** 설명형 — 한 문단. 줄바꿈 문자 없이 문장을 이어 쓴다(§6-3-5) */
  desc?: string;
  /** 목록형 — 무엇이 지워지는지 */
  lost?: string[];
  cancelLabel?: string;
  doLabel: string;
  /** 실행 버튼 색. 기본 위험(빨강). 부고장 종료는 먹색 주 버튼 — 2단계 묶음 3 결정(빨강이 부정적으로 보임, 틀의 붉은 테두리·경고 딱지는 그대로) */
  doKind?: 'danger' | 'primary';
  /** 처리 중 글 (기본 "삭제하는 중") */
  busyText?: string;
  busy?: boolean;
  onCancel: () => void;
  onDo: () => void;
}) {
  return (
    <RdDialog
      danger
      evenButtons
      warning="되돌릴 수 없습니다"
      title={title}
      onClose={onCancel}
      initialFocus="[data-rd-cancel]"
      footer={
        <>
          <RdButton kind="secondary" place="dialog" data-rd-cancel="" onClick={onCancel}>{cancelLabel}</RdButton>
          <RdButton kind={doKind} place="dialog" busy={busy} busyText={busyText} onClick={onDo}>{doLabel}</RdButton>
        </>
      }
    >
      {desc && <p className="rd-dialog__desc">{desc}</p>}
      {lost && (
        <>
          <p className="rd-dialog__desc">아래 내용이 지워집니다.</p>
          <ul className="rd-dialog__lost">
            {lost.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </>
      )}
    </RdDialog>
  );
}

/** ④ 알림 창 — 꼭 읽어야 하는 일, 버튼 하나. 읽고 넘길 일은 RdToast. */
export function RdAlertDialog({ title, desc, onOk }: { title: string; desc?: string; onOk: () => void }) {
  return (
    <RdDialog title={title} onClose={onOk} footer={<RdButton place="dialog" onClick={onOk}>확인</RdButton>}>
      {desc && <p className="rd-dialog__desc">{desc}</p>}
    </RdDialog>
  );
}

/** ④ 짧은 알림 — 화면 아래 먹색, 4초 뒤 사라짐. 모바일은 바닥 버튼 줄 위. */
export function useRdToast(): { show: (message: string, tone?: 'ok' | 'warn') => void; node: React.ReactNode } {
  const [message, setMessage] = useState<string | null>(null);
  // 실패를 알릴 때는 'warn'(경고 그림) — 행정 가이드 판 2-3 ③
  const [tone, setTone] = useState<'ok' | 'warn'>('ok');
  const timer = useRef<number | undefined>(undefined);
  const host = useHost();
  const show = useCallback((m: string, t: 'ok' | 'warn' = 'ok') => {
    window.clearTimeout(timer.current);
    setMessage(m);
    setTone(t);
    timer.current = window.setTimeout(() => setMessage(null), 4000);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node =
    host && message
      ? createPortal(
          <div className="rd-toast" role="status" aria-live="polite">
            {tone === 'warn' ? <IconWarn size={18} /> : <IconCheck size={18} />}
            <span>{message}</span>
          </div>,
          host,
        )
      : null;
  return { show, node };
}

/**
 * ⑤ 로그인 가림막 — 뒤 화면을 바탕색 50%로 흐리게 + 가운데 카드. 문구는 한 틀(§6-3-7).
 * contained = 견본 쪽에서 상자 안에만 보이게 한다. 실제 화면에서는 쓰지 않는다(화면 전체를 가림).
 */
export function RdLoginGate({ screenName, onLogin, contained }: { screenName: string; onLogin?: () => void; contained?: boolean }) {
  return (
    <div className={`rd-gate${contained ? ' rd-gate--contained' : ''}`}>
      <div className="rd-gate__card" role="group" aria-label="로그인 안내">
        <p className="rd-gate__brand">이어봄</p>
        <p className="rd-gate__title">로그인이 필요합니다</p>
        <p className="rd-gate__desc">
          <span>{screenName}은(는)</span> <span className="rd-gate__rest">로그인 후 이용 가능합니다.</span>
        </p>
        <RdButton place="dialog" className="rd-gate__btn" onClick={onLogin}>로그인</RdButton>
      </div>
    </div>
  );
}
