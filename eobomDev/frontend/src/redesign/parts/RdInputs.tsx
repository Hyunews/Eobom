import React, { useId, useRef } from 'react';
import { RdButton, RdOptional, RdRequired } from './RdButtons';
import { IconCalendar, IconCamera, IconChevronDown, IconDoc, IconImage, IconUpload, IconErrorCircle, IconClose } from './icons';

// 00-44 §8 폼 · 입력. 필수는 "필수" 딱지(별표 없음), 오류는 칸마다(브라우저 기본 검증 안 씀).

export interface RdControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

/** 칸 한 개: 칸 이름(+필수) → 칸 → 도움말 또는 오류(도움말 자리를 대신한다, §8-3-2). */
export function RdField({
  label,
  required,
  optional,
  help,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  /** "선택" 딱지(회색). required와 같이 쓰지 않는다 */
  optional?: boolean;
  /** 필요한 칸에만 단다(§8-1) */
  help?: string;
  error?: string;
  children: (p: RdControlProps) => React.ReactNode;
}) {
  const base = useId();
  const id = `${base}-c`;
  const noteId = `${base}-n`;
  const note = error ?? help;
  return (
    <div className="rd-field">
      <label className="rd-field__label" htmlFor={id}>
        {label}
        {required && <RdRequired />}
        {optional && !required && <RdOptional />}
      </label>
      {children({ id, 'aria-describedby': note ? noteId : undefined, 'aria-invalid': error ? true : undefined })}
      {note && (
        error ? (
          <p className="rd-field__error" id={noteId} role="alert">
            <IconErrorCircle />
            <span>{error}</span>
          </p>
        ) : (
          <p className="rd-field__help" id={noteId}>{help}</p>
        )
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** 글 입력칸. 상태 5가지: 기본 · 초점(:focus) · 입력됨 · 오류(aria-invalid) · 사용 불가(disabled). */
export const RdInput = React.forwardRef<HTMLInputElement, InputProps>(function RdInput({ className, ...rest }, ref) {
  return <input ref={ref} className={['rd-input', className].filter(Boolean).join(' ')} {...rest} />;
});

/** 고르기(select) — 칸과 같은 틀 + 오른쪽 꺾쇠. 모바일은 휴대폰 기본 고르기 창. */
export function RdSelect({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="rd-select">
      <select className={['rd-input', className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
      <span className="rd-select__chev" aria-hidden="true"><IconChevronDown /></span>
    </span>
  );
}

/** 날짜 — 칸 + 오른쪽 달력 그림. 달력은 브라우저 기본. */
export function RdDate({ className, ...rest }: Omit<InputProps, 'type'>) {
  return (
    <span className="rd-date">
      <input type="date" className={['rd-input', className].filter(Boolean).join(' ')} {...rest} />
      <span className="rd-date__icon" aria-hidden="true"><IconCalendar /></span>
    </span>
  );
}

/** 긴 글 — 세로로만 늘림, 오른쪽 아래 "19 / 2,000자". */
export function RdTextarea({
  value,
  maxLength,
  className,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> & { value: string; maxLength: number }) {
  return (
    <div className="rd-textarea">
      <textarea className={['rd-input', 'rd-input--area', className].filter(Boolean).join(' ')} value={value} maxLength={maxLength} {...rest} />
      <p className="rd-textarea__count" aria-hidden="true">{value.length.toLocaleString()} / {maxLength.toLocaleString()}자</p>
    </div>
  );
}

/** 체크 — 상자 22, 줄 최소 44, 글자까지 누르는 자리(§6-5-8). */
export function RdCheck({ label, ...rest }: Omit<InputProps, 'type'> & { label: string }) {
  return (
    <label className="rd-choice">
      <input type="checkbox" className="rd-checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/** 라디오 묶음 — 모바일은 줄 전체가 누르는 자리 · 52 · 줄 사이 점선. */
export function RdRadioGroup({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="rd-radios">
      <legend className="rd-field__label">{legend}</legend>
      {options.map((o) => (
        <label className="rd-choice rd-choice--radio" key={o.value}>
          <input type="radio" className="rd-checkbox rd-radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export interface RdConsentItem {
  id: string;
  label: string;
  required?: boolean;
  /** 설명이 붙는 동의 줄: 제목과 같은 시작선, 한 줄 = 한 문장 */
  desc?: string;
}

/** 동의 묶음 — [모두 동의] + 하위 줄(+[보기]) + 묶음 아래 오류 글. */
export function RdConsentGroup({
  items,
  checked,
  onChange,
  error,
  onView,
}: {
  items: RdConsentItem[];
  checked: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  error?: string;
  onView?: (id: string) => void;
}) {
  const all = items.every((i) => checked[i.id]);
  const errId = useId();
  // 설명이 붙는 동의 줄 하나만 있으면 [모두 동의] 없이 한 칸으로 그린다(판 04 "설명이 붙는 동의 줄")
  const single = items.length === 1 && !!items[0].desc;
  return (
    <div>
      <div className={`rd-consent${single ? ' rd-consent--single' : ''}`} role="group" aria-describedby={error ? errId : undefined}>
        {!single && (
          <label className="rd-consent__all">
            <input
              type="checkbox"
              className="rd-checkbox"
              checked={all}
              onChange={(e) => onChange(Object.fromEntries(items.map((i) => [i.id, e.target.checked])))}
            />
            <span>모두 동의</span>
          </label>
        )}
        {items.map((i) => (
          <div className="rd-consent__item" key={i.id}>
            <label className={`rd-consent__lab${i.desc ? ' rd-consent__lab--desc' : ''}`}>
              <input
                type="checkbox"
                className={`rd-checkbox${i.desc ? '' : ' rd-checkbox--sm'}`}
                checked={!!checked[i.id]}
                onChange={(e) => onChange({ ...checked, [i.id]: e.target.checked })}
              />
              <span className="rd-consent__txt">
                <span className="rd-consent__title">
                  {i.required && !i.desc && '[필수] '}
                  {i.label}
                  {i.required && i.desc && <RdRequired narrow />}
                </span>
                {i.desc && <span className="rd-consent__desc">{i.desc}</span>}
              </span>
            </label>
            {onView && (
              <button type="button" className="rd-consent__view" onClick={() => onView(i.id)}>
                보기
              </button>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="rd-field__error" id={errId} role="alert">
          <IconErrorCircle />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** 파일 올리기 — 데스크톱: 점선 상자 + [파일 고르기] / 모바일: 끌어다 놓기가 없어 버튼 둘. */
export function RdFileDrop({ hint = 'JPG, PNG · 장당 10MB까지', onFiles }: { hint?: string; onFiles: (files: File[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const pick = (list: FileList | null) => {
    if (list && list.length) onFiles(Array.from(list));
  };
  return (
    <div>
      <div
        className={`rd-drop${over ? ' rd-drop--over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files);
        }}
      >
        <span className="rd-drop__icon"><IconUpload /></span>
        <p className="rd-drop__lead">여기에 끌어다 놓으세요</p>
        <p className="rd-t-small">{hint}</p>
        <RdButton kind="secondary" onClick={() => fileRef.current?.click()}>파일 고르기</RdButton>
      </div>
      <div className="rd-drop-m">
        <RdButton kind="secondary" onClick={() => camRef.current?.click()}>
          <IconCamera /> 사진 찍기
        </RdButton>
        <RdButton kind="secondary" onClick={() => fileRef.current?.click()}>
          <IconImage /> 앨범에서 고르기
        </RdButton>
        <p className="rd-t-small">{hint}</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

/** 올린 파일 줄 — 미리보기 48 + 파일 이름 + "2.4MB · 올림" + 지우기 44. */
export function RdFileRow({ name, meta, previewUrl, onRemove }: { name: string; meta: string; previewUrl?: string; onRemove: () => void }) {
  return (
    <li className="rd-file">
      <span className="rd-file__thumb">{previewUrl ? <img src={previewUrl} alt="" /> : <IconDoc size={22} />}</span>
      <span className="rd-file__main">
        <span className="rd-file__name">{name}</span>
        <span className="rd-t-small">{meta}</span>
      </span>
      <button type="button" className="rd-iconbtn" aria-label={`${name} 지우기`} onClick={onRemove}>
        <IconClose />
      </button>
    </li>
  );
}

/** 선택 조각 — 높이 40(누르는 자리 44), 고른 것 = 먹색 채움. 모바일은 한 줄 옆으로 밀어 넘김. */
export function RdChips({
  label,
  options,
  value,
  onChange,
  multiple,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
}) {
  const toggle = (o: string) => {
    const on = value.includes(o);
    if (multiple) onChange(on ? value.filter((v) => v !== o) : [...value, o]);
    else onChange(on ? [] : [o]);
  };
  return (
    <div className="rd-chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o} className="rd-chip" aria-pressed={value.includes(o)} onClick={() => toggle(o)}>
          <span>{o}</span>
        </button>
      ))}
    </div>
  );
}

/** 거르기 줄 — 고르기 칸 둘 + [찾기] 한 줄, 위 실선. 모바일은 칸 2열 + [찾기] 가득 폭. */
export function RdFilterRow({ children, onSearch }: { children: React.ReactNode; onSearch: () => void }) {
  return (
    <div className="rd-filter">
      <div className="rd-filter__fields">{children}</div>
      <RdButton onClick={onSearch}>찾기</RdButton>
    </div>
  );
}

/** 쪽 맨 아래 저장 줄(§7-1 ④) — 왼쪽 "마지막 저장 …" · 오른쪽 버튼. 모바일은 화면 아래 고정. 오류 요약 한 줄은 버튼 왼쪽(§8-3-2 ③). */
export function RdSaveBar({
  savedAt,
  errorCount,
  children,
}: {
  savedAt?: string;
  errorCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rd-savebar">
      <p className="rd-savebar__saved">{savedAt ? `마지막 저장 ${savedAt}` : ''}</p>
      <div className="rd-savebar__right">
        {!!errorCount && (
          <p className="rd-savebar__error" role="alert">
            <IconErrorCircle />
            <span>확인이 필요한 항목이 {errorCount}개 있습니다.</span>
          </p>
        )}
        <div className="rd-btnrow rd-btnrow--bar">{children}</div>
      </div>
    </div>
  );
}
