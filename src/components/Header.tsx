import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

const Header = ({ onReset }: HeaderProps) => {
  return (
    <header className="bg-teal-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">SplitWise</h1>
            <p className="text-teal-100">Split bills easily with friends</p>
          </div>
          <button
            onClick={onReset}
            className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;