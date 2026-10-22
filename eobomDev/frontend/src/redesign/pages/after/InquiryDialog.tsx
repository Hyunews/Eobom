import React, { useEffect, useRef, useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { RdCheck, RdConsentGroup, RdField, RdInput, RdTextarea } from '../../parts/RdInputs';
import { RdAlertDialog, RdDialog } from '../../parts/RdModal';
import { sleep } from '../../parts/RdDemo';

// 8단계 묶음 5 · 상담 창(시설, 판 2-9)과 견적 신청 창(유품 정리 업체, 판 2-11)이 같은 틀이다.
// 다른 점 셋: 머리 / 작업 장소 주소 칸(견적만) / 동의 설명의 제공 항목(03-02 §4.3).
// 전송은 하지 않는다 — 예시 접수번호만 보여 준다(서버는 10단계 교체 때 지금 InquiryModal의 POST를 잇는다).

export type InquiryKind = 'facility' | 'estate';

export interface InquiryDemo {
  /** 열 때 동의 줄에 오류를 보인다(판 2-9 ③ · 2-11 ③) */
  noConsent?: boolean;
  /** 열 때 주소 칸에 오류를 보인다(판 2-11 ②, 견적만) */
  noAddress?: boolean;
  /** 전송하면 서버 오류 알림 창(판 2-9 알림) */
  serverError?: boolean;
}

const COPY: Record<InquiryKind, { head: (n: string) => string; intro: string; message: string; placeholder: string; submit: string; consentError: string; doneTitle: (n: string) => string }> = {
  facility: {
    head: (n) => `${n} 상담`,
    intro: '문의 내용을 남겨주시면 담당자가 확인 후 연락드립니다.',
    message: '문의 사항',
    placeholder: '궁금하신 내용을 남겨주세요 (예: 빈소 사용 가능 일정, 비용 문의 등)',
    submit: '문의 전송',
    consentError: '개인정보 제3자 제공에 동의해야 문의를 보낼 수 있습니다.',
    doneTitle: (n) => `${n}에 문의가 접수되었습니다.`,
  },
  estate: {
    head: (n) => `${n} 견적 신청`,
    intro: '견적 신청 내용을 남겨주시면 업체가 확인 후 연락드립니다.',
    message: '요청 내용',
    placeholder: '요청 내용을 남겨주세요 (예: 평수, 희망 일정, 정리할 물품 등)',
    submit: '견적 신청',
    consentError: '개인정보 제3자 제공에 동의해야 견적을 신청할 수 있습니다.',
    doneTitle: (n) => `${n}에 견적 신청이 접수되었습니다.`,
  },
};

const consentDesc = (kind: InquiryKind, name: string) =>
  kind === 'facility'
    ? `제공받는 자: ${name} 등 신청 시설 (또는 비제휴 시 이어봄 상담원)\n제공 목적: 문의 응대 및 연락\n제공 항목: 이름, 연락처, 문의 내용\n보유 기간: 문의가 끝날 때까지(최대 접수일부터 90일)`
    : '제공받는 자: 유품 정리 업체 (이어봄 제휴 사업자)\n제공 목적: 방문 견적 및 수거 상담 연락\n제공 항목: 이름, 연락처, 작업 장소 주소, 요청 내용\n보유 기간: 문의가 끝날 때까지(최대 접수일부터 90일)';

const EXAMPLE_ADDRESS = '서울특별시 강남구 테헤란로 123';

export function InquiryDialog({ kind, name, demo = {}, onClose }: { kind: InquiryKind; name: string; demo?: InquiryDemo; onClose: () => void }) {
  const copy = COPY[kind];
  const [useMine, setUseMine] = useState(true);
  const [who, setWho] = useState('');
  const [phone, setPhone] = useState('');
  const [saveMine, setSaveMine] = useState(false);
  const [address, setAddress] = useState('');
  const [detail, setDetail] = useState('');
  const [text, setText] = useState('');
  const [agree, setAgree] = useState<Record<string, boolean>>({ c: false });
  const [errConsent, setErrConsent] = useState(!!demo.noConsent);
  const [errAddress, setErrAddress] = useState(!!demo.noAddress);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [leadNo, setLeadNo] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const submit = async () => {
    const noAddr = kind === 'estate' && !address;
    setErrAddress(noAddr);
    setErrConsent(!agree.c);
    if (noAddr || !agree.c) return;
    setBusy(true);
    await sleep(900);
    if (!alive.current) return;
    setBusy(false);
    if (demo.serverError) {
      setAlert('서버와 통신 중 오류가 발생했습니다.');
      return;
    }
    setLeadNo(kind === 'facility' ? 'L-1015-0041' : 'L-1015-0042');
  };

  if (leadNo) {
    return (
      <RdDialog
        width={560}
        title={copy.head(`[${name}]`)}
        onClose={onClose}
        footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}
      >
        <div className="rd-formstack">
          <p className="rd-dialog__desc"><b>{copy.doneTitle(`[${name}]`)}</b></p>
          <p className="rd-dialog__desc">접수번호 {leadNo}</p>
          <p className="rd-dialog__desc">(문의 시 이 번호를 말씀해주시면 빠르게 확인 가능합니다)</p>
        </div>
      </RdDialog>
    );
  }

  return (
    <>
      <RdDialog
        form
        width={560}
        title={copy.head(`[${name}]`)}
        closeX
        onClose={onClose}
        footer={
          <>
            <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
            <RdButton place="dialog" busy={busy} busyText="전송 중..." onClick={submit}>{copy.submit}</RdButton>
          </>
        }
      >
        <div className="rd-formstack">
          <p className="rd-dialog__desc">{copy.intro}</p>
          <RdCheck label="내 정보 사용 (010-****-1234)" checked={useMine} onChange={(e) => setUseMine(e.target.checked)} />
          <RdField label="이름" required>{(p) => <RdInput {...p} disabled={useMine} value={useMine ? '김OO' : who} onChange={(e) => setWho(e.target.value)} />}</RdField>
          <RdField label="연락처" required>
            {(p) => <RdInput {...p} inputMode="tel" placeholder="010-0000-0000" disabled={useMine} value={useMine ? '010-****-1234' : phone} onChange={(e) => setPhone(e.target.value)} />}
          </RdField>
          {!useMine && <RdCheck label="다음에도 쓸 수 있게 내 정보에 저장" checked={saveMine} onChange={(e) => setSaveMine(e.target.checked)} />}
          {kind === 'estate' && (
            <RdField label="작업 장소 주소" required error={errAddress ? '작업 장소 주소를 입력해야 견적을 신청할 수 있습니다.' : undefined}>
              {(p) => (
                <div className="rd-af-addr">
                  <div className="rd-af-addr__row">
                    <RdInput {...p} readOnly placeholder="주소 검색을 눌러 입력합니다" value={address} />
                    <RdButton kind="secondary" place="row" onClick={() => { setAddress(EXAMPLE_ADDRESS); setErrAddress(false); }}>주소 검색</RdButton>
                  </div>
                  <RdInput aria-label="상세 주소" placeholder="상세 주소 (동·호수, 선택)" value={detail} onChange={(e) => setDetail(e.target.value)} />
                </div>
              )}
            </RdField>
          )}
          <RdField label={copy.message} required>
            {(p) => <RdTextarea {...p} rows={4} maxLength={1000} placeholder={copy.placeholder} value={text} onChange={(e) => setText(e.target.value)} />}
          </RdField>
          <RdConsentGroup
            items={[{ id: 'c', label: '개인정보 제3자 제공에 동의합니다.', required: true, desc: consentDesc(kind, name) }]}
            checked={agree}
            onChange={(n) => { setAgree(n); if (n.c) setErrConsent(false); }}
            error={errConsent ? copy.consentError : undefined}
          />
        </div>
      </RdDialog>
      {alert && <RdAlertDialog title={alert} onOk={() => setAlert(null)} />}
    </>
  );
}
