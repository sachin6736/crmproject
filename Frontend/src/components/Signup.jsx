import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './utilities/Spinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading,setLoading] = useState(false)

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
  
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
  
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)
    ) {
      newErrors.password =
        'Password must be at least 8 characters and include letters, numbers, and special characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/Auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || 'Login failed');
        setLoading(false);
        return;
      }
      toast.success('Signup successful!');
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-[#002775]">Create Your Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'password', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label className="block mb-1 text-sm font-medium text-gray-700 capitalize">
                {field === 'confirmPassword' ? 'Confirm Password' : field}
              </label>
              <input
                type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors[field]
                    ? 'border-red-500 focus:ring-red-400'
                    : 'focus:ring-blue-400'
                }`}
                placeholder={
                  field === 'confirmPassword'
                    ? 'Confirm your password'
                    : field === 'password'
                    ? 'Your password'
                    : field === 'email'
                    ? 'you@example.com'
                    : 'Your name'
                }
              />
              {errors[field] && (
                <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
              )}
            </div>
          ))}

<button
  type="submit"
  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
  disabled={loading}
  aria-label="Submit Sign Up Form"
>
  {loading ? (
    <>
      <Spinner size="w-5 h-5" color="text-white" fill="fill-green-300" />
      signing up..
    </>
  ) : (
    'Sign Up'
  )}
</button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <a href="/" className="text-[#5573b1] hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
