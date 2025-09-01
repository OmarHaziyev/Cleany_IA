import React, { useState, useEffect } from 'react';
import { api, Loading } from '../App';
import { useAuth } from '../App';

const CleReqPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getRequestsForCleaner(user._id);
      setRequests(data);
    } catch (err) {
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

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Requests</h2>
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request._id} className="bg-white p-4 rounded border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{request.service}</h3>
                  <p className="text-sm text-gray-600">Client: {request.client.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.date).toLocaleDateString()} from {request.startTime} to {request.endTime}
                  </p>
                  {request.note && <p className="text-sm mt-2">Note: {request.note}</p>}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status}
                </span>
              </div>
              
              {request.status === 'pending' && (
                <div className="flex gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default CleReqPage;