import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Pencil, Save, Edit, Truck, DollarSign } from "lucide-react";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmationModal from "./ConfirmationModal";
import { useTheme } from "../context/ThemeContext";

const statusOptions = [
  "ReplacementRequested",
  "WaitingShipment",
  "InTransit",
  "Delivered",
];

const ReplacementOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [replacement, setReplacement] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmText, setConfirmText] = useState("Confirm");

  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    method: "",
    trackingId: "",
    carrier: "",
    amount: "",
  });

  useEffect(() => {
    const fetchReplacement = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/Replacement/replacement/${id}`,
          { credentials: "include" }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        setReplacement(data);
        setNotes(data.notes || []);
      } catch (error) {
        console.error("Failed to fetch replacement:", error);
        toast.error("Failed to load replacement order");
        navigate("/home/replacements");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchReplacement();
  }, [id, navigate]);

  const canUpdateShipping = replacement?.status === "ReplacementRequested";

  const openShippingModal = () => {
    if (!canUpdateShipping) {
      toast.info("Shipping details can only be updated when status is Replacement Requested");
      return;
    }
    setShippingForm({ method: "", trackingId: "", carrier: "", amount: "" });
    setShowShippingModal(true);
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();

    if (!shippingForm.method) {
      toast.warn("Please select who is shipping");
      return;
    }

    if (!shippingForm.trackingId.trim() || !shippingForm.carrier.trim()) {
      toast.warn("Tracking ID and Carrier are required");
      return;
    }

    let payload = {
      method: shippingForm.method,
      trackingId: shippingForm.trackingId.trim(),
      carrier: shippingForm.carrier.trim(),
      amount: 0,
    };

    if (shippingForm.method === "own") {
      const amt = Number(shippingForm.amount);
      if (isNaN(amt) || amt <= 0) {
        toast.warn("Please enter a valid positive amount");
        return;
      }
      payload.amount = amt;
    }

    setActionLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/Replacement/replacement/${id}/shipping`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update shipping");
      }

      const updated = await res.json();
      setReplacement(updated);
      setNotes(updated.notes || []);
      toast.success("Shipping info saved → Status is now Waiting Shipment");
      setShowShippingModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not save shipping information");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) {
      toast.warn("Please enter a note");
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Replacement/replacement/${id}/note`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: newNote.trim() }),
        }
      );

      if (!response.ok) throw new Error("Failed to save note");

      const updated = await response.json();
      toast.success("Note added");
      setNotes(updated.notes || []);
      setNewNote("");
      setIsEditingNote(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to add note");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Replacement/replacement/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update status");
      }

      const updated = await response.json();
      toast.success(`Status changed to ${newStatus}`);
      setReplacement(updated);
      setNotes(updated.notes || []);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const showStatusConfirmation = (newStatus) => {
    if (newStatus === replacement?.status) return;

    if (newStatus === "InTransit" && replacement?.status !== "WaitingShipment") {
      toast.warn("Can only move to InTransit from Waiting Shipment");
      return;
    }

    if (newStatus === "Delivered" && replacement?.status !== "InTransit") {
      toast.warn("Can only move to Delivered from InTransit status");
      return;
    }

    setConfirmTitle("Confirm Status Change");
    setConfirmMessage(`Change status to "${newStatus}"?`);
    setConfirmText("Change");
    setConfirmAction(() => async () => {
      await updateStatus(newStatus);
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  if (isLoading) return <LoadingOverlay isLoading={true} />;

  if (!replacement) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        Replacement order not found
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <LoadingOverlay isLoading={actionLoading} />

      {/* Top controls: Status buttons + Add Note */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Status buttons */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex-1">
          {statusOptions.map((status) => {
            const isCurrent = replacement.status === status;
            const isWaitingShipment = status === "WaitingShipment";

            if (isWaitingShipment) {
              return (
                <button
                  key={status}
                  onClick={() => !actionLoading && openShippingModal()}
                  disabled={actionLoading || !canUpdateShipping}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : canUpdateShipping
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow"
                      : "bg-gray-400 dark:bg-gray-600 text-gray-300 dark:text-gray-400 cursor-not-allowed opacity-60"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <Truck size={16} />
                  {isCurrent ? "Waiting Shipment" : "Proceed to Waiting Shipment"}
                </button>
              );
            }

            let isDisabled = actionLoading;

            if (status === "InTransit" && replacement.status !== "WaitingShipment") {
              isDisabled = true;
            }

            if (status === "Delivered" && replacement.status !== "InTransit") {
              isDisabled = true;
            }

            const handleClick = () => {
              if (isDisabled) {
                if (status === "InTransit") {
                  toast.warn("Can only move to InTransit from Waiting Shipment");
                } else if (status === "Delivered") {
                  toast.warn("Can only move to Delivered from InTransit");
                }
                return;
              }
              showStatusConfirmation(status);
            };

            return (
              <button
                key={status}
                onClick={handleClick}
                disabled={isDisabled}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md scale-105"
                    : isDisabled
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Add Note button - top right */}
        <div className="flex justify-center sm:justify-end">
          {!isEditingNote ? (
            <button
              onClick={() => !actionLoading && setIsEditingNote(true)}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Edit size={18} />
              Add Note
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNewNote("");
                  setIsEditingNote(false);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={actionLoading || !newNote.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {actionLoading ? "Saving..." : "Save Note"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note editor - shown below when editing */}
      {isEditingNote && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <textarea
            className="w-full p-3 border rounded-lg resize-y min-h-[140px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type your note here..."
            disabled={actionLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Replacement Order Details
          </h2>

          <div className="space-y-4">
            <InfoRow label="Tracking ID" value={replacement.replacementId} />
            <InfoRow
              label="Original Order"
              value={
                <span
                  className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                  onClick={() =>
                    replacement.originalOrderId?._id &&
                    navigate(`/home/litigation/details/${replacement.originalOrderId._id}`)
                  }
                >
                  {replacement.originalOrderId?.order_id ||
                    replacement.originalOrderId ||
                    "N/A"}
                </span>
              }
            />
            <InfoRow label="Customer Name" value={replacement.customer?.name || "N/A"} />
            <InfoRow label="Phone" value={replacement.customer?.phone || "N/A"} />
            <InfoRow label="Email" value={replacement.customer?.email || "N/A"} />
            <InfoRow label="Part Requested" value={replacement.partDetails?.partRequested || "N/A"} />
            <InfoRow
              label="Vehicle"
              value={`${replacement.partDetails?.make || "N/A"} / ${
                replacement.partDetails?.model || "N/A"
              } / ${replacement.partDetails?.year || "N/A"}`}
            />

            {replacement.shipping?.method && (
              <>
                <InfoRow
                  label="Shipping Method"
                  value={
                    replacement.shipping.method === "customer"
                      ? "By Customer"
                      : replacement.shipping.method === "vendor"
                      ? "By Vendor"
                      : "Our Shipping (with charge)"
                  }
                />
                {replacement.shipping.trackingId && (
                  <InfoRow label="Tracking / AWB" value={replacement.shipping.trackingId} />
                )}
                {replacement.shipping.carrier && (
                  <InfoRow label="Carrier" value={replacement.shipping.carrier} />
                )}
                {replacement.shipping.method === "own" && replacement.shipping.amount > 0 && (
                  <InfoRow
                    label="Shipping Charge"
                    value={`₹${replacement.shipping.amount.toFixed(2)}`}
                  />
                )}
              </>
            )}

            <InfoRow
              label="Created At"
              value={new Date(replacement.createdAt).toLocaleString()}
            />
            <InfoRow label="Created By" value={replacement.createdBy?.name || "System"} />
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Notes
          </h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {notes.length > 0 ? (
              notes.map((note, index) => (
                <div
                  key={note._id || index}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {note.text}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>
                      {new Date(note.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-medium">{note.addedBy || "Unknown"}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12 italic">
                No notes added yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-5">Enter Shipping Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will move the replacement to <strong>Waiting Shipment</strong> status.
              </p>

              <form onSubmit={handleShippingSubmit} className="space-y-5">
                {/* ... rest of shipping form remains the same ... */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="customer"
                      checked={shippingForm.method === "customer"}
                      onChange={handleShippingChange}
                      className="w-5 h-5 accent-emerald-600"
                    />
                    <span>Customer will ship the part</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="vendor"
                      checked={shippingForm.method === "vendor"}
                      onChange={handleShippingChange}
                      className="w-5 h-5 accent-emerald-600"
                    />
                    <span>Vendor will ship the part</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="own"
                      checked={shippingForm.method === "own"}
                      onChange={handleShippingChange}
                      className="w-5 h-5 accent-emerald-600"
                    />
                    <span>We will arrange shipping (customer pays)</span>
                  </label>
                </div>

                {shippingForm.method && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Carrier Name *</label>
                      <input
                        type="text"
                        name="carrier"
                        value={shippingForm.carrier}
                        onChange={handleShippingChange}
                        className="w-full p-2.5 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="FedEx, Blue Dart, Delhivery, etc."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tracking ID / AWB *</label>
                      <input
                        type="text"
                        name="trackingId"
                        value={shippingForm.trackingId}
                        onChange={handleShippingChange}
                        className="w-full p-2.5 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter tracking number"
                        required
                      />
                    </div>
                  </>
                )}

                {shippingForm.method === "own" && (
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2">
                      <DollarSign size={16} />
                      Shipping Charge Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={shippingForm.amount}
                      onChange={handleShippingChange}
                      min="1"
                      step="0.01"
                      className="w-full p-2.5 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g. 450.00"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowShippingModal(false)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
                  >
                    {actionLoading ? "Processing..." : "Save & Move to Waiting Shipment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        cancelText="Cancel"
      />
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <span className="font-medium text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-gray-900 dark:text-gray-100 text-right">{value}</span>
  </div>
);

export default ReplacementOrderDetails;