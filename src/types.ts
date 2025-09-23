export interface Person {
  id: string;
  name: string;
  amount: number;
  foods: string[];
}

export interface Discount {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
}

export interface Fee {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
}

export interface PersonResult {
  id: string;
  name: string;
  originalAmount: number;
  discountAmount: number;
  feeAmount: number;
  finalAmount: number;
}

export interface SummaryResult {
  people: PersonResult[];
  totalOriginal: number;
  totalDiscount: number;
  totalFee: number;
  grandTotal: number;
  isEqualSplit: boolean;
}