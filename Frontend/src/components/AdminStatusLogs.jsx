import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from "./LoadingOverlay";

// Heroicons for status indicators
import {
  CheckCircleIcon,
  PauseCircleIcon,
  CakeIcon,
  VideoCameraIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/solid';

const AdminStatusLogs = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [durations, setDurations] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingDurations, setLoadingDurations] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Added for async actions

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/check`, {
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Sales/all`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : data.users || [];
        if (!Array.isArray(usersArray)) {
          throw new Error('Invalid users data structure');
        }
        setUsers(usersArray);
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
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setLoadingDurations(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Sales/status-logs/${selectedUserId}?date=${date}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status durations');
      }
      const data = await response.json();
      setDurations(data.durations || {});
    } catch (error) {
      console.error('Error fetching durations:', error);
      toast.error(error.message || 'Failed to load status durations');
    } finally {
      setLoadingDurations(false);
      setActionLoading(false); // Reset actionLoading
    }
  };

  const handleFetchDurations = (e) => {
    e.preventDefault();
    setActionLoading(true); // Set actionLoading for form submission
    fetchDurations();
  };

  const handleClearFilters = () => {
    if (!actionLoading) {
      setActionLoading(true);
      setSelectedUserId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDurations({});
      setActionLoading(false);
    }
  };

  // Status card configurations
  const statusCards = [
    {
      status: 'Available',
      icon: CheckCircleIcon,
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    },
    {
      status: 'OnBreak',
      icon: PauseCircleIcon,
      color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
    },
    {
      status: 'Lunch',
      icon: CakeIcon,
      color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
    },
    {
      status: 'Meeting',
      icon: VideoCameraIcon,
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    },
    {
      status: 'LoggedOut',
      icon: ArrowRightCircleIcon,
      color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 relative">
      <LoadingOverlay isLoading={loadingUser || loadingDurations || actionLoading} />
      <div className={`${loadingUser || loadingDurations || actionLoading ? "blur-[1px]" : ""}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto transform transition-all duration-300 hover:shadow-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            User Status Insights
          </h2>

          {/* Filter Form */}
          <form onSubmit={handleFetchDurations} className="mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  disabled={loadingUser || actionLoading}
                >
                  <option value="">Select a user</option>
                  {users.length === 0 ? (
                    <option disabled>No users available</option>
                  ) : (
                    users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  max={new Date().toISOString().split('T')[0]}
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all duration-200"
                disabled={loadingDurations || actionLoading}
              >
                {loadingDurations ? 'Loading...' : 'View Insights'}
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                disabled={actionLoading}
              >
                Clear Filters
              </button>
            </div>
          </form>

          {/* Durations Display */}     
          {Object.keys(durations).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statusCards.map(({ status, icon: Icon, color }) => (
                <div
                  key={status}
                  className={`p-4 rounded-lg shadow-md ${color} flex items-center space-x-3 transform transition-all duration-200 hover:scale-105 animate-fade-in`}
                >
                  <Icon className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg font-semibold">{status}</h3>
                    <p className="text-sm">{durations[status] || 0} hours</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Select a user and date to view status insights.
              </p>
            </div>
          )}  
        </div>
      </div>
    </div>
  );
};

export default AdminStatusLogs;