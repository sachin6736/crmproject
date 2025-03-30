import { useState } from "react"
import React from 'react'

function Userfrom() {
    const [formData, setFormData] = useState({
        clientName: "",
        phoneNumber: "",
        email: "",
        zip: "",
        partRequested: "",
        make: "",
        model: "",
        year: "",
        trim: ""
      });
    
      const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Submitted", formData);
      };
  return (
    <div className="max-w-lg mx-auto bg-white p-6 shadow-md rounded-lg">
    <div className="w-full h-8 border-b border-b-gray-400">
    <h2 className="text-2xl font-semibold mb-4 text-center text-slate-500">New Lead</h2>
    </div>
    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-scroll">
      {[
        { label: "Client Name", name: "clientName" },
        { label: "Phone Number", name: "phoneNumber" },
        { label: "Email", name: "email", type: "email" },
        { label: "Zip", name: "zip" },
        { label: "Make", name: "make" },
        { label: "Model", name: "model" },
        { label: "Year", name: "year" },
        { label: "Trim", name: "trim" }
      ].map(({ label, name, type = "text" }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-slate-500">{label}</label>
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      ))}

     <div>
          <label className="block text-sm font-medium text-slate-500">Part Requested</label>
          <select
            name="partRequested"
            value={formData.partRequested}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a Part</option>
            <option value="Engine">Engine</option>
            <option value="Transmission">Transmission</option>
            <option value="Brakes">Brakes</option>
          </select>
        </div>
      
        <div className="flex justify-end space-x-2">
        <button type="button" className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
      </div>
    </form>
  </div>
  )
}

export default Userfrom
