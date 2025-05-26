import { SummaryResult } from '../types';

export const exportToCSV = (results: SummaryResult) => {
  // Prepare CSV content
  const headers = ['Name,Original,Discount,Fee,Final'];
  
  const rows = results.people.map(person => 
    `${person.name},${person.originalAmount},${person.discountAmount},${person.feeAmount},${person.finalAmount}`
  );

  const summary = [
    '',
    'Overall Summary',
    `Total Original,${results.totalOriginal}`,
    `Total Discount,${results.totalDiscount}`,
    `Total Fee,${results.totalFee}`,
    `Grand Total,${results.grandTotal}`
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