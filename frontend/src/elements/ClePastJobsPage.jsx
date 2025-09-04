import React, { useState, useEffect } from 'react';
import { Star, DollarSign, Clock, MapPin, Calendar } from 'lucide-react';
import { api, Loading, useAuth } from '../App';

const ClePastJobsPage = () => {
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      fetchPastJobs();
    }
  }, [user]);

  const fetchPastJobs = async () => {
    setLoading(true);
    try {
      const cleanerId = user._id;
      const data = await api.getCompletedJobs(cleanerId);
      setPastJobs(data);
    } catch (err) {
      console.error('Error fetching past jobs:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  // Function to calculate earnings
  const calculateEarnings = (startTime, endTime, hourlyPrice) => {
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

  // Calculate total earnings
  const totalEarnings = pastJobs.reduce((total, job) => {
    const earnings = calculateEarnings(job.startTime, job.endTime, user?.hourlyPrice || 0);
    return total + parseFloat(earnings.amount);
  }, 0);

  if (!user) {
    return <div>No user data available</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Past Jobs</h2>
        <div className="bg-green-50 px-4 py-2 rounded">
          <p className="text-sm text-gray-600">Total Earned</p>
          <p className="text-xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="space-y-4">
          {pastJobs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No completed jobs yet</p>
              <p className="text-sm mt-2">Your completed jobs will appear here</p>
            </div>
          ) : (
            pastJobs.map(job => {
              const earnings = calculateEarnings(job.startTime, job.endTime, user.hourlyPrice);
              
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
                          <span>{job.startTime} - {job.endTime} ({earnings.hours} hours)</span>
                        </div>
                        
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin size={16} className="mt-0.5" />
                          <span>{job.client?.address || 'Address not provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Earnings Display */}
                    <div className="bg-green-50 p-4 rounded text-right min-w-[140px]">
                      <p className="text-xs text-gray-600 mb-1">You earned:</p>
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        ${earnings.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {earnings.hours}h × ${user.hourlyPrice}/h
                      </p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <h4 className="font-medium mb-2">Client Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Name: </span>
                        <span className="font-medium">{job.client?.name || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email: </span>
                        <span>{job.client?.email || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone: </span>
                        <span>{job.client?.phoneNumber || 'Not provided'}</span>
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

                  {/* Rating and Review */}
                  {job.rating && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <h4 className="font-medium mb-2">Client Rating & Review</h4>
                      <div className="flex items-center gap-2 mb-2">
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
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Summary Statistics */}
      {pastJobs.length > 0 && (
        <div className="mt-8 bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-3">Job Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{pastJobs.length}</p>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {(pastJobs.reduce((total, job) => {
                  const earnings = calculateEarnings(job.startTime, job.endTime, user.hourlyPrice);
                  return total + parseFloat(earnings.hours);
                }, 0)).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Hours Worked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {pastJobs.filter(job => job.rating).length > 0 
                  ? (pastJobs.reduce((sum, job) => sum + (job.rating || 0), 0) / pastJobs.filter(job => job.rating).length).toFixed(1)
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClePastJobsPage;