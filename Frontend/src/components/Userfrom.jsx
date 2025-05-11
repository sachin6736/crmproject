import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from './utilities/Spinner';
import { useTheme } from '../context/ThemeContext';

function UserForm() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNumber: '',
    email: '',
    zip: '',
    partRequested: '',
    make: '',
    model: '',
    year: '',
    trim: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning('Please enter a valid email address');
      return;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.warning('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.zip.match(/^\d{5}$/)) {
      toast.warning('Please enter a valid 5-digit ZIP code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/Lead/createnewlead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setFormData({
          clientName: '',
          phoneNumber: '',
          email: '',
          zip: '',
          partRequested: '',
          make: '',
          model: '',
          year: '',
          trim: '',
        });
        //navigate('/home/sales/leads');
        toast.success('Form has been uploaded', { icon: '💾' });
      } else {
        toast.error(data.message || 'Failed to create lead');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      clientName: '',
      phoneNumber: '',
      email: '',
      zip: '',
      partRequested: '',
      make: '',
      model: '',
      year: '',
      trim: '',
    });
    navigate('/home/userform');
  };

  // Static options
  const makes = ['Toyota', 'Honda', 'Ford', 'BMW'];
  const models = ['Corolla', 'Civic', 'F-150', 'X5'];
  const years = ['2023', '2022', '2021', '2020'];
  const trims = ['Base', 'Sport', 'Luxury', 'Premium'];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md rounded-lg text-gray-900 dark:text-gray-100">
        <div className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl font-semibold text-slate-600 dark:text-gray-100 text-center">
            New Lead
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Name', name: 'clientName', type: 'text', ariaLabel: 'Client name' },
            { label: 'Phone Number', name: 'phoneNumber', type: 'tel', ariaLabel: 'Phone number' },
            { label: 'Email', name: 'email', type: 'email', ariaLabel: 'Email address' },
            { label: 'Zip', name: 'zip', type: 'text', ariaLabel: 'ZIP code' },
          ].map(({ label, name, type, ariaLabel }) => (
            <div key={name} className="col-span-1">
              <label className="block text-sm font-medium text-slate-500 dark:text-gray-400">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                required
                aria-label={ariaLabel}
              />
            </div>
          ))}

          {/* Dropdowns */}
          {[
            { label: 'Make', name: 'make', options: makes, ariaLabel: 'Vehicle make' },
            { label: 'Model', name: 'model', options: models, ariaLabel: 'Vehicle model' },
            { label: 'Year', name: 'year', options: years, ariaLabel: 'Vehicle year' },
            { label: 'Trim', name: 'trim', options: trims, ariaLabel: 'Vehicle trim' },
          ].map(({ label, name, options, ariaLabel }) => (
            <div key={name} className="col-span-1">
              <label className="block text-sm font-medium text-slate-500 dark:text-gray-400">
                {label}
              </label>
              <select
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                required
                aria-label={ariaLabel}
              >
                <option value="">Select {label}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Part Requested Dropdown */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-500 dark:text-gray-400">
              Part Requested
            </label>
            <select
              name="partRequested"
              value={formData.partRequested}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              required
              aria-label="Part requested"
            >
              <option value="">Select a Part</option>
              <option value="Engine">Engine</option>
              <option value="Transmission">Transmission</option>
              <option value="Brakes">Brakes</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="col-span-1 sm:col-span-2 flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-md shadow-md text-gray-900 dark:text-gray-100"
              onClick={handleCancel}
              aria-label="Cancel lead creation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md shadow-md text-white flex items-center justify-center disabled:opacity-50"
              disabled={loading}
              aria-label="Save lead"
            >
              {loading ? (
                <>
                  <Spinner size="w-4 h-4" color="text-white" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserForm;