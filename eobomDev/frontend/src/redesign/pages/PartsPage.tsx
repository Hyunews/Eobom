import React, { useState } from 'react';
import {
  RdBadge,
  RdBranchButton,
  RdButton,
  RdButtonRow,
  RdIconButton,
  RdRequired,
  RdTextLink,
} from '../parts/RdButtons';
import {
  RdCard,
  RdChecklistRow,
  RdFold,
  RdList,
  RdListRow,
  RdMoreButton,
  RdNavRow,
  RdPager,
  RdSectionHead,
  RdStatGrid,
} from '../parts/RdCards';
import {
  RdCheck,
  RdChips,
  RdConsentGroup,
  RdDate,
  RdField,
  RdFileDrop,
  RdFileRow,
  RdFilterRow,
  RdInput,
  RdRadioGroup,
  RdSaveBar,
  RdSelect,
  RdTextarea,
} from '../parts/RdInputs';
import { RdPageHead, RdTabs, RdToc } from '../parts/RdNav';
import {
  RdBanner,
  RdDeadlineLine,
  RdHelpTip,
  RdLocation,
  RdNotice,
  RdSourceTip,
  RdTipHost,
} from '../parts/RdNotices';
import { RdAlertDialog, RdConfirmDialog, RdDangerDialog, RdDialog, RdLoginGate, useRdToast } from '../parts/RdModal';
import { RdState } from '../parts/RdState';
import { IconChevronLeft, IconClose, IconPause, IconUser, IconUsers } from '../parts/icons';

// 8단계 묶음 2 — 공통 부품 견본 쪽(/preview/parts). 상태별로 전부 늘어놓는다. 00-44 §6~§8 · 0단계 판 02~08.
// 올림·초점은 마우스를 올려야 보이므로 is-hover / is-focus 클래스로 고정해 나란히 보인다.

const SECTIONS = [
  { id: 'pt-button', label: '버튼 · 링크' },
  { id: 'pt-card', label: '칸 · 목록' },
  { id: 'pt-input', label: '입력' },
  { id: 'pt-head', label: '쪽 머리 · 탭' },
  { id: 'pt-notice', label: '안내' },
  { id: 'pt-dialog', label: '창' },
  { id: 'pt-state', label: '상태 화면' },
];

function Sample({ title, note, children, bare, wide }: { title: string; note?: string; children: React.ReactNode; bare?: boolean; wide?: boolean }) {
  return (
    <div className="rd-pv__sample" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <h3 className="rd-pv__sub">{title}</h3>
      {note && <p className="rd-t-small">{note}</p>}
      <div className={`rd-pv__stage${bare ? ' rd-pv__stage--bare' : ''}`}>{children}</div>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rd-pv__cell">
      <p className="rd-t-small">{label}</p>
      {children}
    </div>
  );
}

const noop = () => {};

function ButtonsBlock() {
  return (
    <>
      <Sample title="주 버튼" note="그 구역의 한 가지 할 일. 먹색 바탕.">
        <div className="rd-pv__row rd-pv__row--grid">
          <Cell label="기본"><RdButton>저장하기</RdButton></Cell>
          <Cell label="올림 · 눌림"><RdButton className="is-hover">저장하기</RdButton></Cell>
          <Cell label="초점(키보드)"><RdButton className="is-focus">저장하기</RdButton></Cell>
          <Cell label="사용 불가"><RdButton disabled disabledReason="필수 항목을 모두 적어야 합니다.">저장하기</RdButton></Cell>
          <Cell label="처리 중"><RdButton busy busyText="저장하는 중">저장하기</RdButton></Cell>
        </div>
      </Sample>
      <Sample title="보조 버튼" note="취소 · 이전 · 다른 선택. 투명 + 먹색 1px 테두리. 처리 중 상태 없음.">
        <div className="rd-pv__row rd-pv__row--grid">
          <Cell label="기본"><RdButton kind="secondary">취소</RdButton></Cell>
          <Cell label="올림 · 눌림"><RdButton kind="secondary" className="is-hover">취소</RdButton></Cell>
          <Cell label="초점(키보드)"><RdButton kind="secondary" className="is-focus">취소</RdButton></Cell>
          <Cell label="사용 불가"><RdButton kind="secondary" disabled>이전</RdButton></Cell>
        </div>
      </Sample>
      <Sample title="위험 버튼" note="지우기 · 탈퇴 · 파기. 누르면 바로 지우지 않고 위험 확인 창(창 구간)을 거친다.">
        <div className="rd-pv__row rd-pv__row--grid">
          <Cell label="기본"><RdButton kind="danger">삭제하기</RdButton></Cell>
          <Cell label="올림 · 눌림"><RdButton kind="danger" className="is-hover">삭제하기</RdButton></Cell>
          <Cell label="초점(키보드)"><RdButton kind="danger" className="is-focus">삭제하기</RdButton></Cell>
          <Cell label="사용 불가"><RdButton kind="danger" disabled>삭제하기</RdButton></Cell>
          <Cell label="처리 중"><RdButton kind="danger" busy busyText="삭제하는 중">삭제하기</RdButton></Cell>
        </div>
      </Sample>
      <Sample title="글 링크" note="다른 화면으로 이동. 사용 불가 상태가 없다(숨긴다). 모바일은 짧은 글자.">
        <div className="rd-pv__row">
          <Cell label="기본"><RdTextLink href="#" onClick={(e) => e.preventDefault()}>상속 절차 보기</RdTextLink></Cell>
          <Cell label="올림"><RdTextLink href="#" className="is-hover" onClick={(e) => e.preventDefault()}>상속 절차 보기</RdTextLink></Cell>
          <Cell label="초점(키보드)"><RdTextLink href="#" className="is-focus" onClick={(e) => e.preventDefault()}>상속 절차 보기</RdTextLink></Cell>
          <Cell label="바깥 이동 (↗)"><RdTextLink href="#" external onClick={(e) => e.preventDefault()}>장사법 제6조</RdTextLink></Cell>
          <Cell label="모바일에서 짧게"><RdTextLink href="#" short="전체" onClick={(e) => e.preventDefault()}>전체 보기</RdTextLink></Cell>
        </div>
      </Sample>
      <Sample title="아이콘 버튼" note="44 × 44. 이름은 화면낭독용(aria-label).">
        <div className="rd-pv__row">
          <Cell label="없음(닫기)"><RdIconButton label="닫기"><IconClose /></RdIconButton></Cell>
          <Cell label="테두리(이전)"><RdIconButton label="이전" bordered><IconChevronLeft /></RdIconButton></Cell>
          <Cell label="테두리(멈춤)"><RdIconButton label="멈춤" bordered><IconPause /></RdIconButton></Cell>
          <Cell label="올림"><RdIconButton label="멈춤" bordered className="is-hover"><IconPause /></RdIconButton></Cell>
          <Cell label="초점(키보드)"><RdIconButton label="이전" bordered className="is-focus"><IconChevronLeft /></RdIconButton></Cell>
          <Cell label="사용 불가"><RdIconButton label="멈춤" bordered disabled><IconPause /></RdIconButton></Cell>
        </div>
      </Sample>
      <Sample title="놓이는 자리 ① 화면 안 · ② 목록 줄 안" note="① 데스크톱 오른쪽 정렬 [보조][주] · 모바일 가득 폭 쌓기(주가 위). ② 높이 44 · 글자 14.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <RdButtonRow>
            <RdButton kind="secondary">이전</RdButton>
            <RdButton>다음</RdButton>
          </RdButtonRow>
          <div className="rd-pv__row" style={{ justifyContent: 'flex-end' }}>
            <RdButton place="row" kind="secondary">수정</RdButton>
            <RdButton place="row" kind="danger">삭제</RdButton>
          </div>
        </div>
      </Sample>
      <Sample title="갈래 버튼" note="랜딩 첫 화면 · 상담의 상황 고르기. 주(먹색 채움) / 보조(종이 + 먹색 테두리).">
        <div className="rd-pv__grid">
          <RdBranchButton tone="primary" title="미리 준비하고 싶습니다" desc="엔딩노트와 메시지를 남깁니다" />
          <RdBranchButton tone="secondary" title="가족을 떠나보냈습니다" desc="지금 해야 할 일을 순서대로 봅니다" />
        </div>
      </Sample>
      <Sample title="표시 딱지 · 필수 딱지" note="테두리 딱지 = 상태 · 채운 딱지 = 기한 임박과 예시만.">
        <div className="rd-pv__row" style={{ alignItems: 'center' }}>
          <RdBadge kind="done">공개 중</RdBadge>
          <RdBadge kind="state">닫힘</RdBadge>
          <RdBadge kind="draft">작성 중</RdBadge>
          <RdBadge kind="danger">되돌릴 수 없음</RdBadge>
          <RdBadge kind="danger-fill">D-12</RdBadge>
          <RdBadge kind="example">예시</RdBadge>
          <span style={{ fontSize: 15, fontWeight: 500 }}>성함 <RdRequired /></span>
          <span style={{ fontSize: 15 }}>동의 문장 끝 <RdRequired narrow /></span>
        </div>
      </Sample>
    </>
  );
}

function CardsBlock() {
  const [checks, setChecks] = useState({ a: false, b: false, c: true });
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  return (
    <>
      <Sample title="구간 머리" note="구간 제목 + 개수 + 오른쪽 링크 · 아래 실선. 링크 글자는 모바일에서 짧게(전체 보기 → 전체).">
        <RdSectionHead title="추모공원" count="12곳" linkLabel="전체 보기" linkShort="전체" />
      </Sample>
      <Sample title="카드" note="평 카드(올림 = 눌린 바탕 + 테두리 #B9AC98) · 종이 카드(어긋난 그림자, 화면당 1~2개). 데스크톱 3칸 간격 24.">
        <div className="rd-cards">
          <RdCard
            eyebrow="서울 강남구"
            title="[예시] 한결 유품정리"
            desc="유품 분류 · 폐기 · 특수 청소"
            footer={
              <>
                <span className="rd-card__state">견적 문의 가능</span>
                <RdTextLink href="#" onClick={(e) => e.preventDefault()}>견적 신청</RdTextLink>
              </>
            }
            mobileAction={<RdButton kind="secondary">견적 신청</RdButton>}
          />
          <div className="rd-pv-desk-only">
            <RdCard
              className="rd-card--press is-hover"
              eyebrow="서울 송파구"
              title="[예시] 마중 정리"
              desc="유품 분류 · 기부 연계"
              footer={
                <>
                  <span className="rd-card__state">마우스 올림</span>
                  <RdTextLink href="#" onClick={(e) => e.preventDefault()}>견적 신청</RdTextLink>
                </>
              }
            />
          </div>
          <RdCard
            tone="paper"
            eyebrow="강조 카드 · 화면당 1~2개"
            title="상속포기 · 한정승인"
            desc="사망을 안 날부터 3개월 안에 가정법원에 신고합니다."
            footer={
              <>
                <span className="rd-card__state rd-card__state--danger">남은 날 12일</span>
                <RdTextLink href="#" onClick={(e) => e.preventDefault()}>자세히</RdTextLink>
              </>
            }
          />
        </div>
      </Sample>
      <Sample title="목록 줄 · 이동 줄" note="위 먹색 실선, 줄 사이 점선. 줄 전체가 누르는 자리. 모바일은 상태가 정보 줄 안으로.">
        <div className="rd-pv__grid">
          <RdList label="목록 줄">
            <RdListRow title="故 김○○ 님 부고" info="발인 10월 16일 · 조문 32명" status={<span className="rd-st rd-st--done">공개 중</span>} onClick={noop} />
            <RdListRow className="is-hover" title="故 박○○ 님 부고" info="발인 9월 2일" status={<span className="rd-st rd-st--muted">닫힘</span>} onClick={noop} />
            <RdListRow title="연금 수급 중지" info="국민연금공단" onClick={noop} />
          </RdList>
          <RdList label="이동 줄">
            <RdNavRow icon={<IconUser />} name="내 정보" desc="이름 · 연락처 · 로그인 방법" />
            <RdNavRow icon={<IconUsers />} name="가족 지정" desc="2명 지정됨" />
          </RdList>
        </div>
      </Sample>
      <Sample title="체크리스트 줄" note="상자를 눌러야만 체크된다. 제목 · ›는 안내 창. 세 상태: 안 함 · 기한 임박 · 끝냄. 색만으로 구분하지 않고 글로도 적는다.">
        <RdList label="체크리스트">
          <RdChecklistRow title="사망신고" info="시·구·읍·면 사무소 · 1개월 안" infoMobile="1개월 안 · D-21" dueTag="D-21" state="todo" checked={checks.a} onToggle={(v) => setChecks({ ...checks, a: v })} onOpen={noop} />
          <RdChecklistRow
            title="상속포기 · 한정승인 결정"
            info="가정법원"
            state="soon"
            checked={checks.b}
            onToggle={(v) => setChecks({ ...checks, b: v })}
            onOpen={noop}
            deadlineBadge="D-12"
            deadlineText="기한이 12일 남았습니다"
          />
          <RdChecklistRow title="장례식장 정하기" info="장례식장" state="done" checked={checks.c} onToggle={(v) => setChecks({ ...checks, c: v })} onOpen={noop} doneText="10월 12일 끝냄" />
        </RdList>
      </Sample>
      <Sample title="숫자 칸">
        <RdStatGrid items={[{ name: '전체 할 일', value: '24' }, { name: '끝낸 일', value: '9' }, { name: '기한 있는 일', value: '2', tone: 'danger' }]} />
      </Sample>
      <Sample title="펼침 · 더 보기">
        <div className="rd-foldlist">
          <RdFold title="장례 기간">
            <p className="rd-t-support">펼친 내용이 이 자리에 들어갑니다.</p>
          </RdFold>
          <RdFold title="장례 후 1개월" defaultOpen>
            <p className="rd-t-support">펼친 내용이 이 자리에 들어갑니다.</p>
          </RdFold>
          {more && <p className="rd-t-support">더 보기를 누르면 이어서 나오는 내용입니다.</p>}
          {!more && <RdMoreButton onClick={() => setMore(true)} />}
        </div>
      </Sample>
      <Sample title="쪽 넘김" note="첫 쪽 [이전] · 마지막 쪽 [다음]은 흐리게.">
        <RdPager page={page} total={6} onChange={setPage} />
      </Sample>
    </>
  );
}

function InputsBlock() {
  const [text, setText] = useState('');
  const [long, setLong] = useState('아버지께 드리는 마지막 인사입니다.');
  const [relation, setRelation] = useState('');
  const [kind, setKind] = useState('buried');
  const [chips, setChips] = useState<string[]>(['서울']);
  const [multi, setMulti] = useState<string[]>(['봉안당', '수목장']);
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<{ name: string; meta: string }[]>([{ name: '사망진단서.jpg', meta: '2.4MB · 올림' }]);
  const [formErr, setFormErr] = useState<{ name?: string; relation?: string; agree?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [consentView, setConsentView] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: { name?: string; relation?: string; agree?: string } = {};
    if (!text.trim()) err.name = '성함을 끝까지 적어 주세요';
    if (!relation) err.relation = '관계를 골라 주세요';
    if (!agree.terms) err.agree = '확인이 필요한 항목입니다.';
    setFormErr(Object.keys(err).length ? err : null);
    if (Object.keys(err).length) {
      // 화면 위에서 첫 번째 오류 칸으로 초점 (§8-3-2 ④)
      window.setTimeout(() => (document.querySelector('#pv-form [aria-invalid="true"]') as HTMLElement | null)?.focus(), 0);
      return;
    }
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1500);
  };
  const errCount = formErr ? Object.keys(formErr).length : 0;

  return (
    <>
      <Sample title="입력칸 다섯 가지 상태" note="기본 · 초점(2px 먹색) · 입력됨 · 오류(2px 위험 + 오류 글이 도움말 자리를 대신함) · 사용 불가. 데스크톱 48 / 모바일 52.">
        <div className="rd-pv__grid">
          <RdField label="성함" required help="주민등록상 이름">
            {(p) => <RdInput {...p} placeholder="예: 김영자" />}
          </RdField>
          <RdField label="성함 (초점)" required>
            {(p) => <RdInput {...p} className="is-focus" placeholder="예: 김영자" />}
          </RdField>
          <RdField label="성함 (입력됨)" required>
            {(p) => <RdInput {...p} defaultValue="김영자" />}
          </RdField>
          <RdField label="연락처 (오류)" required error="번호를 끝까지 적어 주세요">
            {(p) => <RdInput {...p} defaultValue="010-12" />}
          </RdField>
          <RdField label="주민등록번호 (사용 불가)" help="고칠 수 없는 칸입니다.">
            {(p) => <RdInput {...p} disabled defaultValue="680312-*******" />}
          </RdField>
        </div>
      </Sample>
      <Sample title="그 밖의 입력: 고르기 · 날짜 · 긴 글" note="날짜의 달력은 브라우저 기본. 긴 글은 세로로만 늘어난다.">
        <div className="rd-pv__grid">
          <RdField label="관계">
            {(p) => (
              <RdSelect {...p} value={relation} onChange={(e) => setRelation(e.target.value)}>
                <option value="">선택해 주세요</option>
                <option value="spouse">배우자</option>
                <option value="child">자녀</option>
              </RdSelect>
            )}
          </RdField>
          <RdField label="사망일">
            {(p) => <RdDate {...p} />}
          </RdField>
          <div style={{ gridColumn: '1 / -1' }}>
            <RdField label="남기는 말">
              {(p) => <RdTextarea {...p} value={long} maxLength={2000} onChange={(e) => setLong(e.target.value)} />}
            </RdField>
          </div>
        </div>
      </Sample>
      <Sample title="체크 · 라디오" note="상자 22, 테두리 #8A7E70, 고르면 먹색. 폼의 체크는 글자까지 누르는 자리. 모바일 라디오는 줄 52 · 한 줄 전체.">
        <div className="rd-pv__grid">
          <div>
            <RdCheck label="알림을 받겠습니다" />
            <RdCheck label="고른 상태" defaultChecked />
            <RdCheck label="사용 불가" disabled />
          </div>
          <RdRadioGroup
            legend="장례 방식"
            name="pv-kind"
            value={kind}
            options={[{ value: 'buried', label: '매장' }, { value: 'cremated', label: '화장' }, { value: 'tree', label: '수목장' }]}
            onChange={setKind}
          />
        </div>
      </Sample>
      <Sample title="동의 묶음 · 설명이 붙는 동의 줄" note="[모두 동의] 굵게 + 아래 실선 · 하위 줄 + [보기] · 묶음 아래 오류 글.">
        <div className="rd-pv__grid">
          <RdConsentGroup
            checked={agree}
            onChange={setAgree}
            onView={setConsentView}
            items={[
              { id: 'terms', label: '이용약관 동의', required: true },
              { id: 'privacy', label: '개인정보 수집 동의', required: true },
            ]}
          />
          <RdConsentGroup
            checked={agree}
            onChange={setAgree}
            error="확인이 필요한 항목입니다."
            items={[{ id: 'third', label: '제3자 제공 동의', required: true, desc: '부고장을 받는 사람에게 성함이 보입니다.' }]}
          />
        </div>
      </Sample>
      <Sample title="파일 올리기 · 올린 파일 줄" note="데스크톱: 점선 상자. 모바일: 끌어다 놓기가 없어 버튼 둘.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <RdFileDrop onFiles={(fs) => setFiles((cur) => [...cur, ...fs.map((f) => ({ name: f.name, meta: `${(f.size / 1048576).toFixed(1)}MB · 올림` }))])} />
          {files.length > 0 && (
            <ul className="rd-files">
              {files.map((f, i) => (
                <RdFileRow key={f.name + i} name={f.name} meta={f.meta} onRemove={() => setFiles((cur) => cur.filter((_, j) => j !== i))} />
              ))}
            </ul>
          )}
        </div>
      </Sample>
      <Sample title="선택 조각 · 거르기 줄" note="고른 것 = 먹색 채움. 모바일은 한 줄로 옆으로 밀어 넘김.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <RdChips label="지역 (하나만)" options={['서울', '경기', '인천', '부산', '대구', '광주', '대전']} value={chips} onChange={setChips} />
          <RdChips label="종류 (여럿)" options={['봉안당', '수목장', '자연장', '매장']} value={multi} onChange={setMulti} multiple />
          <RdFilterRow onSearch={noop}>
            <RdField label="지역">{(p) => <RdSelect {...p}><option>서울</option></RdSelect>}</RdField>
            <RdField label="종류">{(p) => <RdSelect {...p}><option>전체</option></RdSelect>}</RdField>
          </RdFilterRow>
        </div>
      </Sample>
      <Sample title="폼 하나 (오류 · 처리 중 · 저장 줄)" note="[저장하기]를 눌러 보면: 칸 아래 오류 글 + 2px 위험 테두리 + 저장 줄의 요약 한 줄 + 첫 오류 칸으로 초점. 고치면 그 칸 오류만 풀린다.">
        <form id="pv-form" className="rd-form" noValidate onSubmit={submit}>
          <RdField label="성함" required help="주민등록상 이름" error={formErr?.name}>
            {(p) => (
              <RdInput
                {...p}
                value={text}
                placeholder="예: 김영자"
                onChange={(e) => {
                  setText(e.target.value);
                  if (formErr?.name) setFormErr({ ...formErr, name: undefined });
                }}
              />
            )}
          </RdField>
          <RdField label="관계" required error={formErr?.relation}>
            {(p) => (
              <RdSelect
                {...p}
                value={relation}
                onChange={(e) => {
                  setRelation(e.target.value);
                  if (formErr?.relation) setFormErr({ ...formErr, relation: undefined });
                }}
              >
                <option value="">선택해 주세요</option>
                <option value="spouse">배우자</option>
                <option value="child">자녀</option>
              </RdSelect>
            )}
          </RdField>
          <RdConsentGroup
            checked={agree}
            onChange={(n) => {
              setAgree(n);
              if (formErr?.agree && n.terms) setFormErr({ ...formErr, agree: undefined });
            }}
            error={formErr?.agree}
            items={[{ id: 'terms', label: '이용약관 동의', required: true }]}
          />
          <RdSaveBar savedAt="10월 14일 15:20" errorCount={errCount}>
            <RdButton place="bar" kind="secondary">취소</RdButton>
            <RdButton place="bar" type="submit" busy={saving} busyText="처리 중…">저장하기</RdButton>
          </RdSaveBar>
        </form>
      </Sample>
      {consentView && (
        <RdAlertDialog title="약관 보기" desc="약관 전문은 해당 화면에서 보입니다. 견본에서는 창만 확인합니다." onOk={() => setConsentView(null)} />
      )}
    </>
  );
}

function HeadBlock() {
  const [tab, setTab] = useState('a');
  const [toc, setToc] = useState('s2');
  return (
    <>
      <Sample title="쪽 머리" note="윗글 → 쪽 제목 → 한 줄 설명, 오른쪽에 쪽 전체에 걸리는 버튼. 둘이면 [보조][주]. 모바일은 제목 아래 세로(주가 위).">
        <RdPageHead
          eyebrow="제1부 · 생전 준비"
          title="디지털 엔딩노트"
          desc="나의 기록을 한곳에 모읍니다."
          actions={
            <>
              <RdButton kind="secondary">내려받기</RdButton>
              <RdButton>새로 쓰기</RdButton>
            </>
          }
        />
      </Sample>
      <Sample title="탭" note="고른 것 = 굵게 + 먹색 밑줄 3px. 방향키로 옮긴다. 모바일은 넘치면 옆으로 밀어 넘김.">
        <RdTabs
          label="견본 탭"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'a', label: '전체' },
            { value: 'b', label: '작성 중' },
            { value: 'c', label: '끝낸 것' },
            { value: 'd', label: '공유받은 것' },
            { value: 'e', label: '보관함' },
            { value: 'f', label: '설정' },
          ]}
        />
      </Sample>
      <Sample title="쪽 안 차례" note="데스크톱: 왼쪽 열 220, 스크롤 따라 고정. 모바일: 화면 위에 붙는 접힌 띠 → 누르면 펼침.">
        <div className="rd-pv__split">
          <RdToc
            current={toc}
            onSelect={setToc}
            items={[
              { id: 's1', label: '기본 정보', done: 5, total: 5 },
              { id: 's2', label: '가족과 연락처', done: 2, total: 5 },
              { id: 's3', label: '재산', done: 0, total: 4 },
              { id: 's4', label: '장례 희망' },
            ]}
          />
          <div className="rd-pv__read" style={{ flex: 1 }}>
            <p className="rd-t-support">차례에서 구간을 고르면 지금 위치 표시가 옮겨 갑니다. 본문 폭 764.</p>
          </div>
        </div>
      </Sample>
    </>
  );
}

function NoticeBlock() {
  const [banner, setBanner] = useState(true);
  return (
    <>
      <Sample title="띠 알림" note="먹색 띠 · 한 번에 하나 · role=status. 닫으면 사라진다.">
        {banner ? (
          <RdBanner
            onClose={() => setBanner(false)}
            action={<RdTextLink onDark href="#" onClick={(e) => e.preventDefault()}>확인하기</RdTextLink>}
          >
            사후 개봉 요청이 접수되었습니다.
          </RdBanner>
        ) : (
          <RdButton kind="secondary" onClick={() => setBanner(true)}>띠 다시 보기</RdButton>
        )}
      </Sample>
      <Sample title="알림 상자 · 주의 · 성공 상자" note="주의는 되돌릴 수 없는 일과 기한에만. 성공 상자는 일이 끝났음을 한 줄 사실로.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RdNotice title="사진의 글자를 읽어 옮깁니다" action={<RdTextLink href="#" onClick={(e) => e.preventDefault()}>읽는 방법</RdTextLink>}>
            옮겨 적은 글은 저장하기 전에 직접 확인해 주세요.
          </RdNotice>
          <RdNotice tone="caution" title="상속 한정승인 기한이 12일 남았습니다">
            기한이 지나면 되돌릴 수 없습니다.
          </RdNotice>
          <RdNotice tone="success" title="부고장을 만들었습니다" />
        </div>
      </Sample>
      <Sample title="기한 한 줄 안내" note="높이 48, 한 줄. 큰 주의 상자를 숨기는 모바일에서 대신 쓴다. 누르면 해당 구간으로.">
        <RdDeadlineLine onClick={noop}>한정승인 기한이 12일 남았습니다</RdDeadlineLine>
      </Sample>
      <Sample title="위치 표시">
        <RdLocation>서울 강남구</RdLocation>
      </Sample>
      <Sample title="도움말 풍선 · 출처 말풍선" note="도움말: 눌러서 열고 닫는다(올림만으로는 안 열림). 출처: 데스크톱은 올림 · 초점 · 누름으로 열고 Esc · 바깥 누름으로 닫는다.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <RdTipHost>
            상속을 받을 때 한정승인<RdHelpTip term="한정승인">상속받은 재산 범위 안에서만 빚을 갚겠다고 법원에 신고하는 절차입니다.</RdHelpTip>을 할 수 있습니다.
          </RdTipHost>
          <div style={{ height: 56 }} aria-hidden="true" />
          <RdTipHost>
            개인정보는 처리방침에 따라 보관합니다.{' '}
            <RdSourceTip label="개인정보 보호법 제21조" title="개인정보 보호법 제21조 제1항">
              개인정보처리자는 개인정보의 보유기간이 경과하거나 처리 목적이 달성된 경우에는 지체 없이 그 개인정보를 파기하여야 한다.
            </RdSourceTip>
          </RdTipHost>
          <div style={{ height: 120 }} aria-hidden="true" />
        </div>
      </Sample>
      <Sample title="말풍선 열린 모양" note="시안의 열린 모양을 보이려고 처음부터 열어 두고 바깥을 눌러도 닫지 않게 한 견본 전용 설정(keepOpen). 실제 화면의 말풍선은 바깥을 누르면 닫힌다 — 위의 닫힌 말풍선 견본에서 확인.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <RdTipHost term>
            한정승인<RdHelpTip defaultOpen keepOpen term="한정승인">물려받은 재산 안에서만 빚을 갚는 방법입니다. 사망을 안 날부터 3개월 안에 가정법원에 신고합니다.</RdHelpTip>
          </RdTipHost>
          <div style={{ height: 96 }} aria-hidden="true" />
          <RdTipHost term>
            <RdSourceTip defaultOpen keepOpen label="KISO 정책규정 §28①" title="KISO 정책규정 제28조 ①">
              회원사는 상속인에게 피상속인의 계정 접속권 등을 원칙적으로 제공하지 아니한다.
            </RdSourceTip>
          </RdTipHost>
          <div style={{ height: 110 }} aria-hidden="true" />
        </div>
      </Sample>
    </>
  );
}

function DialogBlock() {
  const [dlg, setDlg] = useState<null | 'input' | 'confirm' | 'danger' | 'dangerDesc' | 'alert' | 'switch'>(null);
  const [step, setStep] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('300000000');
  const [busy, setBusy] = useState(false);
  const [gate, setGate] = useState(false);
  const { show, node } = useRdToast();
  const close = () => {
    setDlg(null);
    setStep('in');
    setBusy(false);
  };
  const total = Number(amount.replace(/\D/g, '')) || 0;
  return (
    <>
      <Sample title="창 열어 보기" note="데스크톱: 가운데 창 + 뒷배경 블러 4px · 먹색 35%. 휴대폰 폭(767 이하): 모두 아래에서 올라오는 판. Esc · 바깥 누르기로 닫힌다.">
        <div className="rd-pv__row rd-pv__row--grid">
          <RdButton kind="secondary" onClick={() => setDlg('input')}>① 입력 창</RdButton>
          <RdButton kind="secondary" onClick={() => setDlg('confirm')}>② 확인 창</RdButton>
          <RdButton kind="secondary" onClick={() => setDlg('danger')}>③ 위험 확인 창 (목록형)</RdButton>
          <RdButton kind="secondary" onClick={() => setDlg('dangerDesc')}>③ 위험 확인 창 (설명형)</RdButton>
          <RdButton kind="secondary" onClick={() => setDlg('alert')}>④ 알림 창</RdButton>
          <RdButton kind="secondary" onClick={() => show('저장했습니다')}>④ 짧은 알림</RdButton>
          <RdButton kind="secondary" onClick={() => setDlg('switch')}>⑥ 내용 바꾸기</RdButton>
        </div>
      </Sample>
      <Sample title="⑤ 로그인 가림막" note="뒤 화면을 바탕색 50%로 흐리게 + 가운데 카드 340. 실제 화면에서는 화면 전체를 가린다(여기서는 상자 안에서만).">
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 320 }}>
          <div className="rd-pv__fake" aria-hidden="true">
            <span style={{ width: '40%' }} /><span /><span style={{ width: '85%' }} /><span style={{ width: '70%' }} /><span />
          </div>
          {gate ? (
            <div className="rd-pv__fake"><p className="rd-t-support">로그인했다고 가정한 화면입니다.</p><RdButton kind="secondary" onClick={() => setGate(false)}>가림막 다시 보기</RdButton></div>
          ) : (
            <RdLoginGate contained screenName="엔딩노트" onLogin={() => setGate(true)} />
          )}
        </div>
      </Sample>

      {dlg === 'input' && (
        <RdDialog
          width={560}
          form
          closeX
          eyebrow="이어봄 추모동산"
          title="상담 신청"
          onClose={close}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" onClick={close}>취소</RdButton>
              <RdButton place="dialog" onClick={() => { close(); show('상담을 신청했습니다'); }}>신청하기</RdButton>
            </>
          }
        >
          <div className="rd-form">
            <RdField label="성함" required>{(p) => <RdInput {...p} placeholder="예: 김영자" />}</RdField>
            <RdField label="연락처" required help="통화 가능한 번호">{(p) => <RdInput {...p} inputMode="tel" />}</RdField>
          </div>
        </RdDialog>
      )}
      {dlg === 'confirm' && (
        <RdConfirmDialog
          title="개봉 요청을 취소하시겠습니까?"
          desc="취소하면 다시 요청해야 합니다."
          keepLabel="그대로 두기"
          doLabel="요청 취소"
          onKeep={close}
          onDo={() => { close(); show('요청을 취소했습니다'); }}
        />
      )}
      {dlg === 'danger' && (
        <RdDangerDialog
          title="메시지를 삭제할까요?"
          lost={['메시지 본문', '첨부한 사진 2장', '받는 사람 지정']}
          doLabel="삭제하기"
          busy={busy}
          onCancel={close}
          onDo={() => { setBusy(true); window.setTimeout(() => { close(); show('삭제했습니다'); }, 1200); }}
        />
      )}
      {dlg === 'dangerDesc' && (
        <RdDangerDialog
          title="이 편지를 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          doLabel="삭제"
          busy={busy}
          onCancel={close}
          onDo={() => { setBusy(true); window.setTimeout(() => { close(); show('삭제했습니다'); }, 1200); }}
        />
      )}
      {dlg === 'alert' && <RdAlertDialog title="사진을 읽지 못했습니다" desc="사진이 흐리게 찍혔습니다. 다시 찍어 올려 주세요." onOk={close} />}
      {dlg === 'switch' && (
        <RdDialog
          title="간이 계산기"
          footLine
          onClose={close}
          evenButtons={step === 'out'}
          footer={
            step === 'in' ? (
              <>
                <RdButton kind="secondary" place="dialog" onClick={close}>닫기</RdButton>
                <RdButton place="dialog" onClick={() => setStep('out')}>계산하기</RdButton>
              </>
            ) : (
              <>
                <RdButton kind="secondary" place="dialog" onClick={() => setStep('in')}>뒤로가기</RdButton>
                <RdButton place="dialog" onClick={close}>닫기</RdButton>
              </>
            )
          }
        >
          {step === 'in' ? (
            <RdField label="재산 합계 (만원)">
              {(p) => <RdInput {...p} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />}
            </RdField>
          ) : (
            <>
              <dl className="rd-dl">
                <div><dt>재산 합계</dt><dd>{total.toLocaleString()} 만원</dd></div>
              </dl>
              <p className="rd-dl__result" role="status">결과: 견본 값입니다</p>
            </>
          )}
        </RdDialog>
      )}
      {node}
    </>
  );
}

function StateBlock() {
  return (
    <div className="rd-pv__grid">
      <Sample title="① 빈 화면" bare>
        <RdState kind="empty" title="아직 남긴 메시지가 없습니다" desc="가족에게 전할 말을 글이나 목소리로 남길 수 있습니다.">
          <RdButton>첫 메시지 쓰기</RdButton>
        </RdState>
      </Sample>
      <Sample title="② 처리 중" bare>
        <RdState kind="working" title="사진의 글자를 읽고 있습니다" desc="사진 3장 · 30초쯤 걸립니다. 이 화면을 닫지 마세요." progress={{ now: 2, total: 3 }} />
      </Sample>
      <Sample title="③ 연결 실패" bare>
        <RdState kind="offline" title="서버에 연결하지 못했습니다" desc="인터넷 연결을 확인한 뒤 다시 시도해 주세요. 쓰던 내용은 이 기기에 남아 있습니다.">
          <RdButton>다시 시도</RdButton>
        </RdState>
      </Sample>
      <Sample title="④ 오류" bare>
        <RdState kind="error" title="화면을 불러오지 못했습니다" desc="잠시 뒤 다시 열어 주세요. 계속되면 카카오톡으로 알려 주세요.">
          <RdButton kind="secondary">홈으로</RdButton>
          <RdButton>새로 고침</RdButton>
        </RdState>
      </Sample>
      <Sample title="⑤ 완료 (강조 카드)" bare wide>
        <RdState
          kind="done"
          title="부고장을 만들었습니다"
          desc="아래 버튼으로 바로 알릴 수 있습니다. 내용은 내 정보에서 고칠 수 있습니다."
          link={<RdTextLink href="#" onClick={(e) => e.preventDefault()}>내 부고장 보기</RdTextLink>}
        >
          <RdButton kind="secondary" place="dialog">링크 복사</RdButton>
          <RdButton place="dialog">카카오톡으로 보내기</RdButton>
        </RdState>
      </Sample>
    </div>
  );
}

export function PartsPage() {
  return (
    <div className="rd-container rd-pv">
      <div className="rd-pv__head">
        <p className="rd-t-eyebrow">8단계 · 묶음 2</p>
        <h1 className="rd-t-title">공통 부품 견본</h1>
        <p className="rd-t-support">
          00-44 §6~§8 · 0단계 판 02~08. 메뉴 · 링크에 연결하지 않습니다. 휴대폰 폭은 창을 767 이하로 줄여 확인합니다.
        </p>
      </div>
      <nav className="rd-pv__nav" aria-label="견본 구간">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>{s.label}</a>
        ))}
      </nav>

      <section className="rd-pv__block" id="pt-button" aria-labelledby="pt-button-h">
        <h2 className="rd-t-section" id="pt-button-h">버튼 · 링크 (판 02)</h2>
        <ButtonsBlock />
      </section>
      <section className="rd-pv__block" id="pt-card" aria-labelledby="pt-card-h">
        <h2 className="rd-t-section" id="pt-card-h">칸 · 목록 (판 03)</h2>
        <CardsBlock />
      </section>
      <section className="rd-pv__block" id="pt-input" aria-labelledby="pt-input-h">
        <h2 className="rd-t-section" id="pt-input-h">입력 (판 04 · §8)</h2>
        <InputsBlock />
      </section>
      <section className="rd-pv__block" id="pt-head" aria-labelledby="pt-head-h">
        <h2 className="rd-t-section" id="pt-head-h">쪽 머리 · 탭 · 쪽 안 차례 (판 05)</h2>
        <HeadBlock />
      </section>
      <section className="rd-pv__block" id="pt-notice" aria-labelledby="pt-notice-h">
        <h2 className="rd-t-section" id="pt-notice-h">안내 (판 06)</h2>
        <NoticeBlock />
      </section>
      <section className="rd-pv__block" id="pt-dialog" aria-labelledby="pt-dialog-h">
        <h2 className="rd-t-section" id="pt-dialog-h">창 (판 07)</h2>
        <DialogBlock />
      </section>
      <section className="rd-pv__block" id="pt-state" aria-labelledby="pt-state-h">
        <h2 className="rd-t-section" id="pt-state-h">상태 화면 (판 08)</h2>
        <StateBlock />
      </section>
    </div>
  );
}
