import React, { useState } from 'react';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    specifications: '',
    firstName: '',
    lastName: '',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select name="make" onChange={handleChange} required className="border rounded p-2">
            <option value="">Make *</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
          </select>
          <select name="model" onChange={handleChange} required className="border rounded p-2">
            <option value="">Model *</option>
            <option value="Corolla">Corolla</option>
            <option value="Civic">Civic</option>
          </select>
          <select name="year" onChange={handleChange} required className="border rounded p-2">
            <option value="">Year *</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
          <input name="specifications" placeholder="Specifications *" onChange={handleChange} required className="border rounded p-2" />
          <input name="firstName" placeholder="First Name *" onChange={handleChange} required className="border rounded p-2" />
          <input name="lastName" placeholder="Last Name *" onChange={handleChange} required className="border rounded p-2" />
          <input name="phone" placeholder="Phone *" onChange={handleChange} required className="border rounded p-2" />
          <input name="email" placeholder="Email *" type="email" onChange={handleChange} required className="border rounded p-2" />
        </div>
      </section>

      {/* Payment Information */}
      <section>
        <h2 className="text-2xl font-bold">Payment Information</h2>
        <p className="mb-4 text-gray-600">Securely enter your card information to complete the payment.</p>
        <input name="cardNumber" placeholder="Card Number *" onChange={handleChange} required className="border rounded p-2 w-full mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="cardMonth" placeholder="Month *" onChange={handleChange} required className="border rounded p-2" />
          <input name="cardYear" placeholder="Year *" onChange={handleChange} required className="border rounded p-2" />
          <input name="cvv" placeholder="CVV Number *" onChange={handleChange} required className="border rounded p-2" />
        </div>
      </section>

      {/* Billing Address */}
      <section>
        <h2 className="text-2xl font-bold">Billing Address</h2>
        <p className="mb-4 text-gray-600">Please provide the address associated with your payment method.</p>
        <input name="billingAddress" placeholder="Billing Address *" onChange={handleChange} required className="border rounded p-2 w-full mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="city" placeholder="City *" onChange={handleChange} required className="border rounded p-2" />
          <input name="state" placeholder="State or Province *" onChange={handleChange} required className="border rounded p-2" />
          <input name="zip" placeholder="Postal or Zip *" onChange={handleChange} required className="border rounded p-2" />
        </div>
      </section>

      {/* Shipping Address */}
      <section>
        <h2 className="text-2xl font-bold">Shipping Address</h2>
        <p className="mb-4 text-gray-600">Enter the address where the order should be shipped.</p>
        <input name="shippingAddress" placeholder="Shipping Address *" onChange={handleChange} required className="border rounded p-2 w-full mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="shippingCity" placeholder="City *" onChange={handleChange} required className="border rounded p-2" />
          <input name="shippingState" placeholder="State or Province *" onChange={handleChange} required className="border rounded p-2" />
          <input name="shippingZip" placeholder="Postal or Zip *" onChange={handleChange} required className="border rounded p-2" />
        </div>
      </section>

      {/* Amount */}
      <section>
        <label className="block font-semibold text-lg mt-4 mb-2">Amount $ :</label>
        <input name="amount" placeholder="Amount" onChange={handleChange} required className="border rounded p-2" />
      </section>

      <button type="submit" className="bg-black text-white px-6 py-2 rounded mt-4 hover:bg-gray-800">Submit Now</button>
    </form>
  );
};

export default OrderForm;
