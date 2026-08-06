import { api } from './client';
import { BaseResponse } from './types';

export type ReportTargetType =
  | 'FREE_POST'
  | 'USED_ITEM'
  | 'TICKET_TRANSFER'
  | 'COMPANION'
  | 'MEMBER';

export type ReportReason =
  | 'SPAM'
  | 'ABUSE'
  | 'FRAUD'
  | 'INAPPROPRIATE'
  | 'ETC';

export interface ReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  detail?: string;
}

export const createReport = (data: ReportRequest) => {
  return api.post<BaseResponse<number>>('/api/reports', data);
};
