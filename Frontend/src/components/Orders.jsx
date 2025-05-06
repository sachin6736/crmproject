import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FullPageLoader from './utilities/FullPageLoader';
import { useTheme } from '../context/ThemeContext';

const OrderForm = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    clientName: '',
    phone: '',
    email: '',
    cardNumber: '',
    cardMonth: '',
    cardYear: '',
    cvv: '',
    billingAddress: '',
    city: '',
    state: '',
    zip: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    amount: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sameAsBilling, setSameAsBilling] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:3000/Lead/getleadbyid/${id}`, { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch lead data');
        }
        return response.json();
      })
      .then(data => {
        console.log('Data:', data);
        setFormData({
          make: data.make || '',
          model: data.model || '',
          year: String(data.year || ''),
          clientName: data.clientName || '',
          phone: data.phoneNumber || '',
          email: data.email || '',
          cardNumber: '',
          cardMonth: '',
          cardYear: '',
          cvv: '',
          billingAddress: data.billingAddress || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          shippingAddress: data.shippingAddress || '',
          shippingCity: data.shippingCity || '',
          shippingState: data.shippingState || '',
          shippingZip: data.shippingZip || '',
          amount: data.totalCost?.toString() || '',
        });
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching lead data:', error);
        toast.error('Failed to load lead data');
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSameAsBilling = (e) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setFormData({
        ...formData,
        shippingAddress: formData.billingAddress,
        shippingCity: formData.city,
        shippingState: formData.state,
        shippingZip: formData.zip,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/Order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, leadId: id }),
      });
      if (response.ok) {
        toast.success('Order submitted successfully');
        setFormData({
          ...formData,
          cardNumber: '',
          cardMonth: '',
          cardYear: '',
          cvv: '',
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Network error: Unable to submit order');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <FullPageLoader
          size="w-10 h-10"
          color="text-blue-500 dark:text-blue-400"
          fill="fill-blue-300 dark:fill-blue-600"
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      {/* Order Information */}
      <section>
        <h2 className="text-2xl font-bold">Order Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Provide your product selection and personal details to complete your order.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            name="make"
            value={formData.make}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          >
            <option value="">Make *</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
          </select>
          <select
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          >
            <option value="">Model *</option>
            <option value="Corolla">Corolla</option>
            <option value="Civic">Civic</option>
          </select>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          >
            <option value="">Year *</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <input
            name="clientName"
            placeholder="Client Name *"
            value={formData.clientName}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="phone"
            placeholder="Phone *"
            value={formData.phone}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="email"
            placeholder="Email *"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Payment Information */}
      <section>
        <h2 className="text-2xl font-bold">Payment Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Securely enter your card information to complete the payment.
        </p>
        <input
          name="cardNumber"
          placeholder="Card Number *"
          value={formData.cardNumber}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="cardMonth"
            placeholder="Month *"
            value={formData.cardMonth}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="cardYear"
            placeholder="Year *"
            value={formData.cardYear}
            onChange={handleChange}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="cvv"
            placeholder="CVV Number *"
            value={formData.cvv}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Billing Address */}
      <section>
        <h2 className="text-2xl font-bold">Billing Address</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Please provide the address associated with your payment method.
        </p>
        <input
          name="billingAddress"
          placeholder="Billing Address *"
          value={formData.billingAddress}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="city"
            placeholder="City *"
            value={formData.city}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="state"
            placeholder="State or Province *"
            value={formData.state}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="zip"
            placeholder="Postal or Zip *"
            value={formData.zip}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Shipping Address */}
      <section>
        <h2 className="text-2xl font-bold">Shipping Address</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Enter the address where the order should be shipped.
        </p>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="sameAsBilling"
            checked={sameAsBilling}
            onChange={handleSameAsBilling}
            className="mr-2"
          />
          <label htmlFor="sameAsBilling" className="text-gray-600 dark:text-gray-400">
            Same as Billing Address
          </label>
        </div>
        <input
          name="shippingAddress"
          placeholder="Shipping Address *"
          value={formData.shippingAddress}
          onChange={handleChange}
          required
          disabled={sameAsBilling}
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="shippingCity"
            placeholder="City *"
            value={formData.shippingCity}
            onChange={handleChange}
            required
            disabled={sameAsBilling}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <input
            name="shippingState"
            placeholder="State or Province *"
            value={formData.shippingState}
            onChange={handleChange}
            required
            disabled={sameAsBilling}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <input
            name="shippingZip"
            placeholder="Postal or Zip *"
            value={formData.shippingZip}
            onChange={handleChange}
            required
            disabled={sameAsBilling}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </section>

      {/* Amount */}
      <section>
        <label className="block font-semibold text-lg mt-4 mb-2">
          Amount $ :
        </label>
        <input
          name="amount"
          placeholder="Amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
        />
      </section>

      <button
        type="submit"
        className="bg-green-800 dark:bg-green-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-green-900 dark:hover:bg-green-700"
      >
        Submit Now
      </button>
    </form>
  );
};

export default OrderForm;