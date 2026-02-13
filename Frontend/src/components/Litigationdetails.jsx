import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmationModal from "./ConfirmationModal";

const statusTextColors = {
  Litigation: "text-green-600 dark:text-green-400",
  Replacement: "text-orange-600 dark:text-orange-400",
  "Replacement Cancelled": "text-red-600 dark:text-red-400",
  Resolved: "text-blue-600 dark:text-blue-400",
};

const LitigationDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [order, setOrder] = useState(null);
  const [litigationData, setLitigationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Controls whether Replacement is allowed after re-open from Resolved
  const [canShowReplacement, setCanShowReplacement] = useState(true);

  // For manually adding litigation notes
  const [newLitigationNote, setNewLitigationNote] = useState("");

  const [openSections, setOpenSections] = useState({
    vendorNotes: false,
    procurementNotes: false,
    orderNotes: false,
    litigationHistory: false,
    litigationNotes: false,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReplacementDropdownOpen, setIsReplacementDropdownOpen] = useState(false);

  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundConfirmAction, setRefundConfirmAction] = useState(null);

  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [resolveConfirmAction, setResolveConfirmAction] = useState(null);

  const [formData, setFormData] = useState({
    deliveryDate: "",
    installationDate: "",
    problemOccurredDate: "",
    problemInformedDate: "",
    receivedPictures: false,
    receivedDiagnosticReport: false,
    problemDescription: "",
    resolutionNotes: "",
  });

  // Fetch order + litigation
  const fetchOrderAndLitigation = async () => {
    setIsLoading(true);
    try {
      const orderResponse = await fetch(`${import.meta.env.VITE_API_URL}/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
          navigate("/login");
          return;
        }
        if (orderResponse.status === 404) {
          setOrder(null);
          toast.info("Order not found");
          return;
        }
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || "Failed to fetch order");
      }
      const orderData = await orderResponse.json();
      setOrder(orderData);

      // Reset Replacement permission if currently Resolved
      setCanShowReplacement(orderData.status !== "Resolved");

      const litigationResponse = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/litigation/${orderId}`, {
        credentials: "include",
      });
      if (litigationResponse.ok) {
        const litigation = await litigationResponse.json();
        setLitigationData(litigation);
        setFormData({
          deliveryDate: litigation.deliveryDate ? litigation.deliveryDate.split('T')[0] : '',
          installationDate: litigation.installationDate ? litigation.installationDate.split('T')[0] : '',
          problemOccurredDate: litigation.problemOccurredDate ? litigation.problemOccurredDate.split('T')[0] : '',
          problemInformedDate: litigation.problemInformedDate ? litigation.problemInformedDate.split('T')[0] : '',
          receivedPictures: litigation.receivedPictures || false,
          receivedDiagnosticReport: litigation.receivedDiagnosticReport || false,
          problemDescription: litigation.problemDescription || '',
          resolutionNotes: litigation.resolutionNotes || '',
        });
      } else {
        setLitigationData(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndLitigation();
  }, [orderId, navigate]);

  const openForm = () => {
    if (actionLoading) return;
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (actionLoading) return;
    setIsFormOpen(false);
  };

  const validateLitigationForm = () => {
    const required = [
      { value: formData.deliveryDate?.trim(), label: "Delivery Date" },
      { value: formData.installationDate?.trim(), label: "Installation Date" },
      { value: formData.problemOccurredDate?.trim(), label: "Problem Occurred Date" },
      { value: formData.problemInformedDate?.trim(), label: "Problem Informed Date" },
      { value: formData.problemDescription?.trim(), label: "What's the Problem" },
    ];

    const missing = required.filter(field => !field.value);

    if (missing.length > 0) {
      const missingLabels = missing.map(f => f.label).join(", ");
      toast.error(`Please fill all required fields: ${missingLabels}`);
      return false;
    }

    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateLitigationForm()) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/update-litigation/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update litigation details");
      }

      const updated = await response.json();
      setLitigationData(updated.litigation);

      setFormData({
        deliveryDate: updated.litigation.deliveryDate ? updated.litigation.deliveryDate.split('T')[0] : '',
        installationDate: updated.litigation.installationDate ? updated.litigation.installationDate.split('T')[0] : '',
        problemOccurredDate: updated.litigation.problemOccurredDate ? updated.litigation.problemOccurredDate.split('T')[0] : '',
        problemInformedDate: updated.litigation.problemInformedDate ? updated.litigation.problemInformedDate.split('T')[0] : '',
        receivedPictures: updated.litigation.receivedPictures || false,
        receivedDiagnosticReport: updated.litigation.receivedDiagnosticReport || false,
        problemDescription: updated.litigation.problemDescription || '',
        resolutionNotes: updated.litigation.resolutionNotes || '',
      });

      await fetchOrderAndLitigation();

      const wasResolved = order?.status === "Resolved";
      if (wasResolved) {
        setCanShowReplacement(true);
      }

      toast.success(
        wasResolved
          ? "Litigation updated successfully — order status changed back to Litigation"
          : "Litigation details updated successfully"
      );

      setIsFormOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update litigation details");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ────────────────────────────────────────────────
  // New: Add manual litigation note
  // ────────────────────────────────────────────────
  const handleAddLitigationNote = async () => {
    if (!newLitigationNote.trim()) {
      toast.warn("Please enter some text for the note");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/litigation/${orderId}/note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text: newLitigationNote.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add note");
      }

      // Clear input
      setNewLitigationNote("");

      // Refresh litigation data (notes will update)
      await fetchOrderAndLitigation();

      toast.success("Note added successfully");
    } catch (error) {
      toast.error(error.message || "Failed to add note");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRMA = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/send-rma/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send RMA form");
      }

      toast.success("RMA form sent successfully");
      await fetchOrderAndLitigation();
    } catch (error) {
      toast.error(error.message || "Failed to send RMA form");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplacement = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/updateStatus/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Replacement" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      const data = await response.json();

      if (data.alreadyExists) {
        toast.info(`Replacement already exists: ${data.replacementOrder?.order_id || "N/A"}`);
      } else {
        toast.success("Order status updated to Replacement");
        await fetchOrderAndLitigation();
      }

      setIsReplacementDropdownOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  const hasMeaningfulLitigation = litigationData && (
    litigationData.deliveryDate ||
    litigationData.installationDate ||
    litigationData.problemOccurredDate ||
    litigationData.problemInformedDate ||
    litigationData.receivedPictures ||
    litigationData.receivedDiagnosticReport ||
    litigationData.problemDescription?.trim() ||
    litigationData.resolutionNotes?.trim()
  );

  const formatAddress = (address, city, state, zip) => {
    if (!address && !city && !state && !zip) return "N/A";
    return `${address || ""}, ${city || ""}, ${state || ""} ${zip || ""}`.trim();
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) : "N/A";
  };

  const toggleSection = (section) => {
    if (actionLoading) return;
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleResolveClick = () => {
    if (actionLoading) return;

    if (order?.status !== "Litigation") {
      toast.warn("This order is no longer in Litigation status. Cannot resolve now.");
      return;
    }

    if (!hasMeaningfulLitigation) {
      toast.warn("Please fill at least one field in the Litigation form first");
      return;
    }

    setResolveConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/resolve-litigation/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to resolve order");
        }

        const data = await response.json();
        setOrder(data.order);
        toast.success("Order resolved successfully");
      } catch (error) {
        toast.error(error.message || "Failed to resolve order");
      } finally {
        setActionLoading(false);
        setShowResolveConfirm(false);
      }
    });

    setShowResolveConfirm(true);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={isLoading || actionLoading} />
      <div className={`${isLoading || actionLoading ? "blur-[1px]" : ""}`}>
        {isLoading ? (
          <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="space-y-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : order ? (
          <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Order {order.order_id || "N/A"}</h1>
              </div>

              {/* Customer Information */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Name:</p>
                    <p>{order.leadId?.clientName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Phone:</p>
                    <p>{order.leadId?.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Email:</p>
                    <p>{order.leadId?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Zip Code:</p>
                    <p>{order.leadId?.zip || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Order Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Status:</p>
                    <p className={`${statusTextColors[order.status] || "text-gray-900 dark:text-gray-100"} font-medium`}>
                      {order.status || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Date:</p>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Team Information */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Team Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Sales Person:</p>
                    <p>{order.salesPerson?.name || "N/A"} ({order.salesPerson?.email || "N/A"})</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Customer Relations Person:</p>
                    <p>{order.customerRelationsPerson?.name || "N/A"} ({order.customerRelationsPerson?.email || "N/A"})</p>
                  </div>
                </div>
              </div>

              {/* Billing & Shipping */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Billing and Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Billing Address:</p>
                    <p>{formatAddress(order.billingAddress, order.city, order.state, order.zip)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Shipping Address:</p>
                    <p>{formatAddress(order.shippingAddress, order.shippingCity, order.shippingState, order.shippingZip)}</p>
                  </div>
                </div>
              </div>

              {/* Part Information */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Part Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Part Requested:</p>
                    <p>{order.leadId?.partRequested || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Make:</p>
                    <p>{order.leadId?.make || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Model:</p>
                    <p>{order.leadId?.model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Year:</p>
                    <p>{order.leadId?.year || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Trim:</p>
                    <p>{order.leadId?.trim || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Warranty:</p>
                    <p>{order.leadId?.warranty || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Active Vendor */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Active Vendor</h2>
                {order.vendors?.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed") ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Business Name:</p>
                      <p>{order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").businessName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Agent Name:</p>
                      <p>{order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").agentName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Email:</p>
                      <p>{order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Phone:</p>
                      <p>{order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").phoneNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Total Cost:</p>
                      <p>{order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").totalCost ? `$${order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").totalCost.toFixed(2)}` : "N/A"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        onClick={() => toggleSection("vendorNotes")}
                        className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={actionLoading}
                      >
                        <p className="font-medium text-gray-700 dark:text-gray-300">Vendor Notes</p>
                        {openSections.vendorNotes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <div className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${openSections.vendorNotes ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                        {order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed")?.notes?.length > 0 ? (
                          <ul className="list-disc pl-5 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-60 overflow-y-auto">
                            {[...order.vendors.find((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed").notes].reverse().map((note, index) => (
                              <li key={index} className="mb-2">
                                {note.text} <span className="text-gray-500 dark:text-gray-400 text-sm">({formatDate(note.createdAt)})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">No notes</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No active vendor found</p>
                )}
              </div>

              {/* Procurement Notes */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <button
                  onClick={() => toggleSection("procurementNotes")}
                  className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  <h2 className="font-medium text-gray-700 dark:text-gray-300">Procurement Notes</h2>
                  {openSections.procurementNotes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <div className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${openSections.procurementNotes ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  {order.procurementnotes?.length > 0 ? (
                    <ul className="list-disc pl-5 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-60 overflow-y-auto">
                      {[...order.procurementnotes].reverse().map((note, index) => (
                        <li key={index} className="mb-2">
                          {note.text} <span className="text-gray-500 dark:text-gray-400 text-sm">({formatDate(note.createdAt)})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">No procurement notes</p>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <button
                  onClick={() => toggleSection("orderNotes")}
                  className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  <h2 className="font-medium text-gray-700 dark:text-gray-300">Order Notes</h2>
                  {openSections.orderNotes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <div className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${openSections.orderNotes ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  {order.notes?.length > 0 ? (
                    <ul className="list-disc pl-5 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-60 overflow-y-auto">
                      {[...order.notes].reverse().map((note, index) => (
                        <li key={index} className="mb-2">
                          {note.text} <span className="text-gray-500 dark:text-gray-400 text-sm">({formatDate(note.createdAt)})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">No order notes</p>
                  )}
                </div>
              </div>

              {/* Litigation History */}
              <div className="mb-8">
                <button
                  onClick={() => toggleSection("litigationHistory")}
                  className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  <h2 className="font-medium text-gray-700 dark:text-gray-300">Litigation History</h2>
                  {openSections.litigationHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                <div
                  className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    openSections.litigationHistory ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {litigationData?.history?.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto space-y-6">
                      {[...litigationData.history].reverse().map((entry, index) => (
                        <div key={index} className="pb-5 border-b border-gray-200 dark:border-gray-600 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {entry.updatedByName || "Unknown User"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(entry.updatedAt)}
                            </span>
                          </div>
                          {entry.changeSummary && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-3 font-medium">
                              {entry.changeSummary}
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div><strong>Delivery Date:</strong> {entry.deliveryDate ? new Date(entry.deliveryDate).toLocaleDateString("en-IN") : "—"}</div>
                            <div><strong>Installation Date:</strong> {entry.installationDate ? new Date(entry.installationDate).toLocaleDateString("en-IN") : "—"}</div>
                            <div><strong>Problem Occurred:</strong> {entry.problemOccurredDate ? new Date(entry.problemOccurredDate).toLocaleDateString("en-IN") : "—"}</div>
                            <div><strong>Problem Informed:</strong> {entry.problemInformedDate ? new Date(entry.problemInformedDate).toLocaleDateString("en-IN") : "—"}</div>
                            <div><strong>Pictures Received:</strong> {entry.receivedPictures ? "Yes" : "No"}</div>
                            <div><strong>Diagnostic Report:</strong> {entry.receivedDiagnosticReport ? "Yes" : "No"}</div>
                          </div>
                          {entry.problemDescription && (
                            <div className="mt-4">
                              <strong className="block text-sm mb-1">Previous Problem Description:</strong>
                              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-3 rounded">
                                {entry.problemDescription}
                              </p>
                            </div>
                          )}
                          {entry.resolutionNotes && (
                            <div className="mt-4">
                              <strong className="block text-sm mb-1">Previous Resolution Notes:</strong>
                              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-3 rounded">
                                {entry.resolutionNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      No previous updates yet
                    </div>
                  )}
                </div>
              </div>

              {/* ────────────────────────────────────────────────
                   Litigation Notes + Add Note Input
                ──────────────────────────────────────────────── */}
              <div className="mb-8">
                <button
                  onClick={() => toggleSection("litigationNotes")}
                  className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  <h2 className="font-medium text-gray-700 dark:text-gray-300">Litigation Notes</h2>
                  {openSections.litigationNotes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                <div
                  className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    openSections.litigationNotes ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {/* Add Note Input */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700 flex gap-3 items-center">
                    <input
                      type="text"
                      value={newLitigationNote}
                      onChange={(e) => setNewLitigationNote(e.target.value)}
                      placeholder="Type a new litigation note..."
                      className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                      disabled={actionLoading}
                    />
                    <button
                      onClick={handleAddLitigationNote}
                      disabled={actionLoading || !newLitigationNote.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                    >
                      {actionLoading ? "Adding..." : "Add Note"}
                    </button>
                  </div>

                  {/* Notes List */}
                  {litigationData?.litigationNotes?.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-b-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto space-y-4">
                      {[...litigationData.litigationNotes].reverse().map((note, index) => (
                        <div
                          key={index}
                          className="pb-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0 last:pb-0"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {note.createdByName || "System"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      No litigation notes yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="w-full md:w-64 flex flex-col space-y-3 md:sticky md:top-6 self-start">
              {/* Litigation Button */}
              <button
                onClick={openForm}
                disabled={actionLoading || order?.status === "Replacement"}
                title={
                  order?.status === "Replacement"
                    ? "Litigation form is blocked while order is in Replacement status"
                    : ""
                }
                className={`flex items-center justify-center px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionLoading || order?.status === "Replacement"
                    ? "cursor-not-allowed bg-purple-400"
                    : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                }`}
              >
                {order?.status === "Resolved" ? "Re-open / Update Litigation" : "Litigation"}
              </button>

              {/* Send RMA Form */}
              <button
                onClick={() => {
                  if (!hasMeaningfulLitigation) {
                    toast.warn("Please fill at least one field in the Litigation form first");
                    return;
                  }
                  handleSendRMA();
                }}
                disabled={actionLoading || !hasMeaningfulLitigation || order?.status === "Replacement"}
                title={
                  order?.status === "Replacement"
                    ? "Action blocked: Order is in Replacement status"
                    : !hasMeaningfulLitigation
                    ? "Litigation form must have at least one field filled"
                    : ""
                }
                className={`flex items-center justify-center px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionLoading || order?.status === "Replacement" || !hasMeaningfulLitigation
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700"
                }`}
              >
                Send RMA Form
              </button>

              {/* Replacement */}
              {hasMeaningfulLitigation && order?.status !== "Replacement" && (order?.status !== "Resolved" || canShowReplacement) ? (
                <div className="relative">
                  <button
                    onClick={() => !actionLoading && setIsReplacementDropdownOpen(!isReplacementDropdownOpen)}
                    disabled={actionLoading}
                    className="flex items-center justify-center w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm font-medium focus:ring-4 focus:ring-green-300 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Replacement
                  </button>
                  {isReplacementDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 w-32">
                      <button
                        onClick={handleReplacement}
                        disabled={actionLoading}
                        className="block w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => !actionLoading && setIsReplacementDropdownOpen(false)}
                        className="block w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  disabled
                  title={
                    order?.status === "Replacement"
                      ? "Action blocked: Order is already in Replacement"
                      : order?.status === "Resolved" && !canShowReplacement
                      ? "Please update Litigation first before proceeding to Replacement"
                      : "Please fill at least one field in the Litigation form first"
                  }
                  className="flex items-center justify-center px-4 py-2.5 bg-gray-500 text-gray-300 rounded-lg cursor-not-allowed text-sm font-medium"
                >
                  Replacement
                </button>
              )}

              {/* Resolve */}
              <button
                onClick={handleResolveClick}
                disabled={actionLoading || !hasMeaningfulLitigation || order?.status !== "Litigation"}
                title={
                  order?.status === "Replacement"
                    ? "Action blocked: Order is in Replacement status"
                    : !hasMeaningfulLitigation
                    ? "Litigation form must have at least one field filled"
                    : order?.status !== "Litigation"
                    ? "Only available when order is in Litigation"
                    : ""
                }
                className={`flex items-center justify-center px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasMeaningfulLitigation && order?.status === "Litigation"
                    ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-indigo-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Resolve
              </button>

              {/* Refund */}
              <button
                onClick={() => {
                  if (!hasMeaningfulLitigation) {
                    toast.warn("Please fill at least one field in the Litigation form first");
                    return;
                  }
                  if (order?.status !== "Litigation") {
                    toast.warn("Can only mark Refund from Litigation status");
                    return;
                  }

                  setRefundConfirmAction(() => async () => {
                    setActionLoading(true);
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/refund/${orderId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || "Failed to mark as Refund");
                      }

                      const data = await response.json();
                      setOrder(data.order);
                      toast.success("Order marked as Refund successfully");
                    } catch (error) {
                      toast.error(error.message || "Failed to mark as Refund");
                    } finally {
                      setActionLoading(false);
                      setShowRefundConfirm(false);
                    }
                  });

                  setShowRefundConfirm(true);
                }}
                disabled={actionLoading || !hasMeaningfulLitigation || order?.status !== "Litigation"}
                title={
                  order?.status === "Replacement"
                    ? "Action blocked: Order is in Replacement status"
                    : !hasMeaningfulLitigation
                    ? "Litigation form must have at least one field filled"
                    : order?.status !== "Litigation"
                    ? "Can only mark Refund from Litigation status"
                    : ""
                }
                className={`flex items-center justify-center px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasMeaningfulLitigation && order?.status === "Litigation"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Refund
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-16 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <p className="text-lg">Order not found</p>
          </div>
        )}
      </div>

      {/* Litigation Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold">Update Litigation Details</h2>
              <button
                onClick={closeForm}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                disabled={actionLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleFormChange}
                  className="block w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                  disabled={actionLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Installation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleFormChange}
                  className="block w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                  disabled={actionLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Problem Occurred Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="problemOccurredDate"
                  value={formData.problemOccurredDate}
                  onChange={handleFormChange}
                  className="block w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                  disabled={actionLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Problem Informed Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="problemInformedDate"
                  value={formData.problemInformedDate}
                  onChange={handleFormChange}
                  className="block w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                  disabled={actionLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  What's the Problem <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="problemDescription"
                  value={formData.problemDescription}
                  onChange={handleFormChange}
                  className="block w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 min-h-[100px] transition-colors"
                  rows="4"
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="receivedPictures"
                    checked={formData.receivedPictures}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 mr-2"
                    disabled={actionLoading}
                  />
                  Received Pictures of Defective Part
                </label>

                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="receivedDiagnosticReport"
                    checked={formData.receivedDiagnosticReport}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 mr-2"
                    disabled={actionLoading}
                  />
                  Received Diagnostic Report
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resolution Notes (optional)
                </label>
                <textarea
                  name="resolutionNotes"
                  value={formData.resolutionNotes}
                  onChange={handleFormChange}
                  className="block w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 min-h-[100px] transition-colors"
                  rows="4"
                  disabled={actionLoading}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all text-sm font-medium"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Litigation Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Confirmation */}
      <ConfirmationModal
        isOpen={showResolveConfirm}
        onClose={() => setShowResolveConfirm(false)}
        onConfirm={resolveConfirmAction}
        title="Confirm Resolve"
        message="Are you sure you want to mark this order as Resolved (problem solved without replacement)?"
        confirmText="Yes, Resolve"
        cancelText="Cancel"
        confirmButtonProps={{
          className: "bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600",
          disabled: actionLoading,
        }}
        cancelButtonProps={{ disabled: actionLoading }}
      />

      {/* Refund Confirmation */}
      <ConfirmationModal
        isOpen={showRefundConfirm}
        onClose={() => setShowRefundConfirm(false)}
        onConfirm={refundConfirmAction}
        title="Confirm Refund"
        message="Are you sure you want to mark this order as Refund? This action cannot be undone."
        confirmText="Yes, Refund"
        cancelText="Cancel"
        confirmButtonProps={{
          className: "bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600",
          disabled: actionLoading,
        }}
        cancelButtonProps={{ disabled: actionLoading }}
      />
    </div>
  );
};

export default LitigationDetails;