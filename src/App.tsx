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

  const handleReset = () => {
    setPeople([]);
    setDiscounts([]);
    setFees([]);
  };

  const results = calculateFinalAmounts(people, discounts, fees);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onReset={handleReset} />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PeopleSection people={people} setPeople={setPeople} />
            <DiscountsSection discounts={discounts} setDiscounts={setDiscounts} />
            <FeesSection fees={fees} setFees={setFees} />
          </div>
          <div>
            <Summary people={people} results={results} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;