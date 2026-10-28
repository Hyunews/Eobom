import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, apiFetch } from '../../../lib/api';
import { useProfileContact } from '../../../hooks/useProfileContact';
import { calculateInheritanceTax, type InheritanceTaxBreakdown } from '../../../utils/inheritanceTax';
import { COUNSELING_SITUATIONS, type CounselingSituation } from '../../../utils/counselingSituations';
import { LoginRequired } from '../../auth/LoginRequired';
import { RdBranchButton, RdButton, RdTextLink } from '../../parts/RdButtons';
import { RdList, RdListRow } from '../../parts/RdCards';
import { RdChips, RdConsentGroup, RdField, RdInput, RdTextarea, RdCheck } from '../../parts/RdInputs';
import { RdPageHead } from '../../parts/RdNav';
import { RdAlertDialog, RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconWarn } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import './prep.css';

// 10단계 묶음 10-2 · 전문가 상담 — 1단계 캔버스 1-16~1-20(전문가 상담 · 상황 고르기 · 상세 · 신청 · 상속세 · 상태·알림).
// 서버 `GET /api/experts` · `POST /api/experts/:id/consult-requests` · `GET /api/me/profile`. 규칙은 지금 화면(`pages/CounselingPage.tsx` · `components/expert/ConsultRequestModal.tsx`)에서 옮겼다.
// 정본 = 02-05(전문가 상담 화면) · 02-03 §4(상담 신청).

const TITLE = '상속 · 법률 · 세무 전문가 상담';
const DESC = '분야별 전문가 상담 신청 및 상속세 시뮬레이터';

// 상황 모달 "처음 1회 자동" 표시용 — 계정이 아니라 브라우저 기준(02-05 §2.2 ①)
const SITUATION_SEEN_KEY = 'eobom_counseling_situation_seen';
const hasSeenSituationModal = (): boolean => {
  try {
    return localStorage.getItem(SITUATION_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
const markSituationModalSeen = () => {
  try {
    localStorage.setItem(SITUATION_SEEN_KEY, '1');
  } catch {
    // 저장 불가 환경 — 매번 열려도 화면은 정상 동작
  }
};

// docs/02_전문가_매칭/02-05 §3.3의 5대 직역. 순서 = 탭 노출 순서.
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'LAWYER', label: '상속 변호사' },
  { value: 'JUDICIAL_SCRIVENER', label: '상속 법무사' },
  { value: 'TAX_ACCOUNTANT', label: '상속세 세무사' },
  { value: 'ADMINISTRATIVE_SCRIVENER', label: '행정사' },
  { value: 'FUNERAL_DIRECTOR', label: '장례 지도사' },
];
const ALL = '전체';
const labelOf = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value;
const valueOf = (label: string) => CATEGORIES.find((c) => c.label === label)?.value ?? label;

interface PublicExpert {
  id: string;
  category: string;
  name: string;
  licenseOrg: string | null;
  bio: string | null;
  specialties: string[];
  /** 02-03 §4.3 — 공개 필드(의뢰인이 방문하려면 알아야 하는 정보) */
  officeAddress: string | null;
  createdAt: string;
}

/* ───────── 상속세 간이 계산 (1-19) ───────── */

const eok = (man: number) => (man / 10000).toFixed(2);
const nf = (n: number) => Math.round(n).toLocaleString();

function TaxDialog({ onClose }: { onClose: () => void }) {
  const [total, setTotal] = useState('150000');
  const [debt, setDebt] = useState('5000');
  const [fin, setFin] = useState('30000');
  const [spouse, setSpouse] = useState<'yes' | 'no'>('yes');
  const [spouseActual, setSpouseActual] = useState('');
  const [kids, setKids] = useState('2');
  const [elders, setElders] = useState('0');
  const [out, setOut] = useState<InheritanceTaxBreakdown | null>(null);
  const n = (s: string) => Math.max(Number(s.replace(/,/g, '')) || 0, 0);

  const run = () =>
    setOut(
      calculateInheritanceTax({
        totalAsset: n(total),
        debtAndFuneralCost: n(debt),
        financialAsset: n(fin),
        hasSpouse: spouse === 'yes',
        spouseInheritedAmount: spouse === 'yes' && spouseActual.trim() !== '' ? n(spouseActual) : null,
        childrenCount: n(kids),
        elderlyCount: n(elders),
      }),
    );

  const num = (v: string, set: (s: string) => void, label: string, help?: string) => (
    <RdField label={label} help={help}>
      {(p) => <RdInput {...p} inputMode="numeric" value={v} onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ''))} />}
    </RdField>
  );

  return (
    <RdDialog
      form
      width={960}
      title="상속세 간이 시뮬레이터"
      closeX
      onClose={onClose}
      footer={<RdButton kind="secondary" place="dialog" onClick={onClose}>닫기</RdButton>}
    >
      <p className="rd-dialog__desc" style={{ marginBottom: 16 }}>아래 조건을 입력하면 예상 상속세를 단계별로 계산해드립니다.</p>
      <div className="rd-pr-tax">
        <div className="rd-pr-tax__form">
          {num(total, setTotal, '총 상속재산가액 (만원)', `약 ${eok(n(total))}억원 (부동산·예금·주식 등 전체)`)}
          {num(debt, setDebt, '채무 및 장례비용 (만원)', '과세가액에서 차감')}
          {num(fin, setFin, '그중 순수 금융재산 (만원)', '부동산 제외')}
          <RdChips label="배우자 유무" options={['배우자 있음', '배우자 없음']} value={[spouse === 'yes' ? '배우자 있음' : '배우자 없음']} onChange={(v) => setSpouse(v[0] === '배우자 없음' ? 'no' : 'yes')} />
          {spouse === 'yes' && num(spouseActual, setSpouseActual, '배우자 실제 상속액 (만원, 선택)', '배우자공제는 실제 상속액 기준(최소 5억~최대 30억). 비워두면 법정상속분으로 자동 추정')}
          <div className="rd-grid2">
            {num(kids, setKids, '자녀 수')}
            {num(elders, setElders, '65세 이상 상속인 수')}
          </div>
          <div className="rd-pr-tax__actions">
            <RdButton place="dialog" onClick={run}>상속세 산출하기</RdButton>
          </div>
        </div>
        <div className="rd-pr-tax__out" aria-live="polite">
          {!out ? (
            <p className="rd-pr-tax__empty">왼쪽 조건을 입력하고<br />"상속세 산출하기"를 누르면<br />결과가 여기 표시됩니다.</p>
          ) : (
            <>
              <h3 className="rd-t-sub" style={{ margin: 0 }}>예상 상속세 산출 결과</h3>
              <dl className="rd-pr-tax__table">
                <dt>상속세 과세가액</dt><dd>{nf(out.taxableBase)} 만원</dd>
                <dt>기초·일괄공제(큰 금액)</dt><dd>- {nf(out.basicOrLumpSumDeduction)} 만원</dd>
                {out.spouseDeduction > 0 && (<><dt>배우자공제{out.spouseDeductionIsEstimated ? '(추정)' : ''}</dt><dd>- {nf(out.spouseDeduction)} 만원</dd></>)}
                <dt>금융재산 상속공제</dt><dd>- {nf(out.financialAssetDeduction)} 만원</dd>
                <dt>과세표준</dt><dd>{nf(out.taxBase)} 만원</dd>
                <dt>최고세율 구간</dt><dd>{Math.round(out.bracketRate)}%</dd>
                <dt>산출세액</dt><dd>{nf(out.calculatedTax)} 만원</dd>
                <dt>신고세액공제(3%)</dt><dd>- {nf(out.reportingDeduction)} 만원</dd>
              </dl>
              <p className="rd-pr-tax__final">최종 예상 상속세액: 약 {nf(out.finalTax)} 만원 ({eok(out.finalTax)} 억원)</p>
              <p className="rd-pr-tax__refs">
                <b>계산 기준 및 참고사항</b><br />
                <b>반영</b>: 기초공제(2억)·자녀공제(1인당 5천만원)·연로자공제(1인당 5천만원) 중 일괄공제(5억)와 비교해 큰 금액, 배우자공제(최소 5억~최대 30억), 금융재산 상속공제(순금융재산의 20%, 최소 2천만원~한도 2억), 5단계 누진세율(10~50%), 신고세액공제(3%)<br />
                <b>미반영</b>: 미성년자·장애인공제(기대여명 등 개별 심사 필요), 동거주택 상속공제(거주요건 확인 필요), 가업·영농상속공제, 세대생략 상속 할증, 10년 이내 사전증여재산 합산, 상속공제 종합한도<br />
                법적 근거: 상속세 및 증여세법. 세율·공제액은 개정에 따라 달라질 수 있어 최신 기준은 국세청·세무 전문가를 통해 확인 바랍니다.
              </p>
            </>
          )}
        </div>
      </div>
      {out && <p className="rd-t-small" style={{ margin: '16px 0 0' }}>이 결과는 참고용 추정치이며 법적 효력이 없습니다. 정확한 세액은 전문가 상담을 이용해주세요.</p>}
    </RdDialog>
  );
}

/* ───────── 상담 신청 창 (1-18) ───────── */

const METHODS: { value: string; label: string }[] = [
  { value: 'ALIMTALK', label: '카카오 알림톡' },
  { value: 'PHONE', label: '전화' },
  { value: 'VIDEO', label: '화상 상담' },
  { value: 'VISIT', label: '방문' },
];

function RequestDialog({ expert, onClose, onDone }: { expert: PublicExpert; onClose: () => void; onDone: (msg: { title: string; desc?: string }) => void }) {
  // 00-28 §6.4 — 저장된 연락처 재사용. 연락처는 마스킹돼 오고, 제출 때는 값이 아니라 "프로필 걸 쓰겠다"는 의사만 보낸다
  const { maskedPhone, profileName, useProfileContact: useMine, setUseProfileContact: setUseMine, saveToProfile: saveMine, setSaveToProfile: setSaveMine } = useProfileContact();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState('ALIMTALK');
  const [when, setWhen] = useState('');
  const [text, setText] = useState('');
  const [agree, setAgree] = useState<Record<string, boolean>>({ c: false });
  const [busy, setBusy] = useState(false);
  const [alertBox, setAlertBox] = useState<{ title: string; desc?: string } | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const submit = async () => {
    if (!agree.c) {
      setAlertBox({ title: '개인정보 제3자 제공에 동의해야 상담을 신청할 수 있습니다.' });
      return;
    }
    if (!useMine && (!name.trim() || !phone.trim())) {
      setAlertBox({ title: '이름과 연락처를 입력해 주세요.' });
      return;
    }
    if (!text.trim()) {
      setAlertBox({ title: '상담 희망 내용을 입력해 주세요.' });
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch<{ requestNo: string }>(`/api/experts/${expert.id}/consult-requests`, 'USER', {
        method: 'POST',
        body: JSON.stringify({
          ...(useMine ? {} : { applicantName: name, applicantPhone: phone }),
          useProfileContact: useMine,
          saveToProfile: !useMine && saveMine,
          channel,
          preferredAt: when || undefined,
          content: text,
          contextType: 'POST_DEATH',
          thirdPartyConsent: agree.c,
        }),
      });
      if (!alive.current) return;
      onDone({ title: `[${expert.name}]님께 상담 신청이 접수되었습니다.`, desc: `접수번호: ${data.requestNo}\n(문의 시 이 번호를 말씀해주시면 빠르게 확인 가능합니다)` });
    } catch (e) {
      if (alive.current) setAlertBox({ title: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const methodLabel = METHODS.find((m) => m.value === channel)?.label ?? METHODS[0].label;

  return (
    <>
      <RdDialog
        form
        title={`[${expert.name}] 상담 신청`}
        closeX
        onClose={onClose}
        footer={
          <>
            <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
            <RdButton place="dialog" busy={busy} busyText="전송 중..." onClick={submit}>상담 신청</RdButton>
          </>
        }
      >
        <div className="rd-formstack">
          <p className="rd-dialog__desc">신청 내용을 남겨주시면 전문가가 확인 후 연락드립니다.</p>
          {maskedPhone && <RdCheck label={`내 정보 사용 (${maskedPhone})`} checked={useMine} onChange={(e) => setUseMine(e.target.checked)} />}
          <RdField label="이름" required>{(p) => <RdInput {...p} disabled={useMine} value={useMine ? profileName || '' : name} onChange={(e) => setName(e.target.value)} />}</RdField>
          <RdField label="연락처" required>{(p) => <RdInput {...p} inputMode="tel" placeholder="010-0000-0000" disabled={useMine} value={useMine ? maskedPhone || '' : phone} onChange={(e) => setPhone(e.target.value)} />}</RdField>
          {!useMine && <RdCheck label="다음에도 쓸 수 있게 내 정보에 저장" checked={saveMine} onChange={(e) => setSaveMine(e.target.checked)} />}
          <RdChips
            label="희망 상담 방식"
            options={METHODS.map((m) => m.label)}
            value={[methodLabel]}
            onChange={(v) => {
              const hit = METHODS.find((m) => m.label === v[0]);
              if (hit) setChannel(hit.value);
            }}
          />
          <RdField label="희망 상담 일시 (선택)">{(p) => <RdInput {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</RdField>
          <RdField label="상담 희망 내용">
            {(p) => <RdTextarea {...p} rows={4} maxLength={1000} value={text} placeholder="궁금하신 내용을 남겨주세요 (예: 상속세 절세 방안, 유언장 작성 관련 등)" onChange={(e) => setText(e.target.value)} />}
          </RdField>
          <div className="rd-pr-voice">
            <RdConsentGroup
              items={[
                {
                  id: 'c',
                  label: '개인정보 제3자 제공에 동의합니다.',
                  required: true,
                  // 보유기간 문구 = 02-03 §4(10-15 개발자 결정) · 00-19 제5조와 같다
                  desc: `제공받는 자: ${expert.name} (이어봄 입점 전문가)\n제공 목적: 상담 안내 및 연락\n제공 항목: 이름, 연락처, 상담 희망 내용\n보유 기간: 상담이 끝날 때까지(최대 신청일부터 90일)`,
                },
              ]}
              checked={agree}
              onChange={setAgree}
            />
          </div>
        </div>
      </RdDialog>
      {alertBox && <RdAlertDialog title={alertBox.title} desc={alertBox.desc} onOk={() => setAlertBox(null)} />}
    </>
  );
}

/* ───────── 쪽 ───────── */

export function CounselingPage() {
  return (
    <LoginRequired screenName="전문가 상담" title="전문가 상담" desc="분야별 상담 신청 및 상속세 자동 시뮬레이터">
      <CounselingBody />
    </LoginRequired>
  );
}

function CounselingBody() {
  const phone = useIsPhone();
  const [situation, setSituation] = useState<CounselingSituation | null>(null);
  /** 켜진 분야(서버 코드) — 비어 있으면 "전체". 상황을 고르면 그 상황의 직역 전부(02-05 §2.2 ③) */
  const [cats, setCats] = useState<string[]>([]);
  const [picking, setPicking] = useState(() => !hasSeenSituationModal());
  const [experts, setExperts] = useState<PublicExpert[]>([]);
  const [load, setLoad] = useState<'loading' | 'ready' | 'fail'>('loading');
  const [detail, setDetail] = useState<PublicExpert | null>(null);
  const [request, setRequest] = useState<PublicExpert | null>(null);
  const [tax, setTax] = useState(false);
  const [done, setDone] = useState<{ title: string; desc?: string } | null>(null);

  // 자동으로 뜬 모달도 "봤음"으로 남긴다 — 닫는 방식과 상관없이 다음 방문엔 자동으로 안 뜬다
  useEffect(() => {
    if (picking) markSituationModalSeen();
  }, [picking]);

  const catParam = cats.join(',');
  const fetchExperts = useCallback(() => {
    let live = true;
    setLoad('loading');
    const qs = new URLSearchParams();
    if (catParam) qs.set('category', catParam);
    apiFetch<PublicExpert[]>(`/api/experts?${qs.toString()}`)
      .then((d) => { if (live) { setExperts(d); setLoad('ready'); } })
      .catch(() => { if (live) setLoad('fail'); });
    return () => { live = false; };
  }, [catParam]);
  useEffect(() => fetchExperts(), [fetchExperts]);

  const head = (
    <RdPageHead
      title={TITLE}
      desc={DESC}
      actions={
        <>
          <RdButton kind="secondary" onClick={() => setTax(true)}>상속세 계산하기</RdButton>
          <RdButton onClick={() => setPicking(true)}>어떤 도움이 필요하세요?</RdButton>
        </>
      }
    />
  );

  return (
    <div className="rd-container rd-screen">
      {head}

      {/* 고른 상황 한 줄 + 다시 고르기(02-05 §2.2 ③) */}
      {situation && (
        <div className="rd-pr-situation">
          {situation.deadlineNote && (
            <p className="rd-pr-situation__deadline"><IconWarn size={16} />{situation.deadlineNote}</p>
          )}
          <div className="rd-pr-situation__row">
            <span className="rd-pr-situation__name">{situation.label}</span>
            <RdTextLink href="#" onClick={(e) => { e.preventDefault(); setPicking(true); }}>다시 고르기</RdTextLink>
          </div>
        </div>
      )}

      {/* 분야를 직접 누르면 상황 줄이 사라진다(02-05 §2.2 ③) */}
      <RdChips
        label="분야"
        options={[ALL, ...CATEGORIES.map((c) => c.label)]}
        value={cats.length === 0 ? [ALL] : cats.map(labelOf)}
        multiple
        onChange={(v) => {
          setSituation(null);
          const next = v.filter((x) => x !== ALL).map(valueOf);
          // 방금 눌러서 "전체"가 새로 들어왔으면 모두 풀고, 분야가 새로 들어왔으면 그 분야만 남긴다
          setCats(v.includes(ALL) && cats.length > 0 ? [] : next);
        }}
      />

      {load === 'loading' ? (
        <p className="rd-lineinfo" role="status">불러오는 중...</p>
      ) : load === 'fail' ? (
        <RdState kind="error" title="전문가 목록을 불러오지 못했습니다." desc="잠시 뒤 다시 시도해 주세요.">
          <RdButton onClick={fetchExperts}>다시 불러오기</RdButton>
        </RdState>
      ) : experts.length === 0 ? (
        <RdState
          kind="empty"
          title={cats.length === 0 ? '아직 입점한 전문가가 없습니다.' : `${cats.map(labelOf).join('·')} 분야에 입점한 전문가가 아직 없습니다.`}
          desc="준비되는 대로 순차적으로 노출됩니다."
        />
      ) : (
        <RdList label="전문가">
          {experts.map((e) => (
            <RdListRow key={e.id} title={e.name} info={phone || !e.bio ? labelOf(e.category) : `${labelOf(e.category)} · ${e.bio}`} onClick={() => setDetail(e)} />
          ))}
        </RdList>
      )}

      {picking && (
        <RdDialog
          title="어떤 도움이 필요하세요?"
          width={560}
          onClose={() => setPicking(false)}
          footer={<RdButton kind="secondary" place="dialog" onClick={() => setPicking(false)}>닫기</RdButton>}
        >
          <div className="rd-pr-picks">
            {COUNSELING_SITUATIONS.map((s, i) => (
              <RdBranchButton
                key={s.id}
                tone={i === 0 ? 'primary' : 'secondary'}
                title={s.label}
                desc={`${s.categories.map(labelOf).join(' · ')}${s.deadline ? ` · ${s.deadline}` : ''}`}
                onClick={() => { setSituation(s); setCats(s.categories); setPicking(false); }}
              />
            ))}
          </div>
        </RdDialog>
      )}

      {detail && !request && (
        <RdDialog
          title={detail.name}
          onClose={() => setDetail(null)}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" onClick={() => setDetail(null)}>닫기</RdButton>
              <RdButton place="dialog" onClick={() => setRequest(detail)}>상담 신청</RdButton>
            </>
          }
        >
          <dl className="rd-dl">
            <dt>분야</dt><dd>{labelOf(detail.category)}</dd>
            {detail.licenseOrg && (<><dt>자격</dt><dd>{detail.licenseOrg}</dd></>)}
            {detail.specialties.length > 0 && (<><dt>전문</dt><dd>{detail.specialties.map((s) => `#${s}`).join(' ')}</dd></>)}
            {detail.officeAddress && (<><dt>사무실</dt><dd>{detail.officeAddress}</dd></>)}
            {detail.bio && (<><dt>소개</dt><dd>{detail.bio}</dd></>)}
          </dl>
        </RdDialog>
      )}

      {request && (
        <RequestDialog
          expert={request}
          onClose={() => { setRequest(null); setDetail(null); }}
          onDone={(m) => { setRequest(null); setDetail(null); setDone(m); }}
        />
      )}
      {done && (
        <RdDialog title={done.title} onClose={() => setDone(null)} footer={<RdButton place="dialog" onClick={() => setDone(null)}>확인</RdButton>}>
          {done.desc?.split('\n').map((l) => <p className="rd-dialog__desc" key={l}>{l}</p>)}
        </RdDialog>
      )}
      {tax && <TaxDialog onClose={() => setTax(false)} />}
    </div>
  );
}
