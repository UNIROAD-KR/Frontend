import { api } from './client';
import { BaseResponse } from './types';

export type TransactionType = 'INCOME' | 'EXPENSE';
export type AccountBookCategory = 'FOOD' | 'TRANSPORT' | 'SHOPPING' | 'TRAVEL' | 'ETC' | 'CHARGE';

export interface AccountBookRequest {
  amount: number;
  type: TransactionType;
  category: AccountBookCategory;
  title: string;
  description?: string;
  transactionDate: string; // YYYY-MM-DD
}

export interface DailySummary {
  income: number;
  expense: number;
}

export interface MonthlySummaryResponse {
  totalIncome: number;
  totalExpense: number;
  dailySummaries: Record<string, DailySummary>; // 날짜(YYYY-MM-DD) -> {income, expense}
}

export interface AccountBookResponse {
  id: number;
  amount: number;
  type: TransactionType;
  category: AccountBookCategory;
  categoryName?: string;
  title: string;
  description?: string;
  transactionDate: string;
}

// 가계부 내역 추가
export const addAccountBookTransaction = (data: AccountBookRequest) => {
  return api.post<BaseResponse<number>>('/api/account-book', data);
};

// 가계부 내역 수정 (연관 데이터는 수정 후 조회 API를 다시 호출해 갱신)
export const updateAccountBookTransaction = (id: number, data: AccountBookRequest) => {
  return api.put<BaseResponse<unknown>>(`/api/account-book/${id}`, data);
};

// 가계부 내역 삭제
export const deleteAccountBookTransaction = (id: number) => {
  return api.delete<BaseResponse<unknown>>(`/api/account-book/${id}`);
};

// 월간 요약 조회
export const getAccountBookMonthlySummary = (year: number, month: number) => {
  return api.get<BaseResponse<MonthlySummaryResponse>>('/api/account-book/summary', {
    params: { year, month },
  });
};

// 일간 상세 조회
export const getAccountBookDailyDetails = (date: string) => {
  return api.get<BaseResponse<AccountBookResponse[]>>('/api/account-book/daily', {
    params: { date },
  });
};

export interface BalanceResponse {
  balance: number;
}

// 잔액 조회
export const getAccountBookBalance = () => {
  return api.get<BaseResponse<BalanceResponse>>('/api/account-book/balance');
};
