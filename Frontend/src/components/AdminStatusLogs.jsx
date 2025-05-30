import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullPageLoader from './utilities/FullPageLoader';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';

const AdminStatusLogs = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [durations, setDurations] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingDurations, setLoadingDurations] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/Auth/check', {
          credentials: 'include',
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        if (data.user.role !== 'admin') {
          toast.error('Unauthorized. Admin access required.');
          navigate('/home');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoadingUser(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/Sales/all', {
          credentials: 'include',
        });
        if (!response.ok) {
          console.error('Fetch users failed with status:', response.status, response.statusText);
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched users data:', data);
        // Handle direct array or { users: [...] }
        const usersArray = Array.isArray(data) ? data : data.users || [];
        if (!Array.isArray(usersArray)) {
          console.error('Invalid users data structure:', data);
          throw new Error('Invalid users data structure');
        }
        setUsers(usersArray);
        console.log('Updated users state:', usersArray);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        setUsers([]);
      }
    };

    fetchUser();
    fetchUsers();
  }, [navigate]);

  const fetchDurations = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoadingDurations(true);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      const response = await fetch(
        `http://localhost:3000/Sales/status-logs/${selectedUserId}?${query.toString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch status durations');
      const data = await response.json();
      setDurations(data.durations || {});
    } catch (error) {
      console.error('Error fetching durations:', error);
      toast.error('Failed to load status durations');
    } finally {
      setLoadingDurations(false);
    }
  };

  const handleFetchDurations = (e) => {
    e.preventDefault();
    fetchDurations();
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {loadingUser ? (
        <div className="flex justify-center items-center py-8">
          <FullPageLoader
            size="w-10 h-10"
            color="text-blue-500 dark:text-blue-400"
            fill="fill-blue-300 dark:fill-blue-600"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            User Status Durations
          </h2>

          {/* Filter Form */}
          <form onSubmit={handleFetchDurations} className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Select User
                </label>
                {console.log('Rendering users in dropdown:', users)}
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    console.log('Selected user ID:', e.target.value);
                    setSelectedUserId(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingUser}
                >
                  <option value="">Select a user</option>
                  {users.length === 0 ? (
                    <option disabled>No users available</option>
                  ) : (
                    users.map((u) => (
                      <option key={u._id.toString()} value={u._id.toString()}>
                        {u.name} ({u.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingDurations}
            >
              Fetch Durations
            </button>
          </form>

          {/* Durations Table */}
          {loadingDurations ? (
            <div className="flex justify-center items-center py-8">
              <FullPageLoader
                size="w-10 h-10"
                color="text-blue-500 dark:text-blue-400"
                fill="fill-blue-300 dark:fill-blue-600"
              />
            </div>
          ) : Object.keys(durations).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm md:text-base">
                <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">
                      Duration (Hours)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(durations).map(([status, hours]) => (
                    <tr
                      key={status}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        {status}
                      </td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        {hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Select a user and date range to view status durations.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStatusLogs;