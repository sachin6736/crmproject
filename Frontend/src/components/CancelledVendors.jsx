import React, { useState, useEffect, useRef } from 'react';

const FullPageLoader = ({ size = 'w-6 h-6', color = 'text-blue-500', fill = 'fill-blue-200' }) => (
  <svg className={`${size} animate-spin ${color}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className={fill} d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
  </svg>
);

const Modal = ({ isOpen, onClose, title, children, submitLabel, cancelLabel, onSubmit, showActions = true }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-fade-in">
        <h2 id="modal-title" className="text-xl font-semibold text-gray-100 mb-4">{title}</h2>
        {children}
        {showActions && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              aria-label={cancelLabel || 'Cancel'}
            >
              {cancelLabel || 'Cancel'}
            </button>
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                aria-label={submitLabel || 'Submit'}
              >
                {submitLabel || 'Submit'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CancelledVendors = () => {
  const [cancelledVendors, setCancelledVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isViewNotesModalOpen, setIsViewNotesModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedVendorNotes, setSelectedVendorNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState(null);
  const [noteSuccess, setNoteSuccess] = useState(null);
  const [paymentStatusError, setPaymentStatusError] = useState(null); // New state for payment status errors
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchCancelledVendors = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/Order/cancelledvendorlist?page=${page}&search=${encodeURIComponent(search)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch cancelled vendors');
        }
        const data = await response.json();
        setCancelledVendors(data.cancelledVendors || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.message || 'Failed to fetch cancelled vendors. Please check your network connection.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCancelledVendors();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
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
    setIsAddNoteModalOpen(true);
  };

  const handleViewNotes = (vendorId, notes) => {
    setSelectedVendorId(vendorId);
    setSelectedVendorNotes(notes || []);
    setIsViewNotesModalOpen(true);
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
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsAddNoteModalOpen(false);
        setNoteSuccess(null);
      }, 1500);
    } catch (err) {
      setNoteError(err.message || 'Failed to add note. Please check your network connection.');
    }
  };

  const handlePaymentStatusChange = async (vendorId, newStatus) => {
  try {
    setPaymentStatusError(null); // Clear previous errors
    const response = await fetch(
      `http://localhost:3000/Order/cancelledvendor/${vendorId}/paymentStatus`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentStatus: newStatus }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update payment status');
    }

    // Re-fetch the cancelled vendors list to ensure UI is in sync with the server
    const fetchResponse = await fetch(
      `http://localhost:3000/Order/cancelledvendorlist?page=${page}&search=${encodeURIComponent(search)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      throw new Error(errorData.message || 'Failed to fetch updated vendor list');
    }

    const data = await fetchResponse.json();
    setCancelledVendors(data.cancelledVendors || []);
    setTotalPages(data.totalPages || 1);
  } catch (err) {
    setPaymentStatusError(err.message || 'Failed to update payment status. Please check your network connection.');
    console.error('Payment status update error:', err);
  }
};

  const handleCloseAddNoteModal = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsAddNoteModalOpen(false);
    setNoteSuccess(null);
    setNoteError(null);
  };

  const handleCloseViewNotesModal = () => {
    setIsViewNotesModalOpen(false);
    setSelectedVendorId(null);
    setSelectedVendorNotes([]);
  };

  const handleRetry = () => {
    setError(null);
    setPaymentStatusError(null); // Clear payment status error on retry
    setLoading(true);
    setPage(1);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 text-gray-100">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-white tracking-tight">
          Canceled Vendors
        </h1>

        {/* Search Bar */}
        <div className="mb-6 max-w-lg mx-auto relative">
          <div className="flex items-center">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by business name, phone, email, agent, or reason..."
              className="w-full p-3 pr-10 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base"
              aria-label="Search cancelled vendors"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 text-gray-400 hover:text-gray-200 focus:outline-none"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FullPageLoader />
            <span className="ml-2 text-gray-100">Loading...</span>
          </div>
        ) : error || paymentStatusError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-400 bg-red-900/30 p-4 rounded-lg mb-4">{error || paymentStatusError}</div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-label="Retry fetching data"
            >
              Retry
            </button>
          </div>
        ) : cancelledVendors.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">No canceled vendors found.</p>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-gray-800 text-gray-200">
              <thead className="bg-gray-700 sticky top-0 z-10">
                <tr className="text-left text-sm uppercase font-medium text-gray-300">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Business Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Total Cost</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Canceled At</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {cancelledVendors.map((vendorData, index) => (
                  <tr
                    key={vendorData._id}
                    className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">{vendorData.orderId?.order_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{vendorData.vendor.businessName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{vendorData.vendor.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{vendorData.vendor.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{vendorData.vendor.agentName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">${vendorData.vendor.totalCost?.toFixed(2) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{vendorData.cancellationReason || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      {vendorData.canceledAt ? new Date(vendorData.canceledAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={vendorData.paymentStatus || 'pending'}
                        onChange={(e) => handlePaymentStatusChange(vendorData._id, e.target.value)}
                        className="bg-gray-700 text-gray-100 border border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                        aria-label={`Payment status for vendor ${vendorData.vendor.businessName}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td
                      className="px-6 py-4 text-sm cursor-pointer hover:text-blue-400 transition-colors duration-200"
                      onClick={() => handleViewNotes(vendorData._id, vendorData.vendor.notes)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View notes for vendor ${vendorData.vendor.businessName}`}
                      onKeyDown={(e) => e.key === 'Enter' && handleViewNotes(vendorData._id, vendorData.vendor.notes)}
                    >
                      {vendorData.vendor.notes?.length > 0 ? (
                        <span className="truncate block max-w-[200px]">
                          {vendorData.vendor.notes[0].text.length > 50
                            ? `${vendorData.vendor.notes[0].text.substring(0, 47)}...`
                            : vendorData.vendor.notes[0].text}
                          {vendorData.vendor.notes.length > 1 && ` (+${vendorData.vendor.notes.length - 1} more)`}
                        </span>
                      ) : (
                        <span className="text-gray-400">No notes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleAddNote(vendorData._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                        aria-label={`Add note for vendor ${vendorData.vendor.businessName}`}
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
          <div className="flex flex-wrap justify-center items-center mt-6 gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-700 text-gray-100 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              aria-label="Previous page"
            >
              Previous
            </button>
            {[...Array(totalPages).keys()].map((i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                } transition-all duration-200`}
                aria-label={`Go to page ${i + 1}`}
                aria-current={page === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-700 text-gray-100 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}

        {/* Modal for Adding Notes */}
        <Modal
          isOpen={isAddNoteModalOpen}
          onClose={handleCloseAddNoteModal}
          onSubmit={handleNoteSubmit}
          title="Add Note to Cancelled Vendor"
        >
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
            placeholder="Enter your note here..."
            rows="4"
            aria-label="Note input"
          />
          {noteError && (
            <div className="text-red-400 bg-red-900/30 p-2 mt-2 rounded-lg text-sm">{noteError}</div>
          )}
          {noteSuccess && (
            <div className="text-green-400 bg-green-900/30 p-2 mt-2 rounded-lg text-sm">{noteSuccess}</div>
          )}
        </Modal>

        {/* Modal for Viewing Notes */}
        <Modal
          isOpen={isViewNotesModalOpen}
          onClose={handleCloseViewNotesModal}
          title="View Notes"
          showActions={false}
          cancelLabel="Close"
        >
          {selectedVendorNotes.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {selectedVendorNotes.map((note, noteIndex) => (
                <li key={noteIndex} className="text-sm leading-relaxed">
                  {note.text}
                  <br />
                  <span className="text-xs text-gray-400">
                    ({note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No notes available.</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCloseViewNotesModal}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CancelledVendors;