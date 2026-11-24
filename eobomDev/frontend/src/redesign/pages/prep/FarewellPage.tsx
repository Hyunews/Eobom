import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiFetch, apiFetchRaw } from '../../../lib/api';
import { HEAVY_CLIENT_LIMITS } from '../../../lib/heavyLimits';
import { formatKstDate, kstTodayCompact } from '../../../utils/kstDate';
import { LoginRequired } from '../../auth/LoginRequired';
import { useAuth } from '../../auth/AuthProvider';
import { RdBadge, RdButton, RdIconButton, RdTextLink } from '../../parts/RdButtons';
import { RdFold } from '../../parts/RdCards';
import { RdConsentGroup, RdField, RdFileRow, RdInput, RdTextarea } from '../../parts/RdInputs';
import { RdPageHead, RdTabs } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdAlertDialog, RdConfirmDialog, RdDangerDialog, RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronLeft, IconChevronRight, IconDoc, IconErrorCircle } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { relationLabel, type FamilyItem } from './noteData';
import { extensionForMime, fmtClock, markRecordNoticeSeen, MAX_RECORD_MINUTES, recordNoticeSeen, useVoiceCapture, type PendingVoice, type SavedMedia } from './voice';
import './prep.css';

// 10단계 묶음 10-2 · 유족 메시지 보관함 — 1단계 캔버스 1-11~1-15(보관함 · 편지 쓰기 · 음성 · 상태 · 확인 창).
// 서버 `/api/farewell-messages` · `/api/family-designations` · `/api/stt/*`. 규칙은 지금 화면(`pages/FarewellMessagePage.tsx` · `components/farewell/*`)에서 옮겼다.
// 정본 = 06-05(유족 메시지 보관함). 06-05 §7.2 — 엔딩노트의 "음성 메시지 남기기"가 이 화면으로 온다.

const TITLE = '유족 메시지 보관함';

interface Recipient extends FamilyItem {
  scope: string;
}
interface MessageItem {
  id: string;
  recipientId: string;
  title: string | null;
  preview: string;
  hasAudio: boolean;
  mediaMime: string | null;
  mediaDurationSec: number | null;
  createdAt: string;
  updatedAt: string;
}
interface LetterDetail {
  id: string;
  title: string;
  body: string;
  hasAudio: boolean;
  mediaMime: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '아직 알리지 않음',
  PENDING: '수락 대기 중',
  ACCEPTED: '가족으로 연결됨',
  DECLINED: '거절됨',
};

// 00-34 §8 — apiFetch가 던지는 ApiError는 서버 문구(5xx면 오류 번호 포함)를 그대로 보여 준다.
const errText = (e: unknown, fallback: string): string => (e instanceof ApiError ? e.message : fallback);

// 건별 반출 파일명 — 백엔드 farewellMessageExport.ts의 규칙과 맞춘다(40자 절단·금지문자 제거).
const sanitizeForFilename = (raw: string): string => raw.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '무제';

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const DownIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
);
const TrashIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6" />
  </svg>
);
const MicIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

/* ───────── 편지 쓰기 창 ───────── */

type Method = 'upload' | 'record' | 'write';

function WriteDialog({
  person,
  letter,
  sttEnabled,
  voiceStorageEnabled,
  onClose,
  onChanged,
}: {
  person: Recipient;
  /** 고치는 편지 — 없으면 새 편지 */
  letter: LetterDetail | null;
  sttEnabled: boolean;
  voiceStorageEnabled: boolean;
  onClose: () => void;
  /** 저장·삭제·음성 삭제가 서버에 반영됐다 — 부모가 목록을 다시 불러온다 */
  onChanged: () => void;
}) {
  const phone = useIsPhone();
  const editing = !!letter;
  // 편지를 열 때 탭이 "저장된 기준"(첨부 음성 유무·형식)을 따라간다 — 녹음(MediaRecorder)은 거의 항상 webm으로 저장되고 업로드는 m4a·mp3·wav가 대부분이라 mediaMime이 둘을 가르는 유일한 단서다(09-08)
  const [method, setMethod] = useState<Method>(
    letter ? (!letter.hasAudio ? 'write' : letter.mediaMime?.includes('webm') ? 'record' : 'upload') : sttEnabled ? 'upload' : 'write',
  );
  const [title, setTitle] = useState(letter?.title ?? '');
  const [body, setBody] = useState(letter?.body ?? '');
  const [savedVoice, setSavedVoice] = useState(letter?.hasAudio ?? false);
  const [pending, setPending] = useState<(PendingVoice & { url: string }) | null>(null);
  const [keepVoice, setKeepVoice] = useState(true); // §5.5-3 — 기본값 켬
  const [consent, setConsent] = useState<Record<string, boolean>>({ c: false });
  const [recConsent, setRecConsent] = useState<Record<string, boolean>>({ c: false });
  const [recAsk, setRecAsk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [closeAsk, setCloseAsk] = useState(false);
  const [voiceDel, setVoiceDel] = useState<'saved' | 'pending' | null>(null);
  const [letterDel, setLetterDel] = useState(false);
  const [alertBox, setAlertBox] = useState<string | null>(null);
  const [listen, setListen] = useState<'saved' | 'pending' | null>(null);
  const [savedAudioSrc, setSavedAudioSrc] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const storedMediaRef = useRef<SavedMedia | null>(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const savedAudioRef = useRef(savedAudioSrc);
  savedAudioRef.current = savedAudioSrc;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
    alive.current = false;
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.url);
    if (savedAudioRef.current) URL.revokeObjectURL(savedAudioRef.current);
    };
  }, []);

  // 변환이 끝나면 글은 입력창에만 넣고 편지는 저장하지 않는다. 원본 음성은 메모리의 "저장 전 음성"으로 둔다(R2·DB 없음).
  const voice = useVoiceCapture((text, v) => {
    setBody((prev) => (prev ? `${prev.trimEnd()} ${text}`.trim() : text));
    setSaveErr(null);
    setPending((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { ...v, url: URL.createObjectURL(v.blob) };
    });
    storedMediaRef.current = null;
    setListen(null);
    setMethod('write');
  });

  const voiceBlocked = savedVoice || !!pending;
  const dirty = (!editing && (title.trim() || body.trim())) || !!pending || (editing && (title !== letter?.title || body !== letter?.body));
  const tryClose = () => (dirty ? setCloseAsk(true) : onClose());

  // 저장 전 음성을 버린다 — 입력창의 글은 그대로 남는다
  const dropPending = () => {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    storedMediaRef.current = null;
    setListen((l) => (l === 'pending' ? null : l));
  };

  // 원본 음성을 R2에 올린다(`POST /api/stt/store-audio`) — 편지 [저장]에서만 부른다(§5.6-9-1)
  const storeAudio = async (v: PendingVoice): Promise<SavedMedia> => {
    const formData = new FormData();
    formData.append('audio', v.blob, v.blob instanceof File ? v.blob.name : `recording.${extensionForMime(v.mime)}`);
    const data = await apiFetch<any>('/api/stt/store-audio', 'USER', { method: 'POST', body: formData });
    if (!data?.media?.mediaKey) throw new Error('음성 저장에 실패했습니다.');
    return {
      mediaKey: data.media.mediaKey,
      mediaMime: data.media.mediaMime,
      ...(v.durationSec !== null ? { mediaDurationSec: v.durationSec } : {}),
    };
  };

  // 편지 [저장] — ① 저장 전 음성이 있고 "목소리도 함께 남기기"가 켜져 있으면 store-audio → ② 글 + mediaKey로 편지 저장.
  // 🔴 ①의 mediaKey는 ②가 성공할 때까지 storedMediaRef에 둔다 — ②가 실패해 다시 [저장]을 눌러도 ①을 건너뛴다.
  const doSave = async () => {
    if (!body.trim()) {
      setSaveErr('내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setSaveErr(null);
    let media: SavedMedia | null = null;
    if (pending && keepVoice && voiceStorageEnabled) {
      media = storedMediaRef.current;
      if (!media) {
        try {
          media = await storeAudio(pending);
          storedMediaRef.current = media;
        } catch (e) {
          if (alive.current) {
            setSaveErr(e instanceof Error ? e.message : '음성 저장 중 오류가 발생했습니다.');
            setSaving(false);
          }
          return;
        }
      }
    }
    try {
      const mediaFields = media ? { mediaKey: media.mediaKey, mediaMime: media.mediaMime, mediaDurationSec: media.mediaDurationSec } : {};
      const payload = letter
        ? { title: title.trim() || null, body, ...mediaFields }
        : { recipientId: person.id, title: title.trim() || null, body, ...mediaFields };
      await apiFetch<any>(`/api/farewell-messages${letter ? `/${letter.id}` : ''}`, 'USER', {
        method: letter ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      storedMediaRef.current = null;
      onChanged();
      onClose();
    } catch (e) {
      if (alive.current) {
        setSaveErr(errText(e, '저장 중 오류가 발생했습니다.'));
        setSaving(false);
      }
    }
  };

  // 저장된 음성은 GET .../audio로 받아온다 — presigned URL 없이 인증 fetch → blob → objectURL (§5.6-2)
  const listenSaved = async () => {
    if (!letter) return;
    if (savedAudioSrc) {
      setListen('saved');
      return;
    }
    setAudioBusy(true);
    try {
      const res = await apiFetchRaw(`/api/farewell-messages/${letter.id}/audio`, 'USER');
      if (!res.ok) throw new Error('load');
      setSavedAudioSrc(URL.createObjectURL(await res.blob()));
      setListen('saved');
    } catch {
      setAlertBox('음성을 불러오지 못했습니다.');
    } finally {
      if (alive.current) setAudioBusy(false);
    }
  };

  // 소프트 삭제뿐이다 — "즉시 삭제됩니다"가 아니라 유예 기간을 안내한다(§5.6-4)
  const deleteSavedVoice = async () => {
    if (!letter) return;
    setVoiceDel(null);
    try {
      await apiFetch(`/api/farewell-messages/${letter.id}/audio`, 'USER', { method: 'DELETE' });
      if (!alive.current) return;
      if (savedAudioSrc) URL.revokeObjectURL(savedAudioSrc);
      setSavedAudioSrc(null);
      setListen(null);
      setSavedVoice(false);
      onChanged();
    } catch (e) {
      setAlertBox(errText(e, '삭제 중 오류가 발생했습니다.'));
    }
  };

  const deleteLetter = async () => {
    if (!letter) return;
    setLetterDel(false);
    try {
      await apiFetch(`/api/farewell-messages/${letter.id}`, 'USER', { method: 'DELETE' });
      onChanged();
      onClose();
    } catch (e) {
      setAlertBox(errText(e, '삭제 중 오류가 발생했습니다.'));
    }
  };

  const exportLetter = async () => {
    if (!letter) return;
    try {
      const res = await apiFetchRaw(`/api/farewell-messages/${letter.id}/export`, 'USER');
      if (!res.ok) return;
      saveBlob(await res.blob(), `eobom_유족메시지_${sanitizeForFilename(title.trim() || `${person.name}에게`)}_${kstTodayCompact()}.zip`);
    } catch {
      // 실패는 조용히 삼킨다 — 다시 누르면 재시도된다(전체 반출과 같은 태도)
    }
  };

  const consentUpload = [
    {
      id: 'c',
      label: '음성 파일이 네이버 클라우드 CLOVA Speech로 전송됩니다.',
      required: true,
      desc: '음성인식 성능 향상에 활용될 수 있습니다.\n변환된 텍스트는 네이버에 7일간 보관 후 삭제됩니다.\n편지를 저장하면 이 파일도 암호화되어 함께 보관됩니다.',
    },
  ];
  const consentRecord = [
    {
      id: 'c',
      label: "'글로 바꾸기'를 누르면 녹음이 네이버 클라우드 CLOVA Speech로 전송됩니다.",
      required: true,
      desc: '음성인식 성능 향상에 활용될 수 있습니다.\n변환된 텍스트는 네이버에 7일간 보관 후 삭제됩니다.\n편지를 저장하면 녹음 원본도 암호화되어 함께 보관됩니다.',
    },
  ];

  const blockedLine = pending ? (
    <RdNotice tone="info" title="변환이 끝났습니다.">다른 음성으로 바꾸려면 위의 '삭제'를 누르세요.</RdNotice>
  ) : (
    <RdNotice tone="info" title="이미 저장된 음성이 있습니다.">위의 '음성 삭제'를 누르면 다시 올리거나 녹음할 수 있습니다.</RdNotice>
  );

  let methodBody: React.ReactNode = null;
  if (voice.working) {
    methodBody = (
      <div className="rd-pr-working" role="status" aria-busy="true">
        <RdState kind="working" title="처리하고 있습니다." desc={`최대 ${HEAVY_CLIENT_LIMITS.audio.maxMinutes}분까지 걸릴 수 있습니다.`} />
        <p>이 화면을 닫으면 처음부터 다시 해야 합니다.</p>
      </div>
    );
  } else if (method === 'upload') {
    methodBody = voiceBlocked ? blockedLine : !sttEnabled ? (
      <RdNotice tone="info" title="지금은 음성 파일 업로드를 사용할 수 없습니다.">"직접 쓰기" 탭을 이용해 주세요.</RdNotice>
    ) : (
      <div className="rd-pr-voice">
        <h4>녹음해 둔 음성 파일 올리기</h4>
        <p className="rd-t-small" style={{ margin: 0 }}>m4a · mp3 · wav · webm, 최대 20MB · {MAX_RECORD_MINUTES}분 이하.</p>
        <RdNotice tone="info" title={phone ? '본인의 음성만 올려 주세요.' : '본인의 음성만 올려 주세요. 다른 분의 녹음은 올리지 마세요.'}>
          이 녹음으로 만든 편지는 사후에 지정한 가족에게 전달됩니다.
        </RdNotice>
        <RdConsentGroup items={consentUpload} checked={consent} onChange={setConsent} />
        {voice.file && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <RdFileRow name={voice.file.name} meta={`${(voice.file.size / 1048576).toFixed(1)}MB`} onRemove={voice.clearFile} />
          </ul>
        )}
        {voice.fileErr && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>{voice.fileErr}</span></p>}
        {voice.workErr && <p className="rd-pr-err" role="alert" style={{ whiteSpace: 'pre-line' }}><IconErrorCircle /><span>{voice.workErr}</span></p>}
        <div className="rd-pr-actions">
          <RdButton kind="secondary" place="dialog" onClick={() => fileRef.current?.click()}>파일 선택</RdButton>
          <RdButton place="dialog" disabled={!consent.c || !voice.file} onClick={voice.uploadFile}>업로드</RdButton>
        </div>
        <input ref={fileRef} type="file" accept=".m4a,.mp3,.wav,.webm,audio/*" hidden onChange={(e) => { void voice.pickFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
      </div>
    );
  } else if (method === 'record') {
    methodBody = voiceBlocked ? blockedLine : !sttEnabled ? (
      <RdNotice tone="info" title="지금은 음성 녹음을 글로 바꾸는 기능을 사용할 수 없습니다.">"직접 쓰기" 탭을 이용해 주세요.</RdNotice>
    ) : !voice.recSupported || voice.micError === 'unsupported' ? (
      <RdNotice tone="info" title="이 브라우저에서는 음성 입력을 지원하지 않습니다.">아래 입력창에 직접 입력해 주세요.</RdNotice>
    ) : voice.micError === 'denied' ? (
      <RdNotice tone="info" title="마이크를 사용할 수 없습니다.">권한을 확인하거나 아래 입력창에 직접 입력해 주세요.</RdNotice>
    ) : (
      <div className="rd-pr-voice">
        <RdConsentGroup items={consentRecord} checked={recConsent} onChange={setRecConsent} />
        {voice.rec === 'idle' && (
          <div className="rd-pr-actions">
            <RdButton
              place="dialog"
              disabled={!recConsent.c}
              onClick={() => (recordNoticeSeen() ? void voice.startRecording() : setRecAsk(true))}
            >
              녹음 시작
            </RdButton>
          </div>
        )}
        {voice.rec === 'recording' && (
          <div className="rd-pr-rec">
            <p className="rd-pr-rec__now" role="status"><span className="rd-pr-rec__dot" aria-hidden="true" />녹음 중 {fmtClock(voice.sec)} <span className="rd-t-small">(최대 {MAX_RECORD_MINUTES}분)</span></p>
            <RdButton kind="secondary" place="dialog" onClick={voice.stopRecording}>녹음 멈춤</RdButton>
          </div>
        )}
        {voice.rec === 'done' && (
          <div className="rd-pr-rec">
            <p className="rd-pr-rec__now">녹음을 마쳤습니다.</p>
            <div className="rd-pr-rec__row">
              <RdButton kind="secondary" place="row" onClick={voice.openPreview}>먼저 들어보기</RdButton>
            </div>
            {voice.previewUrl && <audio controls autoPlay src={voice.previewUrl} style={{ width: '100%' }} />}
            <p className="rd-t-small" style={{ margin: 0 }}>취소하면 녹음이 사라집니다.</p>
            <div className="rd-pr-actions">
              <RdButton kind="secondary" place="dialog" onClick={voice.discardRecording}>취소</RdButton>
              <RdButton place="dialog" onClick={voice.convertRecording}>글로 바꾸기</RdButton>
            </div>
          </div>
        )}
        {voice.recNotice && <p className="rd-t-small" role="status" style={{ margin: 0 }}>{voice.recNotice}</p>}
        {voice.workErr && <p className="rd-pr-err" role="alert" style={{ whiteSpace: 'pre-line' }}><IconErrorCircle /><span>{voice.workErr}</span></p>}
      </div>
    );
  } else {
    methodBody = (
      <RdFold title="작성 안내" defaultOpen={!editing && !body}>
        <div className="rd-pr-guide">
          <p>무엇을 남길까 고민된다면</p>
          <div className="rd-pr-guide__chips">
            <span>요즘 근황</span>
            <span>고마웠던 순간</span>
            <span>못다한 말</span>
          </div>
        </div>
      </RdFold>
    );
  }

  const titleField = (
    <RdField label="제목 (선택)">{(p) => <RdInput {...p} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />}</RdField>
  );
  const bodyField = (
    <RdField label="내용">{(p) => <RdTextarea {...p} rows={phone ? 7 : 8} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />}</RdField>
  );

  return (
    <>
      <RdDialog
        form
        width={720}
        eyebrow={`${person.name}님께`}
        title={editing ? '편지 수정' : '새 편지 쓰기'}
        closeX
        onClose={tryClose}
        footer={
          voice.working ? (
            <RdButton kind="secondary" place="dialog" onClick={voice.closeWorking}>닫기</RdButton>
          ) : (
            <>
              <RdButton kind="secondary" place="dialog" disabled={saving} onClick={tryClose}>취소</RdButton>
              <RdButton place="dialog" busy={saving} busyText="저장" disabled={!body.trim()} onClick={doSave}>저장</RdButton>
            </>
          )
        }
      >
        <div className="rd-formstack">
          {savedVoice && (
            <div className="rd-pr-saved">
              <b>첨부된 음성</b>
              <RdButton kind="secondary" place="row" disabled={audioBusy} onClick={listenSaved}>{audioBusy ? '불러오는 중…' : '듣기'}</RdButton>
              <RdButton kind="secondary" place="row" onClick={() => setVoiceDel('saved')}>음성 삭제</RdButton>
              {listen === 'saved' && savedAudioSrc && <audio controls autoPlay src={savedAudioSrc} style={{ width: '100%', marginTop: 4 }} />}
            </div>
          )}
          {pending && (
            <div className="rd-pr-saved" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>저장 전 음성</b>
                <RdButton kind="secondary" place="row" disabled={saving} onClick={() => setListen('pending')}>듣기</RdButton>
                <RdButton kind="secondary" place="row" disabled={saving} onClick={() => setVoiceDel('pending')}>삭제</RdButton>
              </div>
              {listen === 'pending' && <audio controls autoPlay src={pending.url} style={{ width: '100%' }} />}
              {/* "목소리도 함께 남기기" — 저장 때 결정하는 값이라 저장 전 음성 박스에 둔다. 서버에 음성 보관이 꺼져 있으면 두지 않는다(R2_VOICE_ENABLED) */}
              {voiceStorageEnabled && (
                <label className="rd-choice"><input type="checkbox" className="rd-checkbox" checked={keepVoice} disabled={saving} onChange={(e) => setKeepVoice(e.target.checked)} /><span>목소리도 함께 남기기</span></label>
              )}
              <p className="rd-t-small" style={{ margin: 0 }}>저장하면 글과 함께 저장되고, 저장 없이 닫거나 떠나면 사라집니다.</p>
            </div>
          )}
          {!phone && titleField}
          <RdTabs
            label="편지 쓰는 방법"
            tabs={[
              { value: 'upload', label: '음성 파일 업로드' },
              { value: 'record', label: '음성 녹음' },
              { value: 'write', label: '직접 쓰기' },
            ]}
            value={method}
            onChange={(v) => setMethod(v as Method)}
          />
          {methodBody}
          {pending && method !== 'write' ? null : (
            <>
              {phone && titleField}
              {bodyField}
            </>
          )}
          {pending && <p className="rd-t-small" style={{ margin: 0 }}>자동으로 바뀐 글. 확인 후 수정하세요.</p>}
          {editing && (
            <div className="rd-pr-textbtns">
              <button type="button" className="rd-pr-textbtn" onClick={exportLetter}>다운로드</button>
              <button type="button" className="rd-pr-textbtn rd-pr-textbtn--danger" onClick={() => setLetterDel(true)}>삭제</button>
            </div>
          )}
          {saveErr && <p className="rd-pr-err" role="alert"><IconErrorCircle /><span>{saveErr}</span></p>}
        </div>
      </RdDialog>

      {recAsk && (
        <RdDialog
          title="목소리를 녹음합니다"
          width={560}
          onClose={() => setRecAsk(false)}
          evenButtons
          footer={
            <>
              <RdButton kind="secondary" place="dialog" onClick={() => setRecAsk(false)}>취소</RdButton>
              <RdButton place="dialog" onClick={() => { setRecAsk(false); markRecordNoticeSeen(); void voice.startRecording(); }}>확인하고 시작하기</RdButton>
            </>
          }
        >
          <p className="rd-dialog__desc">녹음을 마친 뒤 '글로 바꾸기'를 누르면 음성이 네이버 클라우드 CLOVA Speech로 전송되어 글로 변환되고, 그 글이 편지 내용으로 들어갑니다.</p>
          <p className="rd-dialog__desc">"목소리도 함께 남기기"가 켜져 있으면 편지를 저장할 때 목소리 원본도 암호화되어 함께 보관되며, 유족이 편지를 열람할 때 함께 들을 수 있습니다.</p>
          <p className="rd-dialog__desc">녹음을 마치면 글로 바꾸기 전에 먼저 들어볼 수 있습니다. 이 안내는 처음 한 번만 표시됩니다.</p>
        </RdDialog>
      )}
      {closeAsk && (
        <RdConfirmDialog
          title="저장하지 않은 음성과 글이 있습니다."
          desc="닫으면 사라집니다."
          keepLabel="계속 작성"
          doLabel="닫기"
          onKeep={() => setCloseAsk(false)}
          onDo={() => { setCloseAsk(false); onClose(); }}
        />
      )}
      {voiceDel && (
        <RdDangerDialog
          title={voiceDel === 'saved' ? '이 음성을 삭제하시겠어요?' : '저장 전 음성을 삭제하시겠어요?'}
          desc={voiceDel === 'saved' ? '30일 뒤 완전히 삭제됩니다.' : '저장하기 전이라 되돌릴 수 없습니다. 입력창의 글은 그대로 남습니다.'}
          doLabel="삭제"
          onCancel={() => setVoiceDel(null)}
          onDo={() => {
            if (voiceDel === 'saved') void deleteSavedVoice();
            else { dropPending(); setVoiceDel(null); }
          }}
        />
      )}
      {letterDel && (
        <RdDangerDialog
          title="이 편지를 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          doLabel="삭제"
          onCancel={() => setLetterDel(false)}
          onDo={() => void deleteLetter()}
        />
      )}
      {voice.notice && <RdAlertDialog title={voice.notice} onOk={voice.clearNotice} />}
      {alertBox && <RdAlertDialog title={alertBox} onOk={() => setAlertBox(null)} />}
    </>
  );
}

/* ───────── 쪽 ───────── */

export function FarewellPage() {
  return (
    <LoginRequired screenName={TITLE} title={TITLE} desc="가족 한 분 한 분께 따로 남기는 편지입니다. 생각날 때마다 남기세요.">
      <FarewellBody />
    </LoginRequired>
  );
}

function FarewellBody() {
  const phone = useIsPhone();
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const [load, setLoad] = useState<'loading' | 'ready' | 'fail'>('loading');
  const [people, setPeople] = useState<Recipient[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [writing, setWriting] = useState<{ person: Recipient; letter: LetterDetail | null } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [delAsk, setDelAsk] = useState<MessageItem | null>(null);
  const [alertBox, setAlertBox] = useState<string | null>(null);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [voiceStorageEnabled, setVoiceStorageEnabled] = useState(false); // R2_VOICE_ENABLED — /status로만 판단
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const loadAll = useCallback(() => {
    setLoad('loading');
    Promise.all([apiFetch<Recipient[]>('/api/family-designations', 'USER'), apiFetch<MessageItem[]>('/api/farewell-messages', 'USER')])
      .then(([designations, msgs]) => {
        if (!alive.current) return;
        setPeople(designations);
        setMessages(msgs);
        setLoad('ready');
      })
      .catch(() => { if (alive.current) setLoad('fail'); });
  }, []);
  useEffect(loadAll, [loadAll]);

  const refreshMessages = useCallback(() => {
    apiFetch<MessageItem[]>('/api/farewell-messages', 'USER')
      .then((d) => { if (alive.current) setMessages(d); })
      .catch(() => { /* 목록이 한 번 안 갱신될 뿐이다 — 다음 열기 때 다시 받는다 */ });
  }, []);

  // §6.4-9-5 — 서버에 물어서만 업로드·저장 UI를 켠다(프론트에 플래그를 직접 심지 않는다)
  useEffect(() => {
    apiFetch<{ enabled?: boolean; voiceStorageEnabled?: boolean }>('/api/stt/status')
      .then((d) => {
        setSttEnabled(!!d?.enabled);
        setVoiceStorageEnabled(!!d?.voiceStorageEnabled);
      })
      .catch(() => {
        setSttEnabled(false);
        setVoiceStorageEnabled(false);
      });
  }, []);

  // 데스크톱은 첫 사람을 미리 고른다. 모바일은 목록을 먼저 보여 주려고 고를 때까지 비워 둔다(00-38 §8.1-1 ⓕ)
  useEffect(() => {
    setSel((prev) => {
      if (people.length === 0) return null;
      if (prev && people.some((p) => p.id === prev)) return prev;
      return phone ? null : people[0].id;
    });
  }, [people, phone]);

  const head = (
    <RdPageHead title={TITLE} desc={phone ? undefined : '가족 한 분 한 분께 따로 남기는 편지입니다. 생각날 때마다 남기세요.'} />
  );

  if (load === 'loading') {
    return (
      <div className="rd-container rd-screen">
        {head}
        <p className="rd-lineinfo" role="status">불러오는 중...</p>
      </div>
    );
  }
  if (load === 'fail') {
    return (
      <div className="rd-container rd-screen">
        {head}
        <RdState kind="error" title="화면을 불러오지 못했습니다" desc="잠시 뒤 다시 열어 주세요. 계속되면 '카카오톡 문의하기'로 알려 주세요.">
          <RdButton kind="secondary" onClick={() => window.location.assign('/')}>홈으로</RdButton>
          <RdButton onClick={loadAll}>새로 고침</RdButton>
        </RdState>
      </div>
    );
  }

  const cur = people.find((p) => p.id === sel) ?? null;
  const lettersOf = (pid: string) => messages.filter((m) => m.recipientId === pid);
  const titleOf = (m: MessageItem, p: Recipient) => m.title || `${p.name}에게`;

  const openLetter = async (p: Recipient, m: MessageItem) => {
    setOpening(m.id);
    try {
      const d = await apiFetch<any>(`/api/farewell-messages/${m.id}`, 'USER');
      if (!alive.current) return;
      setWriting({ person: p, letter: { id: m.id, title: d.title || '', body: d.body || '', hasAudio: !!d.hasAudio, mediaMime: d.mediaMime ?? null } });
    } catch (e) {
      showToast(errText(e, '편지를 불러오는 중 오류가 발생했습니다.'), 'warn');
    } finally {
      if (alive.current) setOpening(null);
    }
  };

  const removeLetter = async (m: MessageItem) => {
    setDelAsk(null);
    try {
      await apiFetch(`/api/farewell-messages/${m.id}`, 'USER', { method: 'DELETE' });
      refreshMessages();
    } catch (e) {
      setAlertBox(errText(e, '삭제 중 오류가 발생했습니다.'));
    }
  };

  // 건별 · 전체 반출(zip). presigned URL이 없어 인증 fetch로 받아 blob URL을 만든 뒤 내려받는다. 실패해도 조용히 두고 다시 누르면 재시도된다(보조 기능)
  const exportOne = async (m: MessageItem, p: Recipient) => {
    try {
      const res = await apiFetchRaw(`/api/farewell-messages/${m.id}/export`, 'USER');
      if (!res.ok) return;
      saveBlob(await res.blob(), `eobom_유족메시지_${sanitizeForFilename(titleOf(m, p))}_${kstTodayCompact()}.zip`);
    } catch { /* 다시 누르면 재시도 */ }
  };
  const exportAll = async () => {
    try {
      const res = await apiFetchRaw('/api/farewell-messages/export', 'USER');
      if (!res.ok) return;
      saveBlob(await res.blob(), `eobom_유족메시지_${kstTodayCompact()}.zip`);
    } catch { /* 다시 누르면 재시도 */ }
  };

  const peopleNav = (
    <ul className="rd-pr-people" aria-label="받는 분">
      {people.map((p) => (
        <li key={p.id}>
          <button type="button" className="rd-pr-person" aria-current={!phone && sel === p.id ? 'true' : undefined} onClick={() => setSel(p.id)}>
            <span className="rd-pr-avatar" aria-hidden="true">{p.name[0]}</span>
            <span className="rd-pr-person__text">
              <b>{p.name}</b>
              <span>{relationLabel(p)} · {lettersOf(p.id).length}통</span>
            </span>
            <span className="rd-pr-person__chev"><IconChevronRight /></span>
          </button>
        </li>
      ))}
    </ul>
  );

  const detail = cur && (() => {
    const letters = lettersOf(cur.id);
    const status = STATUS_LABEL[cur.status] || cur.status;
    return (
      <section className="rd-pr-mail__main" aria-label={`${cur.name}님께 남기는 글`}>
        <div className="rd-pr-mail__head">
          <div>
            <h2 className="rd-t-section">{cur.name}님께 남기는 글</h2>
            {phone ? (
              <>
                <p>총 {letters.length}통의 편지가 보관되어 있습니다</p>
                <p style={{ marginTop: 6 }}><RdBadge kind={cur.status === 'ACCEPTED' ? 'done' : 'state'}>{status}</RdBadge></p>
              </>
            ) : (
              <p>총 {letters.length}통의 편지가 보관되어 있습니다 · {status}</p>
            )}
          </div>
          <div className="rd-pr-mail__tools">
            <RdIconButton label="전체 다운로드" bordered={phone} onClick={exportAll}><DownIcon size={20} /></RdIconButton>
            <RdButton place="row" onClick={() => setWriting({ person: cur, letter: null })}>새 편지 쓰기</RdButton>
          </div>
        </div>
        {letters.length === 0 ? (
          <p className="rd-lineinfo">아직 남긴 편지가 없습니다.</p>
        ) : (
          <ul className="rd-pr-letters">
            {letters.map((m) => (
              <li className="rd-pr-letter" key={m.id}>
                <button type="button" className="rd-pr-letter__open" disabled={opening === m.id} onClick={() => void openLetter(cur, m)}>
                  <span className="rd-pr-letter__meta">
                    {m.hasAudio ? (
                      <RdBadge kind="state"><MicIcon /> 음성 첨부</RdBadge>
                    ) : (
                      <RdBadge kind="draft"><IconDoc size={12} /> 텍스트</RdBadge>
                    )}
                    <span>{formatKstDate(m.createdAt, '.')}</span>
                  </span>
                  <span className="rd-pr-letter__title">{titleOf(m, cur)}</span>
                  <span className="rd-pr-letter__peek">{m.preview}</span>
                </button>
                <RdIconButton label="다운로드" onClick={() => void exportOne(m, cur)}><DownIcon /></RdIconButton>
                <RdIconButton label="편지 삭제" className="rd-pr-iconbtn--danger" onClick={() => setDelAsk(m)}><TrashIcon /></RdIconButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  })();

  const endingLink = (
    <div className="rd-pr-linkrow">
      <span>장례 희망·연명의료 등 남겨두실 것이 있다면</span>
      <RdTextLink href="/preview/ending-note" onClick={(e) => { e.preventDefault(); navigate('/preview/ending-note'); }}>디지털 엔딩노트</RdTextLink>
    </div>
  );

  const goFamily = () => navigate('/preview/mypage');

  return (
    <div className="rd-container rd-screen rd-pr-farewell">
      {head}
      {!phone && people.length > 0 && (
        <RdNotice tone="info" title="여기에 남기신 글과 음성은 사망 확인 후 지정하신 분에게 전달됩니다." />
      )}

      {people.length === 0 ? (
        <div className="rd-pr-mailnone">
          {!phone && (
            <div style={{ width: 280, flex: 'none' }}>
              <RdButton kind="secondary" place="row" onClick={goFamily}>가족 추가</RdButton>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <RdState kind="empty" title="아직 지정된 가족이 없습니다" desc={phone ? '받으실 분을 먼저 가족으로 지정해 주세요.' : '편지를 남기려면 먼저 받으실 분을 가족으로 지정해 주세요. 수신자가 없으면 사후에도 전달되지 않습니다.'}>
              {phone && <RdButton onClick={goFamily}>가족 추가</RdButton>}
            </RdState>
          </div>
        </div>
      ) : phone ? (
        cur ? (
          <>
            <button type="button" className="rd-pr-back" onClick={() => setSel(null)}><IconChevronLeft />{cur.name}</button>
            {detail}
          </>
        ) : (
          peopleNav
        )
      ) : (
        <div className="rd-pr-mail">
          {peopleNav}
          {detail}
        </div>
      )}
      {people.length > 0 && endingLink}

      {writing && (
        <WriteDialog
          key={`${writing.person.id}-${writing.letter?.id ?? 'new'}`}
          person={writing.person}
          letter={writing.letter}
          sttEnabled={sttEnabled}
          voiceStorageEnabled={voiceStorageEnabled}
          onClose={() => setWriting(null)}
          onChanged={refreshMessages}
        />
      )}
      {delAsk && (
        <RdDangerDialog
          title="이 편지를 삭제하시겠어요?"
          desc="30일 뒤 완전히 삭제됩니다."
          doLabel="삭제"
          onCancel={() => setDelAsk(null)}
          onDo={() => void removeLetter(delAsk)}
        />
      )}
      {alertBox && <RdAlertDialog title={alertBox} onOk={() => setAlertBox(null)} />}
    </div>
  );
}
