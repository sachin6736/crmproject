import React from "react";

const OrderPage = () => {
  const orderItems = [
    { id: 1, name: "Mango Smoothie", qty: 2, price: 3.5 },
    { id: 2, name: "Omani Coffee", qty: 1, price: 2.0 },
    { id: 3, name: "Date Cake", qty: 1, price: 4.0 },
  ];

  const total = orderItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 mt-10">
      <h1 className="text-2xl font-bold mb-6">Order Summary</h1>

      {/* Customer Details */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
        <p>Name: Ali Al-Mango</p>
        <p>Table No: 5</p>
        <p>Phone: +968 9123 4567</p>
      </div>

      {/* Order Items */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Items Ordered</h2>
        <ul>
          {orderItems.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border-b py-2"
            >
              <span>
                {item.name} x {item.qty}
              </span>
              <span>${(item.qty * item.price).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Total */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center mb-6">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-xl font-bold text-green-600">${total.toFixed(2)}</span>
      </div>

      {/* Place Order Button */}
      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition">
        Place Order
      </button>
    </div>
  );
};

export default OrderPage;
