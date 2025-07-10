import { useState } from 'react';
import { Person } from '../types';
import { UserPlus, Trash2, Users } from 'lucide-react';

interface PeopleSectionProps {
  people: Person[];
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  isEqualSplit: boolean;
  setIsEqualSplit: React.Dispatch<React.SetStateAction<boolean>>;
  totalAmount: string;
  setTotalAmount: React.Dispatch<React.SetStateAction<string>>;
}

const PeopleSection = ({ people, setPeople, isEqualSplit, setIsEqualSplit, totalAmount, setTotalAmount }: PeopleSectionProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAddPerson = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    let numAmount = 0;
    
    if (!isEqualSplit) {
      numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
    }

    const newPerson: Person = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: numAmount,
    };

    setPeople([...people, newPerson]);
    setName('');
    setAmount('');
    setError('');
  };

  const handleEqualSplitToggle = () => {
    const newIsEqualSplit = !isEqualSplit;
    setIsEqualSplit(newIsEqualSplit);
    
    if (!newIsEqualSplit) {
      // When switching off equal split, reset individual amounts to 0
      const updatedPeople = people.map(person => ({
        ...person,
        amount: 0
      }));
      setPeople(updatedPeople);
    }
    setError('');
  };

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value);
  };

  const handleRemovePerson = (id: string) => {
    const updatedPeople = people.filter((person) => person.id !== id);
    setPeople(updatedPeople);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">People</h2>
      
      <div className="mb-4">
        <button
          onClick={handleEqualSplitToggle}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center space-x-2 border transition-colors duration-200 ${
            isEqualSplit 
              ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200' 
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{isEqualSplit ? 'Equal Split Mode (ON)' : 'Equal Split Mode (OFF)'}</span>
        </button>
      </div>

      {isEqualSplit && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Total Amount to Split
          </label>
          <input
            type="number"
            placeholder="Enter total amount (IDR)"
            value={totalAmount}
            onChange={(e) => handleTotalAmountChange(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {people.length > 0 && totalAmount && (
            <p className="text-sm text-blue-600 mt-1">
              Each person pays: IDR {(parseFloat(totalAmount) / people.length).toLocaleString('id-ID')}
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-2">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {!isEqualSplit && (
            <div className="sm:col-span-4">
              <input
                type="number"
                placeholder="Amount (IDR)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
          <div className={isEqualSplit ? "sm:col-span-7" : "sm:col-span-3"}>
            <button
              onClick={handleAddPerson}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {people.length > 0 ? (
        <div className="space-y-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
            >
              <div className="flex-1">
                <div className="font-medium">{person.name}</div>
                <div className="text-gray-500 text-sm">
                  IDR {person.amount.toLocaleString('id-ID')}
                  {isEqualSplit && (
                    <span className="ml-2 text-blue-600 text-xs">(Equal Share)</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemovePerson(person.id)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No people added yet
        </div>
      )}
    </div>
  );
};

export default PeopleSection;