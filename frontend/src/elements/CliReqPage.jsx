import React, { useState, useEffect } from 'react';
import { Star, DollarSign } from 'lucide-react';
import { api, Loading } from '../App';

const CliReqPage = ({ onHireCleaner }) => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCleaners();
      setCleaners(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleHireCleaner = (cleanerId) => {
    onHireCleaner(cleanerId);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Available Cleaners</h2>
      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cleaners.map(cleaner => (
            <div key={cleaner._id} className="bg-white p-4 rounded border">
              <h3 className="font-semibold">{cleaner.name}</h3>
              <p className="text-sm text-gray-600 mb-2">@{cleaner.username}</p>
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-yellow-400" />
                <span className="text-sm">{cleaner.stars.toFixed(1)} stars</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} />
                <span className="text-sm">${cleaner.hourlyPrice}/hour</span>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium">Services:</p>
                <p className="text-sm text-gray-600">{cleaner.service.join(', ')}</p>
              </div>
              <button
                onClick={() => handleHireCleaner(cleaner._id)}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Hire Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CliReqPage;