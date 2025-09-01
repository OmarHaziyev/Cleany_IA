import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const Login = () => {
  const [userType, setUserType] = useState('client');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '', password: '', name: '', email: '', phoneNumber: '', 
    gender: '', age: '', address: '', service: [], hourlyPrice: '', schedule: {}
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(credentials, userType);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData, userType);
      setError('');
      alert('Registration successful! You can now login.');
      setIsRegister(false);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const initializeSchedule = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule = {};
    days.forEach(day => {
      schedule[day] = { available: false, startTime: '09:00', endTime: '17:00' };
    });
    return schedule;
  };

  useEffect(() => {
    if (userType === 'cleaner' && isRegister) {
      setRegisterData(prev => ({ ...prev, schedule: initializeSchedule() }));
    }
  }, [userType, isRegister]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded border w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Cleany</h1>
        
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setUserType('client')}
              className={`px-3 py-2 rounded ${userType === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Client
            </button>
            <button 
              onClick={() => setUserType('cleaner')}
              className={`px-3 py-2 rounded ${userType === 'cleaner' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Cleaner
            </button>
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}

        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button 
              type="button"
              onClick={() => setIsRegister(true)}
              className="w-full mt-2 text-blue-500 hover:underline"
            >
              Need an account? Register
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={registerData.username}
                onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded"
                value={registerData.password}
                onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={registerData.name}
                onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded"
                value={registerData.email}
                onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={registerData.phoneNumber}
                onChange={(e) => setRegisterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={registerData.gender}
                onChange={(e) => setRegisterData(prev => ({ ...prev, gender: e.target.value }))}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                min="18"
                max="80"
                className="w-full px-3 py-2 border rounded"
                value={registerData.age}
                onChange={(e) => setRegisterData(prev => ({ ...prev, age: e.target.value }))}
                required
              />
            </div>
            
            {userType === 'client' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  value={registerData.address}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Services (select multiple)</label>
                  <select
                    multiple
                    className="w-full px-3 py-2 border rounded h-24"
                    value={registerData.service}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setRegisterData(prev => ({ ...prev, service: values }));
                    }}
                    required
                  >
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
                  <label className="block text-sm font-medium mb-1">Hourly Price ($)</label>
                  <input
                    type="number"
                    min="5"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded"
                    value={registerData.hourlyPrice}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, hourlyPrice: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule</label>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={registerData.schedule[day]?.available || false}
                        onChange={(e) => {
                          setRegisterData(prev => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule,
                              [day]: {
                                ...prev.schedule[day],
                                available: e.target.checked
                              }
                            }
                          }));
                        }}
                      />
                      <span className="w-20 text-sm capitalize">{day}</span>
                      {registerData.schedule[day]?.available && (
                        <>
                          <input
                            type="time"
                            className="border rounded px-2 py-1 text-sm"
                            value={registerData.schedule[day]?.startTime || '09:00'}
                            onChange={(e) => {
                              setRegisterData(prev => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  [day]: {
                                    ...prev.schedule[day],
                                    startTime: e.target.value
                                  }
                                }
                              }));
                            }}
                          />
                          <span className="text-sm">to</span>
                          <input
                            type="time"
                            className="border rounded px-2 py-1 text-sm"
                            value={registerData.schedule[day]?.endTime || '17:00'}
                            onChange={(e) => {
                              setRegisterData(prev => ({
                                ...prev,
                                schedule: {
                                  ...prev.schedule,
                                  [day]: {
                                    ...prev.schedule[day],
                                    endTime: e.target.value
                                  }
                                }
                              }));
                            }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            <button 
              type="button"
              onClick={() => setIsRegister(false)}
              className="w-full mt-2 text-blue-500 hover:underline"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;