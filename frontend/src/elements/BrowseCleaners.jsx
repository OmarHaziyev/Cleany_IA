import React, { useState, useEffect } from 'react';
import { Star, DollarSign, Clock, Eye, MessageSquare, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { api, Loading } from '../App';
import CleanerFilter from './CleanerFilter';

const BrowseCleaners = ({ onHireCleaner, onViewProfile }) => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('rating');
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetchCleaners(1, sortBy);
  }, [sortBy]);

  const fetchCleaners = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.getAllCleaners(page, sortBy);
      setCleaners(response.cleaners);
      setTotalPages(Math.ceil(response.pagination.totalCount / ITEMS_PER_PAGE));
      setError('');
      setIsFiltered(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCleaners(page);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
    fetchCleaners(1, newSortBy);
  };

  // This is a duplicate fetchCleaners function that can be removed since we have the paginated version above

  const handleFilter = async (filters) => {
    setLoading(true);
    try {
      const data = await api.filterCleaners(filters);
      setCleaners(data);
      setError('');
      setIsFiltered(true);
      setCurrentPage(1);
      setTotalPages(1); // Filtered results don't use pagination currently
    } catch (err) {
      console.error('Error filtering cleaners:', err);
      setError(err.message);
      setCleaners([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  const handleClearFilter = () => {
    setCurrentPage(1);
    fetchCleaners(1, sortBy);
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
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Browse Cleaners</h2>
          {isFiltered && (
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
              Showing {cleaners.length} filtered result{cleaners.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-4">
          {/* Filter Component */}
          <div className="flex-grow">
            <CleanerFilter 
              onFilter={handleFilter}
              onClear={handleClearFilter}
              isLoading={loading}
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="rating">Highest Rating</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

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
              <div key={cleaner._id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow cleaner-card">
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
                      ) : cleaner.stars ? (
                        <>
                          <span className="font-medium">{cleaner.stars.toFixed(1)}</span>
                          <span className="text-yellow-400">★</span>
                          <span className="text-gray-500 text-sm">(Initial rating)</span>
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
                {((cleaner.reviews && cleaner.reviews.length > 0) || (cleaner.comments && cleaner.comments.length > 0)) && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-1">
                      <MessageSquare size={14} />
                      Recent Reviews:
                    </h4>
                    <div className="space-y-2">
                      {cleaner.reviews?.slice(0, 2).map((review, idx) => (
                        <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= (review.rating || cleaner.stars) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                            {review.source === 'direct' && (
                              <span className="text-xs text-gray-400 ml-1">(Initial review)</span>
                            )}
                          </div>
                          <p className="italic">"{review.review}"</p>
                        </div>
                      ))}
                      {!cleaner.reviews?.length && cleaner.comments?.slice(0, 2).map((comment, idx) => (
                        <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= cleaner.stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">(Initial review)</span>
                          </div>
                          <p className="italic">"{comment}"</p>
                        </div>
                      ))}
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

      {/* Pagination Controls */}
      {!isFiltered && totalPages > 1 && (
        <div className="flex justify-center mt-8 mb-4 gap-2">
          {/* Previous Page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first page, last page, current page, and pages around current page
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(currentPage - page) <= 2
                );
              })
              .map((page, index, array) => {
                // If there's a gap, show ellipsis
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`gap-${page}`}>
                      <span className="px-4 py-2">...</span>
                      <button
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseCleaners;