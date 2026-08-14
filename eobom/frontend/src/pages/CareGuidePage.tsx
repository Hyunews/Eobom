import React, { useState, useRef } from 'react';
import { CheckSquare, MessageSquare, ExternalLink, AlertTriangle } from 'lucide-react';
import careGuideTasksData from '../mockData/careGuideTasks.json';
import { ChecklistShieldIcon } from '../components/MenuIcons';

interface CareGuideTask {
  id: number;
  category: string;
  title: string;
  deadlineLabel: string;
  deadlineBase: string;
  severity: 'CRITICAL' | 'NORMAL' | 'INFO';
  legalBasis: string;
  verified: boolean;
  needsExpertHelp?: boolean;
  linkTo?: string;
  externalUrl?: string;
  conditional?: boolean;
  note?: string;
  checked: boolean;
}

interface CareGuidePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

// docs/07_상중_행정_케어/07-02 §2 22항목(+§2.7 조건부 1건) 전수. 표시 순서는 §3 —
// "기한 순"이 아니라 "판단 순"(severity 우선, 그 안에서 판단 흐름 순). 되돌릴 수 없는 것부터
// 보여야 한다는 원칙이라, 여기서도 severity로 강제 재그룹핑한다(JSON 순서에 기대지 않음).
const SEVERITY_ORDER: Array<CareGuideTask['severity']> = ['CRITICAL', 'NORMAL', 'INFO'];
const SEVERITY_LABEL: Record<CareGuideTask['severity'], { title: string; desc: string; color: string; bg: string }> = {
  // 빨간색은 "위험/응급" 톤이 너무 강해 유족에게 불쾌감을 줄 수 있다는 개발자 피드백(2026-08-14)
  // 으로 짙은 앰버(주황)로 교체 — 강조는 유지하되 경보음보다는 "중요 안내" 톤. "확인 필요" 배지
  // (연한 노란빛 amber #FEF3C7/#92400E)와는 톤을 달리해서 겹칠 때도 구분되게 한다.
  CRITICAL: { title: '1순위 · 되돌릴 수 없는 것', desc: '기한을 놓치면 되돌릴 방법이 없습니다', color: '#9A3412', bg: '#FFEDD5' },
  NORMAL: { title: '2순위 · 과태료·가산세', desc: '기한을 놓치면 불이익이 있지만 되돌릴 수는 있습니다', color: 'var(--point-color)', bg: '#EAE5DC' },
  INFO: { title: '3순위 · 실무 편의', desc: '기한 압박은 없지만 정리해두면 좋습니다', color: 'var(--text-muted)', bg: '#F1F5F9' },
};

const LINK_LABEL: Record<string, string> = {
  facility: '장사시설 찾기 →',
  counseling: '전문가 상담 →',
  'digital-estate': '디지털 자산 정리로 →',
};

export const CareGuidePage: React.FC<CareGuidePageProps> = ({ currentUser, onOpenLogin, setActiveTab }) => {
  const [deceasedName, setDeceasedName] = useState('홍길동');
  const [mournerName, setMournerName] = useState('홍상주');
  const [funeralPlace, setFuneralPlace] = useState('서울 평안 장례식장 201호');

  const [tasks, setTasks] = useState<CareGuideTask[]>(careGuideTasksData as CareGuideTask[]);
  const inheritanceRef = useRef<HTMLDivElement>(null);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)));
  };

  const handleSendObituary = () => {
    if (!currentUser) {
      alert('⚠️ 모바일 부고장 전송 서비스는 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    alert('💬 [개발중] 카카오톡 부고장 공유 API 연동 기능 개발 중입니다.');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#DEF7EC', color: '#03543F', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <ChecklistShieldIcon size={18} color="#03543F" /> 체크리스트 &amp; 쉴드 | 사망 직후 D-Day 필수 행정절차
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <ChecklistShieldIcon color="var(--point-color)" size={32} /> 상중 케어 &amp; 사망 행정 가이드
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          사망 후 D-Day별 필수 행정절차 타임라인, 모바일 부고장 작성 및 유족 심리 케어
        </p>
      </div>

      {/* §3.1 최상단 고정 배너 — 유족은 체크리스트를 끝까지 스크롤하지 않는다. 한 줄이라도
          남으려면 최상단이어야 한다. */}
      <div style={{ backgroundColor: '#FFEDD5', border: '2px solid #FDBA74', borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <AlertTriangle color="#9A3412" size={24} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#9A3412', fontSize: '1.05rem', margin: '0 0 0.4rem 0' }}>
            고인에게 빚이 있을 수 있다면, 3개월 안에 결정해야 합니다.
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#7C2D12', margin: '0 0 0.75rem 0', lineHeight: 1.6 }}>
            상속포기·한정승인 기한은 상속개시를 안 날로부터 3개월입니다. 지나면 채무를 그대로 물려받습니다.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => inheritanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn"
              style={{ backgroundColor: '#FFFFFF', color: '#9A3412', border: '1px solid #FDBA74', height: '38px', fontSize: '0.85rem', padding: '0 1rem' }}
            >
              내용 보기
            </button>
            <button
              type="button"
              onClick={() => setActiveTab?.('counseling')}
              className="btn"
              style={{ backgroundColor: '#9A3412', color: '#FFFFFF', height: '38px', fontSize: '0.85rem', padding: '0 1rem' }}
            >
              전문가 상담
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* D-Day 행정절차 타임라인 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare color="var(--point-color)" /> D-Day별 행정절차 체크리스트
          </h3>

          {SEVERITY_ORDER.map((severity) => {
            const group = tasks.filter((t) => t.severity === severity);
            if (group.length === 0) return null;
            const meta = SEVERITY_LABEL[severity];

            let lastCategory = '';

            return (
              <div key={severity} style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: meta.color }}>{meta.title}</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>{meta.desc}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {group.map((t) => {
                    const showCategoryHeader = t.category !== lastCategory;
                    lastCategory = t.category;
                    const isInheritanceSet = t.category === '상속 승인·포기';

                    return (
                      <React.Fragment key={t.id}>
                        {showCategoryHeader && (
                          <div
                            ref={isInheritanceSet ? inheritanceRef : undefined}
                            style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}
                          >
                            {t.category}
                            {t.conditional && ' (해당하는 경우에만)'}
                          </div>
                        )}
                        <div
                          onClick={() => toggleTask(t.id)}
                          style={{
                            padding: '0.9rem',
                            borderRadius: '8px',
                            backgroundColor: t.checked ? 'var(--secondary-color)' : '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <input type="checkbox" checked={t.checked} onChange={() => {}} style={{ width: '20px', height: '20px', marginTop: '0.1rem', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: meta.color, backgroundColor: meta.bg, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                  {t.deadlineLabel}{t.deadlineBase !== '-' ? ` · ${t.deadlineBase} 기준` : ''}
                                </span>
                                {!t.verified && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                    ⚠️ 확인 필요
                                  </span>
                                )}
                              </div>
                              <span style={{ textDecoration: t.checked ? 'line-through' : 'none', color: t.checked ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600 }}>
                                {t.title}
                              </span>
                              {t.note && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0', lineHeight: 1.5 }}>{t.note}</p>
                              )}
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>근거: {t.legalBasis}</p>
                              <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                {t.needsExpertHelp && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActiveTab?.('counseling'); }}
                                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--point-color)', textDecoration: 'underline', cursor: 'pointer' }}
                                  >
                                    {LINK_LABEL.counseling}
                                  </button>
                                )}
                                {t.linkTo && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActiveTab?.(t.linkTo as string); }}
                                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer' }}
                                  >
                                    {LINK_LABEL[t.linkTo] || '바로가기 →'}
                                  </button>
                                )}
                                {t.externalUrl && (
                                  <a
                                    href={t.externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', textDecoration: 'underline' }}
                                  >
                                    정부24 바로가기 <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
            이 체크리스트는 일반적인 안내이며 개별 사정에 따라 다를 수 있습니다. 정확한 기한 판단은
            전문가 상담을 이용하세요.
          </p>
        </div>

        {/* 모바일 부고장 생성 데모 */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare color="var(--primary-color)" /> 모바일 부고장 간편 작성
          </h3>

          <div className="form-group">
            <label className="form-label">고인 성함</label>
            <input type="text" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">상주 성함</label>
            <input type="text" value={mournerName} onChange={(e) => setMournerName(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">빈소 위치</label>
            <input type="text" value={funeralPlace} onChange={(e) => setFuneralPlace(e.target.value)} className="form-input" />
          </div>

          <div style={{
            marginTop: '1.1rem',
            padding: '1.2rem',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>📱 생성된 부고장 프리뷰</h4>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              [부고] {deceasedName} 님께서 별세하셨기에 아래와 같이 부고를 전합니다.<br/>
              • 상주: {mournerName}<br/>
              • 빈소: {funeralPlace}<br/>
              • 마음 전하실 곳: 카카오뱅크 3333-xx-xxxx
            </div>
            <button onClick={handleSendObituary} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              카카오톡 부고장 전송하기 (개발중)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
