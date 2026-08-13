import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrderWithItems } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getOrderById } from '../utils/lunchBotOperations';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Share2,
  CheckCircle2,
  Circle,
  Loader2,
  Check,
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboardUtils';

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError('Failed to load order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleShareOrder = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order from ${order?.location || 'Restaurant'}`,
          text: `Check out this split order from ${order?.location || 'our meal'}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // fall through to clipboard copy
      }
    }

    await copyToClipboard(order?.location ?? '', shareUrl);
    setShareUrlCopied(true);
    setTimeout(() => setShareUrlCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading order details...</span>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Order not found'}</p>
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

  const items = order.order_items;
  const total = items.reduce((sum, item) => sum + item.final_amount, 0);
  const settledCount = items.filter((item) => item.settled).length;
  const totalPeople = items.length;
  const allSettled = settledCount === totalPeople && totalPeople > 0;

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
            onClick={handleShareOrder}
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
                {order.location || 'Unnamed Order'}
              </h1>
              <div className="flex items-center text-gray-600 mt-2">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(order.order_date)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Paid by <span className="font-medium">{order.payer?.name ?? 'Unknown'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-700">{formatCurrency(total)}</div>
              <div className="flex items-center text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {totalPeople} people
              </div>
            </div>
          </div>

          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              allSettled
                ? 'bg-green-100 text-green-800'
                : settledCount > 0
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {allSettled ? 'All settled up' : `${settledCount} of ${totalPeople} settled`}
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-teal-600" />
          People &amp; Settlement Status
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Settlement is tracked via the Telegram group (tap the paid button, or use{' '}
          <code className="bg-gray-100 px-1 rounded">/paid</code>) — it can't be changed from here.
        </p>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors ${
                item.settled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-800">{item.members?.name ?? 'Unknown'}</h3>
                    {item.settled && <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />}
                  </div>
                  {item.food && <div className="mt-1 text-xs text-gray-600">{item.food}</div>}
                </div>

                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-800">
                    {formatCurrency(item.final_amount)}
                  </div>
                  <div
                    className={`mt-2 inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                      item.settled ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.settled ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-1" />
                        Unpaid
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default OrderDetails;
