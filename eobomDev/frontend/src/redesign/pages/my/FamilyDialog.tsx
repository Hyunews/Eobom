import React, { useState } from 'react';
import { RdBadge, RdButton, RdIconButton } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdField, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdDialog } from '../../parts/RdModal';
import { RdNotice } from '../../parts/RdNotices';
import { IconCheck, IconErrorCircle, IconPencil, IconSend } from '../../parts/icons';
import {
  EXAMPLE_INVITE_URL, FAKE_MS, FAMILY_ITEMS, FAMILY_MAX, FAMILY_RELATIONS, FAMILY_SCOPES, familyRelationText, familyStatusText, scopeLabel,
  type FamilyItem,
} from './accountData';
import { IconCopy, IconPlus, IconTrash, MyLine, MyResult } from './myShared';
import './account.css';

// 8단계 묶음 8 · 가족 지정 창(4-3). 정본: 00-27 §8.2·§8.3 · 00-36 §4.2 · 4단계 묶음 1 캔버스.
// 같은 창 안에서 목록과 추가·수정 칸을 갈아끼운다(2단계 판 07 ⑥). 삭제 확인 = 이어봄 창, 코드 문구 그대로 [취소][삭제]만(새 글 없음, #8).

interface FormState {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  relationshipEtc: string;
  scope: string;
  priority: string;
}
const EMPTY: FormState = { name: '', phone: '', email: '', relationship: 'CHILD', relationshipEtc: '', scope: 'VIEWER', priority: '1' };

type Msg = { tone: 'ok' | 'err'; text: string } | null;
type Errors = Partial<Record<'name' | 'phone' | 'etc', string>>;

export function FamilyDialog({ variant, onClose }: { variant?: string; onClose: () => void }) {
  // variant: empty = 빈 목록 · full = 10명 · form = 추가 칸 열림 · loading = 불러오는 중
  const [items, setItems] = useState<FamilyItem[]>(
    variant === 'empty' ? [] : variant === 'full'
      ? Array.from({ length: FAMILY_MAX }, (_, i) => ({ ...FAMILY_ITEMS[i % FAMILY_ITEMS.length], id: `x${i}` }))
      : FAMILY_ITEMS,
  );
  const [showForm, setShowForm] = useState(variant === 'form');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<{ itemId: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState<FamilyItem | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
  };
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
    setMsg(null);
    setShowForm(true);
  };
  const openEdit = (it: FamilyItem) => {
    setEditingId(it.id);
    setForm({
      name: it.name,
      phone: '', // 가려진 값이라 채우지 않는다 — 바꿀 때만 새로 입력
      email: '',
      relationship: it.relationship,
      relationshipEtc: it.relationshipEtc || '',
      scope: it.scope,
      priority: String(it.priority),
    });
    setErrors({});
    setMsg(null);
    setShowForm(true);
  };

  const submit = async () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = '확인이 필요한 항목입니다.';
    if (!editingId && !form.phone.trim()) next.phone = '휴대전화번호를 입력해 주세요.';
    if (form.relationship === 'OTHER' && !form.relationshipEtc.trim()) next.etc = '확인이 필요한 항목입니다.';
    setErrors(next);
    if (Object.keys(next).length) {
      // §8-3 ④ 첫 오류 칸으로 초점 — 칸이 오류 상태로 그려진 다음에 찾는다
      window.setTimeout(() => document.querySelector<HTMLElement>('.rd-dialog [aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setSaving(true);
    setMsg(null);
    await sleep(FAKE_MS);
    setSaving(false);
    if (editingId) {
      setItems((list) =>
        list.map((it) =>
          it.id === editingId
            ? {
                ...it,
                name: form.name.trim(),
                relationship: form.relationship,
                relationshipEtc: form.relationship === 'OTHER' ? form.relationshipEtc.trim() : null,
                scope: form.scope,
                priority: Number(form.priority) || 1,
              }
            : it,
        ),
      );
    } else {
      setItems((list) => [
        ...list,
        {
          id: `n${list.length + 1}-${Date.now()}`,
          name: form.name.trim(),
          phone: `${form.phone.trim().slice(0, 3)}-****-${form.phone.trim().slice(-4)}`,
          email: form.email.trim() ? `${form.email.trim().slice(0, 1)}***@${form.email.trim().split('@')[1] ?? ''}` : null,
          relationship: form.relationship,
          relationshipEtc: form.relationship === 'OTHER' ? form.relationshipEtc.trim() : null,
          scope: form.scope,
          priority: Number(form.priority) || 1,
          status: 'DRAFT',
          tokenExpiresAt: null,
          declinedAt: null,
          acceptedAt: null,
        },
      ]);
    }
    setMsg({ tone: 'ok', text: editingId ? '수정되었습니다.' : '등록되었습니다.' });
    closeForm();
  };

  // 실제로는 카카오톡 공유 창이 뜨고, 새 초대 링크가 이 줄 아래에 남는다
  const invite = async (it: FamilyItem) => {
    setInviting(it.id);
    setMsg(null);
    setLastLink(null);
    await sleep(FAKE_MS);
    setItems((list) => list.map((x) => (x.id === it.id ? { ...x, status: 'PENDING', tokenExpiresAt: '2099-01-01' } : x)));
    setLastLink({ itemId: it.id, url: EXAMPLE_INVITE_URL });
    setInviting(null);
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* 견본: 복사가 막혀 있어도 결과 글은 그대로 보인다 */
    }
    setMsg({ tone: 'ok', text: '링크가 복사되었습니다. 1:1로 전달해 주세요.' });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelBusy(true);
    await sleep(FAKE_MS);
    setItems((list) => list.filter((x) => x.id !== deleting.id));
    setDelBusy(false);
    setDeleting(null);
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const anyUnaccepted =items.some((it) => it.status !== 'ACCEPTED');

  // ─ 불러오는 중
  if (variant === 'loading') {
    return (
      <RdDialog form width={560} title="가족 지정" onClose={onClose} footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}>
        <MyLine kind="loading">불러오는 중…</MyLine>
      </RdDialog>
    );
  }

  return (
    <>
      <RdDialog
        form
        footLine={showForm}
        width={560}
        title="가족 지정"
        // 삭제 확인이 위에 떠 있는 동안은 Esc가 이 창까지 닫지 않게 한다
        onClose={() => {
          if (deleting || saving) return;
          if (showForm) closeForm();
          else onClose();
        }}
        footer={
          showForm ? (
            <>
              {errorCount > 0 && (
                <p className="rd-ac-footerr" role="alert">
                  <IconErrorCircle />
                  <span>확인이 필요한 항목이 {errorCount}개 있습니다.</span>
                </p>
              )}
              <RdButton kind="secondary" place="dialog" disabled={saving} onClick={closeForm}>취소</RdButton>
              <RdButton place="dialog" busy={saving} busyText="저장 중..." onClick={submit}>{editingId ? '수정 저장' : '등록'}</RdButton>
            </>
          ) : items.length < FAMILY_MAX ? (
            <>
              <RdButton kind="secondary" place="dialog" onClick={onClose}>닫기</RdButton>
              <RdButton place="dialog" onClick={openAdd}>
                <span className="rd-ac-btnicon"><IconPlus size={16} />가족 추가</span>
              </RdButton>
            </>
          ) : (
            <RdButton place="dialog" onClick={onClose}>닫기</RdButton>
          )
        }
      >
        <p className="rd-ac-intro">
          <span>생전 준비를 함께할 가족을 미리 기록해 두세요.</span> <span>최대 10명까지 등록할 수 있습니다.</span>
        </p>

        <div className="rd-mp-editbody">
          {anyUnaccepted && !showForm && (
            <RdNotice>이 링크를 받은 분은 누구나 수락할 수 있습니다. 본인에게만 보내주세요.</RdNotice>
          )}
          {msg && !showForm && <MyResult tone={msg.tone}>{msg.text}</MyResult>}

          {!showForm ? (
            items.length === 0 ? (
              <MyLine kind="empty">아직 지정된 가족이 없습니다.</MyLine>
            ) : (
              <ul className="rd-ac-fams">
                {items.map((it) => (
                  <li key={it.id} className="rd-ac-fam">
                    <div className="rd-ac-fam__row">
                      <div className="rd-ac-fam__main">
                        <div className="rd-ac-fam__top">
                          <strong className="rd-ac-fam__name">{it.name}</strong>
                          <span className="rd-ac-fam__rel">{familyRelationText(it.relationship, it.relationshipEtc)}</span>
                          <RdBadge kind={it.scope === 'PRIMARY' ? 'draft' : 'state'}>{scopeLabel(it.scope)}</RdBadge>
                        </div>
                        <div className="rd-ac-fam__sub">
                          {it.phone}
                          {it.email ? ` · ${it.email}` : ''} ·{' '}
                          {it.status === 'ACCEPTED' ? (
                            <span className="rd-ac-fam__ok"><IconCheck size={14} />{familyStatusText(it)}</span>
                          ) : (
                            familyStatusText(it)
                          )}
                        </div>
                      </div>
                      <div className="rd-ac-fam__acts">
                        {it.status !== 'ACCEPTED' && (
                          <RdIconButton label={`${it.name}님께 카카오톡으로 전달`} bordered disabled={inviting === it.id} onClick={() => invite(it)}>
                            <IconSend size={18} />
                          </RdIconButton>
                        )}
                        <RdIconButton label={`${it.name}님 정보 수정`} bordered onClick={() => openEdit(it)}>
                          <IconPencil size={18} />
                        </RdIconButton>
                        <RdIconButton label={`${it.name}님 지정 삭제`} bordered className="rd-ac-danger-icon" onClick={() => setDeleting(it)}>
                          <IconTrash size={18} />
                        </RdIconButton>
                      </div>
                    </div>
                    {lastLink?.itemId === it.id && (
                      <div className="rd-ac-fam__link">
                        <span className="rd-ac-fam__url">{lastLink.url}</span>
                        <RdButton kind="secondary" place="row" onClick={() => copyLink(lastLink.url)}>
                          <span className="rd-ac-btnicon"><IconCopy size={16} />링크 복사</span>
                        </RdButton>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="rd-mp-editbody">
              <RdField label="성함" required help="가족이 수락할 때 입력할 이름입니다. 평소 부르는 이름과 다르면 수락이 막힐 수 있으니 정확히 입력해 주세요." error={errors.name}>
                {(p) => <RdInput {...p} value={form.name} onChange={(e) => set({ name: e.target.value })} />}
              </RdField>
              <RdField label="휴대전화번호" required={!editingId} optional={!!editingId} error={errors.phone}>
                {(p) => (
                  <RdInput
                    {...p}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    placeholder={editingId ? '바꾸시려면 새 번호를 입력하세요' : '010-0000-0000'}
                  />
                )}
              </RdField>
              <RdField label="이메일" optional>
                {(p) => (
                  <RdInput
                    {...p}
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder={editingId ? '바꾸시려면 새 이메일을 입력하세요' : undefined}
                  />
                )}
              </RdField>
              <div className={form.relationship === 'OTHER' ? 'rd-ac-pair' : undefined}>
                <RdField label="관계" required>
                  {(p) => (
                    <RdSelect {...p} value={form.relationship} onChange={(e) => set({ relationship: e.target.value })}>
                      {FAMILY_RELATIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </RdSelect>
                  )}
                </RdField>
                {form.relationship === 'OTHER' && (
                  <RdField label="관계 직접 입력" required error={errors.etc}>
                    {(p) => <RdInput {...p} value={form.relationshipEtc} onChange={(e) => set({ relationshipEtc: e.target.value })} />}
                  </RdField>
                )}
              </div>
              <RdField label="권한 범위" required>
                {(p) => (
                  <RdSelect {...p} value={form.scope} onChange={(e) => set({ scope: e.target.value })}>
                    {FAMILY_SCOPES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label} ({o.hint})</option>
                    ))}
                  </RdSelect>
                )}
              </RdField>
              <RdField label="연락 순위" optional>
                {(p) => (
                  <>
                    <RdInput {...p} type="number" min={1} value={form.priority} onChange={(e) => set({ priority: e.target.value })} className="rd-ac-num" />
                    {/* 두 줄이 한 글 상자 안에서 줄바꿈으로 이어진다(4단계 묶음 1 결정) */}
                    <p className="rd-field__help">1순위와 연락이 닿지 않으면 다음 순위에게 연락합니다. 상속과는 관계없습니다.</p>
                    <p className="rd-field__help rd-ac-help2">지정한 가족은 사후에 엔딩노트 전체를 볼 수 있으며, 공개 시점은 엔딩노트 페이지에서 바꿀 수 있습니다.</p>
                  </>
                )}
              </RdField>
              <RdNotice>
                입력하신 성함·연락처는 이어봄에 저장됩니다. 이어봄이 가족에게 먼저 연락하지 않습니다. 가족이 알림 링크로 직접 수락해야 볼 수 있고, 무엇을 언제 볼지는 엔딩노트에서 정하신 대로입니다. 언제든 삭제하실 수 있습니다.
              </RdNotice>
            </div>
          )}
        </div>
      </RdDialog>

      {deleting && (
        <RdDialog
          danger
          evenButtons
          title={`${deleting.name}님 지정을 삭제하시겠어요?`}
          onClose={() => !delBusy && setDeleting(null)}
          initialFocus="[data-rd-cancel]"
          footer={
            <>
              <RdButton kind="secondary" place="dialog" data-rd-cancel="" disabled={delBusy} onClick={() => setDeleting(null)}>취소</RdButton>
              <RdButton kind="danger" place="dialog" busy={delBusy} busyText="삭제 중…" onClick={confirmDelete}>삭제</RdButton>
            </>
          }
        />
      )}
    </>
  );
}
