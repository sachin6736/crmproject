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
  const [vendors, setVendors] = useState([]);
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
    rating: "",
    warranty: "",
    mileage: "",
  });
  const [isNewVendor, setIsNewVendor] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [notesForm, setNotesForm] = useState({ note: "" });
  const [showEditOrderForm, setShowEditOrderForm] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState({
    clientName: "",
    phone: "",
    email: "",
    make: "",
    model: "",
    year: "",
    billingAddress: "",
    city: "",
    state: "",
    zip: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
  });
  const [hasVendor, setHasVendor] = useState(false);
  const vendorButtonRef = useRef(null);
  const notesButtonRef = useRef(null);
  const editOrderButtonRef = useRef(null);

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
        setHasVendor(data.vendors && data.vendors.length > 0);
        // Initialize edit form with current order data
        setEditOrderForm({
          clientName: data.clientName || "",
          phone: data.phone || "",
          email: data.email || "",
          make: data.make || "",
          model: data.model || "",
          year: data.year || "",
          billingAddress: data.billingAddress || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          shippingAddress: data.shippingAddress || "",
          shippingCity: data.shippingCity || "",
          shippingState: data.shippingState || "",
          shippingZip: data.shippingZip || "",
        });
      } catch (error) {
        console.error("Error fetching order data:", error);
        toast.error("Failed to load order details");
        navigate("/home/orders");
      } finally {
        setLoading(false);
      }
    };

    const fetchVendors = async () => {
      try {
        const response = await fetch('http://localhost:3000/Order/getallvendors', {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch vendors");
        }
        const data = await response.json();
        console.log("Vendors data:", data);
        setVendors(data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
        toast.error("Failed to load vendors");
      }
    };

    Promise.all([fetchUser(), fetchOrder(), fetchVendors()]);
  }, [orderId, navigate]);

  const handleVendorFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "businessName" && !isNewVendor) {
      const selectedVendor = vendors.find((vendor) => vendor.businessName === value);
      if (selectedVendor) {
        setVendorForm({
          businessName: selectedVendor.businessName || "",
          phoneNumber: selectedVendor.phoneNumber || "",
          email: selectedVendor.email || "",
          agentName: selectedVendor.agentName || "",
          costPrice: selectedVendor.costPrice || "",
          shippingCost: selectedVendor.shippingCost || "",
          corePrice: selectedVendor.corePrice || "",
          totalCost: selectedVendor.totalCost || "",
          rating: selectedVendor.rating || "",
          warranty: selectedVendor.warranty || "",
          mileage: selectedVendor.mileage || "",
        });
      } else {
        setVendorForm((prev) => ({
          ...prev,
          businessName: value,
        }));
      }
    } else {
      setVendorForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      setHasVendor(true);
      setVendorForm({
        businessName: "",
        phoneNumber: "",
        email: "",
        agentName: "",
        costPrice: "",
        shippingCost: "",
        corePrice: "",
        totalCost: "",
        rating: "",
        warranty: "",
        mileage: "",
      });
      setIsNewVendor(false);
      // Refresh order data to show new vendor
      const responseOrder = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (responseOrder.ok) {
        const data = await responseOrder.json();
        setOrder(data);
      }
      // Refresh vendor list to include new vendor if added
      const responseVendors = await fetch('http://localhost:3000/Order/getallvendors', {
        credentials: "include",
      });
      if (responseVendors.ok) {
        const data = await responseVendors.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Error submitting vendor details:", error);
      toast.error("Failed to submit vendor details");
    }
  };

  const handleSendPurchaseOrder = async () => {
    try {
      const response = await fetch(`http://localhost:3000/Order/sendpurchaseorder/${orderId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to send purchase order");
      }
      const data = await response.json();
      toast.success(data.message || "Purchase order sent successfully");
      // Refresh order data to reflect status change
      const responseOrder = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (responseOrder.ok) {
        const updatedOrder = await responseOrder.json();
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Error sending purchase order:", error);
      toast.error("Failed to send purchase order");
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
      rating: "",
      warranty: "",
      mileage: "",
    });
    setIsNewVendor(false);
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

  const handleEditOrderFormChange = (e) => {
    const { name, value } = e.target;
    setEditOrderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditOrderFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/Order/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editOrderForm),
      });
      if (!response.ok) {
        throw new Error("Failed to update order details");
      }
      toast.success("Order details updated successfully");
      setShowEditOrderForm(false);
      // Refresh order data to show updated details
      const responseOrder = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (responseOrder.ok) {
        const data = await responseOrder.json();
        setOrder(data);
        setEditOrderForm({
          clientName: data.clientName || "",
          phone: data.phone || "",
          email: data.email || "",
          make: data.make || "",
          model: data.model || "",
          year: data.year || "",
          billingAddress: data.billingAddress || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          shippingAddress: data.shippingAddress || "",
          shippingCity: data.shippingCity || "",
          shippingState: data.shippingState || "",
          shippingZip: data.shippingZip || "",
        });
      }
    } catch (error) {
      console.error("Error updating order details:", error);
      toast.error("Failed to update order details");
    }
  };

  const closeEditOrderForm = () => {
    setShowEditOrderForm(false);
    // Reset form to current order values
    setEditOrderForm({
      clientName: order?.clientName || "",
      phone: order?.phone || "",
      email: order?.email || "",
      make: order?.make || "",
      model: order?.model || "",
      year: order?.year || "",
      billingAddress: order?.billingAddress || "",
      city: order?.city || "",
      state: order?.state || "",
      zip: order?.zip || "",
      shippingAddress: order?.shippingAddress || "",
      shippingCity: order?.shippingCity || "",
      shippingState: order?.shippingState || "",
      shippingZip: order?.shippingZip || "",
    });
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
      if (
        editOrderButtonRef.current &&
        !editOrderButtonRef.current.contains(event.target) &&
        !event.target.closest('.edit-order-form')
      ) {
        closeEditOrderForm();
      }
    };

    if (showVendorForm || showNotesForm || showEditOrderForm) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVendorForm, showNotesForm, showEditOrderForm]);

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
                      <span>{order.order_id || "N/A"}</span>
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
                              <span>{vendor.rating || "N/A"}</span>
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
                              <span>{vendor.mileage || "N/A"}</span>
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
          {hasVendor ? (
            <button
              onClick={handleSendPurchaseOrder}
              className="w-full px-6 py-2 mb-4 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Send Purchase Order
            </button>
          ) : (
            <button
              ref={vendorButtonRef}
              onClick={() => setShowVendorForm(!showVendorForm)}
              className="w-full px-6 py-2 mb-4 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              Add Vendor Details
            </button>
          )}
          {user?.role === "procurement" && (
            <button
              ref={editOrderButtonRef}
              onClick={() => setShowEditOrderForm(!showEditOrderForm)}
              className="w-full px-6 py-2 mb-4 bg-yellow-600 dark:bg-yellow-500 text-white rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
            >
              Edit Order Details
            </button>
          )}
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
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="vendorType"
                      checked={!isNewVendor}
                      onChange={() => setIsNewVendor(false)}
                      className="mr-2"
                    />
                    Select Existing Vendor
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="vendorType"
                      checked={isNewVendor}
                      onChange={() => setIsNewVendor(true)}
                      className="mr-2"
                    />
                    Add New Vendor
                  </label>
                </div>
                {!isNewVendor ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Select Vendor
                    </label>
                    <select
                      name="businessName"
                      value={vendorForm.businessName}
                      onChange={handleVendorFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a vendor</option>
                      {vendors.map((vendor, index) => (
                        <option key={vendor._id || index} value={vendor.businessName}>
                          {vendor.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
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
                )}
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
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Rating
                  </label>
                  <input
                    type="number"
                    name="rating"
                    value={vendorForm.rating}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.1"
                    min="0"
                    max="5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Warranty
                  </label>
                  <input
                    type="text"
                    name="warranty"
                    value={vendorForm.warranty}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Mileage
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={vendorForm.mileage}
                    onChange={handleVendorFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
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
          {showEditOrderForm && (
            <div className="edit-order-form absolute mt-5 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 z-50">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Edit Order Details
              </h3>
              <form onSubmit={handleEditOrderFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={editOrderForm.clientName}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editOrderForm.phone}
                    onChange={handleEditOrderFormChange}
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
                    value={editOrderForm.email}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Make
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={editOrderForm.make}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={editOrderForm.model}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={editOrderForm.year}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900"
                    max="2099"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    name="billingAddress"
                    value={editOrderForm.billingAddress}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={editOrderForm.city}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={editOrderForm.state}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Zip
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={editOrderForm.zip}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping Address
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={editOrderForm.shippingAddress}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping City
                  </label>
                  <input
                    type="text"
                    name="shippingCity"
                    value={editOrderForm.shippingCity}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping State
                  </label>
                  <input
                    type="text"
                    name="shippingState"
                    value={editOrderForm.shippingState}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping Zip
                  </label>
                  <input
                    type="text"
                    name="shippingZip"
                    value={editOrderForm.shippingZip}
                    onChange={handleEditOrderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeEditOrderForm}
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