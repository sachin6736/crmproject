import React, { useState, useEffect } from "react";
import {
  Pencil,
  Save,
  Edit,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import FullPageLoader from "./utilities/FullPageLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { useTheme } from "../context/ThemeContext";

const statusOptions = [
  "Quoted",
  "No Response",
  "Wrong Number",
  "Not Interested",
  "Price too high",
  "Part not available",
  "Ordered",
];

const statusTextColors = {
  Quoted: "text-yellow-600 dark:text-yellow-400",
  "No Response": "text-gray-500 dark:text-gray-400",
  "Wrong Number": "text-red-500 dark:text-red-400",
  "Not Interested": "text-red-500 dark:text-red-400",
  "Price too high": "text-orange-500 dark:text-orange-400",
  "Part not available": "text-purple-600 dark:text-purple-400",
  Ordered: "text-green-600 dark:text-green-400",
};

const Lead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [singleLead, setSingleLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [showNotes, setShowNotes] = useState(true);
  const [partCost, setPartCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [grossProfit, setGrossProfit] = useState("");
  const [warranty, setWarranty] = useState("0 months");
  const [totalCost, setTotalCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  // Sync notes state with singleLead.notes whenever singleLead changes
  useEffect(() => {
    if (singleLead && singleLead.notes) {
      setNotes(singleLead.notes);
    }
  }, [singleLead]);

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/Lead/getleadbyid/${id}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch lead");
        const data = await response.json();
        setSingleLead(data);
        setSelectedDates(data.importantDates || []);
        setEditForm({
          clientName: data.clientName || "",
          phoneNumber: data.phoneNumber || "",
          email: data.email || "",
          zip: data.zip || "",
          partRequested: data.partRequested || "",
          make: data.make || "",
          model: data.model || "",
          year: data.year || "",
          trim: data.trim || "",
        });
        setPartCost(data.partCost?.toString() || "");
        setShippingCost(data.shippingCost?.toString() || "");
        setGrossProfit(data.grossProfit?.toString() || "");
        setWarranty(data.warranty || "0 months");
        setTotalCost(data.totalCost?.toString() || "");
      } catch (error) {
        console.error("Error fetching single lead:", error);
        toast.error("Failed to load lead data");
        navigate("/home");
      }
    };

    if (id) {
      fetchSingleLead();
    } else {
      toast.error("Invalid lead ID");
      navigate("/home");
    }
  }, [id, navigate]);

  useEffect(() => {
    const part = parseFloat(partCost) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const gp = parseFloat(grossProfit) || 0;
    
    const total = part + shipping + gp;
    setTotalCost(total > 0 ? total.toFixed(2) : "");
  }, [partCost, shippingCost, grossProfit]);

  const areCostsValid = () => {
    const part = parseFloat(partCost);
    const shipping = parseFloat(shippingCost);
    const gp = parseFloat(grossProfit);
    const total = parseFloat(totalCost);
    const warrantyValid = warranty && ["0 months", "3 months", "6 months", "12 months", "24 months"].includes(warranty);
    return (
      !isNaN(part) &&
      part > 0 &&
      !isNaN(shipping) &&
      shipping >= 0 &&
      !isNaN(gp) &&
      gp >= 0 &&
      !isNaN(total) &&
      total > 0 &&
      warrantyValid
    );
  };

  const handleSaveNotes = async () => {
    if (!newNote.trim()) {
      toast.warning("Please enter a note");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/Lead/updateNotes/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: newNote }),
        }
      );

      if (response.ok) {
        toast.success("Note added successfully");
        setNotes([...notes, { text: newNote, createdAt: new Date() }]);
        setNewNote("");
        setIsEditing(false);
      } else {
        toast.error("Failed to add note");
      }
    } catch (error) {
      toast.error("Error updating notes");
      console.error("Error updating notes:", error);
    }
  };

  const handleDateClick = async (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const isDateSelected = selectedDates.includes(dateStr);
    try {
      const response = await fetch(
        isDateSelected
          ? `http://localhost:3000/Lead/updateDates/${id}/${dateStr}`
          : `http://localhost:3000/Lead/updateDates/${id}`,
        {
          method: isDateSelected ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: isDateSelected ? null : JSON.stringify({ selectedDate: dateStr }),
        }
      );

      if (response.ok) {
        toast.success("Event updated successfully");
        setSelectedDates((prevDates) =>
          isDateSelected
            ? prevDates.filter((d) => d !== dateStr)
            : [...prevDates, dateStr]
        );
      } else {
        toast.error("Failed to update date");
      }
    } catch (error) {
      toast.error("Error updating date");
      console.error("Error updating date:", error);
    }
  };

  const updateStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/editstatus/${leadId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Status changed successfully");
        const leadResponse = await fetch(
          `http://localhost:3000/Lead/getleadbyid/${leadId}`,
          { credentials: "include" }
        );
        const updatedLead = await leadResponse.json();
        setSingleLead(updatedLead);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating lead status");
      console.error("Error updating lead status:", error);
    }
  };

  const handleEditLead = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/editlead/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editForm),
        }
      );

      if (response.ok) {
        const updatedLead = await response.json();
        setSingleLead(updatedLead);
        setIsEditingLead(false);
        toast.success("Lead updated successfully");
      } else {
        toast.error("Failed to update lead");
      }
    } catch (error) {
      toast.error("Error updating lead");
      console.error("Error updating lead:", error);
    }
  };

  const handleDownload = () => {
    if (singleLead) {
      exportToExcel([singleLead], "LeadData.xlsx");
    } else {
      toast.error("No lead data available to download");
    }
  };

  const handleSubmitCosts = async () => {
    if (!areCostsValid()) {
      toast.error("Please fill in all cost fields with valid positive numbers and a valid warranty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/updatecost/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            partCost: parseFloat(partCost),
            shippingCost: parseFloat(shippingCost),
            grossProfit: parseFloat(grossProfit),
            warranty,
            totalCost: parseFloat(totalCost),
          }),
        }
      );

      if (response.ok) {
        const updatedLead = await response.json();
        setSingleLead(updatedLead);
        toast.success("Costs updated successfully");
        setShowNotes(true);
      } else {
        toast.error("Failed to update costs");
      }
    } catch (error) {
      toast.error("Error updating costs");
      console.error("Error updating costs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuote = async () => {
    if (!areCostsValid()) {
      toast.error("Please add and submit quote details before sending a quotation.");
      return;
    }

    setIsSendingQuote(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/leadquatation/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        await updateStatus(id, "Quoted");
      } else {
        toast.error(data.message || "Failed to send quotation");
      }
    } catch (error) {
      toast.error("Error sending quotation");
      console.error("Error sending quotation:", error);
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleGoToOrder = () => {
    navigate(`/home/order/${id}`);
  };

  if (!singleLead) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <FullPageLoader
          size="w-10 h-10"
          color="text-blue-500 dark:text-blue-400"
          fill="fill-blue-300 dark:fill-blue-600"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Action Buttons */}
      <div className="flex justify-end mb-4">
        <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 rounded-full shadow-md p-2">
          <button
            onClick={handleSendQuote}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 text-sm border-r border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
            disabled={isSendingQuote || !areCostsValid()}
          >
            {isSendingQuote ? "Sending..." : "Send Quote"}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Download
          </button>
          {singleLead.status === "Ordered" && (
            <button
              onClick={handleGoToOrder}
              className="px-4 py-2 text-green-600 dark:text-green-400 text-sm border-l border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-green-700 dark:hover:text-green-300"
            >
              Go to Order
            </button>
          )}
        </div>
      </div>

      {/* Active Status Row */}
      <div className="flex justify-center items-center bg-white dark:bg-gray-800 rounded-full shadow-md p-2 mb-4 w-full h-14 space-x-2 overflow-x-auto">
        <div className="flex gap-4 px-2">
          {statusOptions.map((status, index) => (
            <button
              key={index}
              onClick={() => updateStatus(singleLead._id, status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                singleLead.status === status
                  ? "bg-blue-600 dark:bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-200 dark:bg-gray-800 p-4 rounded-xl">
        {/* Lead Details */}
        <div className="w-full h-auto md:h-96 rounded-2xl bg-white dark:bg-gray-700 p-4 shadow-md">
          <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-600 pb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {singleLead.clientName}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingLead(!isEditingLead)}
                className={`flex items-center gap-1 text-sm ${
                  isEditingLead
                    ? "text-red-500 dark:text-red-400"
                    : "text-blue-500 dark:text-blue-400"
                }`}
              >
                {isEditingLead ? <>Cancel</> : <><Edit size={18} /> Edit</>}
              </button>
              {isEditingLead && (
                <button
                  onClick={handleEditLead}
                  className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400"
                >
                  <Save size={18} /> Save
                </button>
              )}
            </div>
          </div>
          <div
            className={`mt-2 space-y-2 ${
              isEditingLead ? "max-h-72 overflow-y-auto pr-1" : ""
            }`}
          >
            {[
              { label: "Client Name", key: "clientName" },
              { label: "Phone Number", key: "phoneNumber" },
              { label: "Email", key: "email", isLink: true },
              { label: "ZIP Code", key: "zip" },
              { label: "Part Requested", key: "partRequested" },
              { label: "Make", key: "make" },
              { label: "Model", key: "model" },
              { label: "Year", key: "year" },
              { label: "Trim", key: "trim" },
              { label: "Status", key: "status" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-gray-300 dark:border-gray-600 pb-1 text-sm"
              >
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {item.label}
                </div>
                <div className="flex items-center gap-2 w-1/2">
                  {isEditingLead && item.key !== "status" ? (
                    <input
                      type="text"
                      value={editForm[item.key] || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [item.key]: e.target.value })
                      }
                      className="bg-transparent border-b border-transparent focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none text-right text-sm w-full transition-colors duration-200 text-gray-900 dark:text-gray-100"
                    />
                  ) : item.isLink ? (
                    <a
                      href={`mailto:${singleLead[item.key]}`}
                      className="text-blue-500 dark:text-blue-400 hover:underline truncate"
                    >
                      {singleLead[item.key]}
                    </a>
                  ) : (
                    <div
                      className={`truncate ${
                        statusTextColors[singleLead[item.key]] ||
                        "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {singleLead[item.key]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes and Costs Section */}
        <div className="w-full h-auto md:h-96 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-md overflow-hidden relative">
          <div
            className="w-full h-full flex transition-transform duration-500 ease-in-out"
            style={{
              transform: showNotes ? "translateX(0%)" : "translateX(-100%)",
            }}
          >
            <div className="w-full flex-shrink-0 flex flex-col">
              <h2 className="text-lg font-semibold border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-900 dark:text-gray-100">
                Notes
              </h2>
              <div className="p-2 mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-y-auto flex-1">
                {notes.length > 0 ? (
                  [...notes]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((note, index) => (
                      <div
                        key={note._id || index}
                        className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex justify-between items-center"
                      >
                        <div>
                          <p className="text-gray-900 dark:text-gray-100">
                            {note.text}
                          </p>
                          <small className="text-gray-500 dark:text-gray-400">
                            {new Date(note.createdAt).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    No notes added yet
                  </p>
                )}
              </div>

              {isEditing ? (
                <div className="mt-4">
                  <textarea
                    className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-red-500 dark:text-red-400 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="text-green-500 dark:text-green-400 flex items-center gap-1 text-sm"
                    >
                      <Save size={18} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 dark:text-blue-400 flex items-center gap-1 mt-2 text-sm"
                >
                  <Edit size={18} /> Add Note
                </button>
              )}
              <button
                onClick={() => setShowNotes(false)}
                className="text-sm text-blue-600 dark:text-blue-400 mt-4"
              >
                View Costs →
              </button>
            </div>
            <div className="w-full flex-shrink-0 flex flex-col items-center justify-center gap-3">
              {[
                { label: "Part Cost", value: partCost, setter: setPartCost, type: "number" },
                {
                  label: "Shipping Cost",
                  value: shippingCost,
                  setter: setShippingCost,
                  type: "number",
                },
                {
                  label: "Gross Profit",
                  value: grossProfit,
                  setter: setGrossProfit,
                  type: "number",
                },
                { label: "Warranty", value: warranty, setter: setWarranty, type: "select" },
                { label: "Total Cost", value: totalCost, readonly: true },
              ].map((item, index) => (
                <div
                  key={index}
                  className="w-full h-20 bg-gray-100 dark:bg-gray-700 flex items-center justify-between px-6 rounded-lg"
                >
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {item.label}
                  </p>
                  {item.readonly ? (
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {item.value ? `$${item.value}` : "-"}
                    </p>
                  ) : item.type === "select" ? (
                    <select
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
                      className="border p-2 rounded w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    >
                      {["0 months", "3 months", "6 months", "12 months", "24 months"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={item.type}
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      className="border p-2 rounded w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end w-full pr-6">
                <button
                  onClick={handleSubmitCosts}
                  className="bg-green-600 dark:bg-green-500 text-white w-20 disabled:opacity-50 hover:bg-green-700 dark:hover:bg-green-600 rounded-md"
                  disabled={isSubmitting || !areCostsValid()}
                >
                  {isSubmitting ? "Saving..." : "Submit"}
                </button>
              </div>
              <button
                onClick={() => setShowNotes(true)}
                className="text-sm text-blue-600 dark:text-blue-400 mt-4"
              >
                ← Back to Notes
              </button>
            </div>
          </div>
        </div>

        {/* Important Dates */}
        <div className="w-full h-auto md:h-96 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-md">
          <h2 className="text-lg font-semibold border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-900 dark:text-gray-100">
            Important Dates
          </h2>
          <div className="flex justify-center p-2">
            <Calendar
              onClickDay={handleDateClick}
              tileClassName={({ date }) =>
                selectedDates.includes(date.toISOString().split("T")[0])
                  ? "bg-blue-500 dark:bg-blue-600 text-white rounded-full"
                  : ""
              }
              className={theme === "dark" ? "dark-calendar" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lead;