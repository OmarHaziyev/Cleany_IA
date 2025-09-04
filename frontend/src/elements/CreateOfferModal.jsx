import React, { useState } from 'react';
import { api } from '../App';

const CreateOfferModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    startTime: '',
    endTime: '',
    budget: '',
    deadline: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Combine deadline date and time
      const deadlineDateTime = formData.deadline && formData.deadlineTime 
        ? `${formData.deadline}T${formData.deadlineTime}:00.000Z`
        : formData.deadline;

      await api.createRequest({
        ...formData,
        deadline: deadlineDateTime,
        requestType: 'general'
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Create Offer</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={formData.service}
              onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
              required
            >
              <option value="">Select Service</option>
              <option value="house cleaning">House Cleaning</option>
              <option value="deep cleaning">Deep Cleaning</option>
              <option value="carpet cleaning">Carpet Cleaning</option>
              <option value="window cleaning">Window Cleaning</option>
              <option value="office cleaning">Office Cleaning</option>
              <option value="move-in/move-out cleaning">Move-in/Move-out Cleaning</option>
              <option value="post-construction cleaning">Post-construction Cleaning</option>
              <option value="upholstery cleaning">Upholstery Cleaning</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border rounded"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border rounded"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Budget ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border rounded"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Application Deadline</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              maxLength={500}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Offer'}
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

export default CreateOfferModal;