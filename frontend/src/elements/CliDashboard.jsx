import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import CliHeader from './CliHeader';
import CliOfferPage from './CliOfferPage';
import CliReqPage from './CliReqPage';
import CreateRequestModal from './CreateRequestModal';
import CreateOfferModal from './CreateOfferModal';
import { api, Toast } from '../App';

const CliDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-gray-100">
      <CliHeader />

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded ${activeTab === 'browse' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Browse Cleaners
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded ${activeTab === 'offers' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            My Offers
          </button>
          <button
            onClick={() => setShowCreateOffer(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Plus size={16} className="inline mr-1" />
            Create Offer
          </button>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError('')} />}

        {activeTab === 'browse' && (
          <CliReqPage onHireCleaner={setShowCreateRequest} />
        )}

        {activeTab === 'offers' && (
          <CliOfferPage />
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateRequest && (
        <CreateRequestModal
          cleanerId={showCreateRequest}
          onClose={() => setShowCreateRequest(false)}
          onSuccess={() => {
            setShowCreateRequest(false);
            alert('Request sent successfully!');
          }}
        />
      )}

      {/* Create Offer Modal */}
      {showCreateOffer && (
        <CreateOfferModal
          onClose={() => setShowCreateOffer(false)}
          onSuccess={() => {
            setShowCreateOffer(false);
            alert('Offer created successfully!');
          }}
        />
      )}
    </div>
  );
};

export default CliDashboard;