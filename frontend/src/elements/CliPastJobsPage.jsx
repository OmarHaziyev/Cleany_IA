import React, { useState, useEffect } from 'react';
import { api, Loading, useAuth } from '../App';

const CliPastJobsPage = () => {
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(false);
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

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Past Jobs</h2>
      
      {pastJobs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No completed jobs yet</div>
      ) : (
        <div className="space-y-4">
          {pastJobs.map(job => (
            <div key={job._id} className="bg-white p-4 rounded border">
              <h3 className="font-semibold">{job.service}</h3>
              <p className="text-sm text-gray-600">
                Cleaner: {job.cleaner?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(job.date).toLocaleDateString()} from {job.startTime} to {job.endTime}
              </p>
              {job.note && (
                <p className="text-sm mt-2 bg-blue-50 p-2 rounded">
                  <strong>Note:</strong> {job.note}
                </p>
              )}
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                COMPLETED
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CliPastJobsPage;