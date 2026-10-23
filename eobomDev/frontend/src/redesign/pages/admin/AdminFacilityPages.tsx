import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdConfirmDialog, RdDangerDialog, RdDialog, useRdToast } from '../../parts/RdModal';
import { RdField, RdRadioGroup } from '../../parts/RdInputs';
import { RdState } from '../../parts/RdState';
import { StatusText } from '../partner/partnerCommon';
import { badgesOf } from './adminData';
import { AdminShellFor, AdminTitle } from './AdminShell';
import {
  AdminBackLink, AdminDemoBar, AdminDetailCard, AdminFilterRow, AdminKv, AdminListScreen, AdminNote, AdminPager, AdminRowText, AdminViewNotice,
  ReasonDialog, type AdminView,
} from './AdminKit';
import {
  CONSULTS, CONSULT_CHANNEL_LABEL, CONSULT_FILTER, CONSULT_STATUS_LABEL, CONSULT_STATUS_TONE, EXPERT_CATEGORY_LABEL, FACILITIES, INTRO_HIDE_LABEL,
  LEADS, LEAD_FILTER, LEAD_LABEL, LEAD_TONE, LEAD_TYPE_LABEL, LOST_REASON_LABEL, PREVIEW_PAGE_SIZE, ymd, ymdHm,
  type FacilityAdminRow, type LeadAdminRow,
} from './adminSamples';

// 8단계 묶음 13 · 시설·상담 묶음 — 전체 시설(소개 글 숨김) · 업체 문의 · 상담 신청. 정본: 01-05 §14-5·§14-9 · 02-03 §7.4 · 판 6-16·6-17·6-23.
// 서버: GET /admin/facilities(+/:id) · PATCH …/intro-hide · …/intro-unhide / GET /admin/leads · PATCH …/billable / GET /admin/consult-requests.

// ───────────── 전체 시설 ─────────────
const hiddenLine = (f: FacilityAdminRow) =>
  f.introHidden ? `숨긴 사유: ${INTRO_HIDE_LABEL[f.introHidden.reason]}${f.introHidden.note ? ` (${f.introHidden.note})` : ''}` : null;

export function AdminFacilitiesPage() {
  const [rows, setRows] = useState<FacilityAdminRow[]>(FACILITIES);
  const [q, setQ] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<AdminView>('ready');
  const [dlg, setDlg] = useState<{ kind: 'hide' | 'unhide'; id: string } | null>(null);
  const toast = useRdToast();

  const shown = rows.filter((f) => !q || f.name.includes(q));
  const patch = (id: string, p: Partial<FacilityAdminRow>) => setRows((all) => all.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const find = (id: string) => rows.find((f) => f.id === id)!;
  const badge = (f: FacilityAdminRow) => (f.introHidden ? { tone: 'faint' as const, text: '숨김됨' } : f.linked ? { tone: 'done' as const, text: '연동됨' } : { tone: 'faint' as const, text: '미연동' });

  const detail = (id: string) => {
    const f = find(id);
    const b = badge(f);
    return (
      <AdminDetailCard title={f.name} tone={b.tone} status={b.text}>
        <AdminKv
          rows={[
            ['종류', f.type],
            ['주소', f.location],
            ['연동 사업자', f.partnerName ?? '—'],
            ['종교', f.religion],
            ['수용 규모', f.capacity],
            ['부대시설', f.amenities.length ? f.amenities.join(' · ') : '—'],
          ]}
        />
        {/* 연동하지 않아 소개 글이 없는 시설은 소개 글 줄·[숨기기]를 그리지 않는다(01-05 §14-5 ③) */}
        {f.linked && f.intro && (
          <>
            <div className="rd-ad-intro">
              <h3 className="rd-ad-intro__title">소개 글</h3>
              <p className="rd-pt-detail__msg">{f.intro}</p>
            </div>
            {f.introHidden && <AdminNote label={hiddenLine(f) ?? ''}>{ymd(f.introHidden.at)}에 숨김. 유족 화면에서는 소개 칸이 보이지 않습니다.</AdminNote>}
            <div className="rd-ad-actions">
              <span className="rd-ad-actions__gap" />
              {f.introHidden ? (
                <RdButton place="row" onClick={() => setDlg({ kind: 'unhide', id: f.id })}>되돌리기</RdButton>
              ) : (
                <RdButton kind="danger" place="row" onClick={() => setDlg({ kind: 'hide', id: f.id })}>숨기기</RdButton>
              )}
            </div>
          </>
        )}
      </AdminDetailCard>
    );
  };

  const target = dlg ? find(dlg.id) : null;
  const dialogs = (
    <>
      {toast.node}
      {target && dlg?.kind === 'hide' && (
        <HideIntroDialog
          name={target.name}
          onClose={() => setDlg(null)}
          onDone={(reason, note) => {
            patch(target.id, { introHidden: { at: new Date().toISOString(), reason, note: note || null } });
            setDlg(null);
            toast.show('소개 글을 숨겼습니다.');
          }}
        />
      )}
      {target && dlg?.kind === 'unhide' && (
        <ReasonDialog
          eyebrow={`${target.name} 소개 글`}
          title="되돌리기"
          desc="사유를 입력해 주세요(운영 기록에 남습니다). 되돌리면 소개 글이 유족 화면에 다시 보입니다."
          label="되돌리는 사유"
          onClose={() => setDlg(null)}
          onSubmit={() => {
            patch(target.id, { introHidden: null });
            setDlg(null);
            toast.show('소개 글을 되돌렸습니다.');
          }}
        />
      )}
    </>
  );

  // 시설을 고르면 목록 380 + 상세(판 6-16 "전체 시설 상세"), 아직 안 골랐으면 카드 격자 3열
  if (pickedId) {
    return (
      <AdminListScreen
        current="facilities"
        title="전체 시설"
        initialId={pickedId}
        above={<AdminBackLink onClick={() => setPickedId(null)}>전체 시설 카드로</AdminBackLink>}
        resetKey={q}
        items={shown.map((f) => {
          const b = badge(f);
          return {
            id: f.id,
            node: <AdminRowText top={f.name} tone={b.tone} status={b.text} lines={[`${f.type} · ${f.location}`, hiddenLine(f)]} />,
          };
        })}
        renderDetail={detail}
        emptyTitle="해당하는 시설이 없습니다."
        extra={dialogs}
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(shown.length / PREVIEW_PAGE_SIZE));
  const cards = view === 'ready' ? shown.slice((page - 1) * PREVIEW_PAGE_SIZE, page * PREVIEW_PAGE_SIZE) : [];
  return (
    <AdminShellFor current="facilities" badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>
          전체 시설 <span className="rd-pt-count">총 {view === 'ready' ? shown.length : 0}건</span>
        </AdminTitle>
        <div className="rd-ad-filters">
          <AdminFilterRow search={q} onSearch={(v) => { setQ(v); setPage(1); }} searchLabel="시설명 검색" placeholder="시설명 검색 (예: OO장례식장)" />
        </div>
        <AdminViewNotice view={view} />
        {view === 'empty' || (view === 'ready' && shown.length === 0) ? (
          <RdState kind="empty" title="해당하는 시설이 없습니다." />
        ) : (
          view === 'ready' && (
            <>
              <ul className="rd-ad-cards">
                {cards.map((f) => {
                  const b = badge(f);
                  return (
                    <li key={f.id}>
                      <button type="button" className="rd-ad-card" onClick={() => setPickedId(f.id)}>
                        <span className="rd-ad-card__top">
                          <b>{f.name}</b>
                          <StatusText tone={b.tone}>{b.text}</StatusText>
                        </span>
                        <span className="rd-ad-card__line">{f.type}</span>
                        <span className="rd-ad-card__line">{f.location}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <AdminPager page={page} total={totalPages} count={shown.length} onChange={setPage} />
            </>
          )
        )}
        {dialogs}
        <AdminDemoBar view={view} onView={(v) => { setView(v); setPage(1); }} />
      </div>
    </AdminShellFor>
  );
}

/** 소개 글 숨기기 — 사유 고르기(필수) 3개 + 덧붙일 말(선택). 안 고르면 창 안 오류 글. "기타" 없음("3개만" 규칙을 화면이 지킨다). 위험 버튼. */
function HideIntroDialog({ name, onClose, onDone }: { name: string; onClose: () => void; onDone: (reason: keyof typeof INTRO_HIDE_LABEL, note: string) => void }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason) return setError('사유를 골라야 처리할 수 있습니다.');
    setBusy(true);
    await sleep(400);
    onDone(reason, note.trim());
  };
  return (
    <RdDialog
      form
      width={560}
      danger
      eyebrow={`${name} 소개 글`}
      title="숨기기"
      onClose={() => !busy && onClose()}
      closeX
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
          <RdButton kind="danger" place="dialog" busy={busy} busyText="처리 중…" onClick={submit}>숨기기</RdButton>
        </>
      }
    >
      <div className="rd-pt-dlgbody">
        <p className="rd-dialog__desc">숨기면 유족 화면에서 소개 칸이 사라집니다. 사업자가 고쳐 저장하면 숨김이 풀립니다.</p>
        <RdRadioGroup
          legend="숨기는 사유"
          name="intro-hide-reason"
          value={reason}
          options={Object.entries(INTRO_HIDE_LABEL).map(([value, label]) => ({ value, label }))}
          onChange={(v) => { setReason(v); setError(null); }}
        />
        {error && <p className="rd-field__error" role="alert">{error}</p>}
        <RdField label="덧붙일 말" optional>
          {(p) => <textarea {...p} className="rd-input rd-input--area" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </RdField>
      </div>
    </RdDialog>
  );
}

// ───────────── 업체 문의 ─────────────
export function AdminLeadsPage() {
  const [rows, setRows] = useState<LeadAdminRow[]>(LEADS);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState<{ kind: 'invalid' | 'billable'; id: string } | null>(null);
  const toast = useRdToast();

  const shown = rows.filter((r) => (!status || r.status === status) && (!q || r.leadNo.toLowerCase().includes(q.toLowerCase())));
  const patch = (id: string, p: Partial<LeadAdminRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const find = (id: string) => rows.find((r) => r.id === id)!;

  const detail = (id: string) => {
    const r = find(id);
    const canBill = r.status === 'CONVERTED' && !r.billable;
    return (
      <AdminDetailCard title={r.leadNo} tone={LEAD_TONE[r.status]} status={LEAD_LABEL[r.status]}>
        <AdminKv
          rows={[
            ['시설', r.facilityName],
            ['유형', LEAD_TYPE_LABEL[r.type]],
            ['신청자', `${r.applicantName} · ${r.applicantPhone}`],
            ['문의 내용', r.message ?? '—'],
            ...(r.status === 'LOST' && r.lostReason ? ([['무산 사유', LOST_REASON_LABEL[r.lostReason]]] as [string, React.ReactNode][]) : []),
            ['접수', ymdHm(r.createdAt)],
          ]}
        />
        {r.billable && <AdminNote label="청구 대상:">확정되었습니다.</AdminNote>}
        <div className="rd-ad-actions">
          <span className="rd-ad-actions__gap" />
          <RdButton kind="danger" place="row" disabled={r.status === 'INVALID' || r.billable} onClick={() => setDlg({ kind: 'invalid', id: r.id })}>무효 처리</RdButton>
          <RdButton
            place="row"
            disabled={!canBill}
            disabledReason={!canBill && !r.billable ? '성사된 문의만 확정할 수 있습니다.' : undefined}
            onClick={() => setDlg({ kind: 'billable', id: r.id })}
          >
            청구 대상 확정
          </RdButton>
        </div>
      </AdminDetailCard>
    );
  };

  const target = dlg ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="leads"
      title="업체 문의"
      resetKey={`${status}|${q}`}
      filters={<AdminFilterRow search={q} onSearch={setQ} searchLabel="리드 번호 검색" placeholder="리드 번호 검색 (예: EB-261023-0004)" select={status} onSelect={setStatus} options={LEAD_FILTER} selectLabel="문의 상태" />}
      items={shown.map((r) => ({
        id: r.id,
        node: <AdminRowText top={r.leadNo} tone={LEAD_TONE[r.status]} status={LEAD_LABEL[r.status]} lines={[`${LEAD_TYPE_LABEL[r.type]} · ${r.facilityName}`, `${r.applicantName} · ${r.applicantPhone}`, r.message]} />,
      }))}
      renderDetail={detail}
      emptyTitle="해당하는 업체 문의가 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'invalid' && (
            <RdDangerDialog
              title="무효 처리"
              desc={`${target.leadNo}을 허수·중복·장난으로 확정합니다. 무효 처리한 문의는 되돌릴 수 없고 청구 대상에서 빠집니다.`}
              doLabel="무효 처리"
              busyText="처리 중…"
              onCancel={() => setDlg(null)}
              onDo={() => { patch(target.id, { status: 'INVALID', billable: false }); setDlg(null); toast.show('무효 처리했습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'billable' && (
            <RdConfirmDialog
              title="청구 대상으로 확정할까요?"
              desc={`${target.leadNo} · ${target.facilityName}. 확정해도 금액은 정해지지 않습니다. 금액은 정산 단계에서 정해집니다.`}
              keepLabel="취소"
              doLabel="확정"
              onKeep={() => setDlg(null)}
              onDo={() => { patch(target.id, { billable: true }); setDlg(null); toast.show('청구 대상으로 확정했습니다.'); }}
            />
          )}
        </>
      }
    />
  );
}

// ───────────── 상담 신청(조회만) ─────────────
export function AdminConsultsPage() {
  const [status, setStatus] = useState('');
  const shown = CONSULTS.filter((r) => !status || r.status === status);
  return (
    <AdminListScreen
      current="consults"
      title="상담 신청"
      resetKey={status}
      filters={<AdminFilterRow select={status} onSelect={setStatus} options={CONSULT_FILTER} selectLabel="상담 상태" />}
      items={shown.map((r) => ({
        id: r.id,
        node: (
          <AdminRowText
            top={r.applicantName ?? '(비회원)'}
            tone={CONSULT_STATUS_TONE[r.status]}
            status={CONSULT_STATUS_LABEL[r.status]}
            lines={[`${r.applicantPhone} · ${CONSULT_CHANNEL_LABEL[r.channel]} · ${r.kind}`, `${r.expertName} (${EXPERT_CATEGORY_LABEL[r.expertCategory]})`]}
          />
        ),
      }))}
      renderDetail={(id) => {
        const r = CONSULTS.find((c) => c.id === id)!;
        return (
          <AdminDetailCard title={r.consultNo} tone={CONSULT_STATUS_TONE[r.status]} status={CONSULT_STATUS_LABEL[r.status]}>
            <AdminKv
              rows={[
                ['신청자', r.applicantName ?? '(비회원)'],
                ['전화', r.applicantPhone],
                ['경로', CONSULT_CHANNEL_LABEL[r.channel]],
                ['구분', r.kind],
                ['전문가', `${r.expertName} (${EXPERT_CATEGORY_LABEL[r.expertCategory]})`],
                ['상담 내용', r.content],
                ['접수', ymdHm(r.createdAt)],
              ]}
            />
            <AdminNote>상담 신청은 조회만 합니다. 처리는 전문가가 합니다.</AdminNote>
          </AdminDetailCard>
        );
      }}
      emptyTitle="해당하는 상담 신청이 없습니다."
    />
  );
}
