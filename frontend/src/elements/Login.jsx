import React, { useState } from 'react';
import { useAuth } from '../App';

const SERVICES = [
  { value: 'house cleaning', label: 'House Cleaning' },
  { value: 'deep cleaning', label: 'Deep Cleaning' },
  { value: 'carpet cleaning', label: 'Carpet Cleaning' },
  { value: 'window cleaning', label: 'Window Cleaning' },
  { value: 'office cleaning', label: 'Office Cleaning' },
  { value: 'move-in/move-out cleaning', label: 'Move-in/Move-out Cleaning' },
  { value: 'post-construction cleaning', label: 'Post-construction Cleaning' },
  { value: 'upholstery cleaning', label: 'Upholstery Cleaning' },
];

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function initializeSchedule() {
  const schedule = {};
  DAYS.forEach((day) => {
    schedule[day] = { available: false, startTime: '09:00', endTime: '17:00' };
  });
  return schedule;
}

const Login = () => {
  const [userType, setUserType] = useState('client'); // 'client' | 'cleaner'
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phoneNumber: '',
    gender: '',
    age: '',
    address: '',
    service: [],
    hourlyPrice: '',
    schedule: initializeSchedule(), // keep schedule always initialized to avoid undefined access
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
      setError('');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If user is client, you can optionally strip cleaner-only fields before sending
      const payload =
        userType === 'client'
          ? {
              ...registerData,
              service: [],
              hourlyPrice: '',
              // You can zero-out schedule if your backend expects it empty for clients
              // schedule: {},
            }
          : registerData;

      await register(payload, userType);
      setError('');
      alert('Registration successful! You can now login.');
      setIsRegister(false);
      // reset forms lightly
      setCredentials({ username: '', password: '' });
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (value) => {
    setRegisterData((prev) => {
      const selected = new Set(prev.service);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      return { ...prev, service: Array.from(selected) };
    });
  };

  const updateDay = (day, patch) => {
    setRegisterData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], ...patch },
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded border w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Cleany</h1>

        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUserType('client')}
              className={`px-3 py-2 rounded ${
                userType === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setUserType('cleaner')}
              className={`px-3 py-2 rounded ${
                userType === 'cleaner' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Cleaner
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, username: e.target.value }))
                }
                autoComplete="username"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, password: e.target.value }))
                }
                autoComplete="current-password"
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
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, username: e.target.value }))
                }
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={registerData.name}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border rounded"
                value={registerData.phoneNumber}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                required
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={registerData.gender}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, gender: e.target.value }))
                }
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
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, age: e.target.value }))
                }
                required
              />
            </div>

            {userType === 'client' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  value={registerData.address}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  required
                />
              </div>
            ) : (
              <>
                {/* Services as checkboxes */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Services (select multiple)
                  </label>
                  <div className="border rounded p-3 space-y-2 max-h-40 overflow-auto">
                    {SERVICES.map((s) => (
                      <label key={s.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={s.value}
                          checked={registerData.service.includes(s.value)}
                          onChange={() => toggleService(s.value)}
                        />
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Show selected services as chips */}
                  <div className="mt-2 text-sm">
                    <strong>Selected:</strong>{' '}
                    {registerData.service.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {registerData.service.map((sv) => (
                          <span
                            key={sv}
                            className="inline-flex items-center gap-2 px-2 py-1 border rounded-full"
                          >
                            {SERVICES.find((s) => s.value === sv)?.label || sv}
                            <button
                              type="button"
                              className="text-xs text-red-600"
                              onClick={() => toggleService(sv)}
                              aria-label={`Remove ${sv}`}
                              title="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      'None'
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hourly Price ($)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded"
                    value={registerData.hourlyPrice}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        hourlyPrice: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule</label>
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={registerData.schedule[day].available}
                        onChange={(e) => updateDay(day, { available: e.target.checked })}
                      />
                      <span className="w-24 text-sm capitalize">{day}</span>

                      <input
                        type="time"
                        className="border rounded px-2 py-1 text-sm"
                        value={registerData.schedule[day].startTime}
                        onChange={(e) => updateDay(day, { startTime: e.target.value })}
                        disabled={!registerData.schedule[day].available}
                      />
                      <span className="text-sm">to</span>
                      <input
                        type="time"
                        className="border rounded px-2 py-1 text-sm"
                        value={registerData.schedule[day].endTime}
                        onChange={(e) => updateDay(day, { endTime: e.target.value })}
                        disabled={!registerData.schedule[day].available}
                      />
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
