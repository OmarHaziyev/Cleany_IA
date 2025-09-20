import React, { useState, useEffect } from 'react';
import { Star, DollarSign, Clock, Eye, MessageSquare } from 'lucide-react';
import { api, Loading } from '../App';
import CleanerFilter from './CleanerFilter';

const BrowseCleaners = ({ onHireCleaner, onViewProfile }) => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCleaners();
      setCleaners(data);
      setError('');
      setIsFiltered(false);
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleFilter = async (filters) => {
    setLoading(true);
    try {
      const data = await api.filterCleaners(filters);
      setCleaners(data);
      setError('');
      setIsFiltered(true);
    } catch (err) {
      console.error('Error filtering cleaners:', err);
      setError(err.message);
      setCleaners([]);
    }
    setLoading(false);
  };

  const handleClearFilter = () => {
    fetchCleaners();
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Browse Cleaners</h2>
        {isFiltered && (
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
            Showing {cleaners.length} filtered result{cleaners.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filter Component */}
      <CleanerFilter 
        onFilter={handleFilter}
        onClear={handleClearFilter}
        isLoading={loading}
      />

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
              {isFiltered ? (
                <div>
                  <p className="text-lg mb-2">No cleaners match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria or clearing filters</p>
                </div>
              ) : (
                <p>No cleaners available</p>
              )}
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
                    <span className="flex items-center gap-1">
                      {cleaner.averageRating > 0 ? (
                        <>
                          <span className="font-medium">{cleaner.averageRating.toFixed(1)}</span>
                          <span className="text-yellow-400">★</span>
                          <span className="text-gray-500 text-sm">({cleaner.totalReviews} reviews)</span>
                        </>
                      ) : (
                        <span className="text-gray-500">No reviews yet</span>
                      )}
                    </span>
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

                {/* Show sample reviews if available */}
                {cleaner.reviews && cleaner.reviews.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-1">
                      <MessageSquare size={14} />
                      Recent Review:
                    </h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= cleaner.reviews[0].rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <p className="italic">"{cleaner.reviews[0].review || 'Great service!'}"</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewProfile(cleaner._id)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={16} />
                    View Profile
                  </button>
                  <button
                    onClick={() => onHireCleaner(cleaner._id)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Hire Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseCleaners;