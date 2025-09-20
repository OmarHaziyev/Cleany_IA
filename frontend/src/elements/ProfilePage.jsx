import React, { useState, useEffect } from 'react';
import { User, DollarSign, Save, X, Edit3 } from 'lucide-react';
import { api, Loading, useAuth } from '../App';

const ProfilePage = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hourlyPrice: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getMyProfile(user.userType);
      setProfile(data);
      setFormData({
        name: data.name || '',
        hourlyPrice: data.hourlyPrice || ''
      });
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (user.userType === 'cleaner') {
      const price = parseFloat(formData.hourlyPrice);
      if (isNaN(price) || price < 5) {
        setError('Hourly price must be at least $5');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData = { name: formData.name.trim() };
      if (user.userType === 'cleaner') {
        updateData.hourlyPrice = parseFloat(formData.hourlyPrice);
      }

      const updatedProfile = await api.updateMyProfile(user.userType, updateData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setError('');
      
      // Update the user data in localStorage to reflect the name change
      const updatedUser = { ...user, name: updatedProfile.name };
      if (user.userType === 'cleaner') {
        updatedUser.hourlyPrice = updatedProfile.hourlyPrice;
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      hourlyPrice: profile.hourlyPrice || ''
    });
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User size={24} className="text-blue-600" />
            My Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            {/* Profile Picture Placeholder */}
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {user.userType === 'client' ? 'Client' : 'Cleaner'} Profile
              </h3>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-semibold text-gray-700">Account Information</h4>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Username</label>
                <div className="px-3 py-2 bg-gray-200 rounded text-gray-500">
                  {profile.username}
                </div>
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <div className="px-3 py-2 bg-gray-200 rounded text-gray-500">
                  {profile.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <div className="px-3 py-2 bg-gray-200 rounded text-gray-500">
                  {profile.phoneNumber}
                </div>
                <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
              </div>
            </div>

            {/* Editable Information */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">Editable Information</h4>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="px-3 py-2 bg-white border rounded">
                    {profile.name}
                  </div>
                )}
              </div>

              {user.userType === 'cleaner' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Price ($)
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="number"
                        min="5"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.hourlyPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourlyPrice: e.target.value }))}
                        placeholder="Enter hourly price"
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-white border rounded flex items-center gap-1">
                      <DollarSign size={16} className="text-green-500" />
                      <span className="font-semibold text-green-600">
                        {profile.hourlyPrice}/hour
                      </span>
                    </div>
                  )}
                  {!isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      This is the rate clients see when browsing
                    </p>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center justify-center gap-1"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Additional Info for Cleaner */}
            {user.userType === 'cleaner' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Cleaner Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium">{profile.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <span className="ml-2 font-medium">{profile.age} years</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Services:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profile.service?.map((service, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  To change services, schedule, or other details, please contact support.
                </p>
              </div>
            )}

            {/* Additional Info for Client */}
            {user.userType === 'client' && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Client Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium">{profile.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <span className="ml-2 font-medium">{profile.age} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <div className="ml-2 font-medium mt-1">{profile.address}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  To change your address or other details, please contact support.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;