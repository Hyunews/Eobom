import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

// docs 06-06 §6-1 — 유언장 사진 인식 단계 3 결과 화면. 시안(정본) = Design 캔버스
// https://claude.ai/artifact/C9GhecwVVWYroedZvptCuL (웹 Main·W2·W3 / 모바일 M1·M2·M3).
// 🔴 결과 문구는 서버가 만든 사실 문구를 그대로 보여준다. 유효·무효·적합·합계를 여기서 만들지 않는다(§3.1).
// 🔴 사진은 서버가 돌려주지 않는다 — 브라우저에 이미 있는 (줄인) 파일을 object URL로 그린다(§5).

export type RequirementKey = 'date' | 'address' | 'name' | 'seal' | 'handwriting';
export type RequirementState = 'found' | 'missing' | 'unknown';

export interface RequirementBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WillRequirement {
  key: RequirementKey;
  state: RequirementState;
  evidence: string;
  page?: number; // 0부터
  box?: RequirementBox; // page 이미지(width×height) 기준 픽셀 좌표
}

export interface WillOcrPageInfo {
  text: string;
  width?: number;
  height?: number;
  fileIndex: number; // 올린 파일 순서(사진 표시용 매핑)
}

export interface WillOcrResponse {
  text: string;
  pages: WillOcrPageInfo[];
  requirements: WillRequirement[];
}

const LABEL: Record<RequirementKey, string> = {
  date: '연월일',
  address: '주소',
  name: '성명',
  seal: '날인',
  handwriting: '전문 자서',
};
const STATE_LABEL: Record<RequirementState, string> = { found: '찾음', missing: '찾지 못함', unknown: '판단 못 함' };

type Tab = 'photo' | 'req' | 'text';

const HL_PAD = 8; // 사진 테두리 사방 여백(px)

interface WillPhotoResultProps {
  files: File[];
  result: WillOcrResponse;
  hasExistingDraft: boolean;
  onClose: () => void;
  onMerge: (text: string, mode: 'replace' | 'append') => void;
}

export const WillPhotoResult: React.FC<WillPhotoResultProps> = ({ files, result, hasExistingDraft, onClose, onMerge }) => {
  const isMobile = useIsMobile();
  const { pages, requirements } = result;

  const [tab, setTab] = useState<Tab>(isMobile ? 'photo' : 'req');
  const [selKey, setSelKey] = useState<RequirementKey | null>(null); // 처음 열 때 선택 없음
  const [page, setPage] = useState(0);
  const [fromReq, setFromReq] = useState(false); // 모바일 규칙 3 — 요건 행을 눌러 넘어왔을 때만 설명 줄·테두리
  const hlRef = useRef<HTMLDivElement>(null);

  // 브라우저에 있는 파일 → 보여줄 수 있는 것만 object URL. tiff는 브라우저가 못 그리고 pdf는 쪽 이미지가 없다(§6-1).
  const [urls, setUrls] = useState<(string | null)[]>([]);
  useEffect(() => {
    const created = files.map((f) => (f.type === 'image/jpeg' || f.type === 'image/png' ? URL.createObjectURL(f) : null));
    setUrls(created);
    return () => created.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  const photoOf = (i: number): string | null => {
    const p = pages[i];
    if (!p || !p.width || !p.height) return null;
    return urls[p.fileIndex] ?? null;
  };
  const hasAnyPhoto = pages.some((_, i) => photoOf(i) !== null);

  // 화면 폭이 바뀌어 웹에 '사진' 탭 상태가 남는 경우를 정리한다(웹 탭은 요건/인식된 글 둘뿐).
  const activeTab: Tab = !isMobile && tab === 'photo' ? 'req' : tab;

  const sel = requirements.find((r) => r.key === selKey) ?? null;
  const showHighlight = activeTab === 'req' || (activeTab === 'photo' && fromReq);
  const hl = showHighlight && sel && sel.box && sel.page === page ? sel : null;

  // 모바일 규칙 2 — 테두리가 보이게 스크롤. 웹은 사진 칸 안에서 같은 동작.
  useEffect(() => {
    if (hl) hlRef.current?.scrollIntoView({ block: 'center' });
  }, [hl, page, activeTab, urls]);

  const pickRequirement = (r: WillRequirement) => {
    setSelKey(r.key);
    if (r.page !== undefined && r.page < pages.length) setPage(r.page);
    if (isMobile) {
      setFromReq(true);
      setTab('photo');
    }
  };

  const pickTab = (t: Tab) => {
    setTab(t);
    if (isMobile) setFromReq(false);
  };

  const tabs: { id: Tab; label: string }[] = isMobile
    ? [
        { id: 'photo', label: '사진' },
        { id: 'req', label: '요건' },
        { id: 'text', label: '인식된 글' },
      ]
    : [
        { id: 'req', label: '자필증서 요건' },
        { id: 'text', label: '인식된 글' },
      ];

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const at = tabs.findIndex((t) => t.id === activeTab);
    const next = tabs[(at + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    pickTab(next.id);
    document.getElementById(`ocr-tab-${next.id}`)?.focus();
  };

  const State: React.FC<{ state: RequirementState }> = ({ state }) => (
    <span className={`v2-ocr-state is-${state}`}>
      <span className="v2-ocr-dot" />
      {STATE_LABEL[state]}
    </span>
  );

  const pager = pages.length > 1 && hasAnyPhoto && (
    <div className="v2-ocr-pager">
      <button type="button" className="v2-ocr-pager-btn" aria-label="이전 쪽" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
        <ChevronLeft size={18} />
      </button>
      <span className="v2-ocr-pager-label">{page + 1} / {pages.length}</span>
      <button type="button" className="v2-ocr-pager-btn" aria-label="다음 쪽" disabled={page === pages.length - 1} onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}>
        <ChevronRight size={18} />
      </button>
    </div>
  );

  const photo = photoOf(page);
  const pageInfo = pages[page];
  const photoFrame = photo && pageInfo ? (
    <div className="v2-ocr-frame">
      <div className="v2-ocr-img-wrap">
        <img className="v2-ocr-img" src={photo} alt={`올린 사진 ${page + 1}쪽`} />
        {hl && hl.box && pageInfo.width && pageInfo.height && (
          <div
            ref={hlRef}
            className="v2-ocr-hl"
            aria-hidden="true"
            style={{
              // 09-29 사람 지시 — 테두리도 글자에 붙지 않게 사방 여백(HL_PAD)을 둔다.
              left: `calc(${(hl.box.x / pageInfo.width) * 100}% - ${HL_PAD}px)`,
              top: `calc(${(hl.box.y / pageInfo.height) * 100}% - ${HL_PAD}px)`,
              width: `calc(${(hl.box.width / pageInfo.width) * 100}% + ${HL_PAD * 2}px)`,
              height: `calc(${(hl.box.height / pageInfo.height) * 100}% + ${HL_PAD * 2}px)`,
            }}
          />
        )}
      </div>
    </div>
  ) : (
    <p className="v2-ocr-note">PDF는 사진 표시 없이 결과만 보여 줍니다.</p>
  );

  const requirementRows = (
    <>
      {requirements.map((r) => {
        const selected = r.key === selKey;
        const clickable = !isMobile || !!r.box;
        const body = (
          <>
            <span className="v2-ocr-row-top">
              <span className="v2-ocr-row-label">{LABEL[r.key]}</span>
              <State state={r.state} />
              {isMobile && <span className="v2-ocr-chev">{r.box && <ChevronRight size={18} aria-hidden="true" />}</span>}
            </span>
            <span className="v2-ocr-row-ev">{r.evidence}</span>
          </>
        );
        return clickable ? (
          <button
            key={r.key}
            type="button"
            className={`v2-ocr-row${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            aria-label={isMobile && r.box ? `${LABEL[r.key]} ${STATE_LABEL[r.state]}, 사진에서 위치 보기` : undefined}
            onClick={() => pickRequirement(r)}
          >
            {body}
          </button>
        ) : (
          <div key={r.key} className="v2-ocr-row is-static">{body}</div>
        );
      })}
    </>
  );

  const textPanel = (
    <div className="v2-ocr-textbox">
      {pages.map((p, i) => (
        <div key={i} className="v2-ocr-textpage">
          <div className="v2-ocr-textpage-title">{i + 1}쪽</div>
          <div className="v2-ocr-textpage-body">{p.text}</div>
        </div>
      ))}
    </div>
  );

  const actions = (
    <div className="v2-ocr-actions">
      <button type="button" className="v2-btn-outline" onClick={onClose}>취소</button>
      {hasExistingDraft ? (
        <>
          <button type="button" className="v2-btn-outline" onClick={() => onMerge(result.text, 'append')}>뒤에 붙이기</button>
          <button type="button" className="v2-btn-primary" onClick={() => onMerge(result.text, 'replace')}>바꾸기</button>
        </>
      ) : (
        <button type="button" className="v2-btn-primary" onClick={() => onMerge(result.text, 'replace')}>초안에 넣기</button>
      )}
    </div>
  );

  const head = (
    <div className="v2-ocr-head">
      <h3 className="v2-ocr-title">사진으로 불러오기</h3>
      <button type="button" className="v2-ocr-close" aria-label="닫기" onClick={onClose}>
        <X size={22} />
      </button>
    </div>
  );

  const tablist = (
    <div className="v2-ocr-tabs-wrap">
      <div className="v2-tabs" role="tablist" aria-label="결과 보기" onKeyDown={onTabKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`ocr-tab-${t.id}`}
            aria-selected={activeTab === t.id}
            aria-controls={`ocr-panel-${t.id}`}
            tabIndex={activeTab === t.id ? 0 : -1}
            className="v2-tab"
            onClick={() => pickTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );

  const footNote = <p className="v2-ocr-foot-note">인식된 글은 틀릴 수 있습니다. 사진과 대조해 확인해 주세요.</p>;

  // ── 모바일 — 전체 화면. 위 고정(제목·탭) / 가운데만 스크롤 / 아래 고정(안내 1줄 + 버튼 한 줄) ──
  if (isMobile) {
    return (
      <div className="v2-ocr-result is-mobile">
        {head}
        {tablist}
        <div className="v2-ocr-scroll">
          {activeTab === 'photo' && (
            <div role="tabpanel" id="ocr-panel-photo" aria-labelledby="ocr-tab-photo">
              {((fromReq && sel) || (pages.length > 1 && hasAnyPhoto)) && (
                <div className="v2-ocr-photo-top">
                  <div className="v2-ocr-photo-caption">
                    {fromReq && sel && (
                      <>
                        <span className="v2-ocr-caption-head">
                          {LABEL[sel.key]} <State state={sel.state} />
                        </span>
                        <span className="v2-ocr-caption-ev">{sel.box ? sel.evidence : '이 항목은 사진에서 표시할 위치가 없습니다.'}</span>
                      </>
                    )}
                  </div>
                  {pager}
                </div>
              )}
              {photoFrame}
            </div>
          )}
          {activeTab === 'req' && (
            <div role="tabpanel" id="ocr-panel-req" aria-labelledby="ocr-tab-req" className="v2-ocr-req-panel">
              {requirementRows}
              <p className="v2-ocr-req-note">자동 확인은 참고용입니다. 요건 체크는 유언장 초안 화면에서 직접 해 주세요.</p>
            </div>
          )}
          {activeTab === 'text' && (
            <div role="tabpanel" id="ocr-panel-text" aria-labelledby="ocr-tab-text" className="v2-ocr-text-panel">
              {textPanel}
            </div>
          )}
        </div>
        <div className="v2-ocr-foot">
          {footNote}
          {actions}
        </div>
      </div>
    );
  }

  // ── 웹 — 1048px 2단(사진 | 탭 2개) ──
  return (
    <div className="v2-ocr-result">
      {head}
      <div className="v2-ocr-main">
        <div className="v2-ocr-photo-col">
          {photoFrame}
          {pager}
          {sel && !sel.box && hasAnyPhoto && <p className="v2-ocr-note">이 항목은 사진에서 표시할 위치가 없습니다.</p>}
        </div>
        <div className="v2-ocr-side">
          {tablist}
          {activeTab === 'req' && (
            <div role="tabpanel" id="ocr-panel-req" aria-labelledby="ocr-tab-req">
              <p className="v2-ocr-hint">항목을 누르면 사진에서 찾은 위치가 표시됩니다.</p>
              {requirementRows}
              <p className="v2-ocr-req-note">자동 확인은 참고용입니다. 요건 체크는 유언장 초안 화면에서 직접 해 주세요.</p>
            </div>
          )}
          {activeTab === 'text' && (
            <div role="tabpanel" id="ocr-panel-text" aria-labelledby="ocr-tab-text">
              {textPanel}
            </div>
          )}
        </div>
      </div>
      <div className="v2-ocr-foot">
        {footNote}
        {actions}
      </div>
    </div>
  );
};
