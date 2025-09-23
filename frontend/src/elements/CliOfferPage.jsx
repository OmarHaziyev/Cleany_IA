import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { api, Loading } from '../App';

const CliOfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [offersData, requestsData] = await Promise.all([
        api.getPendingOffers(),
        api.getPendingRequests()
      ]);
      setOffers(offersData || []);
      setPendingRequests(requestsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load offers and requests');
      setOffers([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const selectCleanerForOffer = async (requestId, applicationId) => {
    try {
      await api.selectCleanerForOffer(requestId, applicationId);
      fetchData(); // Fixed: calling fetchData instead of the non-existent fetchOffers
      alert('Cleaner selected successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending Requests Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pending Requests</h2>
        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending requests</p>
            ) : (
              pendingRequests.map(request => (
                <div key={request._id} className="bg-white p-4 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{request.service}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(request.date).toLocaleDateString()} from {request.startTime} to {request.endTime}
                      </p>
                      {request.cleaner && (
                        <p className="text-sm">
                          <span className="font-medium">Cleaner:</span> {request.cleaner.name}
                        </p>
                      )}
                      {request.note && (
                        <p className="text-sm mt-2 bg-blue-50 p-2 rounded">
                          <strong>Note:</strong> {request.note}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded text-xs whitespace-nowrap bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* General Offers Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Offers</h2>
        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {offers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No open offers</p>
            ) : (
              offers.map(offer => (
                <div key={offer._id} className="bg-white p-4 rounded border">
                  <div className="mb-3">
                    <h3 className="font-semibold">{offer.service}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(offer.date).toLocaleDateString()} from {offer.startTime} to {offer.endTime}
                    </p>
                    {offer.budget && <p className="text-sm">Budget: ${offer.budget}</p>}
                    <p className="text-sm">Applications: {offer.applications?.length || 0}</p>
                  </div>
                  
                  {offer.applications && offer.applications.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Applicants:</h4>
                      <div className="space-y-2">
                        {offer.applications.map(app => (
                          <div key={app._id} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{app.cleaner.name}</p>
                                <p className="text-sm text-gray-600">${app.cleaner.hourlyPrice}/hour</p>
                                <div className="flex items-center gap-1">
                                  <Star size={14} className="text-yellow-400" />
                                  <span className="text-sm">{app.cleaner.stars}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Services: {app.cleaner.service.join(', ')}
                                </p>
                              </div>
                              <button
                                onClick={() => selectCleanerForOffer(offer._id, app._id)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
        </div>
      )}
    </div>
    </div>
  );
};

export default CliOfferPage;