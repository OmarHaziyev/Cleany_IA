import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SessionExpiredNotification = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-2xl transform transition-all relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Session Expired
            </h2>
            <div className="mt-4 text-gray-600">
              <p className="text-base mb-2">
                Your session has expired due to inactivity.
              </p>
              <p className="text-base mb-4">
                Please log in again to continue using all features and to ensure your data remains secure.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Log In Again
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredNotification;