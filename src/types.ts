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

export interface Member {
  id: string;
  name: string;
  telegram_username: string | null;
  active: boolean;
  created_at: string;
}

export interface OrderItemWithMember {
  id: string;
  order_id: string;
  member_id: string;
  food: string;
  original_amount: number;
  final_amount: number;
  settled: boolean;
  settled_at: string | null;
  members: { name: string } | null;
}

export interface OrderWithItems {
  id: string;
  group_chat_id: string;
  location: string;
  order_date: string;
  payer_id: string;
  telegram_message_id: number | null;
  telegram_thread_id: number | null;
  created_at: string;
  payer: { name: string } | null;
  order_items: OrderItemWithMember[];
}