import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Bell,
  Menu,
  X,
  Clock,
  Gavel,
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeToggle from './ThemeToggle';
import io from 'socket.io-client';

function Home() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const statusDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const socketRef = useRef(null);
  const userButtonRef = useRef(null);
  const notificationButtonRef = useRef(null); // Added for notification button positioning

  const formatDate = (date) => {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return 'Unknown Date';
      }
      return parsedDate.toLocaleString();
    } catch {
      return 'Unknown Date';
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${import.meta.env.vite_api_url}/User/me`, {
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

  const fetchNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${import.meta.env.vite_api_url}/Notification/user/${user._id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      socketRef.current = io(`${import.meta.env.vite_api_url}`, {
        withCredentials: true,
      });

      socketRef.current.emit('joinRoom', user._id);

      socketRef.current.on('newNotification', (notification) => {
        console.log('Received notification:', notification);
        setNotifications((prev) => [notification, ...prev]);
        toast.info(notification.message);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
        setShowDropdown(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${import.meta.env.vite_api_url}/Auth/logout`, {
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
      setShowDropdown(false);
      return;
    }

    if (selectedStatus === user.status) {
      toast.info('Status is already set to ' + selectedStatus);
      setShowStatusDropdown(false);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.vite_api_url}/Sales/changestatus/${user._id}`,
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

      if (selectedStatus === 'LoggedOut') {
        await handleLogout();
        return;
      }

      await fetchUser();
      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error changing status:', err);
      toast.error(err.message || 'Failed to update status');
    } finally {
      setShowStatusDropdown(false);
      setShowDropdown(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${import.meta.env.vite_api_url}/Notification/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
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

  const navItems = [
    {
      label: 'Home',
      icon: <HomeIcon className='h-6 w-6 text-white dark:text-gray-300 md:h-6 md:w-6' />,
      onClick: () => {
        if (loading) return;
        if (user?.role === 'admin') {
          navigate('/home/dashboard');
        } else if (user?.role === 'procurement') {
          navigate('/home/procurementdashboard');
        } else {
          navigate('/home/salesdashboard');
        }
        setShowSidebar(false);
      },
    },
    {
      label: 'Leads',
      icon: <LineChart className='h-6 w-6 text-white dark:text-gray-300 md:h-6 md:w-6' />,
      onClick: () => {
        navigate('/home/sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'View Orders',
      icon: <PenTool className='h-6 w-6 text-white dark:text-gray-300 md:h-6 md:w-6' />,
      onClick: () => {
        navigate('/home/orders');
        setShowSidebar(false);
      },
    },
    {
      label: 'Litigation and Replacement',
      icon: <Gavel className='h-6 w-6 text-white dark:text-gray-300 md:h-6 md:w-6' />,
      onClick: () => {
        navigate('/home/litigation-orders');
        setShowSidebar(false);
      },
    },
    {
      label: 'Cancelled Vendors',
      icon: <PenTool className='h-6 w-6 text-white dark:text-gray-300 md:h-6 md:w-6' />,
      onClick: () => {
        navigate('/home/cancelledvendors');
        setShowSidebar(false);
      },
    },
    {
      label: 'Your Account',
      icon: <User className='h-6 w-6 text-white dark:text-gray-300 md:h-6 md:w-6' />,
      onClick: () => {
        setShowSidebar(false);
      },
    },
  ];

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
        Loading...
      </div>
    );
  }

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  return (
    <div className='w-screen h-screen bg-gray-100 dark:bg-gray-900 flex text-gray-900 dark:text-gray-100'>
      {/* Desktop Sidebar */}
      <div className='hidden md:flex w-20 h-screen bg-[#002775] dark:bg-gray-800 fixed left-0 top-0 border-r-[2px] border-r-white dark:border-r-gray-700 flex-col items-center pt-3 space-y-3 overflow-hidden'>
        {navItems.map((item, index) => (
          <div
            key={index}
            className='flex flex-col items-center space-y-1 cursor-pointer'
            onClick={item.onClick}
          >
            <div className='w-12 h-12 bg-[#002775] dark:bg-gray-800 rounded-md border border-[#002775] dark:border-gray-700 hover:border-white dark:hover:border-gray-500 transition duration-300 flex items-center justify-center'>
              {item.icon}
            </div>
            <span className='text-white dark:text-gray-300 text-[10px] font-bold text-center'>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile Sidebar (Hamburger Menu) */}
      {showSidebar && (
        <div className='md:hidden fixed inset-0 bg-[#002775] dark:bg-gray-800 z-50 flex flex-col items-center pt-6 space-y-6'>
          <button
            onClick={() => setShowSidebar(false)}
            className='absolute top-4 right-4 text-white dark:text-gray-300'
          >
            <X className='w-8 h-8' />
          </button>
          {navItems.map((item, index) => (
            <div
              key={index}
              className='flex items-center space-x-4 cursor-pointer'
              onClick={item.onClick}
            >
              <div className='w-10 h-10 flex items-center justify-center'>
                {item.icon}
              </div>
              <span className='text-white dark:text-gray-300 text-lg font-bold'>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className='flex-1 h-screen md:ml-20 flex flex-col'>
        {/* Header */}
        <div className='w-full h-16 md:h-24 bg-[#066afe] dark:bg-gray-800 flex items-center justify-between px-4'>
          <div className='flex items-center space-x-2'>
            <button
              className='md:hidden text-white dark:text-gray-300'
              onClick={() => setShowSidebar(true)}
            >
              <Menu className='w-8 h-8' />
            </button>
            {/* <img src={logo} alt='Equivise Logo' className='w-16 h-16 md:w-20 md:h-20' /> */}
            {/* <span className='text-white dark:text-gray-100 font-serif text-base md:text-lg'>| Equivise</span> */}
          </div>
          <div className='relative flex items-center space-x-4'>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/home/admin/status-logs')}
                className='w-8 h-8 bg-white dark:bg-gray-700 text-[#066afe] dark:text-gray-100 rounded-full flex items-center justify-center'
                title='Track User Statuses'
              >
                <Clock className='w-5 h-5' />
              </button>
            )}
            <ThemeToggle />
            <div className='relative'>
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                type='button'
                className='w-8 h-8 bg-white dark:bg-gray-700 text-[#066afe] dark:text-gray-100 rounded-full flex items-center justify-center relative'
              >
                <Bell className='w-5 h-5' />
                {unreadCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && createPortal(
                <div
                  ref={notificationDropdownRef}
                  className='fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[10000] w-80 max-w-[90vw] p-2 max-h-96 overflow-y-auto'
                  style={{
                    top: notificationButtonRef.current
                      ? notificationButtonRef.current.getBoundingClientRect().bottom + window.scrollY + 4
                      : 0,
                    left: notificationButtonRef.current
                      ? notificationButtonRef.current.getBoundingClientRect().right + window.scrollX - 320
                      : 0,
                  }}
                >
                  <h3 className='text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200'>
                    Notifications
                  </h3>
                  {notifications.length === 0 ? (
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      No notifications
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`flex items-center justify-between p-2 text-sm border-b border-gray-200 dark:border-gray-700 cursor-pointer ${
                          notification.isRead
                            ? 'bg-gray-200 dark:bg-gray-600'
                            : 'bg-blue-100 dark:bg-blue-900'
                        }`}
                        onClick={() => {
                          if (notification.lead) {
                            navigate(`/home/sales/lead/${notification.lead._id}`);
                          }
                        }}
                      >
                        <div className='flex-1'>
                          <p className='text-gray-700 dark:text-gray-200 text-sm'>
                            {notification.message}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notification._id);
                            }}
                            className='ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500'
                          >
                            <CheckCircle className='w-4 h-4' />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>,
                document.body
              )}
            </div>
            <div className='relative'>
              <button
                ref={userButtonRef}
                onClick={() => setShowDropdown(!showDropdown)}
                type='button'
                className='w-8 h-8 bg-white dark:bg-gray-700 text-[#066afe] dark:text-gray-100 rounded-full flex items-center justify-center'
              >
                {statusOptions.find((opt) => opt.value === user?.status)?.icon || (
                  <User className='w-5 h-5' />
                )}
              </button>
              {showDropdown && createPortal(
                <div
                  ref={statusDropdownRef}
                  className='fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[10000] w-48 max-w-[90vw] p-2'
                  style={{
                    top: userButtonRef.current
                      ? userButtonRef.current.getBoundingClientRect().bottom + window.scrollY + 4
                      : 0,
                    left: userButtonRef.current
                      ? userButtonRef.current.getBoundingClientRect().right + window.scrollX - 192
                      : 0,
                  }}
                >
                  <div className='mb-2'>
                    <label className='text-sm font-semibold block mb-1 text-gray-900 dark:text-gray-200'>
                      {user.name}
                    </label>
                    <label className='text-sm font-semibold block mb-1 text-amber-500 dark:text-amber-500'>
                      {user.role}
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
                      <div className='mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg'>
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
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>
        <div className='flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4'>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Home;