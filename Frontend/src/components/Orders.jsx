import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const OrderForm = () => {
  const { id } = useParams();
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
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:3000/Lead/getleadbyid/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Data:', data); // Debug API response
        // Ensure year is a string to match select options
        setFormData({
          make: data.make || '',
          model: data.model || '',
          year: String(data.year || ''), // Convert to string
          clientName: data.clientName || '',
          lastName: data.lastName || '',
          phone: data.phoneNumber || '',
          email: data.email || '',
          cardNumber: data.cardNumber || '',
          cardMonth: data.cardMonth || '',
          cardYear: data.cardYear || '',
          cvv: data.cvv || '',
          billingAddress: data.billingAddress || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          shippingAddress: data.shippingAddress || '',
          shippingCity: data.shippingCity || '',
          shippingState: data.shippingState || '',
          shippingZip: data.shippingZip || '',
          amount: data.amount || '',
        });
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching lead data:', error);
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted data:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Order Information */}
      <section>
        <h2 className="text-2xl font-bold">Order Information</h2>
        <p className="mb-4 text-gray-600">
          Provide your product selection and personal details to complete your order.
        </p>
        {isLoading && <p className="text-gray-500">Loading data...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select name="make" value={formData.make} onChange={handleChange} required className="border rounded p-2">
            <option value="">Make *</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
          </select>
          <select name="model" value={formData.model} onChange={handleChange} required className="border rounded p-2">
            <option value="">Model *</option>
            <option value="Corolla">Corolla</option>
            <option value="Civic">Civic</option>
          </select>
          <select name="year" value={formData.year} onChange={handleChange} required className="border rounded p-2">
            <option value="">Year *</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <input
            name="firstName"
            placeholder="First Name *"
            value={formData.clientName}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="phone"
            placeholder="Phone *"
            value={formData.phone}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="email"
            placeholder="Email *"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
        </div>
      </section>

      {/* Payment Information */}
      <section>
        <h2 className="text-2xl font-bold">Payment Information</h2>
        <p className="mb-4 text-gray-600">Securely enter your card information to complete the payment.</p>
        <input
          name="cardNumber"
          placeholder="Card Number *"
          value={formData.cardNumber}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full mb-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="cardMonth"
            placeholder="Month *"
            value={formData.cardMonth}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="cardYear"
            placeholder="Year *"
            value={formData.cardYear}
            onChange={handleChange}
            className="border rounded p-2"
          />
          <input
            name="cvv"
            placeholder="CVV Number *"
            value={formData.cvv}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
        </div>
      </section>

      {/* Billing Address */}
      <section>
        <h2 className="text-2xl font-bold">Billing Address</h2>
        <p className="mb-4 text-gray-600">Please provide the address associated with your payment method.</p>
        <input
          name="billingAddress"
          placeholder="Billing Address *"
          value={formData.billingAddress}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full mb-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="city"
            placeholder="City *"
            value={formData.city}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="state"
            placeholder="State or Province *"
            value={formData.state}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="zip"
            placeholder="Postal or Zip *"
            value={formData.zip}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
        </div>
      </section>

      {/* Shipping Address */}
      <section>
        <h2 className="text-2xl font-bold">Shipping Address</h2>
        <p className="mb-4 text-gray-600">Enter the address where the order should be shipped.</p>
        <input
          name="shippingAddress"
          placeholder="Shipping Address *"
          value={formData.shippingAddress}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full mb-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="shippingCity"
            placeholder="City *"
            value={formData.shippingCity}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="shippingState"
            placeholder="State or Province *"
            value={formData.shippingState}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            name="shippingZip"
            placeholder="Postal or Zip *"
            value={formData.shippingZip}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
        </div>
      </section>

      {/* Amount */}
      <section>
        <label className="block font-semibold text-lg mt-4 mb-2">Amount $ :</label>
        <input
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className="border rounded p-2"
        />
      </section>

      <button type="submit" className="bg-black text-white px-6 py-2 rounded mt-4 hover:bg-gray-800">
        Submit Now
      </button>
    </form>
  );
};

export default OrderForm;