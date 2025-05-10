import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import {
  Home as HomeIcon,
  Users,
  Briefcase,
  LineChart,
  Headset,
  Megaphone,
  LucideShoppingCart,
  PenTool,
  User,
  CheckCircle,
  Coffee,
  Utensils,
  Calendar,
  LogOut,
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeToggle from './ThemeToggle'; // Import ThemeToggle

function Home() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const statusDropdownRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await fetch('http://localhost:3000/User/me', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Fetched user data:', data);
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user info:', err);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:3000/Auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Logged out successfully');
        navigate('/');
      } else {
        console.error('Logout failed:', res.statusText);
        toast.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    }
  };

  const handleStatusChange = async (selectedStatus) => {
    if (!user?._id) {
      toast.error('User ID not found');
      setShowStatusDropdown(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/Sales/changestatus/${user._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
      }

      await fetchUser();
      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error changing status:', err);
      toast.error(err.message || 'Failed to update status');
    } finally {
      setShowStatusDropdown(false);
    }
  };

  const statusOptions = [
    {
      value: 'Available',
      label: 'Available',
      icon: <CheckCircle className='w-4 h-4 text-green-500' />,
    },
    {
      value: 'OnBreak',
      label: 'On Break',
      icon: <Coffee className='w-4 h-4 text-blue-500' />,
    },
    {
      value: 'Lunch',
      label: 'Lunch',
      icon: <Utensils className='w-4 h-4 text-orange-500' />,
    },
    {
      value: 'Meeting',
      label: 'Meeting',
      icon: <Calendar className='w-4 h-4 text-purple-500' />,
    },
    {
      value: 'LoggedOut',
      label: 'Logged Out',
      icon: <LogOut className='w-4 h-4 text-red-500' />,
    },
  ];

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
        Loading...
      </div>
    );
  }

  return (
    <div className='w-screen h-screen bg-gray-100 dark:bg-gray-900 flex text-gray-900 dark:text-gray-100'>
      <div className='w-20 h-screen bg-[#002775] dark:bg-gray-800 fixed left-0 top-0 border-r-[2px] border-r-white dark:border-r-gray-700 flex flex-col items-center pt-3 space-y-3 overflow-y-scroll'>
        <div
          className='flex flex-col items-center space-y-1 cursor-pointer'
          onClick={() => {
            if (loading) return;
            if (user?.role === 'admin') {
              navigate('/home/dashboard');
            } else {
              navigate('/home/salesdashboard');
            }
          }}
        >
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <HomeIcon className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Home</span>
        </div>
        {/* <div className='flex flex-col items-center space-y-1 cursor-pointer'>
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <Users className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Contacts</span>
        </div> */}
        {/* <div className='flex flex-col items-center space-y-1 cursor-pointer'>
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <Briefcase className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Accounts</span>
        </div> */}
        <div
          className='flex flex-col items-center space-y-1 cursor-pointer'
          onClick={() => navigate('/home/sales')}
        >
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <LineChart className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Sales</span>
        </div>
        {/* <div className='flex flex-col items-center space-y-1 cursor-pointer'>
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <Headset className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Service</span>
        </div> */}
        <div
          className='flex flex-col items-center space-y-1 cursor-pointer'
          onClick={() => {
            if (loading) return;
            if (user?.role === 'admin') {
              navigate('/home/dashboard');
            } else {
              navigate('/home/salesdashboard');
            }
          }}
        >
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <Megaphone className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Dashboard</span>
        </div>
        {/* <div className='flex flex-col items-center space-y-1 cursor-pointer'>
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <LucideShoppingCart className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>Commerce</span>
        </div> */}
        <div className='flex flex-col items-center space-y-1 cursor-pointer' onClick={() => navigate('/home/orders')}>
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <PenTool className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>
            View Orders
          </span>
        </div>
        <div className='flex flex-col items-center space-y-1 cursor-pointer'>
          <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
            <User className='h-6 w-6 text-white dark:text-gray-300' />
          </div>
          <span className='text-white dark:text-gray-300 text-[10px] font-bold'>
            Your Account
          </span>
        </div>
      </div>
      <div className='flex-1 h-screen ml-20 flex flex-col'>
        <div className='w-full h-24 bg-[#066afe] dark:bg-gray-800 flex items-center justify-between px-4'>
          <div className='flex items-center space-x-2'>
            {/* Uncomment if using logo */}
            {/* <img src={logo} alt='Equivise Logo' className='w-20 h-20' /> */}
            {/* <span className='text-white dark:text-gray-100 font-serif text-lg'>| Equivise</span> */}
          </div>
          <div className='relative flex items-center space-x-4'>
            <ThemeToggle /> {/* Add ThemeToggle */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              type='button'
              className='w-8 h-8 bg-white dark:bg-gray-700 text-[#066afe] dark:text-gray-100 rounded-full flex items-center justify-center'
            >
              {statusOptions.find((opt) => opt.value === user?.status)?.icon || (
                <User className='w-5 h-5' />
              )}
            </button>
            {showDropdown && (
              <div className='absolute top-12 right-4 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 p-2'>
                <div className='mb-2'>
                  <label className='text-sm font-semibold block mb-1 text-gray-700 dark:text-gray-200'>
                    Status
                  </label>
                  <div
                    className='w-full border rounded px-2 py-1 text-sm flex items-center justify-between cursor-pointer bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <div className='flex items-center space-x-2'>
                      {statusOptions.find((opt) => opt.value === user?.status)?.icon || (
                        <User className='w-4 h-4' />
                      )}
                      <span>
                        {statusOptions.find((opt) => opt.value === user?.status)?.label ||
                          'Unknown Status'}
                      </span>
                    </div>
                    <span>{showStatusDropdown ? '▲' : '▼'}</span>
                  </div>
                  {showStatusDropdown && (
                    <div
                      ref={statusDropdownRef}
                      className='absolute top-16 left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20'
                    >
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className='flex items-center space-x-2 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200'
                          onClick={() => handleStatusChange(option.value)}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <ul className='py-1 text-sm text-gray-700 dark:text-gray-200'>
                  <li className='px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'>
                    Profile
                  </li>
                  <li className='px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'>
                    Settings
                  </li>
                  <li
                    className='px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                    onClick={handleLogout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className='flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900'>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Home;