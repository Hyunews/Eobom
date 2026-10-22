import React, { useEffect, useRef, useState } from 'react';
import { RdBranchButton, RdButton, RdTextLink } from '../../parts/RdButtons';
import { RdList, RdListRow } from '../../parts/RdCards';
import { RdChips, RdConsentGroup, RdField, RdInput, RdTextarea, RdCheck } from '../../parts/RdInputs';
import { RdPageHead } from '../../parts/RdNav';
import { RdAlertDialog, RdDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconWarn } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { calculateInheritanceTax, type InheritanceTaxBreakdown } from '../../../utils/inheritanceTax';
import { DemoBar, sleep, type DemoOption } from './prepCommon';

// 8단계 묶음 4 · /preview/counseling — 1단계 캔버스 1-16~1-20(전문가 상담 · 상황 고르기 · 상세 · 신청 · 상속세 · 상태·알림).
// 전문가·금액·접수번호는 모두 예시. 서버 없이 움직인다.

interface Expert {
  id: string;
  name: string;
  field: string;
  intro: string;
  license: string;
  tags: string;
  office: string;
}
const EXPERTS: Expert[] = [
  { id: 'e1', name: '김OO', field: '상속 변호사', intro: '상속 분쟁 · 유류분 청구 상담', license: '서울지방변호사회', tags: '#상속 #유류분 #상속포기', office: '서울특별시 서초구 OO로 00' },
  { id: 'e2', name: '이OO', field: '상속 법무사', intro: '부동산 상속등기 · 자동차 명의 이전', license: '대한법무사협회', tags: '#상속등기 #명의이전', office: '서울특별시 강남구 OO로 00' },
  { id: 'e3', name: '박OO', field: '상속세 세무사', intro: '상속세 신고 · 취득세 상담', license: '한국세무사회', tags: '#상속세 #취득세', office: '서울특별시 송파구 OO로 00' },
  { id: 'e4', name: '최OO', field: '행정사', intro: '사망 관련 행정 서류 · 각종 신고 대행', license: '행정사 자격증', tags: '#행정서류 #신고대행', office: '서울특별시 마포구 OO로 00' },
  { id: 'e5', name: '정OO', field: '장례 지도사', intro: '장례 절차 안내 · 장례식장 연결', license: '장례지도사 자격증', tags: '#장례절차 #장례식장', office: '서울특별시 종로구 OO로 00' },
];
const FIELDS = ['상속 변호사', '상속 법무사', '상속세 세무사', '행정사', '장례 지도사'];

interface Situation {
  title: string;
  fields: string[];
  deadline?: string;
}
const SITUATIONS: Situation[] = [
  { title: '고인에게 빚이 있을 수 있습니다', fields: ['상속 변호사', '상속 법무사'], deadline: '사망을 안 날부터 3개월 안에 상속포기·한정승인 신청' },
  { title: '부동산·자동차 명의를 바꿔야 합니다', fields: ['상속 법무사'] },
  { title: '상속세·취득세를 알아봐야 합니다', fields: ['상속세 세무사'] },
  { title: '가족 간에 의견이 다릅니다', fields: ['상속 변호사'] },
  { title: '행정 서류·신고가 남아 있습니다', fields: ['행정사'] },
  { title: '장례 절차를 상담하고 싶습니다', fields: ['장례 지도사'] },
];

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본' },
  { value: 'login', label: '로그인 전' },
  { value: 'loading', label: '불러오는 중' },
  { value: 'empty-all', label: '빈 화면 (전체)' },
  { value: 'empty-field', label: '빈 화면 (분야를 골랐을 때)' },
  { value: 'noconsent', label: '알림 ④ 동의하지 않고 신청 (신청 창이 열림)', group: '신청·알림' },
  { value: 'servererr', label: '알림 ⑥ 서버 오류 (신청하면)', group: '신청·알림' },
];

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

const METHODS = ['카카오 알림톡', '전화', '화상 상담', '방문'];

function RequestDialog({ expert, demo, onClose, onDone }: { expert: Expert; demo: string; onClose: () => void; onDone: (msg: { title: string; desc?: string }) => void }) {
  const [useMine, setUseMine] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saveMine, setSaveMine] = useState(false);
  const [method, setMethod] = useState<string[]>(['카카오 알림톡']);
  const [when, setWhen] = useState('');
  const [text, setText] = useState('');
  const [agree, setAgree] = useState<Record<string, boolean>>({ c: false });
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{ title: string; desc?: string } | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const submit = async () => {
    if (!agree.c) {
      setAlert({ title: '개인정보 제3자 제공에 동의해야 상담을 신청할 수 있습니다.' });
      return;
    }
    setBusy(true);
    await sleep(900);
    if (!alive.current) return;
    setBusy(false);
    if (demo === 'servererr') {
      setAlert({ title: '서버와 통신 중 오류가 발생했습니다.' });
      return;
    }
    onDone({ title: `[${expert.name}]님께 상담 신청이 접수되었습니다.`, desc: '접수번호: EC-261014-0001\n(문의 시 이 번호를 말씀해주시면 빠르게 확인 가능합니다)' });
  };

  return (
    <>
      <RdDialog
        form
        title={`[${expert.name}] 상담 신청`}
        closeX
        onClose={onClose}
        footer={
          <>
            <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
            <RdButton place="dialog" busy={busy} busyText="전송 중..." onClick={submit}>상담 신청</RdButton>
          </>
        }
      >
        <div className="rd-formstack">
          <p className="rd-dialog__desc">신청 내용을 남겨주시면 전문가가 확인 후 연락드립니다.</p>
          <RdCheck label="내 정보 사용 (010-****-5678)" checked={useMine} onChange={(e) => setUseMine(e.target.checked)} />
          <RdField label="이름" required>{(p) => <RdInput {...p} disabled={useMine} value={useMine ? '김OO' : name} onChange={(e) => setName(e.target.value)} />}</RdField>
          <RdField label="연락처" required>{(p) => <RdInput {...p} inputMode="tel" disabled={useMine} value={useMine ? '010-1234-5678' : phone} onChange={(e) => setPhone(e.target.value)} />}</RdField>
          {!useMine && <RdCheck label="다음에도 쓸 수 있게 내 정보에 저장" checked={saveMine} onChange={(e) => setSaveMine(e.target.checked)} />}
          <RdChips label="희망 상담 방식" options={METHODS} value={method} onChange={(v) => setMethod(v.length ? v : method)} />
          <RdField label="희망 상담 일시 (선택)">{(p) => <RdInput {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</RdField>
          <RdField label="상담 희망 내용">{(p) => <RdTextarea {...p} rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />}</RdField>
          <div className="rd-pr-voice">
            <RdConsentGroup
              items={[
                {
                  id: 'c',
                  label: '개인정보 제3자 제공에 동의합니다.',
                  required: true,
                  desc: `제공받는 자: ${expert.name} (이어봄 입점 전문가)\n제공 목적: 상담 안내 및 연락\n제공 항목: 이름, 연락처, 상담 희망 내용\n보유 기간: 목적 달성 후 파기`,
                },
              ]}
              checked={agree}
              onChange={setAgree}
            />
          </div>
        </div>
      </RdDialog>
      {alert && <RdAlertDialog title={alert.title} desc={alert.desc} onOk={() => setAlert(null)} />}
    </>
  );
}

/* ───────── 쪽 ───────── */

export function CounselingPage() {
  const phone = useIsPhone();
  const [demo, setDemo] = useState('normal');
  const [situation, setSituation] = useState<Situation | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [picking, setPicking] = useState(true);
  const [detail, setDetail] = useState<Expert | null>(null);
  const [request, setRequest] = useState<Expert | null>(null);
  const [tax, setTax] = useState(false);
  const [done, setDone] = useState<{ title: string; desc?: string } | null>(null);

  useEffect(() => {
    setSituation(null);
    setFields(demo === 'empty-field' ? ['상속 변호사'] : []);
    setPicking(demo === 'normal');
    setDetail(null);
    setRequest(demo === 'noconsent' || demo === 'servererr' ? EXPERTS[0] : null);
  }, [demo]);

  const head = (
    <RdPageHead
      title="상속 · 법률 · 세무 전문가 상담"
      desc="분야별 전문가 상담 신청 및 상속세 시뮬레이터"
      actions={
        <>
          <RdButton kind="secondary" onClick={() => setTax(true)}>상속세 계산하기</RdButton>
          <RdButton onClick={() => setPicking(true)}>어떤 도움이 필요하세요?</RdButton>
        </>
      }
    />
  );
  const demoBar = <DemoBar value={demo} options={DEMOS} onChange={setDemo} />;

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title="전문가 상담" desc="분야별 상담 신청 및 상속세 자동 시뮬레이터" />
        <div style={{ position: 'relative', minHeight: 520 }}><RdLoginGate screenName="전문가 상담" contained /></div>
        {demoBar}
      </div>
    );
  }

  const shown = demo === 'empty-all' || demo === 'empty-field' ? [] : EXPERTS.filter((e) => fields.length === 0 || fields.includes(e.field));

  return (
    <div className="rd-container rd-screen">
      {head}

      {situation && (
        <div className="rd-pr-situation">
          {situation.deadline && (
            <p className="rd-pr-situation__deadline"><IconWarn size={16} />{situation.deadline}</p>
          )}
          <div className="rd-pr-situation__row">
            <span className="rd-pr-situation__name">{situation.title}</span>
            <RdTextLink href="#" onClick={(e) => { e.preventDefault(); setPicking(true); }}>다시 고르기</RdTextLink>
          </div>
        </div>
      )}

      <RdChips label="분야" options={['전체', ...FIELDS]} value={fields.length === 0 ? ['전체'] : fields} multiple onChange={(v) => {
        const next = v.filter((x) => x !== '전체');
        // 방금 눌러서 "전체"가 새로 들어왔으면 모두 풀고, 분야가 새로 들어왔으면 그 분야만 남긴다
        setFields(v.includes('전체') && fields.length > 0 ? [] : next);
      }} />

      {demo === 'loading' ? (
        <p className="rd-lineinfo" role="status">불러오는 중...</p>
      ) : shown.length === 0 ? (
        <RdState
          kind="empty"
          title={demo === 'empty-field' ? '상속 변호사 분야에 입점한 전문가가 아직 없습니다.' : '아직 입점한 전문가가 없습니다.'}
          desc="준비되는 대로 순차적으로 노출됩니다."
        />
      ) : (
        <RdList label="전문가">
          {shown.map((e) => (
            <RdListRow key={e.id} title={e.name} info={phone ? e.field : `${e.field} · ${e.intro}`} onClick={() => setDetail(e)} />
          ))}
        </RdList>
      )}

      {demoBar}

      {picking && (
        <RdDialog
          title="어떤 도움이 필요하세요?"
          width={560}
          onClose={() => setPicking(false)}
          footer={<RdButton kind="secondary" place="dialog" onClick={() => setPicking(false)}>닫기</RdButton>}
        >
          <div className="rd-pr-picks">
            {SITUATIONS.map((s, i) => (
              <RdBranchButton
                key={s.title}
                tone={i === 0 ? 'primary' : 'secondary'}
                title={s.title}
                desc={`${s.fields.join(' · ')}${s.deadline ? ' · 기한 3개월' : ''}`}
                onClick={() => { setSituation(s); setFields(s.fields); setPicking(false); }}
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
            <dt>분야</dt><dd>{detail.field}</dd>
            <dt>자격</dt><dd>{detail.license}</dd>
            <dt>전문</dt><dd>{detail.tags}</dd>
            <dt>사무실</dt><dd>{detail.office}</dd>
            <dt>소개</dt><dd>{detail.intro}</dd>
          </dl>
        </RdDialog>
      )}

      {request && (
        <RequestDialog
          expert={request}
          demo={demo}
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
