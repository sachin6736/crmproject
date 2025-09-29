import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from './LoadingOverlay';

const Modal = ({ isOpen, onClose, title, children, submitLabel, cancelLabel, onSubmit, showActions = true }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-fade-in ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <h2
          id="modal-title"
          className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
        >
          {title}
        </h2>
        {children}
        {showActions && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-100 focus:ring-gray-500 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 focus:ring-gray-400 hover:bg-gray-300'
              }`}
              aria-label={cancelLabel || 'Cancel'}
            >
              {cancelLabel || 'Cancel'}
            </button>
            {onSubmit && (
              <button
                onClick={onSubmit}
                className={`px-4 py-2 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white focus:ring-blue-500 hover:bg-blue-500'
                    : 'bg-blue-500 text-white focus:ring-blue-400 hover:bg-blue-600'
                }`}
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
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cancelledVendors, setCancelledVendors] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
  const [paymentStatusError, setPaymentStatusError] = useState(null);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/check`, {
          credentials: 'include',
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        if (!data.user) throw new Error('No user data received');
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
        toast.error(error.message || 'Failed to load user data');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch cancelled vendors
  useEffect(() => {
    if (!user) return;

    const fetchCancelledVendors = async () => {
      abortControllerRef.current = new AbortController();
      try {
        setLoadingVendors(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/Order/cancelledvendorlist?page=${page}&search=${encodeURIComponent(
            search
          )}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: abortControllerRef.current.signal,
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
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to fetch cancelled vendors. Please check your network connection.');
        console.error('Fetch error:', err);
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchCancelledVendors();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    if (!actionLoading && user?.role !== 'viewer') {
      setSearch('');
      setPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (!actionLoading && user?.role !== 'viewer' && newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleAddNote = (vendorId) => {
    if (!actionLoading && user?.role !== 'viewer') {
      setSelectedVendorId(vendorId);
      setNoteText('');
      setNoteError(null);
      setNoteSuccess(null);
      setIsAddNoteModalOpen(true);
    }
  };

  const handleViewNotes = (vendorId, notes) => {
    if (!actionLoading) {
      setSelectedVendorId(vendorId);
      setSelectedVendorNotes(notes || []);
      setIsViewNotesModalOpen(true);
    }
  };

  const handleNoteSubmit = async () => {
    if (!noteText.trim()) {
      setNoteError('Note cannot be empty');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Order/cancelledvendor/${selectedVendorId}/notes`,
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
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentStatusChange = async (vendorId, newStatus) => {
    if (user?.role === 'viewer') return;
    setActionLoading(true);
    try {
      setPaymentStatusError(null);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Order/cancelledvendor/${vendorId}/paymentStatus`,
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

      const fetchResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/Order/cancelledvendorlist?page=${page}&search=${encodeURIComponent(
          search
        )}`,
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAddNoteModal = () => {
    if (!actionLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsAddNoteModalOpen(false);
      setNoteSuccess(null);
      setNoteError(null);
    }
  };

  const handleCloseViewNotesModal = () => {
    if (!actionLoading) {
      setIsViewNotesModalOpen(false);
      setSelectedVendorId(null);
      setSelectedVendorNotes([]);
    }
  };

  const handleRetry = () => {
    if (!actionLoading && user?.role !== 'viewer') {
      setError(null);
      setPaymentStatusError(null);
      setLoadingVendors(true);
      setActionLoading(true);
      setPage(1);
      setSearch('');
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
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
      <LoadingOverlay isLoading={loadingUser || loadingVendors || actionLoading} />
      <div className={`${loadingUser || loadingVendors || actionLoading ? 'blur-[1px]' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <h1
            className={`text-3xl sm:text-4xl font-bold text-center mb-8 tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
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
                className={`w-full p-3 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-100 border-gray-700'
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
                aria-label="Search cancelled vendors"
                disabled={actionLoading}
              />
              {search && user?.role !== 'viewer' && (
                <button
                  onClick={handleClearSearch}
                  className={`absolute right-3 focus:outline-none ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Clear search"
                  disabled={actionLoading}
                  aria-disabled={actionLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {error || paymentStatusError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`p-4 rounded-lg mb-4 ${
                  theme === 'dark' ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100'
                }`}
              >
                {error || paymentStatusError}
              </div>
              {user?.role !== 'viewer' && (
                <button
                  onClick={handleRetry}
                  className={`px-4 py-2 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white focus:ring-blue-500 hover:bg-blue-500'
                      : 'bg-blue-500 text-white focus:ring-blue-400 hover:bg-blue-600'
                  }`}
                  aria-label="Retry fetching data"
                  disabled={actionLoading}
                  aria-disabled={actionLoading}
                >
                  Retry
                </button>
              )}
            </div>
          ) : cancelledVendors.length === 0 ? (
            <p
              className={`text-center text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
            >
              No canceled vendors found.
            </p>
          ) : (
            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table
                className={`min-w-full ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'}`}
              >
                <thead
                  className={`sticky top-0 z-10 ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <tr className="text-left text-sm uppercase font-medium">
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
                    {user?.role !== 'viewer' && <th className="px-6 py-4">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {cancelledVendors.map((vendorData, index) => (
                    <tr
                      key={vendorData._id}
                      className={`border-b transition-colors duration-200 ${
                        theme === 'dark'
                          ? `border-gray-700 hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`
                          : `border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
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
                        {user?.role !== 'viewer' ? (
                          <select
                            value={vendorData.paymentStatus || 'pending'}
                            onChange={(e) => !actionLoading && handlePaymentStatusChange(vendorData._id, e.target.value)}
                            className={`border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-100 border-gray-600 focus:ring-blue-500'
                                : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-400'
                            }`}
                            aria-label={`Payment status for vendor ${vendorData.vendor.businessName}`}
                            disabled={actionLoading}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        ) : (
                          <span className="text-sm">{vendorData.paymentStatus || 'pending'}</span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm cursor-pointer transition-colors duration-200 ${
                          theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'
                        }`}
                        onClick={() => !actionLoading && handleViewNotes(vendorData._id, vendorData.vendor.notes)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View notes for vendor ${vendorData.vendor.businessName}`}
                        onKeyDown={(e) =>
                          !actionLoading && e.key === 'Enter' && handleViewNotes(vendorData._id, vendorData.vendor.notes)
                        }
                      >
                        {vendorData.vendor.notes?.length > 0 ? (
                          <span className="truncate block max-w-[200px]">
                            {vendorData.vendor.notes[0].text.length > 50
                              ? `${vendorData.vendor.notes[0].text.substring(0, 47)}...`
                              : vendorData.vendor.notes[0].text}
                            {vendorData.vendor.notes.length > 1 && ` (+${vendorData.vendor.notes.length - 1} more)`}
                          </span>
                        ) : (
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            No notes
                          </span>
                        )}
                      </td>
                      {user?.role !== 'viewer' && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleAddNote(vendorData._id)}
                            className={`px-3 py-1 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                              theme === 'dark'
                                ? 'bg-blue-600 text-white focus:ring-blue-500 hover:bg-blue-500'
                                : 'bg-blue-500 text-white focus:ring-blue-400 hover:bg-blue-600'
                            }`}
                            aria-label={`Add note for vendor ${vendorData.vendor.businessName}`}
                            disabled={actionLoading}
                            aria-disabled={actionLoading}
                          >
                            Add Note
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && user?.role !== 'viewer' && (
            <div className="flex flex-wrap justify-center items-center mt-6 gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || actionLoading}
                className={`px-3 py-1 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 focus:ring-blue-500 hover:bg-blue-600 disabled:bg-gray-500'
                    : 'bg-gray-200 text-gray-900 focus:ring-blue-400 hover:bg-gray-300 disabled:bg-gray-300'
                }`}
                aria-label="Previous page"
                aria-disabled={page === 1 || actionLoading}
              >
                Previous
              </button>
              {[...Array(totalPages).keys()].map((i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    page === i + 1
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-100 hover:bg-blue-600 focus:ring-blue-500'
                      : 'bg-gray-200 text-gray-900 hover:bg-blue-500 focus:ring-blue-400'
                  } focus:outline-none focus:ring-2 transition-all duration-200`}
                  aria-label={`Go to page ${i + 1}`}
                  aria-current={page === i + 1 ? 'page' : undefined}
                  disabled={actionLoading}
                  aria-disabled={actionLoading}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || actionLoading}
                className={`px-3 py-1 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 focus:ring-blue-500 hover:bg-blue-600 disabled:bg-gray-500'
                    : 'bg-gray-200 text-gray-900 focus:ring-blue-400 hover:bg-gray-300 disabled:bg-gray-300'
                }`}
                aria-label="Next page"
                aria-disabled={page === totalPages || actionLoading}
              >
                Next
              </button>
            </div>
          )}

          {/* Modal for Adding Notes */}
          {user?.role !== 'viewer' && (
            <Modal
              isOpen={isAddNoteModalOpen}
              onClose={handleCloseAddNoteModal}
              onSubmit={handleNoteSubmit}
              title="Add Note to Cancelled Vendor"
            >
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 border-gray-600'
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
                placeholder="Enter your note here..."
                rows="4"
                aria-label="Note input"
                disabled={actionLoading}
              />
              {noteError && (
                <div
                  className={`text-sm p-2 mt-2 rounded-lg ${
                    theme === 'dark' ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100'
                  }`}
                >
                  {noteError}
                </div>
              )}
              {noteSuccess && (
                <div
                  className={`text-sm p-2 mt-2 rounded-lg ${
                    theme === 'dark' ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100'
                  }`}
                >
                  {noteSuccess}
                </div>
              )}
            </Modal>
          )}

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
                  <li
                    key={noteIndex}
                    className={`text-sm leading-relaxed ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    {note.text}
                    <br />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No notes available.
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCloseViewNotesModal}
                className={`px-4 py-2 rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 focus:ring-gray-500 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 focus:ring-gray-400 hover:bg-gray-300'
                }`}
                aria-label="Close"
                disabled={actionLoading}
                aria-disabled={actionLoading}
              >
                Close
              </button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CancelledVendors;