import { useState } from 'react';
import Header from './components/Header';
import PeopleSection from './components/PeopleSection';
import DiscountsSection from './components/DiscountsSection';
import FeesSection from './components/FeesSection';
import Summary from './components/Summary';
import { Person, Discount, Fee } from './types';
import { calculateFinalAmounts } from './utils/calculations';

function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [isEqualSplit, setIsEqualSplit] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  const handleReset = () => {
    setPeople([]);
    setDiscounts([]);
    setFees([]);
    setIsEqualSplit(false);
    setTotalAmount('');
    setRestaurantName('');
  };

  const results = calculateFinalAmounts(people, discounts, fees, isEqualSplit, totalAmount);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onReset={handleReset} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant / Place Name
            </label>
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
            />
            <DiscountsSection discounts={discounts} setDiscounts={setDiscounts} />
            <FeesSection fees={fees} setFees={setFees} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Summary people={people} results={results} restaurantName={restaurantName} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;