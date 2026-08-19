import React, { useState } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import digitalEstateData from '../mockData/digitalEstate.json';
import { PhoneHeartIcon } from '../components/MenuIcons';

// 08-19 9차(개발자 직접 지시) — 기존 3서브탭(digital/physical/memorial) 중 "디지털 자산·계정
// 정산"만 남기고, 나머지 둘은 PickupPage(유품 수거)·MemorialPage(디지털 추모관)로 분리했다.

interface DigitalEstatePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

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
