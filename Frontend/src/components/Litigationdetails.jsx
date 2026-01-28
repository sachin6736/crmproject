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
};

const LitigationDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [litigationData, setLitigationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    vendorNotes: false,
    procurementNotes: false,
    orderNotes: false,
    litigationHistory: false,
    litigationNotes: false,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReplacementDropdownOpen, setIsReplacementDropdownOpen] = useState(false);

  // Modal for Resolve confirmation
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

      const litigationResponse = await fetch(`${import.meta.env.VITE_API_URL}/LiteReplace/litigation/${orderId}`, {
        credentials: "include",
      });
      if (litigationResponse.ok) {
        const litigationData = await litigationResponse.json();
        setLitigationData(litigationData);
        setFormData({
          deliveryDate: litigationData.deliveryDate ? litigationData.deliveryDate.split('T')[0] : '',
          installationDate: litigationData.installationDate ? litigationData.installationDate.split('T')[0] : '',
          problemOccurredDate: litigationData.problemOccurredDate ? litigationData.problemOccurredDate.split('T')[0] : '',
          problemInformedDate: litigationData.problemInformedDate ? litigationData.problemInformedDate.split('T')[0] : '',
          receivedPictures: litigationData.receivedPictures || false,
          receivedDiagnosticReport: litigationData.receivedDiagnosticReport || false,
          problemDescription: litigationData.problemDescription || '',
          resolutionNotes: litigationData.resolutionNotes || '',
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
    setFormData({
      deliveryDate: litigationData?.deliveryDate ? litigationData.deliveryDate.split('T')[0] : '',
      installationDate: litigationData?.installationDate ? litigationData.installationDate.split('T')[0] : '',
      problemOccurredDate: litigationData?.problemOccurredDate ? litigationData.problemOccurredDate.split('T')[0] : '',
      problemInformedDate: litigationData?.problemInformedDate ? litigationData.problemInformedDate.split('T')[0] : '',
      receivedPictures: litigationData?.receivedPictures || false,
      receivedDiagnosticReport: litigationData?.receivedDiagnosticReport || false,
      problemDescription: litigationData?.problemDescription || '',
      resolutionNotes: litigationData?.resolutionNotes || '',
    });
    setIsFormOpen(true);
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
        // Force re-fetch fresh data to avoid stale state
        await fetchOrderAndLitigation();
      }

      setIsReplacementDropdownOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  // Stricter check: litigation exists AND has meaningful data
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

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Block submit if form is completely empty/default
    const isFormEmpty =
      !formData.deliveryDate &&
      !formData.installationDate &&
      !formData.problemOccurredDate &&
      !formData.problemInformedDate &&
      !formData.receivedPictures &&
      !formData.receivedDiagnosticReport &&
      !formData.problemDescription?.trim() &&
      !formData.resolutionNotes?.trim();

    if (isFormEmpty) {
      toast.warn("Cannot save empty litigation form. Please fill at least one field.");
      return;
    }

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
      const updatedLitigation = await response.json();
      setLitigationData(updatedLitigation.litigation);
      setFormData({
        deliveryDate: updatedLitigation.litigation.deliveryDate ? updatedLitigation.litigation.deliveryDate.split('T')[0] : '',
        installationDate: updatedLitigation.litigation.installationDate ? updatedLitigation.litigation.installationDate.split('T')[0] : '',
        problemOccurredDate: updatedLitigation.litigation.problemOccurredDate ? updatedLitigation.litigation.problemOccurredDate.split('T')[0] : '',
        problemInformedDate: updatedLitigation.litigation.problemInformedDate ? updatedLitigation.litigation.problemInformedDate.split('T')[0] : '',
        receivedPictures: updatedLitigation.litigation.receivedPictures || false,
        receivedDiagnosticReport: updatedLitigation.litigation.receivedDiagnosticReport || false,
        problemDescription: updatedLitigation.litigation.problemDescription || '',
        resolutionNotes: updatedLitigation.litigation.resolutionNotes || '',
      });
      toast.success("Litigation details updated successfully");
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update litigation details");
    } finally {
      setActionLoading(false);
    }
  };

  const closeForm = () => {
    if (actionLoading) return;
    setIsFormOpen(false);
  };

  // Handle Resolve with Confirmation Modal
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
      }
    });

    setShowResolveConfirm(true);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={isLoading || actionLoading} />
      <div className={`${isLoading || actionLoading ? "blur-[1px]" : ""}`}>
        {order && (
          <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 flex">
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

              {/* Litigation Notes */}
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
                    openSections.litigationNotes ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {litigationData?.litigationNotes?.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto space-y-4">
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
            <div className="ml-6 flex flex-col space-y-2">
              <button
                onClick={openForm}
                className="flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                Litigation
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
                className={`flex items-center px-4 py-2 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasMeaningfulLitigation
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                }`}
                disabled={actionLoading || !hasMeaningfulLitigation}
                title={!hasMeaningfulLitigation ? "Litigation form must have at least one field filled" : ""}
              >
                Send RMA Form
              </button>

              {/* Replacement */}
              {hasMeaningfulLitigation ? (
                <div className="relative">
                  <button
                    onClick={() => !actionLoading && setIsReplacementDropdownOpen(!isReplacementDropdownOpen)}
                    className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={actionLoading}
                  >
                    Replacement
                  </button>
                  {isReplacementDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 w-32">
                      <button
                        onClick={handleReplacement}
                        className="block w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        disabled={actionLoading}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => !actionLoading && setIsReplacementDropdownOpen(false)}
                        className="block w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        disabled={actionLoading}
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => toast.warn("Please fill at least one field in the Litigation form first")}
                  className="px-4 py-2 bg-gray-400 dark:bg-gray-600 text-gray-200 rounded-lg cursor-not-allowed text-sm font-medium"
                  disabled
                  title="Litigation form must have at least one field filled"
                >
                  Replacement
                </button>
              )}

              {/* Resolve */}
              <button
                onClick={() => {
                  if (!hasMeaningfulLitigation) {
                    toast.warn("Please fill at least one field in the Litigation form first");
                    return;
                  }
                  if (order?.status !== "Litigation") {
                    toast.warn("This order is no longer in Litigation status. Cannot resolve now.");
                    return;
                  }
                  handleResolveClick();
                }}
                className={`flex items-center px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-4 transition-all duration-200 text-sm font-medium ${
                  hasMeaningfulLitigation && order?.status === "Litigation"
                    ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-indigo-700"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70"
                }`}
                disabled={actionLoading || !hasMeaningfulLitigation || order?.status !== "Litigation"}
                title={
                  !hasMeaningfulLitigation
                    ? "Litigation form must have at least one field filled"
                    : order?.status !== "Litigation"
                    ? "Only available when order is in Litigation"
                    : ""
                }
              >
                Resolve
              </button>
            </div>
          </div>
        )}

        {!order && !isLoading && (
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
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Date</label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Installation Date</label>
                <input
                  type="date"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problem Occurred Date</label>
                <input
                  type="date"
                  name="problemOccurredDate"
                  value={formData.problemOccurredDate}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problem Informed Date</label>
                <input
                  type="date"
                  name="problemInformedDate"
                  value={formData.problemInformedDate}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="receivedPictures"
                    checked={formData.receivedPictures}
                    onChange={handleFormChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    disabled={actionLoading}
                  />
                  Received Pictures of Defective Part
                </label>
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="receivedDiagnosticReport"
                    checked={formData.receivedDiagnosticReport}
                    onChange={handleFormChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    disabled={actionLoading}
                  />
                  Received Diagnostic Report
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">What's the Problem</label>
                <textarea
                  name="problemDescription"
                  value={formData.problemDescription}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  rows="4"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resolution Notes</label>
                <textarea
                  name="resolutionNotes"
                  value={formData.resolutionNotes}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  rows="4"
                  disabled={actionLoading}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all text-sm font-medium"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resolve */}
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
        cancelButtonProps={{
          disabled: actionLoading,
        }}
      />
    </div>
  );
};

export default LitigationDetails;