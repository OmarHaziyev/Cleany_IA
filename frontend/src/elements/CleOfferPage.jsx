import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { api, Loading, useAuth } from '../App';

const formatDeadline = (deadline) => {
  const date = new Date(deadline);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CleOfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      fetchOffers();
      fetchAppliedOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getGeneralRequests();
      // Filter out expired offers
      const currentDate = new Date();
      const availableOffers = data.filter(offer => {
        // Check if deadline has passed
        if (offer.deadline && new Date(offer.deadline) < currentDate) {
          return false;
        }
        return true;
      });
      setOffers(availableOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchAppliedOffers = async () => {
    try {
      const cleanerId = user._id;
      const data = await api.getRequestsForCleaner(cleanerId);
      // Get IDs of offers that the cleaner has applied to
      const appliedIds = data
        .filter(request => request.requestType === 'general' && request.isApplied)
        .map(request => request._id);
      setAppliedOffers(new Set(appliedIds));
    } catch (err) {
      console.error('Error fetching applied offers:', err);
    }
  };

  const calculateEarnings = (startTime, endTime, budget) => {
    if (!budget) return 'Budget not specified';
    
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
      
      return `$${budget} (${durationHours.toFixed(1)}h job)`;
    } catch (err) {
      return `$${budget}`;
    }
  };

  const calculateHourlyRate = (startTime, endTime, budget) => {
    if (!budget) return 'Rate varies';
    
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
      
      return `$${(budget / durationHours).toFixed(2)}/hour`;
    } catch (err) {
      return 'Rate varies';
    }
  };

  const handleApplyToOffer = async (offerId) => {
    try {
      await api.applyToOffer(offerId);
      // Add to applied offers set and remove from available offers
      setAppliedOffers(prev => new Set(prev).add(offerId));
      setOffers(prev => prev.filter(offer => offer._id !== offerId));
      alert('Applied to offer successfully! Check "My Requests" tab to see your application.');
    } catch (err) {
      setError(err.message);
      alert(err.message);
    }
  };

  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDiff = deadlineDate - now;
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 2 && daysDiff > 0; // Less than 2 days remaining
  };

  // Filter out offers that have been applied to
  const filteredOffers = offers.filter(offer => !appliedOffers.has(offer._id));

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
          {filteredOffers.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <p>No offers available at the moment</p>
              <p className="text-sm mt-2">Offers you've applied to or expired offers are not shown</p>
            </div>
          ) : (
            filteredOffers.map(offer => (
              <div key={offer._id} className="bg-white p-4 rounded border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{offer.service}</h3>
                    <p className="text-sm text-gray-600">Client: {offer.client?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(offer.date).toLocaleDateString()} from {offer.startTime} to {offer.endTime}
                    </p>
                    {offer.deadline && (
                      <p className={`text-sm mt-1 ${isDeadlineSoon(offer.deadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        <Clock size={14} className="inline mr-1" />
                        Apply by: {formatDeadline(offer.deadline)}
                        {isDeadlineSoon(offer.deadline) && ' ⚠️ Soon!'}
                      </p>
                    )}
                    {offer.note && (
                      <p className="text-sm mt-2 bg-blue-50 p-2 rounded">
                        <strong>Note:</strong> {offer.note}
                      </p>
                    )}
                  </div>
                  
                  {/* Earnings Display */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="bg-green-50 p-3 rounded text-right min-w-[140px]">
                      <p className="text-xs text-gray-600 mb-1">Offered budget:</p>
                      <p className="text-lg font-bold text-green-600 mb-1">
                        {calculateEarnings(offer.startTime, offer.endTime, offer.budget)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculateHourlyRate(offer.startTime, offer.endTime, offer.budget)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleApplyToOffer(offer._id)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Apply to This Offer
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