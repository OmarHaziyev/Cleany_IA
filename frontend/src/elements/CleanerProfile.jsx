import React, { useState, useEffect } from 'react';
import { 
  Star, 
  DollarSign, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  Calendar,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Award,
  Briefcase
} from 'lucide-react';
import { api, Loading } from '../App';

const CleanerProfile = ({ cleanerId, onBack, onHire }) => {
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (cleanerId) {
      fetchCleanerProfile();
    }
  }, [cleanerId]);

  const fetchCleanerProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getCleanerById(cleanerId);
      setCleaner(data);
      setError('');
    } catch (err) {
      console.error('Error fetching cleaner profile:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const getAvailableDays = (schedule) => {
    if (!schedule) return 'Schedule not available';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const availableDays = days.filter(day => schedule[day]?.available);
    
    if (availableDays.length === 0) return 'No available days';
    if (availableDays.length === 7) return 'Available all week';
    
    return availableDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      ...schedule[day]
    })).filter(dayInfo => dayInfo.available);
  };

  const getRatingDistribution = (reviews) => {
    if (!reviews || reviews.length === 0) return {};
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      if (review.rating) {
        distribution[review.rating]++;
      }
    });
    
    return distribution;
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="p-4">
        <button 
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Browse
        </button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading profile: {error}
        </div>
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="p-4">
        <button 
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Browse
        </button>
        <div className="text-center text-gray-500 py-8">
          Cleaner not found
        </div>
      </div>
    );
  }

  const schedule = formatSchedule(cleaner.schedule);
  const ratingDistribution = getRatingDistribution(cleaner.reviews);
  const reviewsToShow = showAllReviews ? cleaner.reviews : cleaner.reviews.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Browse
        </button>
        <button
          onClick={() => onHire(cleanerId)}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Briefcase size={16} />
          Hire {cleaner.name}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="text-center mb-4">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold">{cleaner.name}</h1>
              <p className="text-gray-600">{cleaner.gender}, {cleaner.age} years old</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-500" />
                <span className="text-sm">{cleaner.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm">{cleaner.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign size={16} className="text-green-500" />
                <span className="text-lg font-bold text-green-600">${cleaner.hourlyPrice}/hour</span>
              </div>
            </div>
          </div>

          {/* Rating Summary */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-yellow-500" />
              Rating Summary
            </h3>
            
            {cleaner.totalReviews > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl font-bold">{cleaner.averageRating.toFixed(1)}</span>
                  <div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={20}
                          className={star <= Math.round(cleaner.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">{cleaner.totalReviews} total reviews</p>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = ratingDistribution[rating] || 0;
                    const percentage = cleaner.totalReviews > 0 ? (count / cleaner.totalReviews) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="w-8">{rating} ★</span>
                        <div className="flex-1 bg-gray-200 rounded h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-gray-600">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-800">
                    <strong>{cleaner.totalCompletedJobs}</strong> jobs completed successfully
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Star size={24} className="text-gray-300 mx-auto mb-2" />
                <p>No reviews yet</p>
                <p className="text-sm">Be the first to hire and review!</p>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {cleaner.service.map((service, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Schedule and Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Availability Schedule
            </h3>
            
            {schedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.map((dayInfo, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <span className="font-medium">{dayInfo.day}</span>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} />
                      <span>{dayInfo.startTime} - {dayInfo.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No availability information
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Schedule Type:</strong> {cleaner.scheduleType || 'Normal'} 
                {cleaner.scheduleType === 'STRICT' && ' - Fixed times only'}
              </p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-500" />
                Customer Reviews ({cleaner.totalReviews})
              </h3>
            </div>

            {cleaner.reviews && cleaner.reviews.length > 0 ? (
              <div className="space-y-4">
                {reviewsToShow.map((review, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.rating}/5</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{review.clientName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleDateString()} • {review.service}
                        </p>
                      </div>
                    </div>
                    
                    {review.review && (
                      <p className="text-gray-700 italic bg-gray-50 p-3 rounded">
                        "{review.review}"
                      </p>
                    )}
                  </div>
                ))}

                {cleaner.reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full py-2 text-blue-500 hover:text-blue-700 font-medium"
                  >
                    {showAllReviews ? 'Show Less' : `Show All ${cleaner.reviews.length} Reviews`}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-lg">No reviews yet</p>
                <p className="text-sm">This cleaner hasn't received any reviews yet.</p>
                <p className="text-sm mt-2">Be the first to hire them and share your experience!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanerProfile;