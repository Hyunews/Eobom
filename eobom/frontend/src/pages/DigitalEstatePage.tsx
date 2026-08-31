import React, { useState } from 'react';
import { Upload, CheckCircle2, ShieldAlert, ExternalLink, Search } from 'lucide-react';
import digitalEstateData from '../mockData/digitalEstate.json';
import { PhoneHeartIcon } from '../components/MenuIcons';

// 08-19 9차(개발자 직접 지시) — 기존 3서브탭(digital/physical/memorial) 중 "디지털 자산·계정
// 정산"만 남기고, 나머지 둘은 PickupPage(유품 수거)·MemorialPage(디지털 추모관)로 분리했다.

interface DigitalEstatePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

// 04-01 §0.2 STEP 1 — 두 경로만 노출한다. 1-C(정보주체 권리행사 서비스)는 사망자 대행이
// ❌ 불가로 확정돼 삭제됐다(04-03 §2.2-1) — 대신 아래 AccountDiscoveryGuide STEP 0 4번째
// 줄로 들어갔다.
const DISCOVERY_PATHS = [
  {
    id: '1-A',
    label: '안심상속 원스톱',
    provider: '정부24 · 주민센터',
    what: '고인 명의로 거래 중인 금융기관·카드사 목록이 나옵니다.',
    deadline: '사망하신 달의 말일부터 1년 안에',
    url: 'https://www.gov.kr/portal/onestopSvc/safeInheritance',
  },
  {
    id: '1-B',
    label: '상속인 금융거래 조회',
    provider: '금융감독원 → 확인된 카드사에 정기결제 내역 개별 청구',
    what: '구독 서비스가 이름 그대로 나옵니다 — 실무상 가장 강력한 경로입니다.',
    deadline: '조회 결과 확인 20일 이내 · 결과 보관 3개월',
    url: 'https://www.fss.or.kr/fss/cvpl/inhCerEc/main.do?menuNo=200010',
  },
] as const;

// 04-01 §0.2 STEP 0·1 — "계정 찾기". 카탈로그(아래 기존 목록)보다 먼저 오는 화면이다
// (04-01 §7.1 "목적지 목록은 목적지를 모르는 사람에게 쓸모가 없다"). 정적 콘텐츠 + 외부
// 링크뿐이라 스키마·API 없이 이 파일 안에서만 완결된다. 🔴 사망일 입력칸을 두지 않는다 —
// 기한은 항상 구간 라벨만 보여준다(§0.6 · 07-04 §3.1-1과 같은 규칙).
const AccountDiscoveryGuide: React.FC = () => (
  <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)', marginBottom: '1.5rem' }}>
    <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Search color="var(--point-color)" size={22} /> 계정 찾기
    </h3>

    {/* STEP 0 — 펼침 없이 항상 노출되는 4줄. 1~3은 KISO 정책규정 §28①·§28②를 근거로 인용하고,
        4는 1-C 삭제분이 옮겨온 것이다(04-01 §0.2, 04-03 §2.2-1). */}
    <div style={{ fontSize: '0.9rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '1rem 1.1rem', marginBottom: '1.5rem', lineHeight: 1.75 }}>
      <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: 0, marginBottom: '0.6rem', fontWeight: 700 }}>
        <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} /> 먼저 아셔야 할 것
      </p>
      <p style={{ margin: 0, marginBottom: '0.4rem' }}>
        1. 고인의 아이디·비밀번호는 어디서도 받으실 수 없습니다 — KISO 정책규정 §28①
      </p>
      <p style={{ margin: 0, marginBottom: '0.4rem' }}>
        2. 받으실 수 있는 것: 계정 폐쇄·구독 해지·추모 전환·공개 게시물 백업(사업자 재량) ·
        사이버머니 등 경제적 가치가 있는 것의 청구 — KISO 정책규정 §28②
      </p>
      <p style={{ margin: 0, marginBottom: '0.4rem' }}>
        3. 플랫폼은 사망 사실을 자동으로 알지 못합니다 — 알리지 않으면 그대로 남습니다
      </p>
      <p style={{ margin: 0 }}>
        4. 개인정보 포털(privacy.go.kr)의 「본인확인 내역 조회」는 본인만 이용할 수 있습니다 —
        고인 명의로는 유족이 조회하실 수 없습니다
      </p>
    </div>

    {/* STEP 1 — 계정 찾기 경로 2개. 신청·수령은 유족 본인이 직접 한다(§0.5) — 이어봄이 대신
        신청하지 않는다. */}
    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
      아래 두 곳은 전부 무료 공공 서비스입니다. 이어봄은 대신 신청하지 않으며, 신청과 결과 수령은
      직접 하셔야 합니다.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
      {DISCOVERY_PATHS.map((path) => (
        <div key={path.id} style={{ padding: '1.1rem', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ color: 'var(--primary-color)', fontSize: '1.02rem', margin: 0 }}>{path.label}</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--point-color)', fontWeight: 600, margin: 0 }}>{path.provider}</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.6 }}>{path.what}</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>기한 · {path.deadline}</p>
          <a
            href={path.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-point"
            style={{ marginTop: '0.4rem', height: '40px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            신청 페이지로 이동 <ExternalLink size={15} />
          </a>
        </div>
      ))}
    </div>
  </div>
);

export const DigitalEstatePage: React.FC<DigitalEstatePageProps> = ({ currentUser, onOpenLogin }) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [digitalAccounts, setDigitalAccounts] = useState(digitalEstateData.digitalAccounts);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      alert('⚠️ 증빙 서류 업로드는 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setUploadedFiles([...uploadedFiles, fileName]);
      alert(`🚧 [${fileName}] 파일이 예시 화면에 표시되었습니다. (실제 서버 업로드·검증 기능은 준비 중입니다)`);
    }
  };

  // 실제 접수·검증 기능은 준비 중(00-14 §2.2)
  const handleApplyAccount = (accName: string) => {
    if (!currentUser) {
      alert('⚠️ 고인 계정 정산 신청은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    if (uploadedFiles.length === 0) {
      alert('⚠️ 증빙 서류(가족관계증명서 또는 사망진단서)가 아직 업로드되지 않았습니다!\n아래 파일 업로드 영역에서 증빙 서류를 먼저 첨부해 주세요.');
    } else {
      alert(`🚧 [${accName}] 정산 신청 기능은 준비 중입니다. 이 화면에서는 실제로 접수되지 않습니다.`);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FEF3C7', color: 'var(--accent-gold)', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <PhoneHeartIcon size={18} color="var(--accent-gold)" /> SNS / 클라우드 계정 정산
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <PhoneHeartIcon color="var(--accent-gold)" size={32} /> 디지털 정산
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          고인의 SNS·클라우드 계정 정산을 신청하세요.
        </p>
      </div>

      <AccountDiscoveryGuide />

      {/* 아래 카탈로그(업로드·건별 신청 목록)는 Step 5(04-01 §8) 전면 개편 대상 — "정산" 문구·
          OCR 검증 표기·업로드 유도를 포함한 기존 목업 그대로다. Step 0-b는 위 계정 찾기 섹션만
          추가하고 이 블록은 건드리지 않는다(스펙 §8 표에 단계가 나뉘어 있음). */}
      <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        ⚠️ 이 페이지는 화면 구성을 보여드리기 위한 <strong>예시 데이터</strong>로 채워져 있습니다.
        실제 정산 신청·검증 기능은 준비 중입니다(00-14 §2.2).
      </div>

      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>고인 디지털 계정 정산 신청</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
          정당한 상속인 확인을 위해 아래 <strong>증빙 서류(가족관계증명서 / 사망진단서)를 먼저 업로드</strong>해 주세요.
        </p>

        <div style={{ border: '2px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: '12px', backgroundColor: 'var(--secondary-color)', marginBottom: '1.75rem' }}>
          <Upload color="var(--primary-color)" size={36} style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>📌 필수 증빙 서류 업로드 (가족관계증명서 / 사망진단서)</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>제출하신 서류는 상속인 확인 절차에 사용될 예정입니다. (자동 검증 기능은 준비 중)</p>

          <input type="file" id="doc-file-input" onChange={handleFileUpload} style={{ display: 'none' }} />
          <label htmlFor="doc-file-input" className="btn btn-primary" style={{ cursor: 'pointer' }}>
            📁 컴퓨터에서 서류 파일 선택/업로드
          </label>

          {uploadedFiles.length > 0 && (
            <div style={{ marginTop: '1.1rem', textAlign: 'left', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid var(--point-color)' }}>
              <h5 style={{ color: 'var(--point-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={16} /> 현재 업로드 완료된 서류 목록:
              </h5>
              <ul style={{ listStyle: 'none', paddingLeft: '0.5rem', fontSize: '0.9rem' }}>
                {uploadedFiles.map((f, i) => (
                  <li key={i} style={{ padding: '0.25rem 0' }}>📄 {f} (OCR 검증 완료)</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>계정별 정산/승계 신청</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {digitalAccounts.map((acc) => (
            <div key={acc.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{acc.name}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--point-color)', fontWeight: 500 }}>{acc.status}</p>
              </div>
              <button onClick={() => handleApplyAccount(acc.name)} className="btn btn-point" style={{ height: '42px', fontSize: '0.9rem' }}>
                정산 신청 (개발중)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
