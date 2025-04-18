import React, { useState, useEffect } from 'react';
import { Triangle, Pencil, Save, Edit, Trash2, ChevronDown } from 'lucide-react';
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

const statusTextColors = {
  Quoted: "text-yellow-600",
  "No Response": "text-gray-500",
  "Wrong Number": "text-red-500",
  "Not Interested": "text-red-500",
  "Price too high": "text-orange-500",
  "Part not available": "text-purple-600",
  Ordered: "text-green-600"
};

const Lead = () => {
  const { id } = useParams();
  const [singleLead, setSingleLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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

  const handleSaveNotes = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/Lead/updateNotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNote }),
      });

      if (response.ok) {
        toast.success("note added")
        setNotes([...notes, { text: newNote, createdAt: new Date() }]);
        setNewNote("");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Error updating notes:", error)
      console.error("Error updating notes:", error);
    }
  };

  const handleDeleteNote = async (noteid) => {
    try {
      const response = await fetch(`http://localhost:3000/Lead/deleteNotes/${id}/${noteid}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setNotes(notes.filter((note) => note._id !== noteid));
      } else {
        console.error("Error deleting note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
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
        toast.success("event added")
        setSelectedDates((prevDates) =>
          isDateSelected ? prevDates.filter((d) => d !== dateStr) : [...prevDates, dateStr]
        );
      } else {
        toast.error("faled to update date")
        console.error("Failed to update date");
      }
    } catch (error) {
      toast.error("Error updating date:", error)
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
        setShowStatusDropdown(false);
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  if (!singleLead) return <FullPageLoader />;

  return (
    <div className="p-4 md:p-8">
      {/* Top Right Buttons */}
      <div className="flex justify-end">
        <div className="flex flex-wrap justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 md:w-1/2 w-full">
          {["Convert", "Change Owner", "Edit", <Triangle size={16} className="rotate-180 fill-blue-500 text-blue-500" />].map((button, index) => (
            <button key={index} className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300 text-sm">
              {button}
            </button>
          ))}
        </div>
      </div>

  {/* Active status row */}
  <div className="flex justify-center items-center bg-white rounded-full shadow-md p-2 mb-4 w-full m-2 h-14 space-x-2 overflow-x-auto">
  <div className="flex gap-14 px-2">
    {statusOptions.map((status, index) => (
      <button
        key={index}
        onClick={() => updateStatus(singleLead._id, status)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
          ${singleLead.status === status ? 'bg-[#032d60] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        {status}
      </button>
    ))}
  </div>
  </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-300 p-4 rounded-xl">
        {/* Lead Details */}
        <div className="w-full md:w-auto h-auto md:h-96 rounded-2xl bg-slate-50 p-4">
          <h2 className="text-lg font-semibold border-b pb-2">{singleLead.clientName}</h2>
          <div className="mt-2 space-y-2 overflow-y-auto">
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
                <div className="flex items-center gap-2">
                  {item.isLink ? (
                    <a href={`mailto:${item.value}`} className="text-blue-500 hover:underline">{item.value}</a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="w-full h-auto md:h-96 rounded-2xl bg-white p-4 shadow-md flex flex-col">
          <h2 className="text-lg font-semibold border-b pb-2">Notes</h2>
          <div className="p-2 mt-2 text-gray-700 whitespace-pre-wrap overflow-y-auto flex-1">
            {notes.length > 0 ? (
              notes.map((note, index) => (
                <div key={index} className="mb-2 p-2 bg-gray-100 rounded flex justify-between items-center">
                  <div>
                    <p>{note.text}</p>
                    <small className="text-gray-500">{new Date(note.createdAt).toLocaleString()}</small>
                  </div>
                  {/* <button onClick={() => handleDeleteNote(note._id)}><Trash2 size={16} /></button> */}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">no notes added yet</p>
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
        </div>

        {/* Calendar Section */}
        <div className="w-full md:w-auto h-auto md:h-96 rounded-2xl bg-white p-4 shadow-md flex flex-col">
          <h2 className="text-lg font-semibold border-b pb-2">Important Dates</h2>
          <div className="flex justify-center items-center">
            <Calendar
              onClickDay={handleDateClick}
              tileClassName={({ date }) =>
                selectedDates.includes(date.toISOString().split("T")[0]) ? "react-calendar__tile--active" : ""
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lead;
