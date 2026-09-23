import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PeopleSection from './components/PeopleSection';
import DiscountsSection from './components/DiscountsSection';
import FeesSection from './components/FeesSection';
import Summary from './components/Summary';
import RecentBillsList from './components/RecentBillsList';
import OrderDetails from './components/OrderDetails';
import MembersPage from './components/MembersPage';
import ImportScreenshotModal, { ImportResult } from './components/ImportScreenshotModal';
import { ImagePlus } from 'lucide-react';
import { Person, Discount, Fee, Member } from './types';
import { calculateFinalAmounts } from './utils/calculations';
import { getActiveMembers } from './utils/orderOperations';

function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [isEqualSplit, setIsEqualSplit] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [payerId, setPayerId] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    getActiveMembers()
      .then(setMembers)
      .catch((err) => console.error('Failed to load members:', err));
  }, []);

  const handleReset = () => {
    setPeople([]);
    setDiscounts([]);
    setFees([]);
    setIsEqualSplit(false);
    setTotalAmount('');
    setRestaurantName('');
    setPayerId('');
  };

  const handleImportApply = (imported: ImportResult) => {
    const hasExisting = people.length > 0 || discounts.length > 0 || fees.length > 0;
    if (hasExisting && !window.confirm('Replace the current people, discounts and fees with the imported ones?')) {
      return;
    }
    setPeople(imported.people);
    setDiscounts(imported.discounts);
    setFees(imported.fees);
    setIsEqualSplit(false);
    setShowImport(false);
  };

  const results = calculateFinalAmounts(people, discounts, fees, isEqualSplit, totalAmount);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onReset={handleReset} />
      <Routes>
        <Route path="/" element={
          <main className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Restaurant / Place Name
                  </label>
                  <button
                    onClick={() => setShowImport(true)}
                    className="flex items-center space-x-1 text-sm text-teal-700 hover:text-teal-800"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>Import from screenshot</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter restaurant or place name..."
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
                />
                {restaurantName && (
                  <div className="mt-2 text-center">
                    <h2 className="text-xl font-semibold text-teal-700">
                      📍 {restaurantName}
                    </h2>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <PeopleSection
                  people={people}
                  setPeople={setPeople}
                  isEqualSplit={isEqualSplit}
                  setIsEqualSplit={setIsEqualSplit}
                  totalAmount={totalAmount}
                  setTotalAmount={setTotalAmount}
                  members={members}
                />
                <DiscountsSection discounts={discounts} setDiscounts={setDiscounts} />
                <FeesSection fees={fees} setFees={setFees} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <Summary
                  people={people}
                  results={results}
                  restaurantName={restaurantName}
                  isEqualSplit={isEqualSplit}
                  totalAmount={totalAmount}
                  members={members}
                  payerId={payerId}
                  setPayerId={setPayerId}
                />
              </div>
            </div>
          </main>
        } />
        <Route path="/history" element={<RecentBillsList />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        <Route path="/members" element={<MembersPage />} />
      </Routes>
      {showImport && (
        <ImportScreenshotModal
          members={members}
          onClose={() => setShowImport(false)}
          onApply={handleImportApply}
        />
      )}
    </div>
  );
}

export default App;