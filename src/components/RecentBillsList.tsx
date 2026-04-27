import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SavedBill } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getRecentBills, deleteBill } from '../utils/supabaseOperations';
import { Receipt, Calendar, MapPin, Users, Loader2, Trash2 } from 'lucide-react';

const RecentBillsList = () => {
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await getRecentBills();
        setBills(data);
      } catch (err) {
        setError('Failed to load recent bills');
        console.error('Error fetching bills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteBill = async (billId: string, restaurantName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmMessage = `Are you sure you want to delete the bill from "${restaurantName || 'Unnamed Restaurant'}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingBillId(billId);
    
    try {
      await deleteBill(billId);
      setBills(prevBills => prevBills.filter(bill => bill.id !== billId));
    } catch (err) {
      console.error('Error deleting bill:', err);
      alert('Failed to delete bill. Please try again.');
    } finally {
      setDeletingBillId(null);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading recent bills...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Recent Bills</h1>
        <p className="text-gray-600">View and manage your saved split bills</p>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No bills saved yet</h3>
          <p className="text-gray-600 mb-6">Start splitting bills and save them to see them here</p>
          <Link
            to="/"
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors"
          >
            Create New Bill
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Restaurant</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">People</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-700">Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Date</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const paidCount = bill.bill_people.filter(person => person.is_paid).length;
                  const totalPeople = bill.bill_people.length;
                  const allPaid = paidCount === totalPeople && totalPeople > 0;
                  
                  return (
                    <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          to={`/bill/${bill.id}`}
                          className="block hover:text-teal-600 transition-colors"
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium">
                                {bill.restaurant_name || 'Unnamed Restaurant'}
                              </div>
                              {bill.is_equal_split && (
                                <div className="text-xs text-blue-600">Equal Split</div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {totalPeople}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        {formatCurrency(bill.grand_total)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(bill.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            allPaid
                              ? 'bg-green-100 text-green-800'
                              : paidCount > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {allPaid ? 'Completed' : `${paidCount}/${totalPeople} paid`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => handleDeleteBill(bill.id, bill.restaurant_name, e)}
                          disabled={deletingBillId === bill.id}
                          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete bill"
                        >
                          {deletingBillId === bill.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default RecentBillsList;