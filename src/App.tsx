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

  const handleReset = () => {
    setPeople([]);
    setDiscounts([]);
    setFees([]);
    setIsEqualSplit(false);
  };

  const results = calculateFinalAmounts(people, discounts, fees, isEqualSplit);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onReset={handleReset} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <PeopleSection 
              people={people} 
              setPeople={setPeople}
              isEqualSplit={isEqualSplit}
              setIsEqualSplit={setIsEqualSplit}
            />
            <DiscountsSection discounts={discounts} setDiscounts={setDiscounts} />
            <FeesSection fees={fees} setFees={setFees} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Summary people={people} results={results} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;