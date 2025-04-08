import React, { useState, useEffect } from 'react';
import { Triangle, Pencil, Save, Edit ,Trash2} from 'lucide-react';
import { useParams } from 'react-router-dom';

const Lead = () => {
  const { id } = useParams();
  const [singleLead, setSingleLead] = useState(null);
  const [notes, setNotes] = useState([]); // Ensure notes is an array
  const [newNote, setNewNote] = useState(""); // New note input field
  const [isEditing, setIsEditing] = useState(false); // Edit mode

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        const response = await fetch(`http://localhost:3000/Lead/getleadbyid/${id}`);
        const data = await response.json();
        setSingleLead(data);
        setNotes(data.notes || []); // Ensure it's an array
      } catch (error) {
        console.error('Error fetching single lead:', error);
      }
    };

    fetchSingleLead();
  }, [id]);
  console.log("notes",notes);
  

  const handleSaveNotes = async () => {
    if (!newNote.trim()) return;
  
    try {
      const response = await fetch(`http://localhost:3000/Lead/updateNotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNote }), // Send text directly
      });
  
      if (response.ok) {
        setNotes([...notes, { text: newNote, createdAt: new Date() }]);
        setNewNote("");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  if (!singleLead) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      {/* Top Right Buttons */}
      <div className="flex items-end justify-end">
        <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/3">
          {['Convert', 'Change Owner', 'Edit', <Triangle size={16} className="rotate-180 fill-blue-500 text-blue-500" />].map((button, index) => (
            <button key={index} className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300">
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
      <div className="w-full h-96 p-2 space-x-2 bg-slate-300 flex items-center justify-center flex-row m-2">
        {/* Left Section - Lead Details */}
        <div className="w-1/3 h-full rounded-2xl bg-slate-50 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold border-b pb-2">{singleLead.clientName}</h2>
          <div className="mt-2 space-y-2">
            {[
              { label: 'Client Name', value: singleLead.clientName },
              { label: 'Phone Number', value: singleLead.phoneNumber },
              { label: 'Email', value: singleLead.email, isLink: true },
              { label: 'ZIP Code', value: singleLead.zip },
              { label: 'Part Requested', value: singleLead.partRequested },
              { label: 'Make', value: singleLead.make },
              { label: 'Model', value: singleLead.model },
              { label: 'Year', value: singleLead.year },
              { label: 'Trim', value: singleLead.trim },
              { label: 'Status', value: singleLead.status },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-1">
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
        <div className="w-1/3 h-full rounded-2xl bg-white p-4 shadow-lg flex flex-col overflow-y-auto">
          <h2 className="text-lg font-semibold border-b pb-2 flex justify-between">
            Notes
          </h2>

          {/* Notes List */}
          <div className="p-2 mt-2 text-gray-700 whitespace-pre-wrap">
            {notes.length > 0 ? (
              notes.map((note, index) => (
                <div key={index} className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-center flex-row space-x-52">
                  <div>
                  <p>{note.text}</p>
                  <small className="text-gray-500">{new Date(note.createdAt).toLocaleString()}</small>
                  </div>
                  <div className='space-x-3'>
                  <button onClick={() => navigate(`/edit/${note._id}`)}><Pencil size={16} /></button>
                  <button onClick={() => navigate(`/delete/${note._id}`)}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            ) : (
              <p>No notes available.</p>
            )}
          </div>

          {/* Notes Input */}
          {isEditing ? (
            <div className="mt-4">
              <textarea
                className="w-full p-2 border rounded"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsEditing(false)} className="text-red-500">Cancel</button>
                <button onClick={handleSaveNotes} className="text-green-500 flex items-center gap-1">
                  <Save size={18} /> Save
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-blue-500 flex items-center gap-1 mt-2">
              <Edit size={18} /> Add Note
            </button>
          )}
        </div>

        {/* Right Section - Empty for Future Use */}
        <div className="w-1/3 h-full rounded-2xl bg-slate-50"></div>
      </div>
    </div>
  );
};


export default Lead;
