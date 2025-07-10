import { Person, Discount, Fee, SummaryResult, PersonResult } from '../types';

export const calculateFinalAmounts = (
  people: Person[],
  discounts: Discount[],
  fees: Fee[],
  isEqualSplit: boolean = false,
  totalAmountStr: string = ''
): SummaryResult => {
  if (people.length === 0) {
    return {
      people: [],
      totalOriginal: 0,
      totalDiscount: 0,
      totalFee: 0,
      grandTotal: 0,
      isEqualSplit,
    };
  }

  // Calculate the total original amount
  let totalOriginal: number;
  
  if (isEqualSplit) {
    // In equal split mode, use the total amount entered by user
    totalOriginal = parseFloat(totalAmountStr) || 0;
  } else {
    // In individual mode, sum up all individual amounts
    totalOriginal = people.reduce((sum, person) => sum + person.amount, 0);
  }

  // If total is 0, return zeros
  if (totalOriginal === 0) {
    return {
      people: people.map(person => ({
        id: person.id,
        name: person.name,
        originalAmount: 0,
        discountAmount: 0,
        feeAmount: 0,
        finalAmount: 0,
      })),
      totalOriginal: 0,
      totalDiscount: 0,
      totalFee: 0,
      grandTotal: 0,
      isEqualSplit,
    };
  }

  // Calculate total discount amount
  const totalDiscount = discounts.reduce((sum, discount) => {
    if (discount.isPercentage) {
      return sum + (totalOriginal * discount.amount) / 100;
    } else {
      return sum + discount.amount;
    }
  }, 0);

  // Calculate total fee amount
  const totalFee = fees.reduce((sum, fee) => {
    if (fee.isPercentage) {
      return sum + (totalOriginal * fee.amount) / 100;
    } else {
      return sum + fee.amount;
    }
  }, 0);

  // Calculate the grand total
  const grandTotal = totalOriginal - totalDiscount + totalFee;

  // Calculate individual results
  const peopleResults: PersonResult[] = people.map((person) => {
    let originalAmount: number;
    let proportion: number;
    
    if (isEqualSplit && totalOriginal > 0) {
      // In equal split mode, each person gets an equal share
      originalAmount = totalOriginal / people.length;
      proportion = 1 / people.length;
    } else {
      // In individual mode, use their specific amount
      originalAmount = person.amount;
      proportion = totalOriginal > 0 ? person.amount / totalOriginal : 0;
    }

    // Calculate individual discount amount
    const discountAmount = totalDiscount * proportion;

    // Calculate individual fee amount
    const feeAmount = totalFee * proportion;

    // Calculate final amount
    const finalAmount = originalAmount - discountAmount + feeAmount;

    return {
      id: person.id,
      name: person.name,
      originalAmount,
      discountAmount,
      feeAmount,
      finalAmount,
    };
  });

  return {
    people: peopleResults,
    totalOriginal,
    totalDiscount,
    totalFee,
    grandTotal,
    isEqualSplit,
  };
};