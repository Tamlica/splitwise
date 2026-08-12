export interface FoodItem {
  id: string;
  name: string;
  price: number;
}

export interface Person {
  id: string;
  name: string;
  amount: number;
  foods: FoodItem[];
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

export interface SavedBill {
  id: string;
  restaurant_name: string;
  total_original: number;
  total_discount: number;
  total_fee: number;
  grand_total: number;
  is_equal_split: boolean;
  created_at: string;
  bill_people: SavedBillPerson[];
  bill_discounts: SavedBillDiscount[];
  bill_fees: SavedBillFee[];
}

export interface SavedBillPerson {
  id: string;
  name: string;
  original_amount: number;
  discount_amount: number;
  fee_amount: number;
  final_amount: number;
  is_paid: boolean;
  bill_food_items: SavedBillFoodItem[];
}

export interface SavedBillFoodItem {
  id: string;
  name: string;
  price: number;
}

export interface SavedBillDiscount {
  id: string;
  name: string;
  amount: number;
  is_percentage: boolean;
}

export interface SavedBillFee {
  id: string;
  name: string;
  amount: number;
  is_percentage: boolean;
}

export interface Member {
  id: string;
  name: string;
  telegram_username: string | null;
  active: boolean;
  created_at: string;
}