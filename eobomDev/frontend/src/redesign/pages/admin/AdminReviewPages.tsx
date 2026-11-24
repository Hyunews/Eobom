import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { RdCheck, RdField, RdInput, RdTextarea } from '../../parts/RdInputs';
import { useRdToast } from '../../parts/RdModal';
import {
  AdminDetailCard, AdminFilterRow, AdminKv, AdminListScreen, AdminNote, AdminRowText, ReasonDialog,
} from './AdminKit';
import {
  CLAIMS, CLAIM_FILTER, CLAIM_LABEL, CLAIM_TONE, EXPERTS, EXPERT_CATEGORY_LABEL, PARTNERS, REVIEW_FILTER, REVIEW_LABEL, REVIEW_TONE,
  monthDay, ymd,
  type ClaimRow, type ExpertRow, type PartnerRow, type ReviewStatus,
} from './adminSamples';

// 8단계 묶음 13 · 심사 3종 — 사업자 가입 · 전문가 가입 · 시설 연동. 정본: 01-05 §14-9 · 02-03 §7.4 · 00-37 §4.1 · 판 6-15.
// 목록 380 + 고른 건의 상세. 정지·해제는 심사 일이라 OPERATOR도 한다 — 열쇠를 붙이지 않는다(00-37 §3.3).
// 반려·정지 = 입력 창(사유 필수, 위험 버튼) · 승인 메모처럼 선택이면 오류 글 없음. 서버: PATCH /admin/partners|experts/:id/status · /admin/claims/:id/status.

type Dlg = { kind: 'reject' | 'suspend'; id: string } | { kind: 'approveClaim' | 'rejectClaim'; id: string } | null;

const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 9 && v.replace(/\D/g, '').length <= 11;

// ───────────── 사업자 가입 ─────────────
export function AdminPartnersPage() {
  const [rows, setRows] = useState<PartnerRow[]>(PARTNERS);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState<Dlg>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ownerName: '', contactName: '', contactPhone: '' });
  const [errs, setErrs] = useState<Partial<Record<keyof typeof draft, string>>>({});
  const toast = useRdToast();

  const shown = rows.filter((r) => (!status || r.status === status) && (!q || r.companyName.includes(q) || r.contactName.includes(q)));
  const patch = (id: string, p: Partial<PartnerRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const find = (id: string) => rows.find((r) => r.id === id)!;

  const startEdit = (r: PartnerRow) => {
    setEditId(r.id);
    setDraft({ ownerName: r.ownerName, contactName: r.contactName, contactPhone: r.contactPhone });
    setErrs({});
  };
  const saveEdit = (r: PartnerRow) => {
    const e: typeof errs = {};
    if (!draft.ownerName.trim()) e.ownerName = '대표자명은 비워둘 수 없습니다.';
    if (!draft.contactName.trim()) e.contactName = '담당자명은 비워둘 수 없습니다.';
    if (!phoneOk(draft.contactPhone)) e.contactPhone = '연락처는 숫자 9~11자리여야 합니다.';
    setErrs(e);
    if (Object.keys(e).length) return;
    patch(r.id, { ownerName: draft.ownerName.trim(), contactName: draft.contactName.trim(), contactPhone: draft.contactPhone.trim() });
    setEditId(null);
    toast.show('정보를 수정했습니다.');
  };

  const detail = (id: string) => {
    const r = find(id);
    const editing = editId === r.id;
    return (
      <AdminDetailCard title={r.companyName} tone={REVIEW_TONE[r.status]} status={REVIEW_LABEL[r.status]}>
        {editing ? (
          <div className="rd-ad-editform">
            <RdField label="대표자명" required error={errs.ownerName}>
              {(p) => <RdInput {...p} value={draft.ownerName} onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })} />}
            </RdField>
            <RdField label="담당자명" required error={errs.contactName}>
              {(p) => <RdInput {...p} value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} />}
            </RdField>
            <RdField label="연락처" required error={errs.contactPhone} help="숫자만 입력해도 됩니다.">
              {(p) => <RdInput {...p} inputMode="tel" value={draft.contactPhone} onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })} />}
            </RdField>
            <div className="rd-ad-actions">
              <span className="rd-ad-actions__gap" />
              <RdButton kind="secondary" place="row" onClick={() => setEditId(null)}>취소</RdButton>
              <RdButton place="row" onClick={() => saveEdit(r)}>저장</RdButton>
            </div>
          </div>
        ) : (
          <>
            <AdminKv
              rows={[
                ['사업자등록번호', r.bizRegNo],
                ['대표자명', r.ownerName],
                ['담당자명', r.contactName],
                ['연락처', r.contactPhone],
                ['이메일', r.email],
                ['신청일', ymd(r.createdAt)],
              ]}
            />
            {r.status === 'SUSPENDED' && r.suspendReason && <AdminNote label="정지 사유:">{r.suspendReason}</AdminNote>}
            {r.status === 'REJECTED' && r.rejectReason && <AdminNote label="반려 사유:">{r.rejectReason}</AdminNote>}
            <div className="rd-ad-actions">
              <RdButton kind="secondary" place="row" onClick={() => startEdit(r)}>정보 수정</RdButton>
              <span className="rd-ad-actions__gap" />
              {r.status === 'PENDING' && (
                <>
                  <RdButton kind="secondary" place="row" onClick={() => setDlg({ kind: 'reject', id: r.id })}>반려</RdButton>
                  <RdButton place="row" onClick={() => { patch(r.id, { status: 'APPROVED' }); toast.show('승인했습니다.'); }}>승인</RdButton>
                </>
              )}
              {r.status === 'APPROVED' && <RdButton kind="danger" place="row" onClick={() => setDlg({ kind: 'suspend', id: r.id })}>정지</RdButton>}
              {r.status === 'SUSPENDED' && (
                <RdButton place="row" onClick={() => { patch(r.id, { status: 'APPROVED', suspendReason: null }); toast.show('정지를 해제했습니다.'); }}>해제</RdButton>
              )}
            </div>
          </>
        )}
      </AdminDetailCard>
    );
  };

  const target = dlg && dlg.kind !== 'approveClaim' && dlg.kind !== 'rejectClaim' ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="partners"
      title="사업자 가입"
      resetKey={`${status}|${q}`}
      filters={
        <AdminFilterRow search={q} onSearch={setQ} searchLabel="상호 또는 담당자명 검색" placeholder="상호 · 담당자명" select={status} onSelect={setStatus} options={REVIEW_FILTER} selectLabel="가입 상태" />
      }
      items={shown.map((r) => ({
        id: r.id,
        node: <AdminRowText top={r.companyName} tone={REVIEW_TONE[r.status]} status={REVIEW_LABEL[r.status]} lines={[`${r.contactName} · ${r.contactPhone}`, `신청 ${ymd(r.createdAt)}`]} />,
      }))}
      renderDetail={detail}
      emptyTitle="해당하는 사업자 가입 신청이 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'reject' && (
            <ReasonDialog
              eyebrow={`${target.companyName} 사업자 가입 신청`}
              title="반려"
              desc="사유를 입력해 주세요(신청자가 로그인할 때 이 글을 봅니다)."
              label="반려 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { status: 'REJECTED', rejectReason: t }); setDlg(null); toast.show('반려했습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'suspend' && (
            <ReasonDialog
              eyebrow={`${target.companyName} 사업자 계정`}
              title="정지"
              desc="사유를 입력해 주세요(운영 기록과 이 화면에 남습니다). 정지하면 이 사업자는 로그인할 수 없습니다."
              label="정지 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { status: 'SUSPENDED', suspendReason: t }); setDlg(null); toast.show('정지했습니다.'); }}
            />
          )}
        </>
      }
    />
  );
}

// ───────────── 전문가 가입 ─────────────
export function AdminExpertsPage() {
  const [rows, setRows] = useState<ExpertRow[]>(EXPERTS);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState<Dlg>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ contactPhone: '', officeAddress: '', bio: '' });
  const [phoneErr, setPhoneErr] = useState<string | undefined>();
  const toast = useRdToast();

  const shown = rows.filter((r) => (!status || r.status === status) && (!q || r.name.includes(q) || r.email.includes(q) || r.licenseNo.includes(q)));
  const patch = (id: string, p: Partial<ExpertRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const find = (id: string) => rows.find((r) => r.id === id)!;

  const detail = (id: string) => {
    const r = find(id);
    const editing = editId === r.id;
    return (
      <AdminDetailCard title={r.name} tone={REVIEW_TONE[r.status]} status={REVIEW_LABEL[r.status]}>
        {editing ? (
          <div className="rd-ad-editform">
            <RdField label="연락처" required error={phoneErr} help="숫자만 입력해도 됩니다.">
              {(p) => <RdInput {...p} inputMode="tel" value={draft.contactPhone} onChange={(e) => { setDraft({ ...draft, contactPhone: e.target.value }); setPhoneErr(undefined); }} />}
            </RdField>
            <RdField label="사무실 주소" optional>
              {(p) => (
                <div className="rd-ad-addr">
                  <RdInput {...p} value={draft.officeAddress} onChange={(e) => setDraft({ ...draft, officeAddress: e.target.value })} />
                  <RdButton kind="secondary" place="row" onClick={() => setDraft({ ...draft, officeAddress: '서울특별시 예시구 예시로 100 (주소 검색 결과 예시)' })}>검색</RdButton>
                </div>
              )}
            </RdField>
            <RdField label="소개" optional>
              {(p) => <RdTextarea {...p} maxLength={1000} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />}
            </RdField>
            <div className="rd-ad-actions">
              <span className="rd-ad-actions__gap" />
              <RdButton kind="secondary" place="row" onClick={() => setEditId(null)}>취소</RdButton>
              <RdButton
                place="row"
                onClick={() => {
                  if (!phoneOk(draft.contactPhone)) return setPhoneErr('연락처는 숫자 9~11자리여야 합니다.');
                  patch(r.id, { contactPhone: draft.contactPhone.trim(), officeAddress: draft.officeAddress.trim() || null, bio: draft.bio.trim() || null });
                  setEditId(null);
                  toast.show('정보를 수정했습니다.');
                }}
              >
                저장
              </RdButton>
            </div>
          </div>
        ) : (
          <>
            <AdminKv
              rows={[
                ['분야', EXPERT_CATEGORY_LABEL[r.category]],
                ['자격번호', r.licenseOrg ? `${r.licenseNo} (${r.licenseOrg})` : r.licenseNo],
                ['연락처', r.contactPhone],
                ['사무실 주소', r.officeAddress ?? '—'],
                ['이메일', r.email],
                ['소개', r.bio ?? '—'],
                ['신청일', ymd(r.createdAt)],
              ]}
            />
            {r.status === 'SUSPENDED' && r.suspendReason && <AdminNote label="정지 사유:">{r.suspendReason}</AdminNote>}
            {r.status === 'REJECTED' && r.rejectReason && <AdminNote label="반려 사유:">{r.rejectReason}</AdminNote>}
            {r.status === 'APPROVED' && (
              <RdCheck
                label="소비자 화면 공개"
                checked={r.isPublished}
                onChange={(e) => { patch(r.id, { isPublished: e.target.checked }); toast.show(e.target.checked ? '소비자 화면에 공개했습니다.' : '공개를 껐습니다.'); }}
              />
            )}
            <div className="rd-ad-actions">
              <RdButton
                kind="secondary"
                place="row"
                onClick={() => { setEditId(r.id); setDraft({ contactPhone: r.contactPhone, officeAddress: r.officeAddress ?? '', bio: r.bio ?? '' }); setPhoneErr(undefined); }}
              >
                정보 수정
              </RdButton>
              <span className="rd-ad-actions__gap" />
              {r.status === 'PENDING' && (
                <>
                  <RdButton kind="secondary" place="row" onClick={() => setDlg({ kind: 'reject', id: r.id })}>반려</RdButton>
                  <RdButton place="row" onClick={() => { patch(r.id, { status: 'APPROVED' }); toast.show('승인했습니다.'); }}>승인</RdButton>
                </>
              )}
              {r.status === 'APPROVED' && <RdButton kind="danger" place="row" onClick={() => setDlg({ kind: 'suspend', id: r.id })}>정지</RdButton>}
              {r.status === 'SUSPENDED' && (
                <RdButton place="row" onClick={() => { patch(r.id, { status: 'APPROVED', suspendReason: null }); toast.show('정지를 해제했습니다.'); }}>해제</RdButton>
              )}
            </div>
          </>
        )}
      </AdminDetailCard>
    );
  };

  const target = dlg && (dlg.kind === 'reject' || dlg.kind === 'suspend') ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="experts"
      title="전문가 가입"
      resetKey={`${status}|${q}`}
      filters={
        <AdminFilterRow search={q} onSearch={setQ} searchLabel="이름 · 이메일 · 자격번호 검색" placeholder="이름 · 이메일 · 자격번호" select={status} onSelect={setStatus} options={REVIEW_FILTER} selectLabel="가입 상태" />
      }
      items={shown.map((r) => ({
        id: r.id,
        node: (
          <AdminRowText
            top={r.name}
            tone={REVIEW_TONE[r.status as ReviewStatus]}
            status={REVIEW_LABEL[r.status as ReviewStatus]}
            lines={[`${EXPERT_CATEGORY_LABEL[r.category]} · ${r.contactPhone}`, `신청 ${ymd(r.createdAt)}`]}
          />
        ),
      }))}
      renderDetail={detail}
      emptyTitle="해당하는 전문가 가입 신청이 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'reject' && (
            <ReasonDialog
              eyebrow={`${target.name} 전문가 가입 신청`}
              title="반려"
              desc="사유를 입력해 주세요(신청자가 로그인할 때 이 글을 봅니다)."
              label="반려 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { status: 'REJECTED', rejectReason: t }); setDlg(null); toast.show('반려했습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'suspend' && (
            <ReasonDialog
              eyebrow={`${target.name} 전문가 계정`}
              title="정지"
              desc="사유를 입력해 주세요(운영 기록과 이 화면에 남습니다). 정지하면 이 전문가는 로그인할 수 없습니다."
              label="정지 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { status: 'SUSPENDED', suspendReason: t, isPublished: false }); setDlg(null); toast.show('정지했습니다.'); }}
            />
          )}
        </>
      }
    />
  );
}

// ───────────── 시설 연동 ─────────────
export function AdminClaimsPage() {
  const [rows, setRows] = useState<ClaimRow[]>(CLAIMS);
  const [status, setStatus] = useState('');
  const [dlg, setDlg] = useState<Dlg>(null);
  const toast = useRdToast();

  const shown = rows.filter((r) => !status || r.status === status);
  const patch = (id: string, p: Partial<ClaimRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const find = (id: string) => rows.find((r) => r.id === id)!;

  const detail = (id: string) => {
    const r = find(id);
    return (
      <AdminDetailCard title={r.facilityName} tone={CLAIM_TONE[r.status]} status={CLAIM_LABEL[r.status]}>
        <AdminKv rows={[['지역', r.region], ['신청 사업자', r.partnerName], ['메모', r.note ?? '—'], ['신청일', ymd(r.createdAt)]]} />
        {r.status === 'PENDING' && (
          <div className="rd-ad-actions">
            <span className="rd-ad-actions__gap" />
            <RdButton kind="secondary" place="row" onClick={() => setDlg({ kind: 'rejectClaim', id: r.id })}>반려</RdButton>
            <RdButton place="row" onClick={() => setDlg({ kind: 'approveClaim', id: r.id })}>승인</RdButton>
          </div>
        )}
      </AdminDetailCard>
    );
  };

  const target = dlg && (dlg.kind === 'approveClaim' || dlg.kind === 'rejectClaim') ? find(dlg.id) : null;
  return (
    <AdminListScreen
      current="claims"
      title="시설 연동"
      resetKey={status}
      filters={<AdminFilterRow select={status} onSelect={setStatus} options={CLAIM_FILTER} selectLabel="연동 신청 상태" onSearch={undefined} />}
      items={shown.map((r) => ({
        id: r.id,
        node: <AdminRowText top={r.facilityName} tone={CLAIM_TONE[r.status]} status={CLAIM_LABEL[r.status]} lines={[`${r.region} · ${r.partnerName}`, r.note ? `메모: ${r.note}` : `신청 ${monthDay(r.createdAt)}`]} />,
      }))}
      renderDetail={detail}
      emptyTitle="해당하는 시설 연동 신청이 없습니다."
      extra={
        <>
          {toast.node}
          {target && dlg?.kind === 'rejectClaim' && (
            <ReasonDialog
              eyebrow={`${target.facilityName} 연동 신청`}
              title="반려"
              desc="사유를 입력해 주세요(신청 사업자에게 전해집니다)."
              label="반려 사유"
              danger
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { status: 'REJECTED', note: t }); setDlg(null); toast.show('반려했습니다.'); }}
            />
          )}
          {target && dlg?.kind === 'approveClaim' && (
            <ReasonDialog
              eyebrow={`${target.facilityName} 연동 신청`}
              title="승인"
              desc="승인 메모를 남길 수 있습니다."
              label="승인 메모"
              required={false}
              onClose={() => setDlg(null)}
              onSubmit={(t) => { patch(target.id, { status: 'APPROVED', note: t || target.note }); setDlg(null); toast.show('승인했습니다. 시설이 연동되었습니다.'); }}
            />
          )}
        </>
      }
    />
  );
}
