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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const zipRegex = /^\d{5}$/;

    if (!formData.clientName.trim()) {
      toast.warning('Please enter a valid name');
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      toast.warning('Please enter a valid email address');
      return false;
    }
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.warning('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!zipRegex.test(formData.zip)) {
      toast.warning('Please enter a valid 5-digit ZIP code');
      return false;
    }
    if (!formData.partRequested.trim()) {
      toast.warning('Please specify the part requested');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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
        toast.success('Lead created successfully', { icon: '💾' });
        navigate(`/home/sales`); // Navigation is correct
      } else {
        toast.error(data.message || 'Failed to create lead');
      }
    } catch (error) {
      toast.error('An error occurred while creating the lead. Please try again.');
      console.error('Error creating lead:', error);
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
    navigate('/home'); // Redirect to home instead of userform to avoid loop
  };

  const formFields = [
    { label: 'Name', name: 'clientName', type: 'text', ariaLabel: 'Client name' },
    { label: 'Phone Number', name: 'phoneNumber', type: 'tel', ariaLabel: 'Phone number' },
    { label: 'Email', name: 'email', type: 'email', ariaLabel: 'Email address' },
    { label: 'Zip', name: 'zip', type: 'text', ariaLabel: 'ZIP code' },
    { label: 'Part Requested', name: 'partRequested', type: 'text', ariaLabel: 'Part requested' },
    { label: 'Make', name: 'make', type: 'text', ariaLabel: 'Vehicle make' },
    { label: 'Model', name: 'model', type: 'text', ariaLabel: 'Vehicle model' },
    { label: 'Year', name: 'year', type: 'text', ariaLabel: 'Vehicle year' },
    { label: 'Trim', name: 'trim', type: 'text', ariaLabel: 'Vehicle trim' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md rounded-lg text-gray-900 dark:text-gray-100">
        <div className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl font-semibold text-slate-600 dark:text-gray-100 text-center">
            New Lead
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formFields.map(({ label, name, type, ariaLabel }) => (
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
                aria-label={ariaLabel}
                required={['clientName', 'email', 'phoneNumber', 'zip', 'partRequested'].includes(name)}
              />
            </div>
          ))}
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