import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";

const FullPageLoader = ({ size = "w-6 h-6", color = "text-blue-500", fill = "fill-blue-200" }) => (
  <svg className={`${size} animate-spin ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className={fill} d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
  </svg>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md sm:max-w-lg w-full mx-4 max-h-[400px] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAssociateVendorModal, setShowAssociateVendorModal] = useState(false);
  const [showVendorDetailsModal, setShowVendorDetailsModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationVendorId, setConfirmationVendorId] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    businessName: "",
    phoneNumber: "",
    email: "",
  });
  const [vendorDetailsForm, setVendorDetailsForm] = useState({
    businessName: "",
    phoneNumber: "",
    email: "",
    agentName: "",
    costPrice: "",
    shippingCost: "",
    totalCost: "",
  });
  const [editVendorForm, setEditVendorForm] = useState({
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
  const [simpleVendors, setSimpleVendors] = useState([]);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [showNotConfirmedVendors, setShowNotConfirmedVendors] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, orderRes] = await Promise.all([
          fetch("http://localhost:3000/User/me", { credentials: "include" }),
          fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, { credentials: "include" }),
        ]);
        if (!userRes.ok) throw new Error("Failed to fetch user data");
        if (!orderRes.ok) throw new Error("Failed to fetch order data");
        const userData = await userRes.json();
        const orderData = await orderRes.json();
        setUser(userData.user);
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        navigate("/home/orders");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, navigate]);

  const fetchSimpleVendors = async () => {
    try {
      const response = await fetch("http://localhost:3000/Order/vendor-simple", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();
      setSimpleVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    }
  };

  const handleVendorFormChange = (e) => {
    const { name, value } = e.target;
    setVendorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/Order/vendor-simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(vendorForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create vendor");
      }
      toast.success("Vendor created successfully");
      setShowAddVendorModal(false);
      setVendorForm({ businessName: "", phoneNumber: "", email: "" });
      fetchSimpleVendors();
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error(error.message || "Failed to create vendor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVendorDetailsFormChange = (e) => {
    const { name, value } = e.target;
    setVendorDetailsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorDetailsFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/Order/order/${orderId}/vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(vendorDetailsForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add vendor to order");
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success("Vendor added successfully");
      setShowVendorDetailsModal(false);
      setVendorDetailsForm({
        businessName: "",
        phoneNumber: "",
        email: "",
        agentName: "",
        costPrice: "",
        shippingCost: "",
        totalCost: "",
      });
    } catch (error) {
      console.error("Error adding vendor to order:", error);
      toast.error(error.message || "Failed to add vendor to order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditVendorFormChange = (e) => {
    const { name, value } = e.target;
    setEditVendorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditVendorFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/order/${orderId}/vendor/${editingVendorId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editVendorForm),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update vendor details");
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success("Vendor details updated successfully");
      setShowEditVendorModal(false);
      setEditVendorForm({
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
      setEditingVendorId(null);
    } catch (error) {
      console.error("Error updating vendor details:", error);
      toast.error(error.message || "Failed to update vendor details");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectVendor = (vendor) => {
    setVendorDetailsForm({
      businessName: vendor.businessName,
      phoneNumber: vendor.phoneNumber,
      email: vendor.email,
      agentName: "",
      costPrice: "",
      shippingCost: "",
      totalCost: "",
    });
    setShowVendorDetailsModal(true);
    setShowAssociateVendorModal(false);
  };

  const handleToggleVendorConfirmation = (vendorId, action) => {
    setConfirmationVendorId(vendorId);
    setConfirmationAction(action);
    setShowConfirmationModal(true);
  };

  const confirmAction = async () => {
    setActionLoading(true);
    try {
      const isConfirmed = confirmationAction === "confirm";
      const response = await fetch(
        `http://localhost:3000/Order/order/${orderId}/vendor/${confirmationVendorId}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isConfirmed }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update vendor status");
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success(`Vendor ${isConfirmed ? "confirmed" : "marked not confirmed"} successfully`);
      setShowConfirmationModal(false);
      setConfirmationVendorId(null);
      setConfirmationAction(null);
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast.error(error.message || "Failed to update vendor status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditVendorClick = (vendor) => {
    setEditVendorForm({
      businessName: vendor.businessName,
      phoneNumber: vendor.phoneNumber,
      email: vendor.email,
      agentName: vendor.agentName,
      costPrice: vendor.costPrice || "",
      shippingCost: vendor.shippingCost || "",
      corePrice: vendor.corePrice || "",
      totalCost: vendor.totalCost || "",
      rating: vendor.rating || "",
      warranty: vendor.warranty || "",
      mileage: vendor.mileage || "",
    });
    setEditingVendorId(vendor._id);
    setShowEditVendorModal(true);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FullPageLoader />
            </div>
          ) : order ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Order #{order.order_id}
                </h2>
                <button
                  onClick={() => navigate("/home/orders")}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base"
                >
                  Back to Orders
                </button>
              </div>
              <div className="space-y-6">
                {/* Customer Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</strong>
                      <p>{order.clientName || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</strong>
                      <p>{order.phone || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</strong>
                      <p>{order.email || "N/A"}</p>
                    </div>
                  </div>
                </section>
                {/* Vehicle Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Make</strong>
                      <p>{order.make || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Model</strong>
                      <p>{order.model || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</strong>
                      <p>{order.year || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Part Requested</strong>
                      <p>{order.leadId?.partRequested || "N/A"}</p>
                    </div>
                  </div>
                </section>
                {/* Active Vendors */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Active Vendors
                  </h3>
                  {order.vendors && order.vendors.filter((v) => v.isConfirmed).length > 0 ? (
                    <ul className="space-y-4">
                      {order.vendors
                        .filter((v) => v.isConfirmed)
                        .map((vendor) => (
                          <li
                            key={vendor._id}
                            className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg shadow-sm"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Business Name
                                </strong>
                                <p>{vendor.businessName}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Agent Name
                                </strong>
                                <p>{vendor.agentName || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Phone
                                </strong>
                                <p>{vendor.phoneNumber || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Email
                                </strong>
                                <p>{vendor.email || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Cost Price
                                </strong>
                                <p>{vendor.costPrice ? `$${vendor.costPrice.toFixed(2)}` : "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Shipping Cost
                                </strong>
                                <p>{vendor.shippingCost ? `$${vendor.shippingCost.toFixed(2)}` : "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Core Price
                                </strong>
                                <p>{vendor.corePrice ? `$${vendor.corePrice.toFixed(2)}` : "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Total Cost
                                </strong>
                                <p>{vendor.totalCost ? `$${vendor.totalCost.toFixed(2)}` : "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Rating
                                </strong>
                                <p>{vendor.rating || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Warranty
                                </strong>
                                <p>{vendor.warranty || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Mileage
                                </strong>
                                <p>{vendor.mileage || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Status
                                </strong>
                                <p className="text-green-600 dark:text-green-400">PO Confirmed</p>
                                <div className="mt-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                  <button
                                    onClick={() => handleEditVendorClick(vendor)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                                    aria-label={`Edit vendor ${vendor.businessName}`}
                                  >
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => handleToggleVendorConfirmation(vendor._id, "reject")}
                                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm"
                                    aria-label={`Reject vendor ${vendor.businessName}`}
                                  >
                                    Reject PO
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No confirmed vendors.</p>
                  )}
                </section>
                {/* Not Confirmed Vendors */}
                <section className="pb-6">
                  <button
                    onClick={() => setShowNotConfirmedVendors(!showNotConfirmedVendors)}
                    className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    aria-expanded={showNotConfirmedVendors}
                  >
                    <span>{showNotConfirmedVendors ? "Hide" : "Show"} Not Confirmed Vendors</span>
                    <svg
                      className={`ml-2 w-4 h-4 sm:w-5 sm:h-5 transform ${
                        showNotConfirmedVendors ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showNotConfirmedVendors && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {order.vendors && order.vendors.filter((v) => !v.isConfirmed).length > 0 ? (
                        <ul className="space-y-2">
                          {order.vendors
                            .filter((v) => !v.isConfirmed)
                            .map((vendor) => (
                              <li
                                key={vendor._id}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-md"
                              >
                                <span className="text-sm sm:text-base">{vendor.businessName}</span>
                                <button
                                  onClick={() => handleToggleVendorConfirmation(vendor._id, "confirm")}
                                  className="mt-2 sm:mt-0 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
                                  aria-label={`Confirm PO for ${vendor.businessName}`}
                                >
                                  Confirm PO
                                </button>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">No unconfirmed vendors.</p>
                      )}
                    </div>
                  )}
                </section>
                {/* Billing Address */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Billing Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</strong>
                      <p>{order.billingAddress || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">City</strong>
                      <p>{order.city || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">State</strong>
                      <p>{order.state?.toUpperCase() || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Zip</strong>
                      <p>{order.zip || "N/A"}</p>
                    </div>
                  </div>
                </section>
                {/* Order Information */}
                <section className="pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</strong>
                      <p>{order.status || "N/A"}</p>
                    </div>
                    <div>
                      <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</strong>
                      <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">No order details available.</p>
          )}
        </div>
        <div className="lg:w-80 w-full">
          <div className="sticky top-6 space-y-4">
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="w-full px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm sm:text-base"
            >
              Add New Vendor
            </button>
            <button
              onClick={() => {
                setShowAssociateVendorModal(true);
                fetchSimpleVendors();
              }}
              className="w-full px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm sm:text-base"
            >
              Associate Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal isOpen={showAddVendorModal} onClose={() => setShowAddVendorModal(false)} title="Add New Vendor">
        <form onSubmit={handleVendorFormSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={vendorForm.businessName}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={vendorForm.phoneNumber}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
            <input
              type="email"
              name="email"
              value={vendorForm.email}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddVendorModal(false)}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <FullPageLoader size="w-4 h-4" color="text-white" fill="fill-blue-200" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Associate Vendor Modal */}
      <Modal
        isOpen={showAssociateVendorModal}
        onClose={() => setShowAssociateVendorModal(false)}
        title="Select Vendor"
      >
        {simpleVendors.length > 0 ? (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {simpleVendors.map((vendor) => (
              <li
                key={vendor._id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSelectVendor(vendor)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleSelectVendor(vendor)}
              >
                <p className="font-semibold text-sm sm:text-base">{vendor.businessName}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{vendor.email}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-sm">No vendors available.</p>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowAssociateVendorModal(false)}
            className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Vendor Details Modal */}
      <Modal
        isOpen={showVendorDetailsModal}
        onClose={() => setShowVendorDetailsModal(false)}
        title="Add Vendor Details"
      >
        <form onSubmit={handleVendorDetailsFormSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={vendorDetailsForm.businessName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={vendorDetailsForm.phoneNumber}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
            <input
              type="email"
              name="email"
              value={vendorDetailsForm.email}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Agent Name</label>
            <input
              type="text"
              name="agentName"
              value={vendorDetailsForm.agentName}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Cost Price ($)</label>
            <input
              type="number"
              name="costPrice"
              value={vendorDetailsForm.costPrice}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Shipping Cost ($)</label>
            <input
              type="number"
              name="shippingCost"
              value={vendorDetailsForm.shippingCost}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost ($)</label>
            <input
              type="number"
              name="totalCost"
              value={vendorDetailsForm.totalCost}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowVendorDetailsModal(false)}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <FullPageLoader size="w-4 h-4" color="text-white" fill="fill-blue-200" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal
        isOpen={showEditVendorModal}
        onClose={() => setShowEditVendorModal(false)}
        title="Edit Vendor Details"
      >
        <form onSubmit={handleEditVendorFormSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={editVendorForm.businessName}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={editVendorForm.phoneNumber}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
            <input
              type="email"
              name="email"
              value={editVendorForm.email}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Agent Name</label>
            <input
              type="text"
              name="agentName"
              value={editVendorForm.agentName}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Cost Price ($)</label>
            <input
              type="number"
              name="costPrice"
              value={editVendorForm.costPrice}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Shipping Cost ($)</label>
            <input
              type="number"
              name="shippingCost"
              value={editVendorForm.shippingCost}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Core Price ($)</label>
            <input
              type="number"
              name="corePrice"
              value={editVendorForm.corePrice}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost ($)</label>
            <input
              type="number"
              name="totalCost"
              value={editVendorForm.totalCost}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Rating (0-5)</label>
            <input
              type="number"
              name="rating"
              value={editVendorForm.rating}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max="5"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Warranty</label>
            <input
              type="text"
              name="warranty"
              value={editVendorForm.warranty}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Mileage</label>
            <input
              type="number"
              name="mileage"
              value={editVendorForm.mileage}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditVendorModal(false)}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <FullPageLoader size="w-4 h-4" color="text-white" fill="fill-blue-200" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title={confirmationAction === "confirm" ? "Confirm Purchase Order" : "Reject Purchase Order"}
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Are you sure you want to {confirmationAction === "confirm" ? "confirm" : "reject"} the purchase order
          for this vendor?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowConfirmationModal(false)}
            className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={confirmAction}
            className={`px-4 py-2 ${
              confirmationAction === "confirm"
                ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
            } text-white rounded-md focus:outline-none focus:ring-2 flex items-center text-sm`}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <FullPageLoader size="w-4 h-4" color="text-white" fill="fill-gray-200" />
            ) : confirmationAction === "confirm" ? (
              "Confirm PO"
            ) : (
              "Reject PO"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;