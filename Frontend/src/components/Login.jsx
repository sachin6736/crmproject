import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './utilities/Spinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';




const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // this is important to receive the HttpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      toast.success('Login successful!');
      navigate('/home'); // change to your desired route
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false); // 👈 always hide spinner
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-[#002775]">Welcome</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition duration-200 flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="w-4 h-4" /> <span className="ml-2">Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Don't have an account? <a href="/signup" className="text-[#002775] hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
