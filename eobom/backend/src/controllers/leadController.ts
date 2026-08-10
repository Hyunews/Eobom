import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyBearerToken } from './authController';
import { createLead, ConsentRequiredError, FacilityNotFoundError } from '../services/leadService';

const safeLead = (lead: { leadNo: string; type: string; status: string; createdAt: Date }) => ({
  leadNo: lead.leadNo,
  type: lead.type,
  status: lead.status,
  createdAt: lead.createdAt,
});

// 견적요청 (`POST /api/facilities/:id/quotes`) — QUOTE 타입 리드.
// 로그인 불필요(§10-2 권장안: 비회원 허용). 로그인 상태면 userId를 함께 남긴다.
export const createQuote = async (req: Request, res: Response) => {
  const { applicantName, applicantPhone, thirdPartyConsent, payload } = req.body as {
    applicantName?: string;
    applicantPhone?: string;
    thirdPartyConsent?: boolean;
    payload?: Record<string, unknown>;
  };

  if (!applicantName?.trim() || !applicantPhone?.trim()) {
    return res.status(400).json({ status: 'error', message: '이름과 연락처는 필수입니다.' });
  }
  if (!thirdPartyConsent) {
    return res.status(400).json({ status: 'error', message: '개인정보 제3자 제공에 동의해야 견적요청을 접수할 수 있습니다.' });
  }

  const decoded = verifyBearerToken(req);

  try {
    const lead = await prisma.$transaction((tx) =>
      createLead(tx, {
        type: 'QUOTE',
        facilityId: req.params.id,
        userId: decoded?.id ?? null,
        applicantName: applicantName.trim(),
        applicantPhone: applicantPhone.trim(),
        payload: payload ?? {},
        thirdPartyConsent: true,
      })
    );
    return res.status(201).json({ status: 'success', data: safeLead(lead) });
  } catch (error) {
    if (error instanceof FacilityNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof ConsentRequiredError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('견적요청 생성 실패:', error);
    return res.status(500).json({ status: 'error', message: '견적요청 처리 중 오류가 발생했습니다.' });
  }
};

// 전화 문의 클릭 이벤트 (`POST /api/facilities/:id/call-events`) — 익명, 개인정보 없음(§4.1).
// 청구 근거로 쓰지 않는다(§9 — 통화 연결·성사 여부를 우리가 증명할 수 없음). 지표 집계 전용.
export const createCallEvent = async (req: Request, res: Response) => {
  const decoded = verifyBearerToken(req);
  try {
    const lead = await prisma.$transaction((tx) =>
      createLead(tx, {
        type: 'CALL',
        facilityId: req.params.id,
        userId: decoded?.id ?? null,
        payload: {},
        thirdPartyConsent: false, // CALL은 동의 대상이 아님 — leadService가 무시한다
      })
    );
    return res.status(201).json({ status: 'success', data: safeLead(lead) });
  } catch (error) {
    if (error instanceof FacilityNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    console.error('전화 클릭 이벤트 기록 실패:', error);
    return res.status(500).json({ status: 'error', message: '이벤트 기록 중 오류가 발생했습니다.' });
  }
};
