import React, { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';

const CleanerFilter = ({ onFilter, onClear, isLoading }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    price: '',
    rating: '',
    age: '',
    gender: '',
    service: ''
  });

  const serviceOptions = [
    'house cleaning',
    'deep cleaning',
    'carpet cleaning',
    'window cleaning',
    'office cleaning',
    'move-in/move-out cleaning',
    'post-construction cleaning',
    'upholstery cleaning'
  ];

  const priceRanges = [
    { label: '$5 - $15', value: '5-15' },
    { label: '$16 - $25', value: '16-25' },
    { label: '$26 - $35', value: '26-35' },
    { label: '$36 - $50', value: '36-50' },
    { label: '$50+', value: '50-200' }
  ];

  const ratingOptions = [
    { label: '4+ Stars', value: '4-5' },
    { label: '3+ Stars', value: '3-5' },
    { label: '2+ Stars', value: '2-5' },
    { label: 'Any Rating', value: '0-5' }
  ];

  const ageRanges = [
    { label: '18-25', value: '18-25' },
    { label: '26-35', value: '26-35' },
    { label: '36-45', value: '36-45' },
    { label: '46-55', value: '46-55' },
    { label: '55+', value: '55-80' }
  ];

  const handleFilterChange = (key, value, isRemoval = true) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);

    // If this is a removal (X button click), apply filters immediately
    if (isRemoval) {
      const activeFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      onFilter(activeFilters);
    }
  };

  const applyFilters = () => {
    // Remove empty filters
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    onFilter(activeFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      price: '',
      rating: '',
      age: '',
      gender: '',
      service: ''
    });
    onClear();
    setShowFilters(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="bg-white text-blue-500 px-2 py-0.5 rounded-full text-xs font-medium">
              {Object.values(filters).filter(v => v).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value, false)}
              >
                <option value="">Any Price</option>
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value, false)}
              >
                <option value="">Any Rating</option>
                {ratingOptions.map(rating => (
                  <option key={rating.value} value={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.age}
                onChange={(e) => handleFilterChange('age', e.target.value, false)}
              >
                <option value="">Any Age</option>
                {ageRanges.map(age => (
                  <option key={age.value} value={age.value}>
                    {age.label} years
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value, false)}
              >
                <option value="">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Service Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.service}
                onChange={(e) => handleFilterChange('service', e.target.value, false)}
              >
                <option value="">Any Service</option>
                {serviceOptions.map(service => (
                  <option key={service} value={service}>
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={applyFilters}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              <Search size={16} />
              {isLoading ? 'Searching...' : 'Apply Filters'}
            </button>
            
            <button
              onClick={clearFilters}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Clear All
            </button>
            
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.price && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
              Price: ${filters.price.replace('-', ' - $')}
              <button onClick={() => handleFilterChange('price', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.rating && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
              Rating: {ratingOptions.find(r => r.value === filters.rating)?.label}
              <button onClick={() => handleFilterChange('rating', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.age && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
              Age: {filters.age.replace('-', ' - ')}
              <button onClick={() => handleFilterChange('age', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.gender && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
              Gender: {filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)}
              <button onClick={() => handleFilterChange('gender', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.service && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
              Service: {filters.service.charAt(0).toUpperCase() + filters.service.slice(1)}
              <button onClick={() => handleFilterChange('service', '')}>
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CleanerFilter;