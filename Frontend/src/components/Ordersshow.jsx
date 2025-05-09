import React, { useState, useEffect } from "react";

const OrdersHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch("http://localhost:3000/Order/getallorders", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setOrders(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching orders:", error);
                let errorMessage = "Failed to fetch orders. Please try again later.";
                if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
                    errorMessage = "Network error: Unable to connect to the server. Check if the backend is running at http://localhost:3000.";
                } else if (error.message.includes("CORS")) {
                    errorMessage = "CORS error: The server does not allow requests from this origin. Check backend CORS configuration.";
                } else if (error.message.includes("404")) {
                    errorMessage = "Endpoint not found: Verify the URL http://localhost:3000/Order/getallorders is correct.";
                }
                setError(errorMessage);
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Log orders when they update
    useEffect(() => {
        if (orders.length > 0) {
            console.log("Updated orders:", orders);
        }
    }, [orders]);

    // Function to format date without time
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to get last 4 digits of order ID
    const getLastFourDigits = (orderId) => {
        return orderId.slice(-4);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-lg text-gray-600">Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-lg text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Orders History</h1>
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getLastFourDigits(order._id)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.clientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.leadId.partRequested}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.leadId.totalCost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    order.status === "Delivered"
                                                        ? "bg-green-100 text-green-800"
                                                        : order.status === "Shipped"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrdersHistory;