import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SavedBill } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getBillById, updatePersonPaidStatus } from '../utils/supabaseOperations';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Receipt, 
  Share2, 
  CheckCircle2, 
  Circle,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { copyToClipboard, copyRichBillSummaryToClipboard } from '../utils/clipboardUtils';

const BillDetails = () => {
  const { billId } = useParams<{ billId: string }>();
  const [bill, setBill] = useState<SavedBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingPerson, setUpdatingPerson] = useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      if (!billId) return;
      
      try {
        const data = await getBillById(billId);
        setBill(data);
      } catch (err) {
        setError('Failed to load bill details');
        console.error('Error fetching bill:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId]);

  const handleTogglePaid = async (personId: string, currentStatus: boolean) => {
    if (!bill) return;
    
    setUpdatingPerson(personId);
    try {
      await updatePersonPaidStatus(personId, !currentStatus);
      
      // Update local state
      setBill({
        ...bill,
        bill_people: bill.bill_people.map(person =>
          person.id === personId
            ? { ...person, is_paid: !currentStatus }
            : person
        ),
      });
    } catch (err) {
      console.error('Error updating paid status:', err);
    } finally {
      setUpdatingPerson(null);
    }
  };

  const handleShareBill = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill from ${bill?.restaurant_name || 'Restaurant'}`,
          text: `Check out this split bill from ${bill?.restaurant_name || 'our meal'}`,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback to copying URL
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading bill details...</span>
        </div>
      </main>
    );
  }

  if (error || !bill) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Bill not found'}</p>
          <Link
            to="/history"
            className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Back to History
          </Link>
        </div>
      </main>
    );
  }

  const paidCount = bill.bill_people.filter(person => person.is_paid).length;
  const totalPeople = bill.bill_people.length;
  const allPaid = paidCount === totalPeople && totalPeople > 0;

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/history"
            className="flex items-center text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Link>
          <button
            onClick={handleShareBill}
            className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
          >
            {shareUrlCopied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <MapPin className="h-6 w-6 text-teal-600 mr-2" />
                {bill.restaurant_name || 'Unnamed Restaurant'}
              </h1>
              <div className="flex items-center text-gray-600 mt-2">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(bill.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-700">
                {formatCurrency(bill.grand_total)}
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {totalPeople} people
                {bill.is_equal_split && (
                  <span className="ml-2 text-blue-600 text-sm">(Equal Split)</span>
                )}
              </div>
            </div>
          </div>

          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            allPaid
              ? 'bg-green-100 text-green-800'
              : paidCount > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {allPaid ? 'All payments completed' : `${paidCount} of ${totalPeople} people have paid`}
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-teal-600" />
          People & Payments
        </h2>

        <div className="space-y-4">
          {bill.bill_people.map((person) => (
            <div
              key={person.id}
              className={`p-4 rounded-lg border transition-colors ${
                person.is_paid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-800">{person.name}</h3>
                    {person.is_paid && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />
                    )}
                  </div>
                  
                  {/* Food Items */}
                  {person.bill_food_items && person.bill_food_items.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {person.bill_food_items.map((food, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full"
                          >
                            {food.name} - {formatCurrency(food.price)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-sm text-gray-600">
                    <div>Original: {formatCurrency(person.original_amount)}</div>
                    {person.discount_amount > 0 && (
                      <div className="text-purple-600">
                        Discount: -{formatCurrency(person.discount_amount)}
                      </div>
                    )}
                    {person.fee_amount > 0 && (
                      <div className="text-orange-600">
                        Fee: +{formatCurrency(person.fee_amount)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-800">
                    {formatCurrency(person.final_amount)}
                  </div>
                  <button
                    onClick={() => handleTogglePaid(person.id, person.is_paid)}
                    disabled={updatingPerson === person.id}
                    className={`mt-2 flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      person.is_paid
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    {updatingPerson === person.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : person.is_paid ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-1" />
                        Mark Paid
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Receipt className="h-5 w-5 mr-2 text-teal-600" />
          Bill Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discounts */}
          {bill.bill_discounts && bill.bill_discounts.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Discounts Applied</h3>
              <div className="space-y-2">
                {bill.bill_discounts.map((discount) => (
                  <div key={discount.id} className="flex justify-between text-sm">
                    <span>{discount.name}</span>
                    <span className="text-purple-600">
                      -{discount.is_percentage 
                        ? `${discount.amount}%` 
                        : formatCurrency(discount.amount)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fees */}
          {bill.bill_fees && bill.bill_fees.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Fees Applied</h3>
              <div className="space-y-2">
                {bill.bill_fees.map((fee) => (
                  <div key={fee.id} className="flex justify-between text-sm">
                    <span>{fee.name}</span>
                    <span className="text-orange-600">
                      +{fee.is_percentage 
                        ? `${fee.amount}%` 
                        : formatCurrency(fee.amount)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 mt-6 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Original:</span>
              <span className="font-medium">{formatCurrency(bill.total_original)}</span>
            </div>
            {bill.total_discount > 0 && (
              <div className="flex justify-between">
                <span className="text-purple-600">Total Discount:</span>
                <span className="font-medium text-purple-600">
                  -{formatCurrency(bill.total_discount)}
                </span>
              </div>
            )}
            {bill.total_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-orange-600">Total Fee:</span>
                <span className="font-medium text-orange-600">
                  +{formatCurrency(bill.total_fee)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-lg">
                <span className="font-bold">Grand Total:</span>
                <span className="font-bold text-teal-700">
                  {formatCurrency(bill.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BillDetails;