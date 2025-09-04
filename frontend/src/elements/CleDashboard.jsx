import React, { useState } from 'react';
import CleHeader from './CleHeader';
import CleOfferPage from './CleOfferPage';
import CleReqPage from './CleReqPage';
import ClePastJobsPage from './ClePastJobsPage';
import { Toast } from '../App';

const CleDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [error, setError] = useState('');

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <CleHeader />

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded ${activeTab === 'requests' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded ${activeTab === 'offers' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Available Offers
          </button>
          <button
            onClick={() => setActiveTab('pastjobs')}
            className={`px-4 py-2 rounded ${activeTab === 'pastjobs' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Past Jobs
          </button>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError('')} />}

        <div>
          {activeTab === 'requests' && <CleReqPage onError={handleError} />}
          {activeTab === 'offers' && <CleOfferPage onError={handleError} />}
          {activeTab === 'pastjobs' && <ClePastJobsPage onError={handleError} />}
        </div>
      </div>
    </div>
  );
};

export default CleDashboard;