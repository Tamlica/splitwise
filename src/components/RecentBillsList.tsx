import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrderWithItems } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getRecentOrders } from '../utils/lunchBotOperations';
import { Receipt, Calendar, MapPin, Users, Loader2, Search, Filter, X } from 'lucide-react';

const RecentBillsList = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'partial'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getRecentOrders();
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        setError('Failed to load recent orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_items.some((item) =>
            item.members?.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => {
        const settledCount = order.order_items.filter((item) => item.settled).length;
        const totalPeople = order.order_items.length;

        switch (statusFilter) {
          case 'completed':
            return settledCount === totalPeople && totalPeople > 0;
          case 'pending':
            return settledCount === 0;
          case 'partial':
            return settledCount > 0 && settledCount < totalPeople;
          default:
            return true;
        }
      });
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((order) => {
        const orderCreatedAt = new Date(order.created_at);

        switch (dateFilter) {
          case 'today':
            return orderCreatedAt >= today;
          case 'week': {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderCreatedAt >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderCreatedAt >= monthAgo;
          }
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <span className="ml-2 text-gray-600">Loading recent orders...</span>
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Recent Orders</h1>
            <p className="text-gray-600">View saved lunch orders and settlement status</p>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations or people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="partial">Partially Settled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

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

              <div>
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
            {searchTerm.trim() && (
              <span className="ml-2">
                matching "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No orders saved yet</h3>
          <p className="text-gray-600 mb-6">Start splitting bills and save them to see them here</p>
          <Link
            to="/"
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors"
          >
            Create New Order
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No orders match your filters</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search (locations or people) or filter criteria</p>
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Location</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Paid By</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">People</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-700">Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Date</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const total = order.order_items.reduce((sum, item) => sum + item.final_amount, 0);
                  const settledCount = order.order_items.filter((item) => item.settled).length;
                  const totalPeople = order.order_items.length;
                  const allSettled = settledCount === totalPeople && totalPeople > 0;

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          to={`/orders/${order.id}`}
                          className="block hover:text-teal-600 transition-colors"
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="font-medium">{order.location || 'Unnamed Order'}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{order.payer?.name ?? 'Unknown'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {totalPeople}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium">{formatCurrency(total)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            allSettled
                              ? 'bg-green-100 text-green-800'
                              : settledCount > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {allSettled ? 'Completed' : `${settledCount}/${totalPeople} settled`}
                        </span>
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
