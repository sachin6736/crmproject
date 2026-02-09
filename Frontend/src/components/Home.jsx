import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import {
  Home as HomeIcon,
  LineChart,
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
  Trash2,
  DollarSign,
  BadgeDollarSign,
  CircleDollarSign as CircleDollarSignIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeToggle from './ThemeToggle';
import io from 'socket.io-client';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const notificationButtonRef = useRef(null);
  const sidebarScrollRef = useRef(null); // Ref for the scrollable area

  const formatDate = (date) => {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Unknown Date';
      return parsedDate.toLocaleString();
    } catch {
      return 'Unknown Date';
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/User/me`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (!data.user) throw new Error('No user data in response');
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user info:', err);
      toast.error('Failed to load user data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Notification/user/${user._id}`, {
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
      socketRef.current = io(`${import.meta.env.VITE_API_URL}`, { withCredentials: true });

      socketRef.current.emit('joinRoom', user._id);

      socketRef.current.on('newNotification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast.info(notification.message);
      });

      return () => socketRef.current?.disconnect();
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        navigate('/', { replace: true });
        setUser(null);
        setNotifications([]);
        socketRef.current?.disconnect();
        toast.success('Logged out successfully');
      } else {
        toast.error('Failed to log out');
      }
    } catch (error) {
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
      toast.info(`Status is already set to ${selectedStatus}`);
      setShowStatusDropdown(false);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Sales/changestatus/${user._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
      }

      await fetchUser();
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setShowStatusDropdown(false);
      setShowDropdown(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Notification/${notificationId}/read`, {
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
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Notification/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      toast.success('Notification deleted successfully');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const statusOptions = [
    { value: 'Available', label: 'Available', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { value: 'OnBreak', label: 'On Break', icon: <Coffee className="w-4 h-4 text-blue-500" /> },
    { value: 'Lunch', label: 'Lunch', icon: <Utensils className="w-4 h-4 text-orange-500" /> },
    { value: 'Meeting', label: 'Meeting', icon: <Calendar className="w-4 h-4 text-purple-500" /> },
    { value: 'LoggedOut', label: 'Logged Out', icon: <LogOut className="w-4 h-4 text-red-500" /> },
  ];

  const navItems = [
    {
      label: 'Home',
      icon: <HomeIcon className="h-6 w-6" />,
      path: ['/home/dashboard', '/home/salesdashboard', '/home/procurementdashboard'],
      onClick: () => {
        if (loading || !user) return;
        if (user.role === 'admin' || user.role === 'viewer') {
          navigate('/home/dashboard');
        } else if (user.role === 'procurement') {
          navigate('/home/procurementdashboard');
        } else {
          navigate('/home/salesdashboard');
        }
        setShowSidebar(false);
      },
    },
    {
      label: 'Leads',
      icon: <LineChart className="h-6 w-6" />,
      path: '/home/sales',
      onClick: () => {
        navigate('/home/sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'View Orders',
      icon: <PenTool className="h-6 w-6" />,
      path: '/home/orders',
      onClick: () => {
        navigate('/home/orders');
        setShowSidebar(false);
      },
    },
    {
      label: 'Customer Payment History',
      icon: <DollarSign className="h-6 w-6" />,
      path: '/home/customer-payments',
      onClick: () => {
        navigate('/home/customer-payments');
        setShowSidebar(false);
      },
    },
    {
      label: 'Litigation and Replacement',
      icon: <Gavel className="h-6 w-6" />,
      path: '/home/litigation-orders',
      onClick: () => {
        navigate('/home/litigation-orders');
        setShowSidebar(false);
      },
    },
    {
      label: 'Pending Vendor Refund',
      icon: <BadgeDollarSign className="h-6 w-6" />,
      path: '/home/cancelledvendors',
      onClick: () => {
        navigate('/home/cancelledvendors');
        setShowSidebar(false);
      },
    },
    {
      label: 'Vendor Refund History',
      icon: <DollarSign className="h-6 w-6" />,
      path: '/home/paidvendors',
      onClick: () => {
        navigate('/home/paidvendors');
        setShowSidebar(false);
      },
    },
    {
      label: 'Paid Vendors History',
      icon: <CircleDollarSignIcon className="h-6 w-6" />,
      path: '/home/paidvendorshistory',
      onClick: () => {
        navigate('/home/paidvendorshistory');
        setShowSidebar(false);
      },
    },
    {
      label: 'Refund Orders',
      icon: <DollarSign className="h-6 w-6" />,
      path: '/home/refund-orders',
      onClick: () => {
        navigate('/home/refund-orders');
        setShowSidebar(false);
      },
    },
  ];

  const isActive = (item) => {
    if (Array.isArray(item.path)) {
      return item.path.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));
    }
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  // Scroll functions
  const scrollUp = () => {
    if (sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollBy({ top: -120, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollBy({ top: 120, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        Loading...
      </div>
    );
  }

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Desktop Sidebar – now with scroll arrows */}
      <div className="hidden md:flex w-20 h-screen bg-[#002775] dark:bg-gray-800 fixed left-0 top-0 border-r-2 border-r-white dark:border-r-gray-700 flex-col z-20">
        {/* Up Arrow */}
        <button
          onClick={scrollUp}
          className="w-full py-3 bg-gradient-to-b from-[#002775]/90 to-transparent hover:from-[#002775]/70 transition-all flex items-center justify-center text-white/50 hover:text-white/90 opacity-70 hover:opacity-100"
          aria-label="Scroll sidebar up"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        {/* Scrollable content */}
        <div
          ref={sidebarScrollRef}
          className="flex-1 overflow-y-auto scrollbar-hide hover:scrollbar-show px-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          }}
        >
          <div className="flex flex-col items-center pt-3 pb-6 space-y-5">
            {navItems.map((item, index) => {
              const active = isActive(item);
              return (
                <div
                  key={index}
                  className={`group flex flex-col items-center space-y-1 cursor-pointer w-full transition-all duration-200 ${
                    active ? 'bg-white/15 dark:bg-gray-700/50' : 'hover:bg-white/10 dark:hover:bg-gray-700/30'
                  }`}
                  onClick={item.onClick}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${
                      active
                        ? 'bg-white dark:bg-gray-200 border-white dark:border-gray-300 scale-110 shadow-lg'
                        : 'bg-[#002775] dark:bg-gray-800 border-transparent group-hover:border-white/60 dark:group-hover:border-gray-400/60'
                    }`}
                  >
                    <div className={active ? 'text-[#066afe] dark:text-blue-400' : 'text-white dark:text-gray-200'}>
                      {React.cloneElement(item.icon, {
                        className: 'h-7 w-7',
                      })}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight transition-colors ${
                      active ? 'text-white font-bold' : 'text-white/70 dark:text-gray-300/80 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Down Arrow */}
        <button
          onClick={scrollDown}
          className="w-full py-3 bg-gradient-to-t from-[#002775]/90 to-transparent hover:from-[#002775]/70 transition-all flex items-center justify-center text-white/50 hover:text-white/90 opacity-70 hover:opacity-100"
          aria-label="Scroll sidebar down"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40">
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#002775] dark:bg-gray-900 z-50 flex flex-col pt-16 px-6 space-y-3 overflow-y-auto">
            <button
              onClick={() => setShowSidebar(false)}
              className="absolute top-5 right-5 text-white dark:text-gray-200"
            >
              <X className="w-9 h-9" />
            </button>

            {navItems.map((item, index) => {
              const active = isActive(item);
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    active
                      ? 'bg-white/20 dark:bg-gray-700/60 text-white'
                      : 'hover:bg-white/10 dark:hover:bg-gray-700/40 text-white/90'
                  }`}
                  onClick={item.onClick}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {React.cloneElement(item.icon, {
                      className: `h-7 w-7 ${active ? 'text-[#066afe] dark:text-blue-400' : 'text-white'}`,
                    })}
                  </div>
                  <span className={`text-lg font-semibold ${active ? 'text-white' : 'text-white/90'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col w-full md:ml-20">
        {/* Header */}
        <div className="fixed top-0 left-0 md:left-20 right-0 h-16 md:h-20 bg-[#066afe] dark:bg-gray-800 flex items-center justify-between px-4 md:px-6 z-10 shadow-md">
          <div className="flex items-center space-x-3">
            <button className="md:hidden text-white" onClick={() => setShowSidebar(true)}>
              <Menu className="w-8 h-8" />
            </button>
            {/* <img src={logo} alt="Logo" className="h-10 md:h-12" /> */}
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/home/admin/status-logs')}
                className="w-9 h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition"
                title="Track User Statuses"
              >
                <Clock className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}

            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white relative transition"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications &&
                createPortal(
                  <div
                    ref={notificationDropdownRef}
                    className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[10000] w-80 sm:w-96 max-w-[92vw] max-h-[80vh] overflow-y-auto"
                    style={{
                      top: notificationButtonRef.current?.getBoundingClientRect().bottom + window.scrollY + 8,
                      right: window.innerWidth - (notificationButtonRef.current?.getBoundingClientRect().right || 0) + 8,
                    }}
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-gray-500 dark:text-gray-400">No notifications yet</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                            !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                          }`}
                          onClick={() => {
                            if (notif.lead) navigate(`/home/sales/lead/${notif.lead._id}`);
                          }}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(notif.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notif._id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => deleteNotification(notif._id, e)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>,
                  document.body
                )}
            </div>

            {/* User / Status Dropdown */}
            <div className="relative">
              <button
                ref={userButtonRef}
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-9 h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition"
              >
                {user && statusOptions.find((opt) => opt.value === user.status)?.icon ? (
                  React.cloneElement(statusOptions.find((opt) => opt.value === user.status).icon, {
                    className: 'w-5 h-5 md:w-6 md:h-6',
                  })
                ) : (
                  <User className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>

              {showDropdown &&
                createPortal(
                  <div
                    ref={statusDropdownRef}
                    className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[10000] w-64 sm:w-72 max-w-[92vw] p-4"
                    style={{
                      top: userButtonRef.current?.getBoundingClientRect().bottom + window.scrollY + 8,
                      right: window.innerWidth - (userButtonRef.current?.getBoundingClientRect().right || 0) + 8,
                    }}
                  >
                    {user ? (
                      <>
                        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                        </div>

                        <div
                          className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer mb-2"
                          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        >
                          <div className="flex items-center gap-3">
                            {statusOptions.find((opt) => opt.value === user.status)?.icon || <User className="w-5 h-5" />}
                            <span className="font-medium">
                              {statusOptions.find((opt) => opt.value === user.status)?.label || 'Status'}
                            </span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {showStatusDropdown ? '▲' : '▼'}
                          </span>
                        </div>

                        {showStatusDropdown && (
                          <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {statusOptions.map((option) => (
                              <div
                                key={option.value}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
                                onClick={() => {
                                  if (option.value === 'LoggedOut') {
                                    handleLogout();
                                  } else {
                                    handleStatusChange(option.value);
                                  }
                                }}
                              >
                                {option.icon}
                                <span className="text-gray-800 dark:text-gray-200">{option.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading user...</p>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 mt-16 md:mt-20 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;