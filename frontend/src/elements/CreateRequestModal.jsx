import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Calculator } from 'lucide-react';
import { api } from '../App';

const CreateRequestModal = ({ cleanerId, onClose, onSuccess }) => {
  const [cleaner, setCleaner] = useState(null);
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    startTime: '',
    endTime: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fetch cleaner details when component mounts
  useEffect(() => {
    if (cleanerId) {
      fetchCleanerDetails();
    }
  }, [cleanerId]);

  /**
   * Auto-recalculate price whenever time inputs or cleaner data changes
   * Dependencies: formData.startTime, formData.endTime, cleaner
   */
  useEffect(() => {
    calculatePrice();
  }, [formData.startTime, formData.endTime, cleaner]);

  /**
   * Fetches cleaner's details including hourly rate and services
   * Updates cleaner state or sets error if fetch fails
   */
  const fetchCleanerDetails = async () => {
    try {
      const cleanerData = await api.getCleanerById(cleanerId);
      setCleaner(cleanerData);
    } catch (err) {
      console.error('Error fetching cleaner details:', err);
      setError('Failed to load cleaner details');
    }
  };

  /**
   * Calculates total price based on duration and cleaner's hourly rate
   * Handles time validation and conversion from HH:MM format
   */
  const calculatePrice = () => {
    // Reset calculations if required data is missing
    if (!formData.startTime || !formData.endTime || !cleaner) {
      setTotalPrice(0);
      setDuration(0);
      return;
    }

    try {
      // Parse hours and minutes from time strings
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      // Convert times to minutes since midnight for easier comparison
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      // Validate end time is after start time
      if (endTotalMinutes <= startTotalMinutes) {
        setTotalPrice(0);
        setDuration(0);
        return;
      }
      
      // Calculate duration in hours and final price
      const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
      const price = durationHours * cleaner.hourlyPrice;
      
      // Update state with calculated values
      setDuration(durationHours);
      setTotalPrice(price);
    } catch (err) {
      console.error('Error calculating price:', err);
      setTotalPrice(0);
      setDuration(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.endTime <= formData.startTime) {
      setError('End time must be after start time');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.createRequest({
        ...formData,
        cleanerId,
        requestType: 'specific'
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!cleaner) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded max-w-md w-full">
          <div className="text-center">Loading cleaner details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Cleaner Info Header */}
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="text-lg font-bold mb-2">Hiring: {cleaner.name}</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className="text-green-500" />
              <span className="font-medium">${cleaner.hourlyPrice}/hour</span>
            </div>
            <div className="text-gray-600">{cleaner.age} years old</div>
            <div className="text-gray-600">{cleaner.gender}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Service <span className="text-gray-500">(only services this cleaner offers)</span>
            </label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={formData.service}
              onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
              required
            >
              <option value="">Select Service</option>
              {cleaner.service.map((service, index) => (
                <option key={index} value={service}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This cleaner offers: {cleaner.service.join(', ')}
            </p>
          </div>
          
          {/* Date picker with past date validation */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              // Prevent selecting past dates by setting minimum date to today
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          {/* Time selection grid with start and end time inputs */}
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

          {/* Price Calculator */}
          {(formData.startTime && formData.endTime) && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={16} className="text-green-600" />
                <h3 className="font-medium text-green-800">Price Calculation</h3>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {duration.toFixed(1)} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span>${cleaner.hourlyPrice}/hour</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Cost:</span>
                  <span className="text-green-600">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              {totalPrice > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {duration.toFixed(1)} hours × ${cleaner.hourlyPrice}/hour = ${totalPrice.toFixed(2)}
                </div>
              )}
              
              {formData.endTime <= formData.startTime && (
                <div className="mt-2 text-red-600 text-sm">
                  ⚠️ End time must be after start time
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              maxLength={500}
              placeholder="Any special instructions or requirements..."
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || totalPrice <= 0 || duration < 1}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 
               duration < 1 && duration > 0 ? 'Minimum 1 hour required' :
               totalPrice > 0 ? `Send Request (${totalPrice.toFixed(2)}$)` : 'Calculate Price'}
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

export default CreateRequestModal;