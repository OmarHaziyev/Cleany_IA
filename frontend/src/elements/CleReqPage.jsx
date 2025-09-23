import React, { useState, useEffect } from 'react';
import { api, Loading } from '../App';
import { useAuth } from '../App';

const CleReqPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, applied, pending, accepted
  const { user } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const cleanerId = user._id;
      const data = await api.getRequestsForCleaner(cleanerId);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await api.updateRequestStatus(requestId, action);
      fetchRequests();
      alert(`Request ${action} successfully!`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Function to calculate earnings
  const calculateEarnings = (startTime, endTime, hourlyPrice) => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
      return (durationHours * hourlyPrice).toFixed(2);
    } catch (err) {
      return '0.00';
    }
  };

  // Function to get request type and status
  const getRequestStatus = (request) => {
    if (request.requestType === 'general' && request.isApplied) {
      return 'applied';
    }
    return request.status;
  };

  // Filter requests based on active filter
  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    return getRequestStatus(request) === activeFilter;
  });

  // Get counts for each filter
  const getCounts = () => {
    return {
      all: requests.length,
      applied: requests.filter(r => getRequestStatus(r) === 'applied').length,
      pending: requests.filter(r => getRequestStatus(r) === 'pending').length,
      accepted: requests.filter(r => getRequestStatus(r) === 'accepted').length
    };
  };

  const counts = getCounts();

  if (!user) {
    return <div>No user data available</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Requests</h2>

      {/* Filter Tags */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeFilter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setActiveFilter('applied')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeFilter === 'applied' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Applied ({counts.applied})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeFilter === 'pending' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setActiveFilter('accepted')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeFilter === 'accepted' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Accepted ({counts.accepted})
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="text-gray-500">No requests found for "{activeFilter}" filter</div>
          ) : (
            filteredRequests.map(request => (
              <div key={request._id} className="bg-white p-4 rounded border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{request.service}</h3>
                    <p className="text-sm text-gray-600">Client: {request.client?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.date).toLocaleDateString()} from {request.startTime} to {request.endTime}
                    </p>
                    
                    {/* Always show the note if it exists */}
                    {request.note && (
                      <p className="text-sm mt-2 bg-blue-50 p-2 rounded">
                        <strong>Note:</strong> {request.note}
                      </p>
                    )}
                  </div>
                  
                  {/* Right side with status and calculator */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                      getRequestStatus(request) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      getRequestStatus(request) === 'accepted' ? 'bg-green-100 text-green-800' :
                      getRequestStatus(request) === 'applied' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getRequestStatus(request)}
                    </span>
                    
                    {/* Earnings Calculator */}
                    <div className="bg-green-50 p-3 rounded text-right min-w-[120px]">
                      <p className="text-xs text-gray-600 mb-1">You'll earn:</p>
                      <p className="text-lg font-bold text-green-600 mb-1">
                        ${calculateEarnings(request.startTime, request.endTime, user.hourlyPrice)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {((new Date(`1970-01-01T${request.endTime}:00`) - new Date(`1970-01-01T${request.startTime}:00`)) / (1000 * 60 * 60)).toFixed(1)}h × ${user.hourlyPrice}/h
                      </p>
                    </div>
                  </div>
                </div>
                
                {request.status === 'pending' && request.requestType === 'specific' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRequestAction(request._id, 'accepted')}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequestAction(request._id, 'declined')}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CleReqPage;