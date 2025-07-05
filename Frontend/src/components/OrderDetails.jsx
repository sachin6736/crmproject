import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import EmailPreviewModal from "./orderdetails/EmailPreviewModal";
import { exportToExcel } from "./utilities/exportToExcel";

const FullPageLoader = ({
  size = "w-6 h-6",
  color = "text-blue-500",
  fill = "fill-blue-200",
}) => (
  <svg
    className={`${size} animate-spin ${color}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className={fill}
      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
    />
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
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
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
  const [showAssociateVendorModal, setShowAssociateVendorModal] =
    useState(false);
  const [showVendorDetailsModal, setShowVendorDetailsModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showProcurementNotesModal, setShowProcurementNotesModal] =
    useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [emailPreviewContent, setEmailPreviewContent] = useState("");
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationVendorId, setConfirmationVendorId] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    businessName: "",
    phoneNumber: "",
    email: "",
    agentName: "",
    address: "",
    rating: "",
  });
  const [vendorDetailsForm, setVendorDetailsForm] = useState({
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
  const [notesForm, setNotesForm] = useState({ note: "" });
  const [procurementNotesForm, setProcurementNotesForm] = useState({
    note: "",
  });
  const [costForm, setCostForm] = useState({
    partCost: "",
    shippingCost: "",
    grossProfit: "",
    totalCost: "",
  });
  const [editOrderForm, setEditOrderForm] = useState({
    clientName: "",
    phone: "",
    email: "",
    billingAddress: "",
    city: "",
    state: "",
    zip: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    make: "",
    model: "",
    year: "",
  });
  const [shipmentForm, setShipmentForm] = useState({
    weight: "",
    height: "",
    width: "",
    carrierName: "",
    trackingNumber: "",
    bolNumber: "",
    trackingLink: "",
  });
  const [simpleVendors, setSimpleVendors] = useState([]);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [showNotConfirmedVendors, setShowNotConfirmedVendors] = useState(false);
  const notesButtonRef = useRef(null);
  const procurementNotesButtonRef = useRef(null);
  const costButtonRef = useRef(null);
  const editOrderButtonRef = useRef(null);
  const shipmentButtonRef = useRef(null);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/orderbyid/${orderId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch order data");
      const orderData = await response.json();
      setOrder(orderData);
      setCostForm({
        partCost: orderData.leadId?.partCost || "",
        shippingCost: orderData.leadId?.shippingCost || "",
        grossProfit: orderData.leadId?.grossProfit || "",
        totalCost: orderData.leadId?.totalCost || "",
      });
      setEditOrderForm({
        clientName: orderData.clientName || "",
        phone: orderData.phone || "",
        email: orderData.email || "",
        billingAddress: orderData.billingAddress || "",
        city: orderData.city || "",
        state: orderData.state || "",
        zip: orderData.zip || "",
        shippingAddress: orderData.shippingAddress || "",
        shippingCity: orderData.shippingCity || "",
        shippingState: orderData.shippingState || "",
        shippingZip: orderData.shippingZip || "",
        make: orderData.make || "",
        model: orderData.model || "",
        year: orderData.year || "",
      });
      setShipmentForm({
        weight: orderData.weightAndDimensions?.weight ?? "",
        height: orderData.weightAndDimensions?.height ?? "",
        width: orderData.weightAndDimensions?.width ?? "",
        carrierName: orderData.carrierName ?? "",
        trackingNumber: orderData.trackingNumber ?? "",
        bolNumber: orderData.bolNumber ?? "",
        trackingLink: orderData.trackingLink ?? "",
      });
    } catch (error) {
      console.error("Error fetching order data:", error);
      toast.error("Failed to load order data");
      navigate("/home/orders");
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate totalCost when partCost, shippingCost, or grossProfit changes
  useEffect(() => {
    const partCost = parseFloat(costForm.partCost) || 0;
    const shippingCost = parseFloat(costForm.shippingCost) || 0;
    const grossProfit = parseFloat(costForm.grossProfit) || 0;
    const calculatedTotalCost = (partCost + shippingCost + grossProfit).toFixed(
      2
    );
    setCostForm((prev) => ({
      ...prev,
      totalCost: calculatedTotalCost,
    }));
  }, [costForm.partCost, costForm.shippingCost, costForm.grossProfit]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, orderRes, vendorsRes] = await Promise.all([
          fetch("http://localhost:3000/User/me", { credentials: "include" }),
          fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
            credentials: "include",
          }),
          fetch("http://localhost:3000/Order/vendor-simple", {
            credentials: "include",
          }),
        ]);
        if (!userRes.ok) throw new Error("Failed to fetch user data");
        if (!orderRes.ok) throw new Error("Failed to fetch order data");
        if (!vendorsRes.ok) throw new Error("Failed to fetch vendors");
        const userData = await userRes.json();
        const orderData = await orderRes.json();
        const vendorsData = await vendorsRes.json();
        setUser(userData.user);
        setOrder(orderData);
        setSimpleVendors(vendorsData);
        setCostForm({
          partCost: orderData.leadId?.partCost || "",
          shippingCost: orderData.leadId?.shippingCost || "",
          grossProfit: orderData.leadId?.grossProfit || "",
          totalCost: orderData.leadId?.totalCost || "",
        });
        setEditOrderForm({
          clientName: orderData.clientName || "",
          phone: orderData.phone || "",
          email: orderData.email || "",
          billingAddress: orderData.billingAddress || "",
          city: orderData.city || "",
          state: orderData.state || "",
          zip: orderData.zip || "",
          shippingAddress: orderData.shippingAddress || "",
          shippingCity: orderData.shippingCity || "",
          shippingState: orderData.shippingState || "",
          shippingZip: orderData.shippingZip || "",
          make: orderData.make || "",
          model: orderData.model || "",
          year: orderData.year || "",
        });
        setShipmentForm({
          weight: orderData.weightAndDimensions?.weight ?? "",
          height: orderData.weightAndDimensions?.height ?? "",
          width: orderData.weightAndDimensions?.width ?? "",
          carrierName: orderData.carrierName ?? "",
          trackingNumber: orderData.trackingNumber ?? "",
          bolNumber: orderData.bolNumber ?? "",
          trackingLink: orderData.trackingLink ?? "",
        });
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

  // Handle click outside to close forms
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notesButtonRef.current &&
        !notesButtonRef.current.contains(event.target) &&
        !event.target.closest(".notes-form")
      ) {
        closeNotesForm();
      }
      if (
        procurementNotesButtonRef.current &&
        !procurementNotesButtonRef.current.contains(event.target) &&
        !event.target.closest(".procurement-notes-form")
      ) {
        closeProcurementNotesForm();
      }
      if (
        costButtonRef.current &&
        !costButtonRef.current.contains(event.target) &&
        !event.target.closest(".cost-form")
      ) {
        closeCostForm();
      }
      if (
        editOrderButtonRef.current &&
        !editOrderButtonRef.current.contains(event.target) &&
        !event.target.closest(".edit-order-form")
      ) {
        closeEditOrderForm();
      }
      if (
        shipmentButtonRef.current &&
        !shipmentButtonRef.current.contains(event.target) &&
        !event.target.closest(".shipment-form")
      ) {
        closeShipmentForm();
      }
    };

    if (
      showNotesModal ||
      showProcurementNotesModal ||
      showCostModal ||
      showEditOrderModal ||
      showShipmentModal
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showNotesModal,
    showProcurementNotesModal,
    showCostModal,
    showEditOrderModal,
    showShipmentModal,
  ]);

  // Vendor form handlers
  const handleVendorFormChange = (e) => {
    const { name, value } = e.target;
    setVendorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/vendor-simple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            businessName: vendorForm.businessName,
            phoneNumber: vendorForm.phoneNumber,
            email: vendorForm.email,
            agentName: vendorForm.agentName,
            address: vendorForm.address,
            rating: vendorForm.rating,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error(
            "Vendor with this email and business name already exists"
          );
        }
        throw new Error(errorData.message || "Failed to create vendor");
      }
      toast.success("Vendor created successfully");
      setShowAddVendorModal(false);
      setVendorForm({
        businessName: "",
        phoneNumber: "",
        email: "",
        agentName: "",
        address: "",
        rating: "",
      });
      const vendorsRes = await fetch(
        "http://localhost:3000/Order/vendor-simple",
        { credentials: "include" }
      );
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setSimpleVendors(vendorsData);
      }
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error(error.message || "Failed to create vendor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendShipmentDetails = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/orders/${orderId}/send-shipment-details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send shipment details");
      }
      toast.success(data.message || "Shipment details sent successfully");
      await fetchOrderData(); // Refresh order data to reflect "Intransit" status and new note
    } catch (error) {
      console.error("Error sending shipment details:", error);
      toast.error(error.message || "Failed to send shipment details");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePOStatus = async (vendorId, newStatus) => {
    setActionLoading(true); // Add loading state
    try {
      const response = await fetch(
        `http://localhost:3000/Order/order/${order._id}/vendor/${vendorId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ poStatus: newStatus }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update PO status");
      }
      await fetchOrderData(); // Refresh order data
      toast.success(data.message || "PO status updated successfully");
    } catch (error) {
      console.error("Error updating PO status:", error);
      toast.error(error.message || "Failed to update PO status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPO = async (vendorId) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/order/${order._id}/vendor/${vendorId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ poStatus: "PO Canceled" }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel PO");
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success("PO canceled successfully");
      await fetchOrderData(); // Refresh order data
    } catch (error) {
      console.error("Error canceling PO:", error);
      toast.error(error.message || "Failed to cancel PO");
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
      const response = await fetch(
        `http://localhost:3000/Order/order/${orderId}/vendor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(vendorDetailsForm),
        }
      );
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
        corePrice: "",
        totalCost: "",
        rating: "",
        warranty: "",
        mileage: "",
      });
    } catch (error) {
      console.error("Error adding vendor to order:", error);
      toast.error(error.message || "Failed to add vendor to order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditVendorClick = (vendor) => {
    setEditVendorForm({
      businessName: vendor.businessName || "",
      phoneNumber: vendor.phoneNumber || "",
      email: vendor.email || "",
      agentName: vendor.agentName || "",
      costPrice: vendor.costPrice ? vendor.costPrice.toString() : "",
      shippingCost: vendor.shippingCost ? vendor.shippingCost.toString() : "",
      corePrice: vendor.corePrice ? vendor.corePrice.toString() : "",
      totalCost: vendor.totalCost ? vendor.totalCost.toString() : "",
      rating: vendor.rating ? vendor.rating.toString() : "",
      warranty: vendor.warranty || "",
      mileage: vendor.mileage ? vendor.mileage.toString() : "",
    });
    setEditingVendorId(vendor._id);
    setShowEditVendorModal(true);
  };

  const handleEditVendorFormChange = (e) => {
    const { name, value } = e.target;
    setEditVendorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditVendorFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        businessName: editVendorForm.businessName,
        phoneNumber: editVendorForm.phoneNumber,
        email: editVendorForm.email,
        agentName: editVendorForm.agentName,
        costPrice: parseFloat(editVendorForm.costPrice) || null,
        shippingCost: parseFloat(editVendorForm.shippingCost) || null,
        corePrice: parseFloat(editVendorForm.corePrice) || null,
        totalCost: parseFloat(editVendorForm.totalCost) || null,
        rating: parseFloat(editVendorForm.rating) || null,
        warranty: editVendorForm.warranty || null,
        mileage: parseInt(editVendorForm.mileage) || null,
      };
      const response = await fetch(
        `http://localhost:3000/Order/order/${orderId}/vendor/${editingVendorId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
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
      agentName: vendor.agentName || "", // Add fallback for agentName
      costPrice: order.leadId?.partCost ? order.leadId.partCost.toString() : "",
      shippingCost: order.leadId?.shippingCost
        ? order.leadId.shippingCost.toString()
        : "",
      corePrice: "",
      totalCost: order.leadId?.totalCost
        ? order.leadId.totalCost.toString()
        : "",
      rating: vendor.rating ? vendor.rating.toString() : "", // Already correct
      warranty: "",
      mileage: "",
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
      toast.success(
        `Vendor ${isConfirmed ? "confirmed" : "canceled"} successfully`
      );
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

  const handleConfirmPayment = async (vendorId) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/order/${orderId}/vendor/${vendorId}/confirm-payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to confirm payment");
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success("Payment confirmed successfully");
      await fetchOrderData(); // Refresh order data
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error(error.message || "Failed to confirm payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPOClick = async (vendorId) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/previewpurchaseorder/${orderId}?vendorId=${vendorId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok)
        throw new Error("Failed to fetch purchase order preview");
      const data = await response.json();
      setEmailPreviewContent(data.htmlContent);
      setConfirmationVendorId(vendorId);
      setShowEmailPreviewModal(true);
    } catch (error) {
      console.error("Error fetching purchase order preview:", error);
      toast.error("Failed to load purchase order preview");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePOConfirmed = async () => {
    setShowEmailPreviewModal(false);
    setEmailPreviewContent("");
    setConfirmationVendorId(null);
    await fetchOrderData(); // Refresh order data
  };

  const YourComponent = () => {
    const [dropdownState, setDropdownState] = useState({});
    // ... rest of your component
  };

  const handlePictureReceived = async (vendorId) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/order/${order._id}/vendor/${vendorId}/pictures-received`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to mark pictures received"
        );
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success("Pictures marked as received successfully");
      await fetchOrderData(); // Refresh order data
    } catch (error) {
      console.error("Error marking pictures received:", error);
      toast.error(error.message || "Failed to mark pictures received");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePictureSent = async (vendorId) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/order/${order._id}/vendor/${vendorId}/pictures-sent`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark pictures sent");
      }
      const data = await response.json();
      setOrder(data.order);
      toast.success("Pictures marked as sent successfully");
      await fetchOrderData(); // Refresh order data
    } catch (error) {
      console.error("Error marking pictures sent:", error);
      toast.error(error.message || "Failed to mark pictures sent");
    } finally {
      setActionLoading(false);
    }
  };

  // Notes form handlers
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
      const response = await fetch(
        `http://localhost:3000/Order/${orderId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ note: notesForm.note }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to submit note");
      }
      toast.success("Note added successfully");
      setShowNotesModal(false);
      setNotesForm({ note: "" });
      const responseOrder = await fetch(
        `http://localhost:3000/Order/orderbyid/${orderId}`,
        {
          credentials: "include",
        }
      );
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
    setShowNotesModal(false);
    setNotesForm({ note: "" });
  };

  // Procurement notes form handlers
  const handleProcurementNotesFormChange = (e) => {
    const { name, value } = e.target;
    setProcurementNotesForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProcurementNotesFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:3000/Order/${orderId}/procurementnotes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ note: procurementNotesForm.note }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to submit procurement note");
      }
      toast.success("Procurement note added successfully");
      setShowProcurementNotesModal(false);
      setProcurementNotesForm({ note: "" });
      const responseOrder = await fetch(
        `http://localhost:3000/Order/orderbyid/${orderId}`,
        {
          credentials: "include",
        }
      );
      if (responseOrder.ok) {
        const data = await responseOrder.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error submitting procurement note:", error);
      toast.error("Failed to add procurement note");
    }
  };

  const closeProcurementNotesForm = () => {
    setShowProcurementNotesModal(false);
    setProcurementNotesForm({ note: "" });
  };

  // Cost form handlers
  const handleCostFormChange = (e) => {
    const { name, value } = e.target;
    setCostForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCostFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/updatecost/${order.leadId._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            partCost: parseFloat(costForm.partCost) || 0,
            shippingCost: parseFloat(costForm.shippingCost) || 0,
            grossProfit: parseFloat(costForm.grossProfit) || 0,
            totalCost: parseFloat(costForm.totalCost) || 0,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update costs");
      }
      toast.success("Costs updated successfully");
      setShowCostModal(false);
      const responseOrder = await fetch(
        `http://localhost:3000/Order/orderbyid/${orderId}`,
        {
          credentials: "include",
        }
      );
      if (responseOrder.ok) {
        const data = await responseOrder.json();
        setOrder(data);
        setCostForm({
          partCost: data.leadId?.partCost || "",
          shippingCost: data.leadId?.shippingCost || "",
          grossProfit: data.leadId?.grossProfit || "",
          totalCost: data.leadId?.totalCost || "",
        });
      }
    } catch (error) {
      console.error("Error updating costs:", error);
      toast.error("Failed to update costs");
    }
  };

  const closeCostForm = () => {
    setShowCostModal(false);
    setCostForm({
      partCost: order.leadId?.partCost || "",
      shippingCost: order.leadId?.shippingCost || "",
      grossProfit: order.leadId?.grossProfit || "",
      totalCost: order.leadId?.totalCost || "",
    });
  };

  // Edit order form handlers
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
      const response = await fetch(
        `http://localhost:3000/Order/update/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(editOrderForm),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update order details");
      }
      const data = await response.json();
      toast.success("Order details updated successfully");
      setShowEditOrderModal(false);
      setOrder(data.order);
      setEditOrderForm({
        clientName: data.order.clientName || "",
        phone: data.order.phone || "",
        email: data.order.email || "",
        billingAddress: data.order.billingAddress || "",
        city: data.order.city || "",
        state: data.order.state || "",
        zip: data.order.zip || "",
        shippingAddress: data.order.shippingAddress || "",
        shippingCity: data.order.shippingCity || "",
        shippingState: data.order.shippingState || "",
        shippingZip: data.order.shippingZip || "",
        make: data.order.make || "",
        model: data.order.model || "",
        year: data.order.year || "",
      });
    } catch (error) {
      console.error("Error updating order details:", error);
      toast.error("Failed to update order details");
    }
  };

  const closeEditOrderForm = () => {
    setShowEditOrderModal(false);
    setEditOrderForm({
      clientName: order.clientName || "",
      phone: order.phone || "",
      email: order.email || "",
      billingAddress: order.billingAddress || "",
      city: order.city || "",
      state: order.state || "",
      zip: order.zip || "",
      shippingAddress: order.shippingAddress || "",
      shippingCity: order.shippingCity || "",
      shippingState: order.shippingState || "",
      shippingZip: order.shippingZip || "",
      make: order.make || "",
      model: order.model || "",
      year: order.year || "",
    });
  };

  // Shipment form handlers
  const handleShipmentFormChange = (e) => {
    const { name, value } = e.target;
    setShipmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShipmentFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:3000/Order/updateShipment/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            weight: parseFloat(shipmentForm.weight) || 0,
            height: parseFloat(shipmentForm.height) || 0,
            width: parseFloat(shipmentForm.width) || 0,
            carrierName: shipmentForm.carrierName,
            trackingNumber: shipmentForm.trackingNumber,
            bolNumber: shipmentForm.bolNumber,
            trackingLink: shipmentForm.trackingLink,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update shipment details"
        );
      }
      const data = await response.json();
      toast.success(data.message);
      setShowShipmentModal(false);
      setOrder(data.order);
      setShipmentForm({
        weight: data.order.weightAndDimensions?.weight ?? "",
        height: data.order.weightAndDimensions?.height ?? "",
        width: data.order.weightAndDimensions?.width ?? "",
        carrierName: data.order.carrierName ?? "",
        trackingNumber: data.order.trackingNumber ?? "",
        bolNumber: data.order.bolNumber ?? "",
        trackingLink: data.order.trackingLink ?? "",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to update shipment details");
    }
  };

  const closeShipmentForm = () => {
    setShowShipmentModal(false);
    setShipmentForm({
      weight: order.weightAndDimensions?.weight || "",
      height: order.weightAndDimensions?.height || "",
      width: order.weightAndDimensions?.width || "",
      carrierName: order.carrierName || "",
      trackingNumber: order.trackingNumber || "",
      bolNumber: order.bolNumber || "",
      trackingLink: order.trackingLink || "",
    });
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!order) {
      toast.error("No order available to export");
      return;
    }

    const formattedOrder = [
      { Field: "Order ID", Value: order.order_id || "N/A" },
      { Field: "Client Name", Value: order.clientName || "N/A" },
      { Field: "Phone", Value: order.phone || "N/A" },
      { Field: "Email", Value: order.email || "N/A" },
      { Field: "Billing Address", Value: order.billingAddress || "N/A" },
      { Field: "City", Value: order.city || "N/A" },
      { Field: "State", Value: order.state?.toUpperCase() || "N/A" },
      { Field: "Zip", Value: order.zip || "N/A" },
      { Field: "Shipping Address", Value: order.shippingAddress || "N/A" },
      { Field: "Shipping City", Value: order.shippingCity || "N/A" },
      {
        Field: "Shipping State",
        Value: order.shippingState?.toUpperCase() || "N/A",
      },
      { Field: "Shipping Zip", Value: order.shippingZip || "N/A" },
      { Field: "Make", Value: order.make || "N/A" },
      { Field: "Model", Value: order.model || "N/A" },
      { Field: "Year", Value: order.year || "N/A" },
      { Field: "Trim", Value: order.leadId?.trim || "N/A" },
      { Field: "Part Requested", Value: order.leadId?.partRequested || "N/A" },
      {
        Field: "Part Cost",
        Value: order.leadId?.partCost
          ? `$${order.leadId.partCost.toFixed(2)}`
          : "N/A",
      },
      {
        Field: "Shipping Cost",
        Value: order.leadId?.shippingCost
          ? `$${order.leadId.shippingCost.toFixed(2)}`
          : "N/A",
      },
      {
        Field: "Gross Profit",
        Value: order.leadId?.grossProfit
          ? `$${order.leadId.grossProfit.toFixed(2)}`
          : "N/A",
      },
      {
        Field: "Total Cost",
        Value: order.leadId?.totalCost
          ? `$${order.leadId.totalCost.toFixed(2)}`
          : "N/A",
      },
      {
        Field: "Amount",
        Value: order.amount ? `$${order.amount.toFixed(2)}` : "N/A",
      },
      { Field: "Order Status", Value: order.status || "N/A" },
      { Field: "Lead Status", Value: order.leadId?.status || "N/A" },
      {
        Field: "Sales Person",
        Value: order.salesPerson?.name || order.salesPerson?._id || "N/A",
      },
      {
        Field: "Order Created At",
        Value: order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : "N/A",
      },
      {
        Field: "Lead Created At",
        Value: order.leadId?.createdAt
          ? new Date(order.leadId.createdAt).toLocaleString()
          : "N/A",
      },
      {
        Field: "Weight",
        Value: order.weightAndDimensions?.weight
          ? `${order.weightAndDimensions.weight} lb`
          : "N/A",
      },
      {
        Field: "Height",
        Value: order.weightAndDimensions?.height
          ? `${order.weightAndDimensions.height} cm`
          : "N/A",
      },
      {
        Field: "Width",
        Value: order.weightAndDimensions?.width
          ? `${order.weightAndDimensions.width} cm`
          : "N/A",
      },
      { Field: "Carrier Name", Value: order.carrierName || "N/A" },
      { Field: "Tracking Number", Value: order.trackingNumber || "N/A" },
      { Field: "BOL Number", Value: order.bolNumber || "N/A" },
      { Field: "Tracking Link", Value: order.trackingLink || "N/A" },
      ...(order.vendors?.length > 0
        ? order.vendors.flatMap((vendor, index) => [
            {
              Field: `Vendor ${index + 1} Business Name`,
              Value: vendor.businessName || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Agent Name`,
              Value: vendor.agentName || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Phone Number`,
              Value: vendor.phoneNumber || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Email`,
              Value: vendor.email || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Cost Price`,
              Value: vendor.costPrice
                ? `$${vendor.costPrice.toFixed(2)}`
                : "N/A",
            },
            {
              Field: `Vendor ${index + 1} Shipping Cost`,
              Value: vendor.shippingCost
                ? `$${vendor.shippingCost.toFixed(2)}`
                : "N/A",
            },
            {
              Field: `Vendor ${index + 1} Core Price`,
              Value: vendor.corePrice
                ? `$${vendor.corePrice.toFixed(2)}`
                : "N/A",
            },
            {
              Field: `Vendor ${index + 1} Total Cost`,
              Value: vendor.totalCost
                ? `$${vendor.totalCost.toFixed(2)}`
                : "N/A",
            },
            {
              Field: `Vendor ${index + 1} Rating`,
              Value: vendor.rating || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Warranty`,
              Value: vendor.warranty || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Mileage`,
              Value: vendor.mileage || "N/A",
            },
            {
              Field: `Vendor ${index + 1} Created At`,
              Value: vendor.createdAt
                ? new Date(vendor.createdAt).toLocaleString()
                : "N/A",
            },
          ])
        : [{ Field: "Vendor", Value: "No vendor details available" }]),
      ...(user?.role === "admin"
        ? [
            { Field: "Card Number", Value: order.cardNumber || "N/A" },
            {
              Field: "Card Expiry",
              Value:
                order.cardMonth && order.cardYear
                  ? `${order.cardMonth}/${order.cardYear}`
                  : "N/A",
            },
            { Field: "Card CVV", Value: order.cvv || "N/A" },
          ]
        : []),
    ];

    try {
      exportToExcel(
        formattedOrder,
        `order_${order.order_id || "details"}.xlsx`
      );
      toast.success("Order exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting order to Excel");
      console.error("Error exporting to Excel:", error);
    }
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
            <div className="flex justify-center items-center py-12 ">
              <FullPageLoader />
            </div>
          ) : order ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
  <div className="flex items-center gap-4">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
      Order No: {order.order_id}
    </h2>
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        {
          "Locate Pending": "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
          "PO Pending": "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
          "PO Sent": "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
          "PO Confirmed": "bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-300",
          "Vendor Payment Pending": "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
          "Vendor Payment Confirmed": "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
          "Shipping Pending": "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
          "Ship Out": "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
          Intransit: "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
          Delivered: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-500",
          Replacement: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
          default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
        }[order.status] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      }`}
    >
      {order.status || "Unknown"}
    </span>
  </div>
  <button
    onClick={() => navigate("/home/orders")}
    className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 font-medium text-sm sm:text-base"
  >
    Back to Orders
  </button>
</div>
              <div className="space-y-6">
                {/* Customer Information */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Customer Details */}
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Customer Details</h3>
      <div className="space-y-4">
        {[
          { label: "Name", value: order.clientName || "N/A" },
          { label: "Phone", value: order.phone || "N/A" },
          { label: "Email", value: order.email || "N/A" },
        ].map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
            <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Order Information */}
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Order Information</h3>
      <div className="space-y-4">
        {[
          { label: "Order ID", value: order.order_id || "N/A" },
          { label: "Order Status", value: order.status || "N/A" },
          { label: "Lead Status", value: order.leadId?.status || "N/A" },
          { label: "Sales Person", value: order.salesPerson?.name || order.salesPerson?._id || "N/A" },
          { label: "Order Created At", value: order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A" },
          { label: "Lead Created At", value: order.leadId?.createdAt ? new Date(order.leadId.createdAt).toLocaleString() : "N/A" },
        ].map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
            <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
<section className="border-b border-gray-200 dark:border-gray-700 pb-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Billing Address */}
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Billing Address</h3>
      <div className="space-y-4">
        {[
          { label: "Address", value: order.billingAddress || "N/A" },
          { label: "City", value: order.city || "N/A" },
          { label: "State", value: order.state?.toUpperCase() || "N/A" },
          { label: "Zip", value: order.zip || "N/A" },
        ].map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
            <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Shipping Address */}
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Shipping Address</h3>
      <div className="space-y-4">
        {[
          { label: "Address", value: order.shippingAddress || "N/A" },
          { label: "City", value: order.shippingCity || "N/A" },
          { label: "State", value: order.shippingState?.toUpperCase() || "N/A" },
          { label: "Zip", value: order.shippingZip || "N/A" },
        ].map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
            <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
              {/* Vehicle Information */}
<section className="border-b border-gray-200 dark:border-gray-700 pb-8">
  <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Vehicle Details</h3>
  <div className="space-y-4">
    {[
      { label: "Make", value: order.make || "N/A" },
      { label: "Model", value: order.model || "N/A" },
      { label: "Year", value: order.year || "N/A" },
      { label: "Trim", value: order.leadId?.trim || "N/A" },
      { label: "Part", value: order.leadId?.partRequested || "N/A" },
    ].map((item, index) => (
      <div key={index} className="flex justify-between items-center">
        <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
        <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
      </div>
    ))}
  </div>
</section>

{/* Payment Information */}
<section className="border-b border-gray-200 dark:border-gray-700 pb-8">
  <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Payment Details</h3>
  <div className="space-y-4">
    {[
      { label: "Card", value: user?.role === "admin" ? order.cardNumber || "N/A" : "**** **** **** ****" },
      { label: "Expiry", value: order.cardMonth && order.cardYear ? `${order.cardMonth}/${order.cardYear}` : "N/A" },
      { label: "Part Cost", value: order.leadId?.partCost ? `$${order.leadId.partCost.toFixed(2)}` : "N/A" },
      { label: "Shipping", value: order.leadId?.shippingCost ? `$${order.leadId.shippingCost.toFixed(2)}` : "N/A" },
      { label: "Profit", value: order.leadId?.grossProfit ? `$${order.leadId.grossProfit.toFixed(2)}` : "N/A" },
      { label: "Total", value: order.leadId?.totalCost ? `$${order.leadId.totalCost.toFixed(2)}` : "N/A" },
      { label: "Amount", value: order.amount ? `$${order.amount.toFixed(2)}` : "N/A" },
    ].map((item, index) => (
      <div key={index} className="flex justify-between items-center">
        <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
        <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
      </div>
    ))}
  </div>
</section>

{/* Card Details (Visible only to admins) */}
{user?.role === "admin" && (
  <section className="pb-8">
    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Card Details</h3>
    <div className="space-y-4">
      {[
        { label: "Card", value: order.cardNumber || "N/A" },
        { label: "Month", value: order.cardMonth || "N/A" },
        { label: "Year", value: order.cardYear || "N/A" },
        { label: "CVV", value: order.cvv || "N/A" },
      ].map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <strong className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</strong>
          <p className="text-sm text-gray-900 dark:text-gray-200 text-right">{item.value}</p>
        </div>
      ))}
    </div>
  </section>
)}
                {/* Shipment Details */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Shipment Details
                  </h3>
                  <div className="flex flex-wrap gap-8 text-sm">
                    <div>
                      <strong className="font-semibold text-gray-600 dark:text-gray-400">
                        Weight and Dimensions:
                      </strong>
                      <span className="ml-1">
                        {order.weightAndDimensions?.weight &&
                        order.weightAndDimensions?.width &&
                        order.weightAndDimensions?.height
                          ? `${order.weightAndDimensions.weight} lb, ${order.weightAndDimensions.width}*${order.weightAndDimensions.height} cm`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-600 dark:text-gray-400">
                        Carrier Name:
                      </strong>
                      <span className="ml-1">{order.carrierName || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-600 dark:text-gray-400">
                        Tracking Number:
                      </strong>
                      <span className="ml-1">
                        {order.trackingNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-600 dark:text-gray-400">
                        BOL Number:
                      </strong>
                      <span className="ml-1">{order.bolNumber || "N/A"}</span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-600 dark:text-gray-400">
                        Tracking Link:
                      </strong>
                      <span className="ml-1">
                        {order.trackingLink ? (
                          <a
                            href={order.trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {order.trackingLink}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    {["procurement", "admin"].includes(user?.role) && (
                      <button
                        onClick={handleSendShipmentDetails}
                        className={`px-4 py-2 text-white rounded-md transition-colors text-sm ${
                          actionLoading ||
                          !order?.email ||
                          !order?.trackingNumber ||
                          !order?.carrierName
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        }`}
                        disabled={
                          actionLoading ||
                          !order?.email ||
                          !order?.trackingNumber ||
                          !order?.carrierName
                        }
                        aria-label="Send shipment details to customer"
                      >
                        {actionLoading ? (
                          <FullPageLoader
                            size="w-4 h-4"
                            color="text-white"
                            fill="fill-teal-200"
                          />
                        ) : (
                          "Send Shipment Details"
                        )}
                      </button>
                    )}
                  </div>
                </section>

                {/* Active Vendors */}
  <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Active Vendor
                  </h3>
                  {order.vendors &&
                  order.vendors.filter((v) => v.poStatus === "PO Confirmed")
                    .length > 0 ? (
                    <ul className="space-y-4">
                      {order.vendors
                        .filter((v) => v.poStatus === "PO Confirmed")
                        .map((vendor) => (
                          <li
                            key={vendor._id}
                            className="relative p-4 bg-green-50 dark:bg-green-900/30 rounded-lg shadow-sm"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-0 sm:pr-32">
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
                                <p>
                                  {vendor.costPrice
                                    ? `$${vendor.costPrice.toFixed(2)}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Shipping Cost
                                </strong>
                                <p>
                                  {vendor.shippingCost
                                    ? `$${vendor.shippingCost.toFixed(2)}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Core Price
                                </strong>
                                <p>
                                  {vendor.corePrice
                                    ? `$${vendor.corePrice.toFixed(2)}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Total Cost
                                </strong>
                                <p>
                                  {vendor.totalCost
                                    ? `$${vendor.totalCost.toFixed(2)}`
                                    : "N/A"}
                                </p>
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
                                  Order Status
                                </strong>
                                <p>{order.status || "N/A"}</p>
                              </div>
                              <div>
                                <strong className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  PO Status
                                </strong>
                                <p className="text-green-600 dark:text-green-400">
                                  {vendor.poStatus}
                                </p>
                              </div>
                            </div>
                            <div className="absolute top-4 right-4 flex flex-col space-y-2 sm:space-y-2">
                              <button
                                onClick={() => handleEditVendorClick(vendor)}
                                className={`w-32 px-3 py-1 text-white rounded-md transition-colors text-sm flex items-center justify-center space-x-1 ${
                                  actionLoading
                                    ? "bg-green-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                }`}
                                aria-label={`Edit vendor ${vendor.businessName}`}
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <FullPageLoader
                                    size="w-4 h-4"
                                    color="text-white"
                                    fill="fill-green-200"
                                  />
                                ) : (
                                  <span>Edit Details</span>
                                )}
                              </button>
                              <div className="relative group">
                                <button
                                  onClick={() =>
                                    handleConfirmPayment(vendor._id)
                                  }
                                  className={`w-32 px-3 py-1 text-white rounded-md transition-colors text-sm flex items-center justify-center space-x-1 ${
                                    actionLoading ||
                                    [
                                      "Vendor Payment Confirmed",
                                      "Shipping Pending",
                                      "Ship Out",
                                      "Intransit",
                                      "Delivered",
                                      "Replacement",
                                    ].includes(order.status)
                                      ? "bg-green-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  }`}
                                  aria-label={`Confirm payment for vendor ${vendor.businessName}`}
                                  disabled={
                                    actionLoading ||
                                    [
                                      "Vendor Payment Confirmed",
                                      "Shipping Pending",
                                      "Ship Out",
                                      "Intransit",
                                      "Delivered",
                                      "Replacement",
                                    ].includes(order.status)
                                  }
                                >
                                  {actionLoading ? (
                                    <FullPageLoader
                                      size="w-4 h-4"
                                      color="text-white"
                                      fill="fill-green-200"
                                    />
                                  ) : (
                                    <>
                                      <span>Confirm Payment</span>
                                      {(actionLoading ||
                                        [
                                          "Vendor Payment Confirmed",
                                          "Shipping Pending",
                                          "Ship Out",
                                          "Intransit",
                                          "Delivered",
                                          "Replacement",
                                        ].includes(order.status)) && (
                                        <svg
                                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 2.9 2 4zm0 0c0 1.1.9 2 2 2s2-.9 2-2-2-4-2-4-2 2.9-2 4zm-6 7h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z"
                                          />
                                        </svg>
                                      )}
                                    </>
                                  )}
                                </button>
                                {(actionLoading ||
                                  [
                                    "Vendor Payment Confirmed",
                                    "Shipping Pending",
                                    "Ship Out",
                                    "Intransit",
                                    "Delivered",
                                    "Replacement",
                                  ].includes(order.status)) && (
                                  <span
                                    className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600/80 text-white text-xs rounded-md"
                                    role="tooltip"
                                  >
                                    Not Allowed, since payment confirmed
                                  </span>
                                )}
                              </div>
                              <div className="relative group">
                                <button
                                  onClick={() => handleCancelPO(vendor._id)}
                                  className={`w-32 px-3 py-1 text-white rounded-md transition-colors text-sm flex items-center justify-center space-x-1 ${
                                    actionLoading ||
                                    [
                                      "Vendor Payment Confirmed",
                                      "Shipping Pending",
                                      "Ship Out",
                                      "Intransit",
                                      "Delivered",
                                      "Replacement",
                                    ].includes(order.status)
                                      ? "bg-green-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  }`}
                                  aria-label={`Cancel PO for vendor ${vendor.businessName}`}
                                  disabled={
                                    actionLoading ||
                                    [
                                      "Vendor Payment Confirmed",
                                      "Shipping Pending",
                                      "Ship Out",
                                      "Intransit",
                                      "Delivered",
                                      "Replacement",
                                    ].includes(order.status)
                                  }
                                >
                                  {actionLoading ? (
                                    <FullPageLoader
                                      size="w-4 h-4"
                                      color="text-white"
                                      fill="fill-green-200"
                                    />
                                  ) : (
                                    <>
                                      <span>Cancel PO</span>
                                      {(actionLoading ||
                                        [
                                          "Vendor Payment Confirmed",
                                          "Shipping Pending",
                                          "Ship Out",
                                          "Intransit",
                                          "Delivered",
                                          "Replacement",
                                        ].includes(order.status)) && (
                                        <svg
                                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 2.9 2 4zm0 0c0 1.1.9 2 2 2s2-.9 2-2-2-4-2-4-2 2.9-2 4zm-6 7h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z"
                                          />
                                        </svg>
                                      )}
                                    </>
                                  )}
                                </button>
                                {(actionLoading ||
                                  [
                                    "Vendor Payment Confirmed",
                                    "Shipping Pending",
                                    "Ship Out",
                                    "Intransit",
                                    "Delivered",
                                    "Replacement",
                                  ].includes(order.status)) && (
                                  <span
                                    className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600/80 text-white text-xs rounded-md"
                                    role="tooltip"
                                  >
                                    Not Allowed, since payment confirmed
                                  </span>
                                )}
                              </div>
                              <div className="relative group">
                                <button
                                  onClick={() =>
                                    handleToggleVendorConfirmation(
                                      vendor._id,
                                      "cancel"
                                    )
                                  }
                                  className={`w-32 px-3 py-1 text-white rounded-md transition-colors text-sm flex items-center justify-center space-x-1 ${
                                    actionLoading || !vendor.isConfirmed
                                      ? "bg-green-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  }`}
                                  aria-label={`Cancel vendor ${vendor.businessName}`}
                                  disabled={
                                    actionLoading || !vendor.isConfirmed
                                  }
                                >
                                  {actionLoading ? (
                                    <FullPageLoader
                                      size="w-4 h-4"
                                      color="text-white"
                                      fill="fill-green-200"
                                    />
                                  ) : (
                                    <>
                                      <span>Cancel Vendor</span>
                                      {(actionLoading ||
                                        !vendor.isConfirmed) && (
                                        <svg
                                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 2.9 2 4zm0 0c0 1.1.9 2 2 2s2-.9 2-2-2-4-2-4-2 2.9-2 4zm-6 7h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z"
                                          />
                                        </svg>
                                      )}
                                    </>
                                  )}
                                </button>
                                {(actionLoading || !vendor.isConfirmed) && (
                                  <span
                                    className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600/80 text-white text-xs rounded-md"
                                    role="tooltip"
                                  >
                                    Vendor Not Confirmed
                                  </span>
                                )}
                              </div>
                              <div className="relative group">
                                <button
                                  onClick={() =>
                                    handlePictureReceived(vendor._id)
                                  }
                                  className={`w-32 px-3 py-1 text-white rounded-md transition-colors text-sm flex items-center justify-center space-x-1 ${
                                    actionLoading ||
                                    order.picturesReceivedFromYard
                                      ? "bg-green-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  }`}
                                  aria-label={`Mark picture received from yard for ${vendor.businessName}`}
                                  disabled={
                                    actionLoading ||
                                    order.picturesReceivedFromYard
                                  }
                                >
                                  {actionLoading ? (
                                    <FullPageLoader
                                      size="w-4 h-4"
                                      color="text-white"
                                      fill="fill-green-200"
                                    />
                                  ) : (
                                    <>
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      <span>Picture Received</span>
                                    </>
                                  )}
                                </button>
                                {(actionLoading ||
                                  order.picturesReceivedFromYard) && (
                                  <span
                                    className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600/80 text-white text-xs rounded-md"
                                    role="tooltip"
                                  >
                                    {order.picturesReceivedFromYard
                                      ? "Already Received"
                                      : "Action in Progress"}
                                  </span>
                                )}
                              </div>
                              <div className="relative group">
                                <button
                                  onClick={() => handlePictureSent(vendor._id)}
                                  className={`w-32 px-3 py-1 text-white rounded-md transition-colors text-sm flex items-center justify-center space-x-1 ${
                                    actionLoading ||
                                    order.picturesSentToCustomer ||
                                    !order.picturesReceivedFromYard
                                      ? "bg-green-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  }`}
                                  aria-label={`Mark picture sent to customer for ${vendor.businessName}`}
                                  disabled={
                                    actionLoading ||
                                    order.picturesSentToCustomer ||
                                    !order.picturesReceivedFromYard
                                  }
                                >
                                  {actionLoading ? (
                                    <FullPageLoader
                                      size="w-4 h-4"
                                      color="text-white"
                                      fill="fill-green-200"
                                    />
                                  ) : (
                                    <>
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      <span>Picture Sent</span>
                                    </>
                                  )}
                                </button>
                                {(actionLoading ||
                                  order.picturesSentToCustomer ||
                                  !order.picturesReceivedFromYard) && (
                                  <span
                                    className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600/80 text-white text-xs rounded-md"
                                    role="tooltip"
                                  >
                                    {order.picturesSentToCustomer
                                      ? "Already Sent"
                                      : !order.picturesReceivedFromYard
                                      ? "Receive Pictures First"
                                      : "Action in Progress"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No confirmed vendors.
                    </p>
                  )}
                </section>
                {/* Not Confirmed Vendors */}
                <section className="pb-6">
                  <button
                    onClick={() =>
                      setShowNotConfirmedVendors(!showNotConfirmedVendors)
                    }
                    className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    aria-expanded={showNotConfirmedVendors}
                  >
                    <span>
                      {showNotConfirmedVendors ? "Hide" : "Show"} Vendor History
                    </span>
                    <svg
                      className={`ml-2 w-4 h-4 sm:w-5 sm:h-5 transform ${
                        showNotConfirmedVendors ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showNotConfirmedVendors && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {order.vendors && order.vendors.length > 0 ? (
                        <ul className="space-y-4">
                          {order.vendors
                            .sort((a, b) => {
                              // Push "PO Canceled" to bottom
                              if (
                                a.poStatus === "PO Canceled" &&
                                b.poStatus !== "PO Canceled"
                              )
                                return 1;
                              if (
                                a.poStatus !== "PO Canceled" &&
                                b.poStatus === "PO Canceled"
                              )
                                return -1;
                              // Sort by createdAt descending (newest first)
                              return (
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                              );
                            })
                            .map((vendor) => (
                              <li
                                key={vendor._id}
                                className="p-3 bg-gray-100 dark:bg-gray-600 rounded-md"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex flex-col sm:items-start">
                                    <span className="text-sm sm:text-base font-semibold">
                                      {vendor.businessName}
                                    </span>
                                    <span
                                      className={`text-xs sm:text-sm ${
                                        vendor.isConfirmed &&
                                        vendor.poStatus === "PO Confirmed"
                                          ? "text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-1 rounded"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      isConfirmed:{" "}
                                      {vendor.isConfirmed
                                        ? "Confirmed"
                                        : "Not Confirmed"}
                                    </span>
                                    <span
                                      className={`text-xs sm:text-sm ${
                                        vendor.isConfirmed &&
                                        vendor.poStatus === "PO Confirmed"
                                          ? "text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-1 rounded"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      PO Status: {vendor.poStatus}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2 mt-2 sm:mt-0 items-center">
                                    <select
                                      value={vendor.poStatus}
                                      onChange={(e) =>
                                        handleUpdatePOStatus(
                                          vendor._id,
                                          e.target.value
                                        )
                                      }
                                      disabled={
                                        vendor.isConfirmed ||
                                        !["PO Sent", "PO Confirmed"].includes(
                                          vendor.poStatus
                                        )
                                      }
                                      className={`text-xs sm:text-sm border rounded-md p-1 ${
                                        vendor.poStatus === "PO Confirmed"
                                          ? "text-green-600 dark:text-green-400 border-green-600"
                                          : vendor.poStatus === "PO Canceled"
                                          ? "text-red-600 dark:text-red-400 border-red-600"
                                          : vendor.poStatus === "PO Sent"
                                          ? "text-blue-600 dark:text-blue-400 border-blue-600"
                                          : "text-gray-600 dark:text-gray-400 border-gray-600"
                                      } ${
                                        vendor.isConfirmed ||
                                        !["PO Sent", "PO Confirmed"].includes(
                                          vendor.poStatus
                                        )
                                          ? "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
                                          : "bg-white dark:bg-gray-800 cursor-pointer"
                                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                      aria-label={`Set PO status for ${vendor.businessName}`}
                                    >
                                      <option value={vendor.poStatus}>
                                        {vendor.poStatus}
                                      </option>
                                      {vendor.poStatus === "PO Sent" && (
                                        <>
                                          <option value="PO Confirmed">
                                            PO Confirmed
                                          </option>
                                          <option value="PO Canceled">
                                            PO Canceled
                                          </option>
                                        </>
                                      )}
                                      {vendor.poStatus === "PO Confirmed" && (
                                        <option value="PO Canceled">
                                          PO Canceled
                                        </option>
                                      )}
                                    </select>
                                    <button
                                      onClick={() =>
                                        handleSendPOClick(vendor._id)
                                      }
                                      className={`px-3 py-1 text-white rounded-md transition-colors text-sm ${
                                        vendor.poStatus !== "PO Pending"
                                          ? "bg-gray-400 cursor-not-allowed"
                                          : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      }`}
                                      aria-label={`Send PO to ${vendor.businessName}`}
                                      disabled={
                                        vendor.poStatus !== "PO Pending"
                                      }
                                    >
                                      Send PO
                                    </button>
                                  </div>
                                </div>
                                {vendor.notes && vendor.notes.length > 0 ? (
                                  <div className="mt-2 max-h-32 overflow-y-auto p-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                                    <ul className="space-y-1">
                                      {[...vendor.notes]
                                        .reverse()
                                        .map((note, index) => (
                                          <li
                                            key={index}
                                            className="p-1 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 text-sm"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span>{note.text || note}</span>
                                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {note.createdAt
                                                  ? new Date(
                                                      note.createdAt
                                                    ).toLocaleString()
                                                  : "N/A"}
                                              </span>
                                            </div>
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    No vendor notes available
                                  </p>
                                )}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          No vendors available.
                        </p>
                      )}
                    </div>
                  )}
                </section>
                {/* Notes Section */}
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Notes
                  </h3>
                  <div className="max-h-64 overflow-y-auto p-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    {order.notes && order.notes.length > 0 ? (
                      <ul className="space-y-2">
                        {[...order.notes].reverse().map((note, index) => (
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
                      <p className="text-gray-600 dark:text-gray-400">
                        No notes available
                      </p>
                    )}
                  </div>
                </section>
                <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Procurement Notes
                  </h3>
                  <div className="max-h-64 overflow-y-auto p-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    {order.procurementnotes &&
                    order.procurementnotes.length > 0 ? (
                      <ul className="space-y-2">
                        {[...order.procurementnotes]
                          .reverse()
                          .map((note, index) => (
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
                      <p className="text-gray-600 dark:text-gray-400">
                        No procurement notes available
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              No order details available.
            </p>
          )}
        </div>
        <div className="lg:w-80 w-full">
          <div className="sticky top-6 space-y-4">
            {["procurement", "admin"].includes(user?.role) && (
              <>
                <button
                  onClick={() => setShowAddVendorModal(true)}
                  className="w-full px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm sm:text-base"
                >
                  Add New Vendor
                </button>
                <button
                  onClick={() => {
                    setShowAssociateVendorModal(true);
                  }}
                  className="w-full px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm sm:text-base"
                >
                  Associate Vendor
                </button>
              </>
            )}
            <button
              ref={notesButtonRef}
              onClick={() => setShowNotesModal(!showNotesModal)}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base"
            >
              Add Note
            </button>
            {["procurement", "admin"].includes(user?.role) && (
              <button
                ref={procurementNotesButtonRef}
                onClick={() =>
                  setShowProcurementNotesModal(!showProcurementNotesModal)
                }
                className="w-full px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm sm:text-base"
              >
                Add Procurement Note
              </button>
            )}
            {["procurement", "admin"].includes(user?.role) && (
              <button
                ref={costButtonRef}
                onClick={() => setShowCostModal(!showCostModal)}
                className="w-full px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors text-sm sm:text-base"
              >
                Edit Costs
              </button>
            )}
            {["procurement"].includes(user?.role) && (
              <button
                ref={shipmentButtonRef}
                onClick={() => setShowShipmentModal(!showShipmentModal)}
                className="w-full px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors text-sm sm:text-base"
              >
                Add Shipment Details
              </button>
            )}
            {["customer_relations", "admin"].includes(user?.role) && (
              <button
                ref={editOrderButtonRef}
                onClick={() => setShowEditOrderModal(!showEditOrderModal)}
                className="w-full px-4 py-2 bg-teal-600 dark:bg-teal-500 text-white rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
              >
                Edit Order Details
              </button>
            )}
            <button
              onClick={handleExportToExcel}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base"
              disabled={loading || !order}
            >
              Download as Excel
            </button>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        title="Add New Vendor"
      >
        <form onSubmit={handleVendorFormSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Business Name
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Phone Number
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={vendorForm.email}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Agent Name
            </label>
            <input
              type="text"
              name="agentName"
              value={vendorForm.agentName}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={vendorForm.address}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Rating (0-5)
            </label>
            <input
              type="number"
              name="rating"
              value={vendorForm.rating}
              onChange={handleVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max="5"
              step="0.1"
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
                <FullPageLoader
                  size="w-4 h-4"
                  color="text-white"
                  fill="fill-blue-200"
                />
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
                onKeyPress={(e) =>
                  e.key === "Enter" && handleSelectVendor(vendor)
                }
              >
                <p className="font-semibold text-sm sm:text-base">
                  {vendor.businessName}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {vendor.email}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No vendors available.
          </p>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              value={vendorDetailsForm.businessName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={vendorDetailsForm.phoneNumber}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={vendorDetailsForm.email}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Agent Name
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Cost Price ($)
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping Cost ($)
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Core Price ($)
            </label>
            <input
              type="number"
              name="corePrice"
              value={vendorDetailsForm.corePrice}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Cost ($)
            </label>
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
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Rating (0-5)
            </label>
            <input
              type="number"
              name="rating"
              value={vendorDetailsForm.rating}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max="5"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Warranty
            </label>
            <input
              type="text"
              name="warranty"
              value={vendorDetailsForm.warranty}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Mileage
            </label>
            <input
              type="number"
              name="mileage"
              value={vendorDetailsForm.mileage}
              onChange={handleVendorDetailsFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
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
                <FullPageLoader
                  size="w-4 h-4"
                  color="text-white"
                  fill="fill-blue-200"
                />
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Business Name
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Phone Number
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Email
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Agent Name
            </label>
            <input
              type="text"
              name="agentName"
              value={editVendorForm.agentName}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Cost Price ($)
            </label>
            <input
              type="number"
              name="costPrice"
              value={editVendorForm.costPrice}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping Cost ($)
            </label>
            <input
              type="number"
              name="shippingCost"
              value={editVendorForm.shippingCost}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Core Price ($)
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Cost ($)
            </label>
            <input
              type="number"
              name="totalCost"
              value={editVendorForm.totalCost}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Rating (0-5)
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Warranty
            </label>
            <input
              type="text"
              name="warranty"
              value={editVendorForm.warranty}
              onChange={handleEditVendorFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Mileage
            </label>
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
                <FullPageLoader
                  size="w-4 h-4"
                  color="text-white"
                  fill="fill-blue-200"
                />
              ) : (
                "Update"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="Confirm Action"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to{" "}
          {confirmationAction === "confirm" ? "confirm" : "cancel"} this
          vendor's PO?
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
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <FullPageLoader
                size="w-4 h-4"
                color="text-white"
                fill="fill-blue-200"
              />
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </Modal>

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={showEmailPreviewModal}
        onClose={() => setShowEmailPreviewModal(false)}
        emailContent={emailPreviewContent}
        orderId={orderId}
        vendorId={confirmationVendorId}
        onPOConfirmed={handlePOConfirmed}
      />

      {/* Notes Modal */}
      <Modal isOpen={showNotesModal} onClose={closeNotesForm} title="Add Note">
        <form onSubmit={handleNotesFormSubmit} className="space-y-3 notes-form">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Note
            </label>
            <textarea
              name="note"
              value={notesForm.note}
              onChange={handleNotesFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows="4"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeNotesForm}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>

      {/* Procurement Notes Modal */}
      <Modal
        isOpen={showProcurementNotesModal}
        onClose={closeProcurementNotesForm}
        title="Add Procurement Note"
      >
        <form
          onSubmit={handleProcurementNotesFormSubmit}
          className="space-y-3 procurement-notes-form"
        >
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Procurement Note
            </label>
            <textarea
              name="note"
              value={procurementNotesForm.note}
              onChange={handleProcurementNotesFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows="4"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeProcurementNotesForm}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>

      {/* Cost Modal */}
      <Modal isOpen={showCostModal} onClose={closeCostForm} title="Edit Costs">
        <form onSubmit={handleCostFormSubmit} className="space-y-3 cost-form">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Part Cost ($)
            </label>
            <input
              type="number"
              name="partCost"
              value={costForm.partCost}
              onChange={handleCostFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping Cost ($)
            </label>
            <input
              type="number"
              name="shippingCost"
              value={costForm.shippingCost}
              onChange={handleCostFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Gross Profit ($)
            </label>
            <input
              type="number"
              name="grossProfit"
              value={costForm.grossProfit}
              onChange={handleCostFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Cost ($)
            </label>
            <input
              type="number"
              name="totalCost"
              value={costForm.totalCost}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeCostForm}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={showEditOrderModal}
        onClose={closeEditOrderForm}
        title="Edit Order Details"
      >
        <form
          onSubmit={handleEditOrderFormSubmit}
          className="space-y-3 edit-order-form"
        >
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Client Name
            </label>
            <input
              type="text"
              name="clientName"
              value={editOrderForm.clientName}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={editOrderForm.phone}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={editOrderForm.email}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Billing Address
            </label>
            <input
              type="text"
              name="billingAddress"
              value={editOrderForm.billingAddress}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              City
            </label>
            <input
              type="text"
              name="city"
              value={editOrderForm.city}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              State
            </label>
            <input
              type="text"
              name="state"
              value={editOrderForm.state}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Zip
            </label>
            <input
              type="text"
              name="zip"
              value={editOrderForm.zip}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping Address
            </label>
            <input
              type="text"
              name="shippingAddress"
              value={editOrderForm.shippingAddress}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping City
            </label>
            <input
              type="text"
              name="shippingCity"
              value={editOrderForm.shippingCity}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping State
            </label>
            <input
              type="text"
              name="shippingState"
              value={editOrderForm.shippingState}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Shipping Zip
            </label>
            <input
              type="text"
              name="shippingZip"
              value={editOrderForm.shippingZip}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Make
            </label>
            <input
              type="text"
              name="make"
              value={editOrderForm.make}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={editOrderForm.model}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={editOrderForm.year}
              onChange={handleEditOrderFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="1900"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeEditOrderForm}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>

      {/* Shipment Modal */}
      <Modal
        isOpen={showShipmentModal}
        onClose={closeShipmentForm}
        title="Add Shipment Details"
      >
        <form
          onSubmit={handleShipmentFormSubmit}
          className="space-y-3 shipment-form"
        >
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Weight (lb)
            </label>
            <input
              type="number"
              name="weight"
              value={shipmentForm.weight}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Height (cm)
            </label>
            <input
              type="number"
              name="height"
              value={shipmentForm.height}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Width (cm)
            </label>
            <input
              type="number"
              name="width"
              value={shipmentForm.width}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Carrier Name
            </label>
            <input
              type="text"
              name="carrierName"
              value={shipmentForm.carrierName}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Tracking Number
            </label>
            <input
              type="text"
              name="trackingNumber"
              value={shipmentForm.trackingNumber}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              BOL Number
            </label>
            <input
              type="text"
              name="bolNumber"
              value={shipmentForm.bolNumber}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Tracking Link
            </label>
            <input
              type="text"
              name="trackingLink"
              value={shipmentForm.trackingLink}
              onChange={handleShipmentFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., https://example.com/track"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeShipmentForm}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderDetails;
