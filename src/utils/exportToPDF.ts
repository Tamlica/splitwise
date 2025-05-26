import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SummaryResult } from '../types';
import { formatCurrency } from './formatters';

export const exportToPDF = (results: SummaryResult) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Bill Split Summary', 14, 20);

  // Add people table
  const peopleTableData = results.people.map(person => [
    person.name,
    import { formatCurrency } from './formatters';(person.originalAmount),
    formatCurrency(person.discountAmount),
    formatCurrency(person.feeAmount),
    formatCurrency(person.finalAmount)
  ]);

  autoTable(doc, {
    head: [['Name', 'Original', 'Discount', 'Fee', 'Final']],
    body: peopleTableData,
    startY: 30,
  });

  // Add overall summary
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(14);
  doc.text('Overall Summary', 14, finalY);

  const summaryData = [
    ['Total Original:', formatCurrency(results.totalOriginal)],
    ['Total Discount:', formatCurrency(results.totalDiscount)],
    ['Total Fee:', formatCurrency(results.totalFee)],
    ['Grand Total:', formatCurrency(results.grandTotal)]
  ];

  autoTable(doc, {
    body: summaryData,
    startY: finalY + 5,
    theme: 'plain',
    styles: {
      fontSize: 12
    }
  });

  // Save the PDF
  doc.save('bill-split-summary.pdf');
};