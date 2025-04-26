import React, { useState, useEffect } from 'react';
import { Triangle, Save, Edit } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import FullPageLoader from './utilities/FullPageLoader';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const statusOptions = [
  'Quoted',
  'No Response',
  'Wrong Number',
  'Not Interested',
  'Price too high',
  'Part not available',
  'Ordered',
];

const Lead = () => {
  const { id } = useParams();
  const [singleLead, setSingleLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showNotes, setShowNotes] = useState(true);

  const [partCost, setPartCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [grossProfit, setGrossProfit] = useState("");
  const [totalCost, setTotalCost] = useState("");

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        const response = await fetch(`http://localhost:3000/Lead/getleadbyid/${id}`);
        const data = await response.json();
        setSingleLead(data);
        setNotes(data.notes || []);
        setSelectedDates(data.importantDates || []);
      } catch (error) {
        console.error("Error fetching single lead:", error);
      }
    };

    fetchSingleLead();
  }, [id]);

  useEffect(() => {
    const part = parseFloat(partCost) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const gp = parseFloat(grossProfit) || 0;
    setTotalCost((part + shipping + gp).toFixed(2));
  }, [partCost, shippingCost, grossProfit]);

  const handleSaveNotes = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/Lead/updateNotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNote }),
      });

      if (response.ok) {
        toast.success("Note added");
        setNotes([...notes, { text: newNote, createdAt: new Date() }]);
        setNewNote("");
        setIsEditing(false);
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
          body: isDateSelected ? null : JSON.stringify({ selectedDate: dateStr }),
        }
      );

      if (response.ok) {
        toast.success("Event updated");
        setSelectedDates((prevDates) =>
          isDateSelected ? prevDates.filter((d) => d !== dateStr) : [...prevDates, dateStr]
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
      const response = await fetch(`http://localhost:3000/Lead/updatelead/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSingleLead((prev) => ({ ...prev, status: newStatus }));
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  const CostBreakdown = ({ setShowNotes }) => {
    const data = [
      { label: "Part Cost", value: partCost, setter: setPartCost },
      { label: "Shipping Cost", value: shippingCost, setter: setShippingCost },
      { label: "Gross Profit", value: grossProfit, setter: setGrossProfit },
    ];

    return (
      <div className="w-full flex flex-col items-center gap-3">
        <h2 className="text-lg font-semibold">Cost Breakdown</h2>
        {data.map((item, index) => (
          <div
            key={index}
            className="w-full h-20 bg-[#f3f4f6] flex flex-row items-center justify-between px-6 rounded-lg"
          >
            <p className="text-base font-medium">{item.label}</p>
            <input
              type="number"
              value={item.value}
              onChange={(e) => item.setter(e.target.value)}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-right"
            />
          </div>
        ))}
        <div className="text-lg font-bold text-green-700">Total Cost: ${totalCost}</div>
        <button onClick={() => setShowNotes(true)} className="text-sm text-blue-500 mt-4">← Back to Notes</button>
      </div>
    );
  };

  if (!singleLead) return <FullPageLoader />;

  return (
    <div className="p-4 md:p-8">
      {/* Action Buttons */}
      <div className="flex justify-end">
        <div className="flex flex-wrap justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 md:w-1/2 w-full">
          {["Convert", "Change Owner", "Edit", "Send Quote", <Triangle size={16} className="rotate-180 fill-blue-500 text-blue-500" />].map((button, index) => (
            <button key={index} className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300 text-sm">
              {button}
            </button>
          ))}
        </div>
      </div>

      {/* Status Buttons */}
      <div className="flex justify-center items-center bg-white rounded-full shadow-md p-2 mb-4 w-full m-2 h-14 space-x-2 overflow-x-auto">
        <div className="flex gap-14 px-2">
          {statusOptions.map((status, index) => (
            <button
              key={index}
              onClick={() => updateStatus(singleLead._id, status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${singleLead.status === status ? 'bg-[#032d60] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-300 p-4 rounded-xl">
        {/* Lead Details */}
        <div className="w-full md:w-auto rounded-2xl bg-slate-50 p-4">
          <h2 className="text-lg font-semibold border-b pb-2">{singleLead.clientName}</h2>
          <div className="mt-2 space-y-2">
            {[
              { label: "Client Name", value: singleLead.clientName },
              { label: "Phone Number", value: singleLead.phoneNumber },
              { label: "Email", value: singleLead.email, isLink: true },
              { label: "ZIP Code", value: singleLead.zip },
              { label: "Part Requested", value: singleLead.partRequested },
              { label: "Make", value: singleLead.make },
              { label: "Model", value: singleLead.model },
              { label: "Year", value: singleLead.year },
              { label: "Trim", value: singleLead.trim },
              { label: "Status", value: singleLead.status },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-1 text-sm">
                <span className="text-gray-600 font-medium">{item.label}</span>
                {item.isLink ? (
                  <a href={`mailto:${item.value}`} className="text-blue-500 hover:underline">{item.value}</a>
                ) : (
                  <span>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes & Cost Breakdown */}
        <div className="w-full h-auto rounded-2xl bg-white p-4 shadow-md overflow-hidden relative">
          <div className="w-full h-full flex transition-transform duration-500 ease-in-out" style={{ transform: showNotes ? 'translateX(0%)' : 'translateX(-100%)' }}>
            {/* Notes View */}
            <div className="w-full flex-shrink-0 flex flex-col">
              <h2 className="text-lg font-semibold border-b pb-2">Notes</h2>
              <div className="p-2 mt-2 text-gray-700 whitespace-pre-wrap overflow-y-auto flex-1">
                {notes.length > 0 ? (
                  notes.map((note, index) => (
                    <div key={index} className="mb-2 p-2 bg-gray-100 rounded flex justify-between items-center">
                      <div>
                        <p>{note.text}</p>
                        <small className="text-gray-500">{new Date(note.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center">No notes added yet</p>
                )}
              </div>
              {isEditing ? (
                <div className="mt-4">
                  <textarea className="w-full p-2 border rounded text-sm" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditing(false)} className="text-red-500 text-sm">Cancel</button>
                    <button onClick={handleSaveNotes} className="text-green-500 flex items-center gap-1 text-sm">
                      <Save size={18} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-blue-500 flex items-center gap-1 mt-2 text-sm">
                  <Edit size={18} /> Add Note
                </button>
              )}
              <button onClick={() => setShowNotes(false)} className="text-sm text-[#032d60] mt-4">Go →</button>
            </div>

            {/* Cost Breakdown View */}
            <div className="w-full flex-shrink-0 flex flex-col justify-center items-center ml-4">
              <CostBreakdown setShowNotes={setShowNotes} />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="w-full h-auto rounded-2xl bg-white p-4 shadow-md">
          <h2 className="text-lg font-semibold border-b pb-2">Important Dates</h2>
          <Calendar
            onClickDay={handleDateClick}
            value={new Date()}
            tileClassName={({ date, view }) => {
              const dateStr = date.toISOString().split("T")[0];
              return selectedDates.includes(dateStr) ? 'bg-blue-200 rounded-lg' : '';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Lead;