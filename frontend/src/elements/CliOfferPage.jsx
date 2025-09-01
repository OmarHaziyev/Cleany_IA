import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { api, Loading } from '../App';

const CliOfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingOffers();
      setOffers(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const selectCleanerForOffer = async (requestId, applicationId) => {
    try {
      await api.selectCleanerForOffer(requestId, applicationId);
      fetchOffers();
      alert('Cleaner selected successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Offers</h2>
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {offers.map(offer => (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default CliOfferPage;