import { Person, Discount, Fee, SummaryResult, PersonResult } from '../types';

export const calculateFinalAmounts = (
  people: Person[],
  discounts: Discount[],
  fees: Fee[]
): SummaryResult => {
  if (people.length === 0) {
    return {
      people: [],
      totalOriginal: 0,
      totalDiscount: 0,
      totalFee: 0,
      grandTotal: 0,
    };
  }

  // Calculate the total original amount
  const totalOriginal = people.reduce((sum, person) => sum + person.amount, 0);

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
    // Calculate proportion of the total
    const proportion = totalOriginal > 0 ? person.amount / totalOriginal : 0;

    // Calculate individual discount amount
    const discountAmount = totalDiscount * proportion;

    // Calculate individual fee amount
    const feeAmount = totalFee * proportion;

    // Calculate final amount
    const finalAmount = person.amount - discountAmount + feeAmount;

    return {
      id: person.id,
      name: person.name,
      originalAmount: person.amount,
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
  };
};