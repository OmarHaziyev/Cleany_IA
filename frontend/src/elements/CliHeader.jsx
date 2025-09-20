import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../App';

const CliHeader = ({ onShowProfile }) => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Cleany - Client Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.name}</span>
          <button 
            onClick={onShowProfile}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <User size={16} />
            Profile
          </button>
          <button onClick={logout} className="text-red-500 hover:underline">
            <LogOut size={16} className="inline mr-1" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CliHeader;