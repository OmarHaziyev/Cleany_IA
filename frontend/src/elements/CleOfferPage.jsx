import React, { useState, useEffect } from 'react';
import { api, Loading, useAuth } from '../App';

const CleOfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getGeneralRequests();
      setOffers(data);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleApplyToOffer = async (offerId) => {
    try {
      await api.applyToOffer(offerId);
      // Remove the applied offer from the list immediately
      setOffers(prev => prev.filter(offer => offer._id !== offerId));
      alert('Applied to offer successfully! Check "My Requests" tab to see your application.');
    } catch (err) {
      setError(err.message);
      alert(err.message);
    }
  };

  if (!user) {
    return <div>No user data available</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Available Offers</h2>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="text-gray-500">No offers available</div>
          ) : (
            offers.map(offer => (
              <div key={offer._id} className="bg-white p-4 rounded border">
                <div className="mb-3">
                  <h3 className="font-semibold">{offer.service}</h3>
                  <p className="text-sm text-gray-600">Client: {offer.client?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(offer.date).toLocaleDateString()} from {offer.startTime} to {offer.endTime}
                  </p>
                  {offer.budget && <p className="text-sm">Budget: ${offer.budget}</p>}
                  {offer.deadline && (
                    <p className="text-sm text-red-600">
                      Deadline: {new Date(offer.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {offer.note && (
                    <p className="text-sm mt-2 bg-blue-50 p-2 rounded">
                      <strong>Note:</strong> {offer.note}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleApplyToOffer(offer._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Apply to Offer
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CleOfferPage;