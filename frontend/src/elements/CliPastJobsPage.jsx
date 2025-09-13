import React, { useState, useEffect } from 'react';
import { Star, DollarSign, Clock, MapPin, Calendar } from 'lucide-react';
import { api, Loading, useAuth } from '../App';

const RatingModal = ({ job, onClose, onSubmit }) => {
  const [rating, setRating] = useState(job.rating || 0);
  const [review, setReview] = useState(job.review || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(job._id, rating, review);
      onClose();
    } catch (err) {
      alert('Error submitting rating: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Rate your experience with {job.cleaner?.name}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Review (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || rating < 1}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : job.rating ? 'Update Rating' : 'Submit Rating'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CliPastJobsPage = () => {
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      fetchPastJobs();
    }
  }, [user]);

  const fetchPastJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getCompletedJobsForClient(user._id);
      setPastJobs(data);
    } catch (err) {
      console.error('Error fetching past jobs:', err);
    }
    setLoading(false);
  };

  const handleRateJob = async (jobId, rating, review) => {
    try {
      await api.rateRequest(jobId, rating, review);
      await fetchPastJobs(); // Refresh the list
      alert('Rating submitted successfully!');
    } catch (err) {
      throw err;
    }
  };

  // Function to calculate total cost
  const calculateTotalCost = (startTime, endTime, hourlyPrice) => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
      return {
        amount: (durationHours * hourlyPrice).toFixed(2),
        hours: durationHours.toFixed(1)
      };
    } catch (err) {
      return { amount: '0.00', hours: '0.0' };
    }
  };

  // Calculate total spent
  const totalSpent = pastJobs.reduce((total, job) => {
    const cost = calculateTotalCost(job.startTime, job.endTime, job.cleaner?.hourlyPrice || 0);
    return total + parseFloat(cost.amount);
  }, 0);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Past Jobs</h2>
        <div className="bg-blue-50 px-4 py-2 rounded">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-xl font-bold text-blue-600">${totalSpent.toFixed(2)}</p>
        </div>
      </div>
      
      {pastJobs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No completed jobs yet</p>
          <p className="text-sm mt-2">Your completed jobs will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pastJobs.map(job => {
            const cost = calculateTotalCost(job.startTime, job.endTime, job.cleaner?.hourlyPrice || 0);
            
            return (
              <div key={job._id} className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{job.service}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        COMPLETED
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>{new Date(job.date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span>{job.startTime} - {job.endTime} ({cost.hours} hours)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cost Display */}
                  <div className="bg-blue-50 p-4 rounded text-right min-w-[140px]">
                    <p className="text-xs text-gray-600 mb-1">You paid:</p>
                    <p className="text-2xl font-bold text-blue-600 mb-1">
                      ${cost.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cost.hours}h × ${job.cleaner?.hourlyPrice || 0}/h
                    </p>
                  </div>
                </div>

                {/* Cleaner Info */}
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <h4 className="font-medium mb-2">Cleaner Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name: </span>
                      <span className="font-medium">{job.cleaner?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email: </span>
                      <span>{job.cleaner?.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate: </span>
                      <span>${job.cleaner?.hourlyPrice || 0}/hour</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Completed: </span>
                      <span>{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : new Date(job.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Job Notes */}
                {job.note && (
                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <h4 className="font-medium mb-2">Job Notes</h4>
                    <p className="text-sm text-gray-700">{job.note}</p>
                  </div>
                )}

                {/* Rating Section */}
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium mb-1">Your Rating</h4>
                      {job.rating ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={star <= job.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{job.rating}/5 stars</span>
                          </div>
                          {job.review && (
                            <p className="text-sm text-gray-700 italic">"{job.review}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Not rated yet</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowRatingModal(job)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm"
                    >
                      {job.rating ? 'Update Rating' : 'Rate Job'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Statistics */}
      {pastJobs.length > 0 && (
        <div className="mt-8 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-3">Job Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{pastJobs.length}</p>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">${totalSpent.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {(pastJobs.reduce((total, job) => {
                  const cost = calculateTotalCost(job.startTime, job.endTime, job.cleaner?.hourlyPrice || 0);
                  return total + parseFloat(cost.hours);
                }, 0)).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Hours of Service</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {pastJobs.filter(job => job.rating).length > 0 
                  ? (pastJobs.reduce((sum, job) => sum + (job.rating || 0), 0) / pastJobs.filter(job => job.rating).length).toFixed(1)
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-gray-600">Avg Rating Given</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          job={showRatingModal}
          onClose={() => setShowRatingModal(null)}
          onSubmit={handleRateJob}
        />
      )}
    </div>
  );
};

export default CliPastJobsPage;