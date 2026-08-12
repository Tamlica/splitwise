import { RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { History, Users } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

const Header = ({ onReset }: HeaderProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-teal-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex justify-between items-center">
          <div>
            <Link to="/" className="text-2xl font-bold hover:text-teal-100 transition-colors">
              SplitWise
            </Link>
            <p className="text-teal-100">Split bills easily with friends</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/history"
              className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>
            <Link
              to="/members"
              className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              <Users className="h-4 w-4" />
              <span>Members</span>
            </Link>
            {isHomePage && (
              <button
                onClick={onReset}
                className="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;