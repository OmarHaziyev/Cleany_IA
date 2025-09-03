import React, { useState, useEffect } from 'react';
import { Star, DollarSign, Clock } from 'lucide-react';
import { api, Loading, useAuth } from '../App';

const CleReqPage = ({ onHireCleaner }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Use user._id directly, which should work for both client and cleaner
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
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
    return (durationHours * hourlyPrice).toFixed(2);
  };

  // Function to get request type tag
  const getRequestTypeTag = (request) => {
    if (request.requestType === 'general' && request.status === 'pending') {
      return 'applied';
    }
    return request.status;
  };

  if (!user) {
    return <div>No user data available</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Requests</h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-gray-500">No requests found</div>
          ) : (
            requests.map(request => (
              <div key={request._id} className="bg-white p-4 rounded border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{request.service}</h3>
                    <p className="text-sm text-gray-600">Client: {request.client?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.date).toLocaleDateString()} from {request.startTime} to {request.endTime}
                    </p>
                    
                    {/* Show note only if request is accepted or if it's an applied offer */}
                    {(request.status === 'accepted' || getRequestTypeTag(request) === 'applied') && request.note && (
                      <p className="text-sm mt-2 bg-blue-50 p-2 rounded">
                        <strong>Note:</strong> {request.note}
                      </p>
                    )}
                    
                    {/* Show that note exists but is hidden for pending specific requests */}
                    {request.status === 'pending' && request.requestType === 'specific' && request.note && (
                      <p className="text-sm mt-2 text-gray-500 italic">
                        📝 Note available after accepting
                      </p>
                    )}
                  </div>
                  
                  {/* Right side with status and calculator */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                      getRequestTypeTag(request) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      getRequestTypeTag(request) === 'accepted' ? 'bg-green-100 text-green-800' :
                      getRequestTypeTag(request) === 'applied' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getRequestTypeTag(request)}
                    </span>
                    
                    {/* Earnings Calculator */}
                    <div className="bg-green-50 p-2 rounded text-right">
                      <p className="text-xs text-gray-600">You'll earn:</p>
                      <p className="text-lg font-bold text-green-600">
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

export default CliReqPage;