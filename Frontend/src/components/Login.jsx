import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './utilities/Spinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.png';
import login from '../assets/login.avif'




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

    
    <div className="flex h-screen w-full">
      <div className="absolute top-10 left-10 flex items-center space-x-2 z-10">
  <img src={logo} alt="Equivise Logo" className="h-8 w-8" />
  <h1 className="text-xl font-bold text-gray-900">Equivise</h1>
</div>
    {/* Left Side - Form Section */}
    <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="mb-2">
  <h2 className="text-xl font-sans text-gray-800 mb-1">Start your journey</h2>
  <h3 className="text-2xl font-bold text-[#002775]">Sign In to Equivise</h3>
</div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
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
      </div>
    </div>

    {/* Right Side - Image Section */}
    <div className="hidden md:block w-1/2">
      <img
        src={login}
        alt="Background"
        className="h-full w-full object-cover opacity-70"
      />
    </div>
    <div className="absolute bottom-10 left-10 flex items-center ">
        <p className="text-sm text-gray-600">Forgot password?</p>
        <button
          type="button"
          className=" text-sm text-blue-600 px-3 py-1 rounded "
        >
          Contact Admin
        </button>
      </div>
  </div>
  );
};

export default Login;
