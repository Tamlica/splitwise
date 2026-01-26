import { supabase } from '../lib/supabase';
import { Person, Discount, Fee, SummaryResult, SavedBill } from '../types';

export const saveBill = async (
  people: Person[],
  discounts: Discount[],
  fees: Fee[],
  results: SummaryResult,
  restaurantName: string
): Promise<string> => {
  try {
    // Insert the main bill record
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert({
        restaurant_name: restaurantName,
        total_original: results.totalOriginal,
        total_discount: results.totalDiscount,
        total_fee: results.totalFee,
        grand_total: results.grandTotal,
        is_equal_split: results.isEqualSplit,
      })
      .select()
      .single();

    if (billError) throw billError;

    const billId = billData.id;

    // Insert people records
    const peopleInserts = results.people.map(person => ({
      bill_id: billId,
      name: person.name,
      original_amount: person.originalAmount,
      discount_amount: person.discountAmount,
      fee_amount: person.feeAmount,
      final_amount: person.finalAmount,
      is_paid: false,
    }));

    const { data: peopleData, error: peopleError } = await supabase
      .from('bill_people')
      .insert(peopleInserts)
      .select();

    if (peopleError) throw peopleError;

    // Insert food items for each person
    const foodItemInserts = [];
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const savedPerson = peopleData[i];
      
      for (const food of person.foods) {
        foodItemInserts.push({
          bill_person_id: savedPerson.id,
          name: food.name,
          price: food.price,
        });
      }
    }

    if (foodItemInserts.length > 0) {
      const { error: foodError } = await supabase
        .from('bill_food_items')
        .insert(foodItemInserts);

      if (foodError) throw foodError;
    }

    // Insert discounts
    if (discounts.length > 0) {
      const discountInserts = discounts.map(discount => ({
        bill_id: billId,
        name: discount.name,
        amount: discount.amount,
        is_percentage: discount.isPercentage,
      }));

      const { error: discountError } = await supabase
        .from('bill_discounts')
        .insert(discountInserts);

      if (discountError) throw discountError;
    }

    // Insert fees
    if (fees.length > 0) {
      const feeInserts = fees.map(fee => ({
        bill_id: billId,
        name: fee.name,
        amount: fee.amount,
        is_percentage: fee.isPercentage,
      }));

      const { error: feeError } = await supabase
        .from('bill_fees')
        .insert(feeInserts);

      if (feeError) throw feeError;
    }

    return billId;
  } catch (error) {
    console.error('Error saving bill:', error);
    throw error;
  }
};

export const getRecentBills = async (): Promise<SavedBill[]> => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        bill_people (
          *,
          bill_food_items (*)
        ),
        bill_discounts (*),
        bill_fees (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching recent bills:', error);
    throw error;
  }
};

export const getBillById = async (billId: string): Promise<SavedBill | null> => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        bill_people (
          *,
          bill_food_items (*)
        ),
        bill_discounts (*),
        bill_fees (*)
      `)
      .eq('id', billId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw error;
  }
};

export const updatePersonPaidStatus = async (personId: string, isPaid: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bill_people')
      .update({ is_paid: isPaid })
      .eq('id', personId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating paid status:', error);
    throw error;
  }
};