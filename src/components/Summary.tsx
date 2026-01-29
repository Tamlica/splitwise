import { useState, useRef } from 'react';
import { Person, SummaryResult, Discount, Fee } from '../types';
import { formatCurrency, roundUpToThousand } from '../utils/formatters';
import { Receipt, FileDown, FileSpreadsheet, Save, CheckCircle } from 'lucide-react';
import { exportToPDF } from '../utils/exportToPDF';
import { exportToCSV } from '../utils/exportToCSV';
import { saveBill } from '../utils/supabaseOperations';
import { copyToClipboard, copyRichBillSummaryToClipboard } from '../utils/clipboardUtils';

interface SummaryProps {
  people: Person[];
  results: SummaryResult;
  restaurantName: string;
  discounts: Discount[];
  fees: Fee[];
  isEqualSplit: boolean;
  totalAmount: string;
}

const Summary = ({ people, results, restaurantName, discounts, fees, isEqualSplit, totalAmount }: SummaryProps) => {
  const summaryTableRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSaveBill = async () => {
    if (people.length === 0) {
      setSaveError('Cannot save empty bill');
      return;
    }
  
    if (!summaryTableRef.current) {
      console.error('Summary ref not mounted');
      return;
    }
  
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
  
    try {
      const billId = await saveBill(people, discounts, fees, results, restaurantName);
  
      // await copyRichBillSummaryToClipboard(
      //   billId,
      //   restaurantName,
      //   summaryTableRef.current
      // );
      const shareUrl = `${window.location.origin}/bill/${billId}`;
      await copyToClipboard(restaurantName, shareUrl);
  
      setSaveSuccess(true);
    } catch (error) {
      setSaveError('Failed to save bill. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div ref={summaryTableRef} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
          {restaurantName && (
            <p className="text-sm text-teal-600 mt-1">📍 {restaurantName}</p>
          )}
        </div>
        {people.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleSaveBill}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded flex items-center gap-1 text-sm transition-colors duration-200 ${
                saveSuccess || linkCopied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
              }`}
            >
              {saveSuccess || linkCopied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {linkCopied ? 'Link Copied!' : 'Saved!'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      {people.length > 0 ? (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Foods</th>
                  <th className="text-right py-3 px-2">Original</th>
                  <th className="text-right py-3 px-2">Final</th>
                </tr>
              </thead>
              <tbody>
                {results.people.map((person) => {
                  const originalPerson = people.find(p => p.id === person.id);
                  return (
                  <tr key={person.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">{person.name}</td>
                      <td className="py-3 px-2">
                        {originalPerson?.foods && originalPerson.foods.length > 0 ? (
                          <div className="space-y-1">
                            {originalPerson.foods.map((food, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {food.name} - {formatCurrency(food.price)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No items</span>
                        )}
                      </td>
                    <td className="text-right py-3 px-2 text-gray-600">
                      {formatCurrency(person.originalAmount)}
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      {formatCurrency(person.finalAmount)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-teal-600" />
              Overall Summary {results.isEqualSplit && <span className="ml-2 text-blue-600 text-sm">(Equal Split)</span>}
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Original:</span>
                <span className="font-medium">{formatCurrency(results.totalOriginal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">Total Discount:</span>
                <span className="font-medium text-purple-600">
                  -{formatCurrency(results.totalDiscount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Total Fee:</span>
                <span className="font-medium text-orange-600">
                  +{formatCurrency(results.totalFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calculated Total:</span>
                <span className="font-medium">{formatCurrency(results.grandTotal)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Final Total (Rounded):</span>
                  <span className="font-bold text-teal-700">{formatCurrency(roundUpToThousand(results.grandTotal))}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-16 flex flex-col items-center">
          <Receipt className="h-12 w-12 mb-3 text-gray-300" />
          <p>Add people to see the summary</p>
        </div>
      )}
    </div>
  );
};

export default Summary;