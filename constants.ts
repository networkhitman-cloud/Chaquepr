
import { Category } from './types';

export const BANK_LIST = [
  'HBL',
  'Meezan Bank',
  'UBL Bank',
  'Allied Bank',
  'Faysal Bank',
  'Alfalah Bank',
  'Other Bank'
];

export const CATEGORIES = Object.values(Category);

export const STATUS_COLORS = {
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Overdue: 'bg-rose-100 text-rose-700 border-rose-200',
  Active: 'bg-blue-100 text-blue-700 border-blue-200',
  Confirmed: 'bg-purple-100 text-purple-700 border-purple-200',
};
