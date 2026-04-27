import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SavedBill } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getRecentBills, deleteBill } from '../utils/supabaseOperations';
import { Receipt, Calendar, MapPin, Users, Loader2, Trash2, Search, Filter, X } from 'lucide-react';

const RecentBillsList = () => {
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<SavedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'partial'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await getRecentBills();
        setBills(data);
        setFilteredBills(data);
      } catch (err) {
        setError('Failed to load recent bills');
        console.error('Error fetching bills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    let filtered = [...bills];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(bill =>
        bill.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => {
        const paidCount = bill.bill_people.filter(person => person.is_paid).length;
        const totalPeople = bill.bill_people.length;
        
        switch (statusFilter) {
          case 'completed':
            return paidCount === totalPeople && totalPeople > 0;
          case 'pending':
            return paidCount === 0;
          case 'partial':
            return paidCount > 0 && paidCount < totalPeople;
          default:
            return true;
        }
      });
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.created_at);
        
        switch (dateFilter) {
          case 'today':
            return billDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return billDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return billDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredBills(filtered);
  }, [bills, searchTerm, statusFilter, dateFilter]);
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'all' || dateFilter !== 'all';
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Recent Bills</h1>
            <p className="text-gray-600">View and manage your saved split bills</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[searchTerm.trim() && 'search', statusFilter !== 'all' && 'status', dateFilter !== 'all' && 'date']
                  .filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`transition-all duration-200 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants or people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="partial">Partially Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-red-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredBills.length} of {bills.length} bills
            {searchTerm.trim() && (
              <span className="ml-2">
                matching "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
          </div>
        )}
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
      ) : filteredBills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No bills match your filters</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search (restaurants or people) or filter criteria</p>
          <button
            onClick={clearFilters}
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors"
          >
            Clear Filters
          </button>
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
                  <th className="text-center py-4 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
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