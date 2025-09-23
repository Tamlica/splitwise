import { useState } from 'react';
import { Fee } from '../types';
import { Receipt, Trash2, Percent } from 'lucide-react';

interface FeesSectionProps {
  fees: Fee[];
  setFees: React.Dispatch<React.SetStateAction<Fee[]>>;
}

const FeesSection = ({ fees, setFees }: FeesSectionProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isPercentage, setIsPercentage] = useState(false);
  const [error, setError] = useState('');

  const handleAddFee = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isPercentage && (numAmount <= 0 || numAmount > 100)) {
      setError('Percentage must be between 0 and 100');
      return;
    }

    const newFee: Fee = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: numAmount,
      isPercentage,
    };

    setFees([...fees, newFee]);
    setName('');
    setAmount('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleRemoveFee = (id: string) => {
    setFees(fees.filter((fee) => fee.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Fees</h2>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-2">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddFee)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddFee)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={() => setIsPercentage(!isPercentage)}
              className={`w-full py-2 px-3 rounded-md flex items-center justify-center border ${
                isPercentage 
                  ? 'bg-orange-100 border-orange-300 text-orange-800' 
                  : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              <Percent className="h-6 w-4" />
            </button>
          </div>
          <div className="sm:col-span-3">
            <button
              onClick={handleAddFee}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors duration-200"
            >
              <Receipt className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {fees.length > 0 ? (
        <div className="space-y-3">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="flex justify-between items-center p-3 bg-orange-50 rounded-md"
            >
              <div className="flex-1">
                <div className="font-medium">{fee.name}</div>
                <div className="text-gray-600 text-sm">
                  {fee.isPercentage
                    ? `${fee.amount}%`
                    : `IDR ${fee.amount.toLocaleString('id-ID')}`}
                </div>
              </div>
              <button
                onClick={() => handleRemoveFee(fee.id)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No fees added yet
        </div>
      )}
    </div>
  );
};

export default FeesSection;