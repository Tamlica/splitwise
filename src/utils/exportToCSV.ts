import { SummaryResult } from '../types';
import { formatCurrency } from './formatters';

export const exportToCSV = (results: SummaryResult, restaurantName?: string) => {
  // Prepare CSV content
  const headers = restaurantName 
    ? [`Restaurant: ${restaurantName}`, '', 'Name,Original,Discount,Fee,Final']
    : ['Name,Original,Discount,Fee,Final'];
  
  const rows = results.people.map(person => 
    `${person.name},${formatCurrency(person.originalAmount)},${formatCurrency(person.discountAmount)},${formatCurrency(person.feeAmount)},${formatCurrency(person.finalAmount)}`
  );

  const summary = [
    '',
    'Overall Summary',
    `Total Original,${formatCurrency(results.totalOriginal)}`,
    `Total Discount,${formatCurrency(results.totalDiscount)}`,
    `Total Fee,${formatCurrency(results.totalFee)}`,
    `Grand Total,${formatCurrency(results.grandTotal)}`
  ];

  const csvContent = [...headers, ...rows, ...summary].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'bill-split-summary.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};