
export enum Category {
  CHAQUE_RECEIVABLES = 'Chaque Receivables',
  CHAQUE_PAYABLES = 'Chaque Payables',
  LONG_TERM_PAYABLES = 'Long Term Payables',
  LONG_TERM_RECEIVABLES = 'Long Term Receivables',
  UNKNOWN_ONLINE = 'Unknown Online'
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  chaqueNo: string;
  voucherNo: string;
}

export interface Entry {
  id: string;
  category: Category;
  date: string;
  transactionDate?: string;
  refNo: string;
  partyName: string;
  bankName?: string;
  bankAccountNum?: string;
  desc: string;
  totalAmount: number;
  dueDate?: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Active' | 'Confirmed';
  payments: Payment[];
  confirmedBy?: string;
}

export type ViewType = Category | 'dashboard' | 'insights';

export interface StatSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}
