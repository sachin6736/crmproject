import { useState } from "react";
import React from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function UserForm() {
  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    email: "",
    zip: "",
    partRequested: "",
    make: "",
    model: "",
    year: "",
    trim: "",
  });

  const [message, setMessage] = useState(""); 

  const handleChange =  (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/Lead/createnewlead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:"include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast("form has been uploaded",{ icon: "💾" })
        setFormData({
          clientName: "",
          phoneNumber: "",
          email: "",
          zip: "",
          partRequested: "",
          make: "",
          model: "",
          year: "",
          trim: "",
        });
      } else {
       toast.error(data || "Failed to create lead");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Error:", error);
    }
  };

  // Static options
  const makes = ["Toyota", "Honda", "Ford", "BMW"];
  const models = ["Corolla", "Civic", "F-150", "X5"];
  const years = ["2023", "2022", "2021", "2020"];
  const trims = ["Base", "Sport", "Luxury", "Premium"];

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-md rounded-lg">
      <div className="w-full border-b border-gray-300 pb-2 mb-4">
        <h2 className="text-2xl font-semibold text-slate-600 text-center">
          New Lead
        </h2>
      </div>
      {message && <p className="text-center text-red-500">{message}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {[
          { label: "Name", name: "clientName" },
          { label: "Phone Number", name: "phoneNumber" },
          { label: "Email", name: "email", type: "email" },
          { label: "Zip", name: "zip" },
        ].map(({ label, name, type = "text" }) => (
          <div key={name} className="col-span-1">
            <label className="block text-sm font-medium text-slate-500">
              {label}
            </label>
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

        {/* Dropdowns */}
        {[
          { label: "Make", name: "make", options: makes },
          { label: "Model", name: "model", options: models },
          { label: "Year", name: "year", options: years },
          { label: "Trim", name: "trim", options: trims },
        ].map(({ label, name, options }) => (
          <div key={name} className="col-span-1">
            <label className="block text-sm font-medium text-slate-500">
              {label}
            </label>
            <select
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select {label}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Part Requested Dropdown */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-500">
            Part Requested
          </label>
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

        {/* Buttons */}
        <div className="col-span-2 flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded-md shadow-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
