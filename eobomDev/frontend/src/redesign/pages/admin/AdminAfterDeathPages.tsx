import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdCheck, RdField, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdTabs } from '../../parts/RdNav';
import { RdConfirmDialog, RdDangerDialog, RdDialog, useRdToast } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { badgesOf } from './adminData';
import { AdminDemoSelect, AdminShellFor, AdminTitle, IconKey } from './AdminShell';
import {
  AdminDemoBar, AdminDetailCard, AdminKv, AdminListScreen, AdminRowText, AdminViewNotice, SuperButton, useIsSuper, type AdminView,
} from './AdminKit';
import {
  ARCHIVE_TODOS, DEATH_VERIFICATIONS, DV_METHOD_LABEL, DV_REJECT_LABEL, PURGE_ITEMS, PURGE_KIND_LABEL, PURGE_KIND_TIP, PURGE_LOGS,
  daysSince, dvDeadline, remaining, ymd, ymdHm,
  type ArchiveTodo, type DeathVerificationRow, type PurgeItem, type PurgeKind,
} from './adminSamples';

// 8단계 묶음 13 · 사후 처리 — 사망 확인 · 유족메시지 파기. 정본: 00-41 §5.3 · 00-37 §4.1 · 06-05 §5.6-8-3 · 판 6-20·6-22.
// 🔴 본문 열람 화면은 만들지 않는다(§3.1): 응답에 엔딩노트 본문·섹션 제목·편지·편지 제목·회원 이름이 없다.

// ───────────── 사망 확인 ─────────────
const DEADLINE_TAG = {
  'over-due': { tone: 'danger', text: '대외 마감 초과' },
  'over-target': { tone: 'state', text: '내부 목표 초과' },
  ok: { tone: 'state', text: '접수' },
} as const;

export function AdminDeathPage() {
  const isSuper = useIsSuper();
  // 목록은 REQUESTED만, dueAt 오래된 순(00-41 §5.3)
  const [rows, setRows] = useState<DeathVerificationRow[]>([...DEATH_VERIFICATIONS].sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
  const [method, setMethod] = useState('FUNERAL_HALL');
  const [rejectCode, setRejectCode] = useState('HALL_NOT_FOUND');
  const [dlg, setDlg] = useState<{ kind: 'verify' | 'reject'; id: string } | null>(null);
  const toast = useRdToast();

  const remove = (id: string) => setRows((all) => all.filter((r) => r.id !== id));
  const find = (id: string) => rows.find((r) => r.id === id)!;

  const detail = (id: string) => {
    const r = find(id);
    const tag = DEADLINE_TAG[dvDeadline(r)];
    const hasHall = !!r.funeralHallName;
    // 장례식장 이름이 없는 건은 "장례식장 전화 확인"을 고를 수 없다(지금 코드와 같다) — 그때는 기타만 남는다
    const methodValue = !hasHall && method === 'FUNERAL_HALL' ? 'OTHER' : method;
    return (
      <AdminDetailCard title={`故 ${r.deceasedName}`} tone={tag.tone} status={tag.text}>
        <AdminKv
          rows={[
            ['접수', ymdHm(r.requestedAt)],
            ['대외 마감', `${ymdHm(r.dueAt)} (${remaining(r.dueAt)})`],
            ['내부 목표', `${ymdHm(r.targetAt)} (${remaining(r.targetAt)})`],
            ['회원 이름', r.memberName],
            ['장례식장', r.funeralHallName ? `${r.funeralHallName} · ${r.funeralHallPhone}` : '—'],
            ['요청자', `${r.requesterName} (${r.requesterRelation})`],
            ['요청자 전화번호', `${r.requesterPhone} — 되걸기용`],
          ]}
        />
        <div className="rd-ad-dvrow">
          <div className="rd-ad-dvrow__field">
            <RdField label="확인 방법">
              {(p) => (
                <RdSelect {...p} value={methodValue} onChange={(e) => setMethod(e.target.value)}>
                  {hasHall && <option value="FUNERAL_HALL">{DV_METHOD_LABEL.FUNERAL_HALL}</option>}
                  <option value="OTHER" disabled={!isSuper}>{DV_METHOD_LABEL.OTHER}{!isSuper ? ' — SUPERADMIN만' : ''}</option>
                </RdSelect>
              )}
            </RdField>
            <span className="rd-ad-dvrow__key"><IconKey size={16} label="기타는 SUPERADMIN만" />기타는 SUPERADMIN만</span>
          </div>
          <RdButton place="row" onClick={() => setDlg({ kind: 'verify', id: r.id })}>확인 완료</RdButton>
        </div>
        <div className="rd-ad-dvrow">
          <div className="rd-ad-dvrow__field">
            <RdField label="반려 사유">
              {(p) => (
                <RdSelect {...p} value={rejectCode} onChange={(e) => setRejectCode(e.target.value)}>
                  {Object.entries(DV_REJECT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </RdSelect>
              )}
            </RdField>
          </div>
          <RdButton kind="danger" place="row" onClick={() => setDlg({ kind: 'reject', id: r.id })}>반려</RdButton>
        </div>
      </AdminDetailCard>
    );
  };

  const target = dlg ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="death"
      title="사망 확인"
      items={rows.map((r) => {
        const tag = DEADLINE_TAG[dvDeadline(r)];
        return {
          id: r.id,
          node: <AdminRowText top={`故 ${r.deceasedName}`} tone={tag.tone} status={tag.text} lines={[`접수 ${ymdHm(r.requestedAt)}`, `대외 마감 ${remaining(r.dueAt)}`]} />,
        };
      })}
      renderDetail={detail}
      emptyTitle="대기 중인 사망 확인 요청이 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'verify' && (
            <RdConfirmDialog
              title="확인 완료로 처리할까요?"
              desc={`故 ${target.deceasedName} · ${DV_METHOD_LABEL[!target.funeralHallName && method === 'FUNERAL_HALL' ? 'OTHER' : method]}. 처리하면 요청자에게 기록이 열립니다.`}
              keepLabel="취소"
              doLabel="확인"
              onKeep={() => setDlg(null)}
              onDo={() => { remove(target.id); setDlg(null); toast.show('확인 완료로 처리했습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'reject' && (
            <RdDangerDialog
              title="사망 확인을 반려할까요?"
              desc={`故 ${target.deceasedName} · ${DV_REJECT_LABEL[rejectCode]}. 요청자에게는 사유 코드만 전해지고, 반려한 요청은 되돌릴 수 없습니다.`}
              doLabel="확인"
              busyText="처리 중…"
              onCancel={() => setDlg(null)}
              onDo={() => { remove(target.id); setDlg(null); toast.show('반려했습니다.'); }}
            />
          )}
        </>
      }
    />
  );
}

// ───────────── 유족메시지 파기 ─────────────
type PurgeDemo = 'ok' | 'server' | 'network';
const PURGE_DEMOS = [
  { value: 'ok', label: '성공' },
  { value: 'server', label: '파기 실패 (서버 오류 글)' },
  { value: 'network', label: '통신 오류' },
];
const KINDS = Object.keys(PURGE_KIND_LABEL) as PurgeKind[];

export function AdminPurgePage() {
  const [tab, setTab] = useState('wait');
  const [view, setView] = useState<AdminView>('ready');
  const [items, setItems] = useState<PurgeItem[]>(PURGE_ITEMS);
  const [todos, setTodos] = useState<ArchiveTodo[]>(ARCHIVE_TODOS);
  const [kind, setKind] = useState<'' | PurgeKind>('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState<PurgeDemo>('ok');
  const toast = useRdToast();

  const shown = view === 'ready' ? items.filter((i) => !kind || i.kind === kind) : [];
  const allOn = shown.length > 0 && shown.every((i) => picked.has(i.key));
  const toggle = (key: string) => setPicked((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  return (
    <AdminShellFor current="purge" badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>유족메시지 파기</AdminTitle>

        {/* 직접 할 일 — 편지 제목·회원 이름은 넣지 않는다(06-05 §5.6-8-1-1) */}
        <section className="rd-ad-todobox" aria-labelledby="rd-ad-todo-h">
          <h2 className="rd-ad-todobox__title" id="rd-ad-todo-h">직접 할 일 ({todos.length}건)</h2>
          <p className="rd-pt-line">서버가 지운 파일의 보관 사본입니다. Cloudflare에서 직접 지운 뒤 [완료 표시]를 누르세요.</p>
          {todos.length === 0 ? (
            <p className="rd-pt-line">직접 할 일이 없습니다.</p>
          ) : (
            <ul className="rd-ad-todolist">
              {todos.map((t) => (
                <li key={t.id}>
                  <code className="rd-ad-mono">{t.fileKey}</code>
                  <span>{t.bucket}</span>
                  <span>1단계 {ymd(t.step1At)}</span>
                  <RdButton kind="secondary" place="row" onClick={() => { setTodos((all) => all.filter((x) => x.id !== t.id)); toast.show('완료로 표시했습니다.'); }}>완료 표시</RdButton>
                </li>
              ))}
            </ul>
          )}
        </section>

        <RdTabs label="파기" tabs={[{ value: 'wait', label: '파기 대기' }, { value: 'log', label: '파기 기록' }]} value={tab} onChange={setTab} />

        <AdminViewNotice view={view} />
        {tab === 'wait' && view !== 'loading' && view !== 'loadfail' && (
          <>
            <div className="rd-ad-chips" role="group" aria-label="종류 거르기">
              <button type="button" className={`rd-ad-chip${kind === '' ? ' is-on' : ''}`} aria-pressed={kind === ''} onClick={() => setKind('')}>전체</button>
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`rd-ad-chip${kind === k ? ' is-on' : ''}`}
                  aria-pressed={kind === k}
                  data-tip={PURGE_KIND_TIP[k]}
                  onClick={() => setKind(k)}
                >
                  {PURGE_KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <p className="rd-pt-line">삭제 뒤 30일이 지난 것만 나옵니다</p>
            {shown.length === 0 ? (
              <RdState kind="empty" title="파기할 것이 없습니다." />
            ) : (
              <table className="rd-ad-table">
                <thead>
                  <tr>
                    <th scope="col" className="rd-ad-table__chk"><RdCheck label="" aria-label="모두 고르기" checked={allOn} onChange={() => setPicked(allOn ? new Set() : new Set(shown.map((i) => i.key)))} /></th>
                    <th scope="col">종류</th>
                    <th scope="col">대상</th>
                    <th scope="col">삭제 날짜</th>
                    <th scope="col">경과일</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((i) => (
                    <tr key={i.key}>
                      <td className="rd-ad-table__chk"><RdCheck label="" aria-label={`${PURGE_KIND_LABEL[i.kind]} ${i.target} 고르기`} checked={picked.has(i.key)} onChange={() => toggle(i.key)} /></td>
                      <td>{PURGE_KIND_LABEL[i.kind]}</td>
                      <td>{i.target}</td>
                      <td>{ymd(i.deletedAt)}</td>
                      <td>{daysSince(i.deletedAt)}일</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="rd-ad-stickybar">
              <span className="rd-ad-stickybar__n">선택 {picked.size}건</span>
              <SuperButton kind="danger" place="row" disabled={picked.size === 0} onClick={() => setOpen(true)}>선택 파기</SuperButton>
            </div>
          </>
        )}
        {tab === 'log' && view === 'ready' && (
          <table className="rd-ad-table">
            <thead>
              <tr><th scope="col">실행 시각</th><th scope="col">실행자</th><th scope="col">내용</th></tr>
            </thead>
            <tbody>
              {PURGE_LOGS.map((l) => (
                <tr key={l.id}>
                  <td>{ymdHm(l.at)}</td>
                  <td>{l.by}</td>
                  <td>{KINDS.filter((k) => l.counts[k]).map((k) => `${PURGE_KIND_LABEL[k]} ${l.counts[k]}`).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {toast.node}
        {open && (
          <PurgeExecuteDialog
            count={picked.size}
            demo={demo}
            onClose={() => setOpen(false)}
            onDone={() => {
              setItems((all) => all.filter((i) => !picked.has(i.key)));
              setPicked(new Set());
              setOpen(false);
              toast.show('파기를 실행했습니다.');
            }}
          />
        )}
        <div className="rd-demo">
          <AdminDemoSelect label="미리보기 전용 · 파기 실행 결과" value={demo} options={PURGE_DEMOS} onChange={(v) => setDemo(v as PurgeDemo)} />
        </div>
        <AdminDemoBar view={view} onView={setView} />
      </div>
    </AdminShellFor>
  );
}

/**
 * 파기 실행 창 — 확인 창 420(뒤 화면 흐림 + 먹색 35%) · 창 안 [파기 실행]에도 열쇠 · 처리 중 "처리 중..."(입력·취소 흐림, 바깥 눌러도 안 닫힘) · 오류 글 4종 그대로.
 * 정본 동작 = 06-05 §5.6-8-3: 대상 건수를 직접 입력하고 비밀번호를 다시 입력해야 실행된다.
 */
function PurgeExecuteDialog({ count, demo, onClose, onDone }: { count: number; demo: PurgeDemo; onClose: () => void; onDone: () => void }) {
  const [typed, setTyped] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setError('');
    if (Number(typed) !== count) return setError(`입력한 건수가 선택된 건수(${count}건)와 다릅니다.`);
    if (!pw) return setError('비밀번호를 입력해주세요.');
    setBusy(true);
    await sleep(900);
    if (demo === 'server') {
      setBusy(false);
      return setError('파기 처리에 실패했습니다.');
    }
    if (demo === 'network') {
      setBusy(false);
      return setError('서버와 통신 중 오류가 발생했습니다.');
    }
    onDone();
  };

  return (
    <RdDialog
      form
      danger
      width={420}
      warning="되돌릴 수 없습니다"
      title="파기 실행"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
          <SuperButton kind="danger" place="dialog" busy={busy} busyText="처리 중..." onClick={run}>파기 실행</SuperButton>
        </>
      }
    >
      <div className={`rd-pt-dlgbody${busy ? ' is-busy' : ''}`}>
        <p className="rd-dialog__desc">선택한 {count}건을 지금 파기합니다. 건수를 직접 입력하고 비밀번호를 다시 입력하면 실행됩니다.</p>
        <RdField label={`대상 건수 입력 (${count}건)`}>
          {(p) => <RdInput {...p} type="number" inputMode="numeric" disabled={busy} value={typed} placeholder={String(count)} onChange={(e) => setTyped(e.target.value)} />}
        </RdField>
        <RdField label="비밀번호 재입력">
          {(p) => <RdInput {...p} type="password" autoComplete="current-password" disabled={busy} value={pw} onChange={(e) => setPw(e.target.value)} />}
        </RdField>
        {error && <p className="rd-field__error" role="alert">{error}</p>}
      </div>
    </RdDialog>
  );
}
