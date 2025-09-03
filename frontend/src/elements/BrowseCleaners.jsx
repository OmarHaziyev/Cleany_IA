import React, { useState, useEffect } from 'react';
import { Star, DollarSign, Clock } from 'lucide-react';
import { api, Loading } from '../App';

const BrowseCleaners = ({ onHireCleaner }) => {
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
      setError('');
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const getAvailableDays = (schedule) => {
    if (!schedule) return 'Schedule not available';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const availableDays = days.filter(day => schedule[day]?.available);
    
    if (availableDays.length === 0) return 'No available days';
    if (availableDays.length === 7) return 'Available 7 days a week';
    
    return availableDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  const getTimeRange = (schedule) => {
    if (!schedule) return '';
    
    const availableDays = Object.values(schedule).filter(day => day.available);
    if (availableDays.length === 0) return '';
    
    // Get the most common time range
    const firstAvailable = availableDays[0];
    return `${firstAvailable.startTime} - ${firstAvailable.endTime}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Browse Cleaners</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cleaners.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              No cleaners available
            </div>
          ) : (
            cleaners.map(cleaner => (
              <div key={cleaner._id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{cleaner.name}</h3>
                  <p className="text-gray-600">{cleaner.gender}, {cleaner.age} years old</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-500" />
                    <span className="text-lg font-bold text-green-600">${cleaner.hourlyPrice}/hour</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <span>{cleaner.stars || 0} stars</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-blue-500 mt-1" />
                    <div className="text-sm">
                      <div>{getAvailableDays(cleaner.schedule)}</div>
                      {getTimeRange(cleaner.schedule) && (
                        <div className="text-gray-600">{getTimeRange(cleaner.schedule)}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Services:</h4>
                  <div className="flex flex-wrap gap-1">
                    {cleaner.service.map((service, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {cleaner.comments && cleaner.comments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Recent Reviews:</h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {cleaner.comments.slice(0, 2).map((comment, index) => (
                        <p key={index} className="mb-1">"{comment}"</p>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onHireCleaner(cleaner._id)}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Hire This Cleaner
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseCleaners;