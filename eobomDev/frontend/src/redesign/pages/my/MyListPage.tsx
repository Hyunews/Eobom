import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatKstDate } from '../../../utils/kstDate';
import { copyObituaryLink } from '../../../utils/kakaoShare';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdInput } from '../../parts/RdInputs';
import { RdList, RdListRow } from '../../parts/RdCards';
import { RdPageHead } from '../../parts/RdNav';
import { RdAlertDialog, RdDialog } from '../../parts/RdModal';
import { IconArrowOut } from '../../parts/icons';
import { MEMORIAL_STATE_BADGE, MEMORIAL_STATE_LABEL, MEMORIALS, OBITS, PV, VISITED, memorialManageUrl, memorialState, visitedKind, type MyObit } from './myData';
import { MyBadge, MyDl, MyGate, MyLine, MyResult, MySec } from './myShared';
import './mypage.css';

// 8단계 묶음 7 · /preview/my-obituaries-memorials — 4단계 판 4-6(내 부고장·추모관 세 구간 · 부고장 상세 창 · 삭제 확인).
// 정본: 00-36 §4.8-1 · 4단계 묶음 2 캔버스 + 묶음 2 점검 ③. 추모관 줄을 누르면 그 추모관 관리 화면으로(상세 창은 없앤다, 확정 ⑧).
// 줄 안 값은 예시이고 날짜는 지금 코드의 formatKstDate로 그린다. 공유는 카카오 없이 "링크를 복사했습니다" 결과만 보인다(실제 공유는 10단계 교체 때 지금 코드의 shareViaKakao 사다리).

const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본 (세 구간)' },
  { value: 'empty', label: '모두 비었을 때' },
  { value: 'login', label: '로그인 전', group: '상태' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'share-fail', label: '부고장 상세, 공유 실패 글 (링크 칸이 보임)', group: '부고장 상세 변형' },
  { value: 'delete-fail', label: '부고장 삭제 확인 후 실패 알림 창', group: '부고장 상세 변형' },
];

const SUBTITLE = '부고장과 추모관을 한곳에서 확인할 수 있습니다.';
const LOAD_FAIL = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
const EXAMPLE_ORIGIN = 'https://eobom.example';

export function MyListPage() {
  const navigate = useNavigate();
  const [demo, setDemo] = useState('ready');
  const [obits, setObits] = useState<MyObit[]>(OBITS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<{ kind: 'ok' | 'err'; text: string; showLink?: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFail, setDeleteFail] = useState(false);

  const open = obits.find((o) => o.id === openId) ?? null;
  const empty = demo === 'empty';
  const loading = demo === 'loading';
  const failed = demo === 'loadfail';

  const closeDetail = () => {
    setOpenId(null);
    setShareNote(null);
    setConfirmDelete(false);
  };

  const onDemo = (v: string) => {
    setDemo(v);
    setObits(OBITS);
    closeDetail();
    setDeleteFail(false);
    // 변형은 바로 상세 창을 열어 보여 준다
    if (v === 'share-fail') {
      setOpenId(OBITS[0].id);
      setShareNote({ kind: 'err', text: '공유에 실패했습니다. 아래 링크를 직접 복사해 주세요.', showLink: true });
    }
  };

  const share = async (o: MyObit) => {
    const url = `${EXAMPLE_ORIGIN}/o/${o.slug}`;
    // 카카오 SDK가 없는 미리보기라 사다리의 마지막(링크 복사) 결과 글만 보인다. 문구는 지금 코드 그대로.
    const copied = await copyObituaryLink(url);
    setShareNote(
      copied
        ? { kind: 'ok', text: '카카오톡 공유를 열 수 없어 링크를 복사했습니다.' }
        : { kind: 'err', text: '공유에 실패했습니다. 아래 링크를 직접 복사해 주세요.', showLink: true },
    );
  };

  const doDelete = async (o: MyObit) => {
    setDeleting(true);
    await sleep(900);
    setDeleting(false);
    setConfirmDelete(false);
    if (demo === 'delete-fail') {
      setDeleteFail(true);
      return;
    }
    setObits((prev) => prev.filter((x) => x.id !== o.id));
    closeDetail();
  };

  const bar = <DemoBar value={demo} options={DEMOS} onChange={onDemo} />;

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <MyGate title="내 부고장·추모관" desc={SUBTITLE} screenName="내 부고장·추모관" />
        {bar}
      </div>
    );
  }

  // 구간마다 따로 불러오므로 상태도 구간 안에서 보인다
  const listOf = (section: 'obit' | 'mem' | 'visit') => {
    if (loading) return <MyLine kind="loading">불러오는 중...</MyLine>;
    if (failed) return <MyLine kind="error">{LOAD_FAIL}</MyLine>;
    if (section === 'obit') {
      if (empty || obits.length === 0) return <MyLine kind="empty">아직 만든 부고장이 없습니다.</MyLine>;
      return (
        <RdList>
          {obits.map((o) => (
            <RdListRow
              key={o.id}
              title={`故 ${o.deceasedName}`}
              info={formatKstDate(o.deceasedDeathDate ?? o.createdAt)}
              status={<MyBadge kind={o.isClosed ? 'state' : 'done'}>{o.isClosed ? '종료됨' : '진행중'}</MyBadge>}
              onClick={() => { setShareNote(null); setOpenId(o.id); }}
            />
          ))}
        </RdList>
      );
    }
    if (section === 'mem') {
      if (empty) return <MyLine kind="empty">아직 만든 추모관이 없습니다.</MyLine>;
      return (
        <RdList>
          {MEMORIALS.map((m) => {
            const s = memorialState(m);
            return (
              <RdListRow
                key={m.id}
                title={`故 ${m.deceasedName}`}
                info={formatKstDate(m.createdAt)}
                status={<MyBadge kind={MEMORIAL_STATE_BADGE[s]}>{MEMORIAL_STATE_LABEL[s]}</MyBadge>}
                onClick={() => navigate(memorialManageUrl(m.slug))}
              />
            );
          })}
        </RdList>
      );
    }
    if (empty) return <MyLine kind="empty">아직 헌화나 방명록을 남긴 추모관이 없습니다.</MyLine>;
    return (
      <RdList>
        {VISITED.map((v) => (
          <RdListRow
            key={v.slug}
            title={`故 ${v.deceasedName}`}
            info={formatKstDate(v.lastAt)}
            status={<span className="rd-mp-with">{visitedKind(v)}</span>}
            onClick={() => navigate(PV.openMemorial)}
          />
        ))}
      </RdList>
    );
  };

  const count = (n: number) => (loading || failed ? undefined : empty ? 0 : n);

  return (
    <div className="rd-container rd-screen">
      <div className="rd-mp-read rd-mp-keep">
        <RdPageHead title="내 부고장·추모관" desc={SUBTITLE} />
        <MySec title="내가 만든 부고장" count={count(obits.length)}>
          {listOf('obit')}
          <div className="rd-mp-act">
            <RdButtonRow>
              <RdButton kind="secondary" onClick={() => navigate(PV.obituary)}>새 부고장 만들기</RdButton>
            </RdButtonRow>
          </div>
        </MySec>
        <MySec title="내가 만든 추모관" count={count(MEMORIALS.length)}>
          {listOf('mem')}
          <div className="rd-mp-act">
            <RdButtonRow>
              <RdButton kind="secondary" onClick={() => navigate(PV.memorial)}>새 추모관 만들기</RdButton>
            </RdButtonRow>
          </div>
        </MySec>
        <MySec title="헌화·방명록을 남긴 추모관" count={count(VISITED.length)}>
          {listOf('visit')}
        </MySec>
      </div>
      {bar}

      {/* 부고장 상세 창 — 버튼 두 줄: 1줄 [보기 ↗][공유(주)] / 2줄 [닫기][수정][삭제] (묶음 2 점검 ③) */}
      {open && !confirmDelete && !deleteFail && (
        <RdDialog
          width={560}
          eyebrow="부고장"
          title={`故 ${open.deceasedName}`}
          closeX
          onClose={closeDetail}
          footer={
            <div className="rd-mp-foot2">
              <div className="rd-mp-foot2__row">
                <a className="rd-btn rd-btn--secondary rd-btn--dialog" href={PV.openObituary} target="_blank" rel="noopener noreferrer">
                  <span>보기</span>
                  <IconArrowOut size={14} />
                </a>
                <RdButton place="dialog" onClick={() => share(open)}>공유</RdButton>
              </div>
              <div className="rd-mp-foot2__row">
                <RdButton kind="secondary" place="dialog" onClick={closeDetail}>닫기</RdButton>
                {!open.isClosed && <RdButton kind="secondary" place="dialog" onClick={() => navigate(PV.obituary)}>수정</RdButton>}
                <RdButton kind="secondary" place="dialog" onClick={() => setConfirmDelete(true)}>삭제</RdButton>
              </div>
            </div>
          }
        >
          <div className="rd-mp-body">
            <MyDl
              rows={[
                { name: '상태', value: <MyBadge kind={open.isClosed ? 'state' : 'done'}>{open.isClosed ? '종료됨' : '진행중'}</MyBadge> },
                open.deceasedDeathDate
                  ? { name: '사망일', value: formatKstDate(open.deceasedDeathDate) }
                  : { name: '개설일', value: formatKstDate(open.createdAt) },
              ]}
            />
            {shareNote && <MyResult tone={shareNote.kind}>{shareNote.text}</MyResult>}
            {shareNote?.showLink && <RdInput aria-label="부고장 링크" readOnly value={`${EXAMPLE_ORIGIN}/o/${open.slug}`} />}
          </div>
        </RdDialog>
      )}

      {/* 부고장 삭제 확인 = 이어봄 위험 확인 창. 제목/본문/위험색 굵은 글 셋으로 나눔(코드 문구 그대로) */}
      {open && confirmDelete && (
        <RdDialog
          danger
          evenButtons
          title={`故 ${open.deceasedName}님의 부고장을 삭제하시겠어요?`}
          onClose={() => !deleting && setConfirmDelete(false)}
          initialFocus="[data-rd-cancel]"
          footer={
            <>
              <RdButton kind="secondary" place="dialog" data-rd-cancel="" disabled={deleting} onClick={() => setConfirmDelete(false)}>취소</RdButton>
              <RdButton kind="danger" place="dialog" busy={deleting} busyText="삭제하는 중" onClick={() => doDelete(open)}>삭제</RdButton>
            </>
          }
        >
          <div className="rd-mp-body">
            <p className="rd-dialog__desc">부고장만 삭제됩니다. 추모관은 삭제되지 않고 그대로 유지됩니다.</p>
            <p className="rd-mp-danger-line">삭제하면 되돌릴 수 없습니다.</p>
          </div>
        </RdDialog>
      )}

      {deleteFail && (
        <RdAlertDialog title="부고장 삭제에 실패했습니다." desc="잠시 후 다시 시도해주세요." onOk={() => { setDeleteFail(false); closeDetail(); }} />
      )}
    </div>
  );
}
