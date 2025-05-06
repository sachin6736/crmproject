import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from './utilities/Spinner';
import logo from '../assets/logo.png';
import login from '../assets/login.avif';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      toast.success('Login successful!');
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    // Mocked action; replace with real functionality (e.g., API or navigation)
    toast.info('Contact admin feature coming soon');
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      {/* Logo Section */}
      {/* <div className="absolute top-10 left-10 flex items-center space-x-2 z-10">
        <img src={logo} alt="Equivise Logo" className="h-8 w-8" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Equivise</h1>
      </div> */}

      {/* Left Side - Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="w-full max-w-md p-4 sm:p-8 space-y-6">
          <div className="mb-2">
            <h2 className="text-xl font-sans text-gray-800 dark:text-gray-100 mb-1">
              Start your journey
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                E-mail
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                aria-label="Email address"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                aria-label="Password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200 flex justify-center items-center disabled:opacity-50"
              disabled={loading}
              aria-label="Login"
            >
              {loading ? (
                <>
                  <Spinner size="w-4 h-4" color="text-white" />
                  <span className="ml-2">Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Image Section */}
      <div className="hidden md:block w-1/2 relative">
        <img
          src={login}
          alt="Background"
          className="h-full w-full object-cover opacity-70 dark:opacity-50"
        />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
      </div>

      {/* Forgot Password */}
      <div className="absolute bottom-10 left-10 flex items-center space-x-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">Forgot password?</p>
        <button
          type="button"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 px-3 py-1 rounded"
          onClick={handleContactAdmin}
          aria-label="Contact Admin for password reset"
        >
          Contact Admin
        </button>
      </div>
    </div>
  );
};

export default Login;