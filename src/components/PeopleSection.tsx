import { useState } from 'react';
import { Person, FoodItem } from '../types';
import { UserPlus, Trash2, Users, Plus, X } from 'lucide-react';

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
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [error, setError] = useState('');

  const handleAddPerson = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    

    const newPerson: Person = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: 0,
      foods: [],
    };

    setPeople([...people, newPerson]);
    setName('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleAddFood = (personId: string) => {
    if (!foodName.trim() || !foodPrice.trim()) return;
    
    const price = parseFloat(foodPrice);
    if (isNaN(price) || price <= 0) return;
    
    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: foodName.trim(),
      price: price
    };
    
    const updatedPeople = people.map(person => 
      person.id === personId 
        ? { ...person, foods: [...person.foods, newFood] }
        : person
    );
    setPeople(updatedPeople);
    setFoodName('');
    setFoodPrice('');
  };

  const handleRemoveFood = (personId: string, foodIndex: number) => {
    const updatedPeople = people.map(person => 
      person.id === personId 
        ? { ...person, foods: person.foods.filter((_, index) => index !== foodIndex) }
        : person
    );
    setPeople(updatedPeople);
  };

  const handleEqualSplitToggle = () => {
    const newIsEqualSplit = !isEqualSplit;
    setIsEqualSplit(newIsEqualSplit);
    
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
          <div className="sm:col-span-9">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddPerson)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="sm:col-span-3">
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
              className="p-4 bg-gray-50 rounded-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-gray-500 text-sm">
                    IDR {(person.foods.reduce((sum, food) => sum + food.price, 0)).toLocaleString('id-ID')}
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
              
              {/* Foods section */}
              <div className="space-y-2">
                {person.foods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {person.foods.map((food, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full"
                      >
                        {food.name} - IDR {food.price.toLocaleString('id-ID')}
                        <button
                          onClick={() => handleRemoveFood(person.id, index)}
                          className="ml-1 text-teal-600 hover:text-teal-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Food name"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, () => handleAddFood(person.id))}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="number"
                      placeholder="Price (IDR)"
                      value={foodPrice}
                      onChange={(e) => setFoodPrice(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, () => handleAddFood(person.id))}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      onClick={() => handleAddFood(person.id)}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white px-2 py-1.5 rounded-md text-sm flex items-center justify-center"
                    >
                      <Plus className="h-6 w-3" />
                    </button>
                  </div>
                </div>
              </div>
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