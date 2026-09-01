import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/storage';

// 00-28 §6.4 — 문의·상담 폼에서 로그인 유저의 저장된 연락처를 재사용할지 묻는 공용 훅.
// InquiryModal.tsx·ConsultRequestModal.tsx가 똑같이 쓴다(⚠️ 두 폼의 동작을 다르게 두지 말 것,
// §6.4-1) — GET /api/me/profile은 연락처를 마스킹해서 주므로, 이 훅은 실제 평문을 한 번도
// 들고 있지 않는다. 제출 시 값이 아니라 "프로필 걸 쓰겠다"는 의사(useProfileContact)만 보낸다.
export const useProfileContact = () => {
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [useProfileContact, setUseProfileContact] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);

  useEffect(() => {
    if (!getToken('USER')) return;
    apiFetch<{ contactPhone?: string; name?: string }>('/api/me/profile', 'USER')
      .then((data) => {
        if (data?.contactPhone) {
          setMaskedPhone(data.contactPhone);
          setProfileName(data.name || null);
          setUseProfileContact(true); // 저장된 값이 있으면 기본으로 켜서 "안 치게" 만든다(Phase 2 목표)
        }
      })
      .catch(() => {
        // 조회 실패는 조용히 무시 — 체크박스가 안 뜰 뿐, 기존처럼 직접 입력하면 된다.
        // 401은 apiFetch가 세션 정리·만료 알림까지 처리한다(00-34 §5.4).
      });
  }, []);

  return { maskedPhone, profileName, useProfileContact, setUseProfileContact, saveToProfile, setSaveToProfile };
};
