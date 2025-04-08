import React, { useState, useEffect } from 'react';
import { Triangle, Pencil, Save, Edit ,Trash2} from 'lucide-react';
import { useParams } from 'react-router-dom';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const Lead = () => {
  const { id } = useParams();
  const [singleLead, setSingleLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/Lead/getleadbyid/${id}`
        );
        const data = await response.json();
        setSingleLead(data);
        setNotes(data.notes || []);
      } catch (error) {
        console.error("Error fetching single lead:", error);
      }
    };

    fetchSingleLead();
  }, [id]);
  console.log("notes",notes);
  

  const handleSaveNotes = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:3000/Lead/updateNotes/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newNote }),
        }
      );

      if (response.ok) {
        setNotes([...notes, { text: newNote, createdAt: new Date() }]);
        setNewNote("");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const handleDeleteNote = async (noteid) => {
    try {
      const response = await fetch(`http://localhost:3000/Lead/deleteNotes/${id}/${noteid}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        // Remove the deleted note from state
        setNotes(notes.filter((note) => note._id !== noteid));
      } else {
        console.error("Error deleting note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toDateString();
    setSelectedDates((prevDates) =>
      prevDates.includes(dateStr)
        ? prevDates.filter((d) => d !== dateStr)
        : [...prevDates, dateStr]
    );
  };

  if (!singleLead) return <div className="p-8">Loading...</div>;

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
      
      {/* Active status buttons */}

      <div className="flex justify-center items-center bg-white rounded-full shadow-md p-2 mb-4 w-full m-2 h-14">
        <div className="bg-[#e5e5e5] p-2 m-2 w-3/4 h-3/4 flex justify-start space-x-2 rounded-full items-center">
          {['Lead', 'Contacted', 'Nurturing', 'Qualified', 'Not Qualified'].map((status, index) => {
            const isActive=singleLead.status === status;
            return(
            <button
              key={index}
              className={`flex items-center justify-center w-40 border-r last:border-r-0 border-gray-300 transition-colors ${
                isActive ? 'bg-[#032d60] text-white' : 'bg-transparent text-black'
              }`}
            >
              {status}
            </button>
            )
        })}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-300 p-4 rounded-xl">
        {/* Left Section - Lead Details */}
        <div className="w-full md:w-auto h-auto md:h-96 rounded-2xl bg-slate-50 p-4 overflow-y-auto">
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
                <div className="flex items-center gap-2">
                  {item.isLink ? (
                    <a href={`mailto:${item.value}`} className="text-blue-500 hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                  {/* <span className="text-gray-400 cursor-pointer hover:text-gray-600">
                    <Pencil size={16} />
                  </span> */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Section - Notes */}
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
                  <div className="flex space-x-3">
                    <button onClick={() => handleDeleteNote(note._id)} ><Trash2 size={16} /></button>
                  </div>
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

        {/* Right Section - Empty for Future Use */}
        <div className="w-full md:w-auto h-auto md:h-96 rounded-2xl bg-slate-50">
        <div className="w-full md:w-auto h-auto md:h-96 rounded-2xl bg-white p-4 shadow-md flex flex-col">
          <h2 className="text-lg font-semibold border-b pb-2">Important Dates</h2>
          <div className="flex justify-center items-center">
          <Calendar
  onClickDay={handleDateClick}
  tileClassName={({ date }) =>
    selectedDates.includes(date.toDateString()) ? "react-calendar__tile--active" : ""
  }
/>
</div>
</div>
      </div>
      </div>
    </div>
  );
};


export default Lead;
