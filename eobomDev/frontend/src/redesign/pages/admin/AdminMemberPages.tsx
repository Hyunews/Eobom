import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdButton } from '../../parts/RdButtons';
import { RdDangerDialog, useRdToast } from '../../parts/RdModal';
import { RdFold } from '../../parts/RdCards';
import { RdTextLink } from '../../parts/RdButtons';
import { adminPath } from './adminData';
import {
  AdminDetailCard, AdminFilterRow, AdminKv, AdminListScreen, AdminNote, AdminRowText, ReasonDialog, SuperButton,
} from './AdminKit';
import { useAdminPreview } from './AdminShell';
import {
  MEMBERS, MEMORIALS, OBITUARIES, OBIT_LABEL, OBIT_TONE, VISIBILITY_LABEL, monthDay, ymd,
  type MemberRow, type MemorialAdminRow, type ObituaryAdminRow,
} from './adminSamples';

// 8단계 묶음 13 · 회원 · 추모관 · 부고장. 정본: 00-37 §4.1(회원 정지 · 탈퇴 대리 접수 · 회원/추모관/부고장 표) · §3.3 · 판 6-18·6-21.
// 회원 [정지]·[해제]·[탈퇴 요청 처리]는 SUPERADMIN만 — 열쇠 버튼(서버도 requireSuperAdmin). 추모관 [내리기]·부고장 [종료]는 열쇠 없음.

const WITHDRAW_GRACE_DAYS = 30;

// ───────────── 회원 ─────────────
export function AdminMembersPage() {
  const navigate = useNavigate();
  const { search } = useAdminPreview();
  const [rows, setRows] = useState<MemberRow[]>(MEMBERS);
  const [q, setQ] = useState('');
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [dlg, setDlg] = useState<{ kind: 'open' | 'suspend' | 'unsuspend' | 'withdraw'; id: string } | null>(null);
  const toast = useRdToast();

  const shown = rows.filter((r) => !q || r.name.includes(q) || (r.email ?? '').includes(q));
  const patch = (id: string, p: Partial<MemberRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const find = (id: string) => rows.find((r) => r.id === id)!;
  const go = (key: string, pick: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(search);
    p.set('pick', pick);
    navigate(`${adminPath(key)}?${p.toString()}`);
  };

  const detail = (id: string) => {
    const r = find(id);
    // 회원 상세 열기 = 입력 창(열람 사유 필수, 00-37 §7 #1 · 서버 ?reason=). 열기 전에는 개인정보를 보이지 않는다.
    if (!opened.has(r.id)) {
      return (
        <AdminDetailCard title={r.name} tone="faint" status={r.role}>
          <p className="rd-ad-note">회원 상세를 열면 열람 기록이 남습니다. 열람 사유를 입력해야 열 수 있습니다.</p>
          <div className="rd-ad-actions">
            <span className="rd-ad-actions__gap" />
            <RdButton place="row" onClick={() => setDlg({ kind: 'open', id: r.id })}>상세 열기</RdButton>
          </div>
        </AdminDetailCard>
      );
    }
    const suspended = !!r.suspendedAt;
    const inGrace = !!r.deletionScheduledAt;
    return (
      <AdminDetailCard title={r.name} tone={suspended ? 'danger' : 'faint'} status={suspended ? '정지됨' : r.role}>
        <AdminKv
          rows={[
            ['이메일', r.email ?? '(이메일 없음)'],
            ['역할', r.role],
            ['가입일', ymd(r.createdAt)],
            ['방명록 작성', `${r.guestbookCount}건`],
          ]}
        />
        <div className="rd-ad-sub">
          <h3 className="rd-ad-intro__title">추모관 ({r.memorials.length}건)</h3>
          {r.memorials.length === 0 ? (
            <p className="rd-pt-line">없음</p>
          ) : (
            <ul className="rd-ad-sublist">
              {r.memorials.map((m) => (
                <li key={m.id}>
                  故 {m.deceasedName} · {VISIBILITY_LABEL[m.visibility]}{' '}
                  <RdTextLink href={`${adminPath('memorials')}?pick=${m.id}`} onClick={go('memorials', m.id)}>보기</RdTextLink>
                </li>
              ))}
            </ul>
          )}
        </div>
        {suspended && (
          <AdminNote label="정지 사유:">
            {r.suspendReason} ({ymd(r.suspendedAt!)} 정지) — 회원에게는 고정 문구만 보입니다.
          </AdminNote>
        )}
        {inGrace && <AdminNote label="탈퇴 유예 중:">파기 예정 {monthDay(r.deletionScheduledAt!)}. 회원이 로그인해 직접 취소할 수 있습니다.</AdminNote>}
        <div className="rd-ad-actions">
          <span className="rd-ad-actions__gap" />
          {suspended ? (
            <SuperButton place="row" onClick={() => setDlg({ kind: 'unsuspend', id: r.id })}>해제</SuperButton>
          ) : (
            <SuperButton kind="danger" place="row" onClick={() => setDlg({ kind: 'suspend', id: r.id })}>정지</SuperButton>
          )}
          <SuperButton
            kind="danger"
            place="row"
            blockedReason={inGrace ? `탈퇴 유예 중 · 파기 예정 ${monthDay(r.deletionScheduledAt!)}` : undefined}
            onClick={() => setDlg({ kind: 'withdraw', id: r.id })}
          >
            탈퇴 요청 처리
          </SuperButton>
        </div>
      </AdminDetailCard>
    );
  };

  const target = dlg ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="members"
      title="회원"
      resetKey={q}
      filters={<AdminFilterRow search={q} onSearch={setQ} searchLabel="이름 또는 이메일 검색" placeholder="이름 · 이메일" />}
      items={shown.map((r) => ({
        id: r.id,
        node: (
          <AdminRowText
            top={r.name}
            tone={r.suspendedAt ? 'danger' : 'faint'}
            status={r.suspendedAt ? `${r.role} · 정지됨` : r.role}
            lines={[r.email ?? '(이메일 없음)', `가입 ${ymd(r.createdAt)}`]}
          />
        ),
      }))}
      renderDetail={detail}
      emptyTitle="해당하는 회원이 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'open' && (
            <ReasonDialog
              eyebrow={`${target.name} 회원`}
              title="상세 열기"
              desc="이 상세 조회는 기록됩니다. 열람 사유를 입력해 주세요."
              label="열람 사유"
              confirmLabel="열기"
              onClose={() => setDlg(null)}
              onSubmit={() => { setOpened((s) => new Set(s).add(target.id)); setDlg(null); }}
            />
          )}
          {target && dlg?.kind === 'suspend' && (
            <ReasonDialog
              eyebrow={`${target.name} 회원`}
              title="정지"
              warning="정지하면 이 회원은 로그인할 수 없습니다"
              desc="사유를 입력해 주세요(운영 기록과 이 화면에 남습니다). 약관을 위반한 경우에 씁니다. 글 하나가 문제라면 정지 대신 추모관 [내리기]·부고장 [종료]·방명록 [숨기기]가 먼저입니다."
              label="정지 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { suspendedAt: new Date().toISOString(), suspendReason: t }); setDlg(null); toast.show('회원을 정지했습니다.'); }}
            >
              {/* 정지는 이 회원이 연 글을 건드리지 않는다 — 운영자가 글마다 판단하게 건수와 링크만 보인다(내용은 넣지 않는다, §3.1) */}
              <div className="rd-ad-posts">
                <p className="rd-ad-posts__line">이 회원이 연 추모관 {target.memorials.length}건 · 부고장 {target.obituaries.length}건 — 정지해도 그대로 공개됩니다.</p>
                {(target.memorials.length > 0 || target.obituaries.length > 0) && (
                  <ul className="rd-ad-sublist">
                    {target.memorials.map((m) => (
                      <li key={m.id}>추모관 · 故 {m.deceasedName} <RdTextLink href="#" onClick={go('memorials', m.id)}>보기</RdTextLink></li>
                    ))}
                    {target.obituaries.map((o) => (
                      <li key={o.id}>부고장 · 故 {o.deceasedName} <RdTextLink href="#" onClick={go('obituaries', o.id)}>보기</RdTextLink></li>
                    ))}
                  </ul>
                )}
              </div>
            </ReasonDialog>
          )}
          {target && dlg?.kind === 'unsuspend' && (
            <ReasonDialog
              eyebrow={`${target.name} 회원`}
              title="정지 해제"
              desc="사유를 입력해 주세요(운영 기록에 남습니다). 해제하면 바로 다시 로그인할 수 있습니다."
              label="해제 사유"
              onClose={() => setDlg(null)}
              onSubmit={() => { patch(target.id, { suspendedAt: null, suspendReason: null }); setDlg(null); toast.show('정지를 해제했습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'withdraw' && (
            <ReasonDialog
              eyebrow={`${target.name} 회원`}
              title="탈퇴 요청 처리"
              warning="회원 본인 대신 탈퇴를 접수합니다"
              desc={`회원 본인 또는 위임장을 낸 대리인이 메일·서면으로 요청한 경우에만 접수합니다. 접수하면 이 회원의 추모관·부고장이 닫히고 ${WITHDRAW_GRACE_DAYS}일 뒤 파기 대상이 됩니다. 유예는 ${WITHDRAW_GRACE_DAYS}일로 고정이며, 그 안에 회원이 로그인하면 직접 취소할 수 있습니다. 운영자가 대신 취소할 수는 없습니다.`}
              label="접수 사유"
              hint="예: 10-23 메일 요청 · 가입 메일과 같은 주소 확인"
              confirmLabel="탈퇴 접수"
              danger
              onClose={() => setDlg(null)}
              onSubmit={() => {
                const at = new Date(Date.now() + WITHDRAW_GRACE_DAYS * 86_400_000).toISOString();
                patch(target.id, { deletionScheduledAt: at });
                setDlg(null);
                toast.show(`탈퇴를 접수했습니다. 파기 예정은 ${monthDay(at)}입니다.`);
              }}
            />
          )}
        </>
      }
    />
  );
}

// ───────────── 추모관 ─────────────
export function AdminMemorialsPage() {
  const [rows, setRows] = useState<MemorialAdminRow[]>(MEMORIALS);
  const [dlg, setDlg] = useState<{ kind: 'hide' | 'unhide' | 'guest'; id: string; gid?: string } | null>(null);
  const toast = useRdToast();

  const patch = (id: string, p: Partial<MemorialAdminRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const find = (id: string) => rows.find((r) => r.id === id)!;
  const tag = (r: MemorialAdminRow) => (r.hidden ? { tone: 'danger' as const, text: '운영자가 내림' } : { tone: 'faint' as const, text: VISIBILITY_LABEL[r.visibility] });

  const detail = (id: string) => {
    const r = find(id);
    const t = tag(r);
    const visible = r.guestbook.filter((g) => !g.hidden).length;
    return (
      <AdminDetailCard title={`故 ${r.deceasedName}`} tone={t.tone} status={t.text}>
        <AdminKv rows={[['개설자', r.ownerName], ['공개 범위', VISIBILITY_LABEL[r.visibility]], ['개설일', ymd(r.createdAt)]]} />
        {r.hidden && <AdminNote label="내린 사유:">{r.hidden.reason} ({ymd(r.hidden.at)})</AdminNote>}
        <RdFold title={`방명록 (${visible}건)`}>
          {r.guestbook.length === 0 ? (
            <p className="rd-pt-line">남긴 글이 없습니다.</p>
          ) : (
            <ul className="rd-ad-guest">
              {r.guestbook.map((g) => (
                <li key={g.id} className={g.hidden ? 'is-hidden' : undefined}>
                  <span className="rd-ad-guest__who">{g.author}</span>
                  <span className="rd-ad-guest__text">{g.hidden ? '운영자가 숨긴 글입니다.' : g.text}</span>
                  {!g.hidden && <RdButton kind="secondary" place="row" onClick={() => setDlg({ kind: 'guest', id: r.id, gid: g.id })}>숨기기</RdButton>}
                </li>
              ))}
            </ul>
          )}
        </RdFold>
        <div className="rd-ad-actions">
          <span className="rd-ad-actions__gap" />
          {r.hidden ? (
            <RdButton place="row" onClick={() => setDlg({ kind: 'unhide', id: r.id })}>되돌리기</RdButton>
          ) : (
            <RdButton kind="danger" place="row" onClick={() => setDlg({ kind: 'hide', id: r.id })}>내리기</RdButton>
          )}
        </div>
      </AdminDetailCard>
    );
  };

  const target = dlg ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="memorials"
      title="추모관"
      items={rows.map((r) => {
        const t = tag(r);
        return { id: r.id, node: <AdminRowText top={`故 ${r.deceasedName}`} tone={t.tone} status={t.text} lines={[`개설자 ${r.ownerName}`, `개설 ${ymd(r.createdAt)}`]} /> };
      })}
      renderDetail={detail}
      emptyTitle="추모관이 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'hide' && (
            <ReasonDialog
              eyebrow={`故 ${target.deceasedName} 추모관`}
              title="내리기"
              desc="사유를 입력해 주세요(개설자에게 전해지고 운영 기록에 남습니다). 내리면 방문자는 볼 수 없고, 개설자도 직접 풀 수 없습니다."
              label="내리는 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { hidden: { at: new Date().toISOString(), reason: t } }); setDlg(null); toast.show('추모관을 내렸습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'unhide' && (
            <ReasonDialog
              eyebrow={`故 ${target.deceasedName} 추모관`}
              title="되돌리기"
              desc="사유를 입력해 주세요(운영 기록에 남습니다)."
              label="되돌리는 사유"
              onClose={() => setDlg(null)}
              onSubmit={() => { patch(target.id, { hidden: null }); setDlg(null); toast.show('추모관을 되돌렸습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'guest' && dlg.gid && (
            <RdDangerDialog
              title="방명록 글 숨기기"
              desc="이 글은 방문자 화면에서 보이지 않게 됩니다. 숨긴 글은 이 화면에서 되돌릴 수 없습니다."
              doLabel="숨기기"
              busyText="처리 중…"
              onCancel={() => setDlg(null)}
              onDo={() => {
                patch(target.id, { guestbook: target.guestbook.map((g) => (g.id === dlg.gid ? { ...g, hidden: true } : g)) });
                setDlg(null);
                toast.show('글을 숨겼습니다.');
              }}
            />
          )}
        </>
      }
    />
  );
}

// ───────────── 부고장 ─────────────
export function AdminObituariesPage() {
  const [rows, setRows] = useState<ObituaryAdminRow[]>(OBITUARIES);
  const [closeId, setCloseId] = useState<string | null>(null);
  const toast = useRdToast();
  const find = (id: string) => rows.find((r) => r.id === id)!;

  const detail = (id: string) => {
    const r = find(id);
    return (
      <AdminDetailCard title={`故 ${r.deceasedName}`} tone={OBIT_TONE[r.status]} status={OBIT_LABEL[r.status]}>
        <AdminKv rows={[['개설자', r.ownerName], ['발인', ymd(r.funeralDate)], ['개설일', ymd(r.createdAt)]]} />
        {r.status !== 'ACTIVE' && <AdminNote>누가 닫았는지는 서버가 저장하지 않아 가르지 않습니다. 감사로그에서 찾을 수 있습니다.</AdminNote>}
        {r.status === 'ACTIVE' && (
          <div className="rd-ad-actions">
            <span className="rd-ad-actions__gap" />
            <RdButton kind="danger" place="row" onClick={() => setCloseId(r.id)}>종료</RdButton>
          </div>
        )}
      </AdminDetailCard>
    );
  };

  const target = closeId ? find(closeId) : null;
  return (
    <AdminListScreen
      current="obituaries"
      title="부고장"
      items={rows.map((r) => ({
        id: r.id,
        node: <AdminRowText top={`故 ${r.deceasedName}`} tone={OBIT_TONE[r.status]} status={OBIT_LABEL[r.status]} lines={[`개설자 ${r.ownerName}`, `발인 ${ymd(r.funeralDate)}`]} />,
      }))}
      renderDetail={detail}
      emptyTitle="부고장이 없습니다."
      extra={
        <>
          {toast.node}
          {target && (
            <ReasonDialog
              eyebrow={`故 ${target.deceasedName} 부고장`}
              title="종료"
              warning="되돌릴 수 없습니다"
              desc="종료하면 조문객 화면에서 닫히고 되돌릴 수 없습니다. 사유를 입력해 주세요(운영 기록에 남습니다)."
              label="종료 사유"
              danger
              onClose={() => setCloseId(null)}
              onSubmit={() => {
                setRows((all) => all.map((r) => (r.id === target.id ? { ...r, status: 'CLOSED' } : r)));
                setCloseId(null);
                toast.show('부고장을 종료했습니다.');
              }}
            />
          )}
        </>
      }
    />
  );
}
