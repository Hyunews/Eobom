import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RdButton, RdBadge } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdDate, RdField, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdDialog, useRdToast } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { StatusText } from '../partner/partnerCommon';
import { badgesOf } from './adminData';
import { AdminShellFor, AdminTitle } from './AdminShell';
import { AdminDemoBar, AdminPager, AdminViewNotice, SuperButton, useIsSuper, type AdminView } from './AdminKit';
import {
  ADMIN_ACCOUNTS, AUDIT_ACTIONS, AUDIT_ROWS, PARTNERS, PREVIEW_PAGE_SIZE, RATES, RATE_BASIS_LABEL, ymd, ymdHm,
  type AdminAccountRow, type AuditRow, type RateRow,
} from './adminSamples';

// 8단계 묶음 13 · 정산(요율 등록 틀 · 정산서) · 기록·설정(감사로그 · 운영자 계정). 정본: 01-05 §14-9·§8.2 · 00-37 §4.1·§3.3 · 판 6-23~6-25.
// 🔴 요율 값은 예시다 — 수수료 산정 기준은 사장님 결정 대기(pending-approvals)라 값은 넣지 않고 틀만 둔다.

// ───────────── 요율 등록 ─────────────
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const rateText = (r: RateRow) => (r.amount !== null ? won(r.amount) : r.rate !== null ? `${(r.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%` : '—');

export function AdminRatesPage() {
  const [rows, setRows] = useState<RateRow[]>(RATES);
  const [view, setView] = useState<AdminView>('ready');
  const [f, setF] = useState({ basis: '', amount: '', rate: '', partner: '', from: '', to: '', memo: '' });
  const [errs, setErrs] = useState<Partial<Record<'basis' | 'value' | 'from' | 'to', string>>>({});
  const [ends, setEnds] = useState<Record<string, string>>({});
  const [endErr, setEndErr] = useState<Record<string, string>>({});
  const toast = useRdToast();
  const partners = PARTNERS.filter((p) => p.status === 'APPROVED');

  const register = () => {
    const e: typeof errs = {};
    if (!f.basis) e.basis = '수수료 기준을 골라야 합니다.';
    const hasAmount = f.amount.trim() !== '';
    const hasRate = f.rate.trim() !== '';
    if (hasAmount === hasRate) e.value = '금액(원)과 정률(%) 중 하나만 입력해야 합니다.';
    else if (hasAmount && (!Number.isInteger(Number(f.amount)) || Number(f.amount) < 0)) e.value = '금액은 0 이상의 정수(원)여야 합니다.';
    else if (hasRate && !(Number(f.rate) >= 0 && Number(f.rate) <= 100)) e.value = '정률은 0~100% 사이여야 합니다.';
    if (!f.from) e.from = '적용 시작일을 입력해야 합니다.';
    if (f.from && f.to && f.to <= f.from) e.to = '적용 종료일은 적용 시작일보다 뒤여야 합니다.';
    const partnerName = f.partner ? (partners.find((p) => p.id === f.partner)?.companyName ?? null) : null;
    if (!e.from && rows.some((r) => r.basis === f.basis && r.partnerName === partnerName && r.effectiveFrom >= f.from)) {
      e.from = '같은 파트너·기준에 이 적용 시작일 이후로 이미 등록된 요율이 있습니다.';
    }
    setErrs(e);
    if (Object.keys(e).length) return;
    setRows((all) => [
      // 같은 범위에 열려 있던 이전 요율은 새 적용 시작일로 닫는다 — 기존 값은 고치지 않는다(§8.2)
      ...all.map((r) => (r.basis === f.basis && r.partnerName === partnerName && r.effectiveFrom < f.from && (!r.effectiveTo || r.effectiveTo > f.from) ? { ...r, effectiveTo: f.from } : r)),
      {
        id: `r${Date.now()}`,
        basis: f.basis,
        amount: hasAmount ? Number(f.amount) : null,
        rate: hasRate ? Number(f.rate) / 100 : null,
        partnerName,
        effectiveFrom: f.from,
        effectiveTo: f.to || null,
        memo: f.memo.trim() || null,
      },
    ]);
    setF({ basis: '', amount: '', rate: '', partner: '', from: '', to: '', memo: '' });
    toast.show('요율을 등록했습니다.');
  };

  const saveEnd = (r: RateRow) => {
    const to = ends[r.id] ?? r.effectiveTo ?? '';
    if (!to) return setEndErr({ ...endErr, [r.id]: '적용 종료일을 입력해야 합니다.' });
    if (to <= r.effectiveFrom) return setEndErr({ ...endErr, [r.id]: '적용 종료일은 적용 시작일보다 뒤여야 합니다.' });
    setEndErr({ ...endErr, [r.id]: '' });
    setRows((all) => all.map((x) => (x.id === r.id ? { ...x, effectiveTo: to } : x)));
    toast.show('적용 종료일을 저장했습니다.');
  };

  const sorted = [...rows].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return (
    <AdminShellFor current="rates" badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>요율 등록</AdminTitle>
        <p className="rd-pt-line">값은 예시입니다. 수수료 산정 기준은 결정 대기 중이라 실제 값을 넣지 않고 틀만 둡니다.</p>
        <AdminViewNotice view={view} />
        <div className="rd-ad-rates">
          <section className="rd-pt-detail__card rd-ad-rates__form" aria-label="요율 등록">
            <RdField label="수수료 기준" required error={errs.basis}>
              {(p) => (
                <div className="rd-ad-basis">
                  <RdSelect {...p} value={f.basis} onChange={(e) => setF({ ...f, basis: e.target.value })}>
                    <option value="">고르세요</option>
                    {Object.entries(RATE_BASIS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </RdSelect>
                  <RdBadge kind="faint">결정 대기</RdBadge>
                </div>
              )}
            </RdField>
            <RdField label="금액(원)" error={errs.value} help="금액과 정률 중 하나만 입력합니다.">
              {(p) => <RdInput {...p} type="number" inputMode="numeric" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />}
            </RdField>
            <RdField label="정률(%)">
              {(p) => <RdInput {...p} type="number" inputMode="decimal" min={0} max={100} step="0.01" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} />}
            </RdField>
            <RdField label="파트너(특약)" optional help="비워 두면 기본 요율입니다.">
              {(p) => (
                <RdSelect {...p} value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })}>
                  <option value="">기본 요율</option>
                  {partners.map((pp) => <option key={pp.id} value={pp.id}>{pp.companyName}</option>)}
                </RdSelect>
              )}
            </RdField>
            <RdField label="적용 시작" required error={errs.from}>
              {(p) => <RdDate {...p} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />}
            </RdField>
            <RdField label="적용 종료" optional error={errs.to}>
              {(p) => <RdDate {...p} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />}
            </RdField>
            <RdField label="메모" optional>
              {(p) => <RdInput {...p} maxLength={500} value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} />}
            </RdField>
            <div className="rd-ad-actions">
              <span className="rd-ad-actions__gap" />
              <SuperButton place="row" onClick={register}>등록</SuperButton>
            </div>
          </section>

          <section className="rd-ad-rates__history" aria-labelledby="rd-ad-rate-h">
            <h2 className="rd-ad-sec__title" id="rd-ad-rate-h">변경 이력</h2>
            <p className="rd-pt-line">이력 줄에서는 적용 종료 한 칸만 고칠 수 있습니다. 요율을 바꾸려면 새로 등록합니다.</p>
            {view !== 'ready' ? null : sorted.length === 0 ? (
              <RdState kind="empty" title="등록된 요율이 없습니다." />
            ) : (
              <ul className="rd-ad-ratelist">
                {sorted.map((r) => (
                  <li key={r.id} className="rd-ad-rateitem">
                    <div className="rd-ad-rateitem__top">
                      <b>{RATE_BASIS_LABEL[r.basis]}</b>
                      <span>{rateText(r)}</span>
                    </div>
                    <p className="rd-ad-rateitem__line">{r.partnerName ?? '기본 요율'} · {r.effectiveFrom} ~ {r.effectiveTo ?? '현재 유효'}</p>
                    {r.memo && <p className="rd-ad-rateitem__line">{r.memo}</p>}
                    <div className="rd-ad-rateitem__end">
                      <RdField label="적용 종료" error={endErr[r.id] || undefined}>
                        {(p) => <RdDate {...p} value={ends[r.id] ?? r.effectiveTo ?? ''} onChange={(e) => setEnds({ ...ends, [r.id]: e.target.value })} />}
                      </RdField>
                      <SuperButton kind="secondary" place="row" onClick={() => saveEnd(r)}>저장</SuperButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        {toast.node}
        <AdminDemoBar view={view} onView={setView} />
      </div>
    </AdminShellFor>
  );
}

// ───────────── 정산서 ─────────────
export function AdminSettlementPage() {
  return (
    <AdminShellFor current="settlement" badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>정산서</AdminTitle>
        <RdState kind="empty" title="준비 중" />
      </div>
    </AdminShellFor>
  );
}

// ───────────── 감사로그 ─────────────
export function AdminAuditPage() {
  const [params] = useSearchParams();
  const [view, setView] = useState<AdminView>('ready');
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState(params.get('result') === 'FAIL' ? 'FAIL' : params.get('result') === 'SUCCESS' ? 'SUCCESS' : '');
  const [applied, setApplied] = useState({ q: '', action: '', result });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const rows = view === 'ready' ? AUDIT_ROWS.filter((r) => (!applied.q || r.targetId.includes(applied.q)) && (!applied.action || r.action === applied.action) && (!applied.result || r.result === applied.result)) : [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PREVIEW_PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PREVIEW_PAGE_SIZE, page * PREVIEW_PAGE_SIZE);
  const chosen: AuditRow | undefined = rows.find((r) => r.id === selected);

  return (
    <AdminShellFor current="audit" badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>
          감사로그 <span className="rd-pt-count">총 {rows.length}건</span>
        </AdminTitle>
        <form
          className="rd-ad-filterrow"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ q: q.trim(), action, result });
            setPage(1);
            setSelected(null);
          }}
        >
          <div className="rd-ad-filterrow__search">
            <RdInput aria-label="대상 ID 검색" placeholder="대상 ID 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="rd-ad-filterrow__select">
            <RdSelect aria-label="행위" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">전체 행위</option>
              {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </RdSelect>
          </div>
          <div className="rd-ad-filterrow__select">
            <RdSelect aria-label="결과" value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="">전체 결과</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAIL">FAIL</option>
            </RdSelect>
          </div>
          <RdButton type="submit" kind="secondary" place="row">검색</RdButton>
        </form>
        <AdminViewNotice view={view} />
        {view === 'empty' || (view === 'ready' && rows.length === 0) ? (
          <RdState kind="empty" title="해당하는 기록이 없습니다." />
        ) : (
          view === 'ready' && (
            <>
              <table className="rd-ad-table rd-ad-table--audit">
                <thead>
                  <tr>
                    <th scope="col">시각</th><th scope="col">운영자</th><th scope="col">행위</th><th scope="col">대상 종류</th>
                    <th scope="col">대상 ID</th><th scope="col">사유</th><th scope="col">결과</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className={selected === r.id ? 'is-on' : undefined}>
                      <td>
                        <button type="button" className="rd-ad-table__pick" onClick={() => setSelected(selected === r.id ? null : r.id)} aria-pressed={selected === r.id}>
                          {ymdHm(r.createdAt)}
                        </button>
                      </td>
                      <td>{r.adminName || '—'}</td>
                      <td>{r.action}</td>
                      <td>{r.targetType}</td>
                      <td className="rd-ad-mono">{r.targetId || '—'}</td>
                      <td>{r.reason ?? '—'}</td>
                      <td><StatusText tone={r.result === 'SUCCESS' ? 'done' : 'danger'}>{r.result}</StatusText></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chosen && (
                <p className="rd-ad-auditdetail" role="status">
                  IP <b className="rd-ad-mono">{chosen.ip ?? '—'}</b> · 요청 번호 <b className="rd-ad-mono">{chosen.requestId ?? '—'}</b>
                </p>
              )}
              <AdminPager page={page} total={totalPages} count={rows.length} onChange={setPage} />
            </>
          )
        )}
        <AdminDemoBar view={view} onView={(v) => { setView(v); setPage(1); }} />
      </div>
    </AdminShellFor>
  );
}

// ───────────── 운영자 계정 ─────────────
type AcctDlg = { kind: 'role' | 'password'; id: string } | null;

export function AdminAccountsPage() {
  const isSuper = useIsSuper();
  const [rows, setRows] = useState<AdminAccountRow[]>(ADMIN_ACCOUNTS);
  const [view, setView] = useState<AdminView>('ready');
  const [dlg, setDlg] = useState<AcctDlg>(null);
  const toast = useRdToast();
  const target = dlg ? rows.find((r) => r.id === dlg.id)! : null;

  return (
    <AdminShellFor current="accounts" badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>운영자 계정</AdminTitle>
        {!isSuper ? (
          <RdState kind="blocked" title="SUPERADMIN만 볼 수 있는 화면입니다." desc="운영자 계정은 최고 관리자만 관리합니다." />
        ) : (
          <>
            <AdminViewNotice view={view} />
            {view === 'empty' ? (
              <RdState kind="empty" title="운영자 계정이 없습니다." />
            ) : (
              view === 'ready' && (
                <table className="rd-ad-table">
                  <thead>
                    <tr><th scope="col">이름</th><th scope="col">이메일</th><th scope="col">등급</th><th scope="col">생성일</th><th scope="col"><span className="rd-ad-visually-hidden">관리</span></th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.email}</td>
                        <td>{r.role}</td>
                        <td>{ymd(r.createdAt)}</td>
                        <td className="rd-ad-table__acts">
                          <SuperButton kind="secondary" place="row" onClick={() => setDlg({ kind: 'role', id: r.id })}>등급 변경</SuperButton>
                          <SuperButton kind="secondary" place="row" onClick={() => setDlg({ kind: 'password', id: r.id })}>비밀번호 변경</SuperButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
            <p className="rd-pt-line">계정 추가는 이 화면에서 하지 않습니다. 계정은 서버에서 직접 만듭니다.</p>
          </>
        )}
        {toast.node}
        {target && dlg?.kind === 'role' && (
          <RoleDialog
            target={target}
            superCount={rows.filter((r) => r.role === 'SUPERADMIN').length}
            onClose={() => setDlg(null)}
            onDone={(role) => { setRows((all) => all.map((r) => (r.id === target.id ? { ...r, role } : r))); setDlg(null); toast.show('등급을 바꿨습니다.'); }}
          />
        )}
        {target && dlg?.kind === 'password' && (
          <PasswordDialog target={target} onClose={() => setDlg(null)} onDone={() => { setDlg(null); toast.show('비밀번호를 바꿨습니다.'); }} />
        )}
        <AdminDemoBar view={view} onView={setView} />
      </div>
    </AdminShellFor>
  );
}

/** 등급 변경 = 확인 창 — 줄 안 고르기로 바로 바꾸지 않는다(최고 권한을 한 번 더 묻는다). 마지막 남은 SUPERADMIN은 낮출 수 없다(서버 거부 글을 창 안에 보인다). */
function RoleDialog({ target, superCount, onClose, onDone }: { target: AdminAccountRow; superCount: number; onClose: () => void; onDone: (role: AdminAccountRow['role']) => void }) {
  const [role, setRole] = useState<AdminAccountRow['role']>(target.role === 'SUPERADMIN' ? 'OPERATOR' : 'SUPERADMIN');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (role === target.role) return setError('이미 같은 등급입니다.');
    setBusy(true);
    await sleep(400);
    setBusy(false);
    if (target.role === 'SUPERADMIN' && role !== 'SUPERADMIN' && superCount <= 1) return setError('마지막 남은 SUPERADMIN은 낮출 수 없습니다.');
    onDone(role);
  };
  return (
    <RdDialog
      title="등급 변경"
      onClose={() => !busy && onClose()}
      evenButtons
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
          <SuperButton place="dialog" busy={busy} busyText="처리 중…" onClick={submit}>변경</SuperButton>
        </>
      }
    >
      <div className="rd-pt-dlgbody">
        <p className="rd-dialog__desc">{target.name}님의 등급을 {role}로 바꿉니다.</p>
        <RdField label="바꿀 등급">
          {(p) => (
            <RdSelect {...p} value={role} onChange={(e) => { setRole(e.target.value as AdminAccountRow['role']); setError(''); }}>
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="OPERATOR">OPERATOR</option>
            </RdSelect>
          )}
        </RdField>
        {error && <p className="rd-field__error" role="alert">{error}</p>}
      </div>
    </RdDialog>
  );
}

function PasswordDialog({ target, onClose, onDone }: { target: AdminAccountRow; onClose: () => void; onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [errs, setErrs] = useState<{ pw?: string; again?: string }>({});
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const e: typeof errs = {};
    if (pw.length < 8 || pw.length > 72) e.pw = '비밀번호는 8자 이상 72자 이하여야 합니다.';
    if (again !== pw) e.again = '비밀번호가 서로 다릅니다.';
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await sleep(400);
    onDone();
  };
  return (
    <RdDialog
      form
      width={560}
      eyebrow={`${target.name} · ${target.email}`}
      title="비밀번호 변경"
      onClose={() => !busy && onClose()}
      closeX
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
          <SuperButton place="dialog" busy={busy} busyText="처리 중…" onClick={submit}>변경</SuperButton>
        </>
      }
    >
      <div className="rd-pt-dlgbody">
        <p className="rd-dialog__desc">바꾸면 이 계정의 다른 로그인이 끊어지고 잠금도 풀립니다. 새 비밀번호는 기록에 남지 않습니다.</p>
        <RdField label="새 비밀번호" required error={errs.pw}>
          {(p) => <RdInput {...p} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />}
        </RdField>
        <RdField label="새 비밀번호 확인" required error={errs.again}>
          {(p) => <RdInput {...p} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />}
        </RdField>
      </div>
    </RdDialog>
  );
}
