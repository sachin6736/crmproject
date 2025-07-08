import React, { useState, useEffect, useRef } from 'react';

const CancelledVendors = () => {
  const [cancelledVendors, setCancelledVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState(null);
  const [noteSuccess, setNoteSuccess] = useState(null);
  const timeoutRef = useRef(null); // Added to manage timeout

  useEffect(() => {
    const fetchCancelledVendors = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/Order/cancelledvendorlist?page=${page}&search=${encodeURIComponent(search)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch cancelled vendors");
        }
        const data = await response.json();
        if (!data.cancelledVendors) {
          console.warn('No cancelledVendors in response:', data);
        }
        setCancelledVendors(data.cancelledVendors || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch cancelled vendors. Please check your network connection.');
        setLoading(false);
        console.error('Fetch error:', err);
      }
    };

    fetchCancelledVendors();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleAddNote = (vendorId) => {
    setSelectedVendorId(vendorId);
    setNoteText('');
    setNoteError(null);
    setNoteSuccess(null);
    setIsModalOpen(true);
  };

  const handleNoteSubmit = async () => {
    if (!noteText.trim()) {
      setNoteError('Note cannot be empty');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/Order/cancelledvendor/${selectedVendorId}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ note: noteText }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add note');
      }

      setCancelledVendors((prevVendors) =>
        prevVendors.map((vendor) =>
          vendor._id === selectedVendorId
            ? {
                ...vendor,
                vendor: {
                  ...vendor.vendor,
                  notes: [...(vendor.vendor.notes || []), { text: noteText, createdAt: new Date() }],
                },
              }
            : vendor
        )
      );
      setNoteSuccess('Note added successfully');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current); // Clear any existing timeout
      }
      timeoutRef.current = setTimeout(() => {
        setIsModalOpen(false);
        setNoteSuccess(null);
      }, 1500);
    } catch (err) {
      setNoteError(err.message || 'Failed to add note. Please check your network connection.');
    }
  };

  const handleCloseModal = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // Clear timeout when closing manually
    }
    setIsModalOpen(false);
    setNoteSuccess(null);
    setNoteError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-red-400 bg-red-900/30 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 text-gray-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Canceled Vendors</h1>

        {/* Search Bar */}
        <div className="mb-6 max-w-md mx-auto">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by business name, phone, email, agent, or reason..."
            className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>

        {cancelledVendors.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">No canceled vendors found.</p>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-gray-800 text-gray-200">
              <thead>
                <tr className="bg-gray-700 text-left text-sm uppercase font-medium text-gray-300">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Business Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Total Cost</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Canceled At</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {cancelledVendors.map((vendorData, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">{vendorData.orderId?.order_id || 'N/A'}</td>
                    <td className="px-6 py-4">{vendorData.orderId?.clientName || 'N/A'}</td>
                    <td className="px-6 py-4">{vendorData.vendor.businessName || 'N/A'}</td>
                    <td className="px-6 py-4">{vendorData.vendor.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-4">{vendorData.vendor.email || 'N/A'}</td>
                    <td className="px-6 py-4">{vendorData.vendor.agentName || 'N/A'}</td>
                    <td className="px-6 py-4">${vendorData.vendor.totalCost?.toFixed(2) || 'N/A'}</td>
                    <td className="px-6 py-4">{vendorData.cancellationReason || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {vendorData.canceledAt ? new Date(vendorData.canceledAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {vendorData.vendor.notes?.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {vendorData.vendor.notes.map((note, noteIndex) => (
                            <li key={noteIndex} className="text-sm">
                              {note.text} <br />
                              <span className="text-gray-400 text-xs">
                                ({note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">No notes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleAddNote(vendorData._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200"
                      >
                        Add Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-4">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <span className="text-gray-100 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        )}

        {/* Modal for Adding Notes */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">Add Note to Cancelled Vendor</h2>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Enter your note here..."
                rows="4"
              />
              {noteError && (
                <div className="text-red-400 bg-red-900/30 p-2 mt-2 rounded-lg">{noteError}</div>
              )}
              {noteSuccess && (
                <div className="text-green-400 bg-green-900/30 p-2 mt-2 rounded-lg">{noteSuccess}</div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoteSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelledVendors;