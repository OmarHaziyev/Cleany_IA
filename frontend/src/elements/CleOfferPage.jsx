import React, { useState, useEffect } from 'react';
import { api, Loading } from '../App';

const CleOfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getGeneralRequests();
      setOffers(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleApplyToOffer = async (offerId) => {
    try {
      await api.applyToOffer(offerId);
      fetchOffers();
      alert('Applied to offer successfully!');
    } catch (err) {
      setError(err.message);
      alert(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Available Offers</h2>
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {offers.map(offer => (
            <div key={offer._id} className="bg-white p-4 rounded border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{offer.service}</h3>
                  <p className="text-sm text-gray-600">Client: {offer.client.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(offer.date).toLocaleDateString()} from {offer.startTime} to {offer.endTime}
                  </p>
                  {offer.budget && <p className="text-sm">Budget: ${offer.budget}</p>}
                  {offer.deadline && (
                    <p className="text-sm text-red-600">
                      Deadline: {new Date(offer.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {offer.note && <p className="text-sm mt-2">Note: {offer.note}</p>}
                </div>
              </div>
              <button
                onClick={() => handleApplyToOffer(offer._id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Apply to Offer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CleOfferPage;