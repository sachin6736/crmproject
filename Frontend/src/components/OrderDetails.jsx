import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FullPageLoader from "./utilities/FullPageLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    businessName: "",
    phoneNumber: "",
    email: "",
    agentName: "",
    costPrice: "",
    shippingCost: "",
    corePrice: "",
    totalCost: "",
  });
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [notesForm, setNotesForm] = useState({ note: "" });
  const vendorButtonRef = useRef(null);
  const notesButtonRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/User/me', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Fetched user data:', data);
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user info:', err);
        toast.error('Failed to load user data');
      }
    };

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch order data");
        }
        const data = await response.json();
        console.log("Order data:", data);
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order data:", error);
        toast.error("Failed to load order details");
        navigate("/home/orders");
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchUser(), fetchOrder()]);
  }, [orderId, navigate]);

  const handleVendorFormChange = (e) => {
    const { name, value } = e.target;
    setVendorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendorFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/Order/${orderId}/vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(vendorForm),
      });
      if (!response.ok) {
        throw new Error("Failed to submit vendor details");
      }
      toast.success("Vendor details submitted successfully");
      setShowVendorForm(false);
      setVendorForm({
        businessName: "",
        phoneNumber: "",
        email: "",
        agentName: "",
        costPrice: "",
        shippingCost: "",
        corePrice: "",
        totalCost: "",
      });
      // Refresh order data to show new vendor
      const responseOrder = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (responseOrder.ok) {
        const data = await responseOrder.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error submitting vendor details:", error);
      toast.error("Failed to submit vendor details");
    }
  };

  const closeVendorForm = () => {
    setShowVendorForm(false);
    setVendorForm({
      businessName: "",
      phoneNumber: "",
      email: "",
      agentName: "",
      costPrice: "",
      shippingCost: "",
      corePrice: "",
      totalCost: "",
    });
  };

  const handleNotesFormChange = (e) => {
    const { name, value } = e.target;
    setNotesForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotesFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/Order/${orderId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ note: notesForm.note }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit note");
      }
      toast.success("Note added successfully");
      setShowNotesForm(false);
      setNotesForm({ note: "" });
      // Refresh order data to show new note
      const responseOrder = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (responseOrder.ok) {
        const data = await responseOrder.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error submitting note:", error);
      toast.error("Failed to add note");
    }
  };

  const closeNotesForm = () => {
    setShowNotesForm(false);
    setNotesForm({ note: "" });
  };

  // Close forms when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vendorButtonRef.current &&
        !vendorButtonRef.current.contains(event.target) &&
        !event.target.closest('.vendor-form')
      ) {
        closeVendorForm();
      }
      if (
        notesButtonRef.current &&
        !notesButtonRef.current.contains(event.target) &&
        !event.target.closest('.notes-form')
      ) {
        closeNotesForm();
      }
    };

    if (showVendorForm || showNotesForm) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVendorForm, showNotesForm]);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FullPageLoader
                size="w-10 h-10"
                color="text-blue-500 dark:text-blue-400"
                fill="fill-blue-300 dark:fill-blue-600"
              />
            </div>
          ) : order ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                  Order Details
                </h2>
                <button
                  onClick={() => navigate("/home/orders")}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Back to Orders
                </button>
              </div>
              <div className="space-y-8 text-gray-900 dark:text-gray-100">
                {/* Customer Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Client Name
                      </strong>
                      <span>{order.clientName || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Phone
                      </strong>
                      <span>{order.phone || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Email
                      </strong>
                      <span>{order.email || "N/A"}</span>
                    </div>
                  </div>
                </section>

                {/* Vehicle Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Make
                      </strong>
                      <span>{order.make || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Model
                      </strong>
                      <span>{order.model || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Year
                      </strong>
                      <span>{order.year || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Trim
                      </strong>
                      <span>{order.leadId?.trim || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Part Requested
                      </strong>
                      <span>{order.leadId?.partRequested || "N/A"}</span>
                    </div>
                  </div>
                </section>

                {/* Payment Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Card Number
                      </strong>
                      <span>{user?.role === "admin" ? order.cardNumber || "N/A" : "**** **** **** ****"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Card Expiry
                      </strong>
                      <span>
                        {order.cardMonth && order.cardYear
                          ? `${order.cardMonth}/${order.cardYear}`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Part Cost
                      </strong>
                      <span>
                        {order.leadId?.partCost
                          ? `$${order.leadId.partCost.toFixed(2)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Shipping Cost
                      </strong>
                      <span>
                        {order.leadId?.shippingCost
                          ? `$${order.leadId.shippingCost.toFixed(2)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Gross Profit
                      </strong>
                      <span>
                        {order.leadId?.grossProfit
                          ? `$${order.leadId.grossProfit.toFixed(2)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Total Cost
                      </strong>
                      <span>
                        {order.leadId?.totalCost
                          ? `$${order.leadId.totalCost.toFixed(2)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Amount
                      </strong>
                      <span>
                        {order.amount ? `$${order.amount.toFixed(2)}` : "N/A"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Billing Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Billing Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Billing Address
                      </strong>
                      <span>{order.billingAddress || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        City
                      </strong>
                      <span>{order.city || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        State
                      </strong>
                      <span>
                        {order.state ? order.state.toUpperCase() : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Zip
                      </strong>
                      <span>{order.zip || "N/A"}</span>
                    </div>
                  </div>
                </section>

                {/* Shipping Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Shipping Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Shipping Address
                      </strong>
                      <span>{order.shippingAddress || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Shipping City
                      </strong>
                      <span>{order.shippingCity || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Shipping State
                      </strong>
                      <span>
                        {order.shippingState
                          ? order.shippingState.toUpperCase()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Shipping Zip
                      </strong>
                      <span>{order.shippingZip || "N/A"}</span>
                    </div>
                  </div>
                </section>

                {/* Order Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Order ID
                      </strong>
                      <span>{order.order_id|| "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Order Status
                      </strong>
                      <span>{order.status || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Lead Status
                      </strong>
                      <span>{order.leadId?.status || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Sales Person
                      </strong>
                      <span>
                        {order.salesPerson?.name ||
                          order.salesPerson?._id ||
                          "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Order Created At
                      </strong>
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Lead Created At
                      </strong>
                      <span>
                        {order.leadId?.createdAt
                          ? new Date(order.leadId.createdAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Vendor Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Vendor Information
                  </h3>
                  {order.vendors && order.vendors.length > 0 ? (
                    <ul className="space-y-4">
                      {order.vendors.map((vendor, index) => (
                        <li
                          key={vendor._id || index}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Business Name
                              </strong>
                              <span>{vendor.businessName || "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Agent Name
                              </strong>
                              <span>{vendor.agentName || "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Phone Number
                              </strong>
                              <span>{vendor.phoneNumber || "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Email
                              </strong>
                              <span>{vendor.email || "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Cost Price
                              </strong>
                              <span>{vendor.costPrice ? `$${vendor.costPrice.toFixed(2)}` : "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Shipping Cost
                              </strong>
                              <span>{vendor.shippingCost ? `$${vendor.shippingCost.toFixed(2)}` : "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Core Price
                              </strong>
                              <span>{vendor.corePrice ? `$${vendor.corePrice.toFixed(2)}` : "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Total Cost
                              </strong>
                              <span>{vendor.totalCost ? `$${vendor.totalCost.toFixed(2)}` : "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Rating
                              </strong>
                              <span>{vendor.rating || "0"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Warranty
                              </strong>
                              <span>{vendor.warranty || "N/A"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Mileage
                              </strong>
                              <span>{vendor.mileage || "0"}</span>
                            </div>
                            <div>
                              <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Created At
                              </strong>
                              <span>
                                {vendor.createdAt
                                  ? new Date(vendor.createdAt).toLocaleString()
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No vendor details available</p>
                  )}
                </section>

                {/* Notes Section */}
                <section>
                  <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Notes
                  </h3>
                  {order.notes && order.notes.length > 0 ? (
                    <ul className="space-y-2">
                      {order.notes.map((note, index) => (
                        <li
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100"
                        >
                          <p>{note.text || note}</p>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {note.createdAt
                              ? new Date(note.createdAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No notes available</p>
                  )}
                </section>

                {/* Card Details (Visible only to admins) */}
                {user?.role === "admin" && (
                  <section>
                    <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                      Card Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Card Number
                        </strong>
                        <span>{order.cardNumber || "N/A"}</span>
                      </div>
                      <div>
                        <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Card Month
                        </strong>
                        <span>{order.cardMonth || "N/A"}</span>
                      </div>
                      <div>
                        <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Card Year
                        </strong>
                        <span>{order.cardYear || "N/A"}</span>
                      </div>
                      <div>
                        <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                          CVV
                        </strong>
                        <span>{order.cvv || "N/A"}</span>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-900 dark:text-gray-100 text-center">
              No order details available
            </p>
          )}
        </div>
        <div className="md:w-80 relative">
          <button
            ref={vendorButtonRef}
            onClick={() => setShowVendorForm(!showVendorForm)}
            className="w-full px-6 py-2 mb-4 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            Add Vendor Details
          </button>
          <button
            ref={notesButtonRef}
            onClick={() => setShowNotesForm(!showNotesForm)}
            className="w-full px-6 py-2 bg-[#3b82f6] dark:bg-[#3b82f6] text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-colors"
          >
            Add Note
          </button>
          {showVendorForm && (
            <div className="vendor-form absolute mt-5 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 z-50">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Add Vendor Details
              </h3>
              <form onSubmit={handleVendorFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={vendorForm.businessName}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={vendorForm.phoneNumber}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={vendorForm.email}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    name="agentName"
                    value={vendorForm.agentName}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={vendorForm.costPrice}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping Cost
                  </label>
                  <input
                    type="number"
                    name="shippingCost"
                    value={vendorForm.shippingCost}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Core Price
                  </label>
                  <input
                    type="number"
                    name="corePrice"
                    value={vendorForm.corePrice}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Total Cost
                  </label>
                  <input
                    type="number"
                    name="totalCost"
                    value={vendorForm.totalCost}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeVendorForm}
                    className="px-6 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
          {showNotesForm && (
            <div className="notes-form absolute mt-5 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 z-50">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Add Note
              </h3>
              <form onSubmit={handleNotesFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Note
                  </label>
                  <textarea
                    name="note"
                    value={notesForm.note}
                    onChange={handleNotesFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeNotesForm}
                    className="px-6 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;