// src/components/CancelledVendors.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from './LoadingOverlay';
import ConfirmationModal from './ConfirmationModal';

const CancelledVendors = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showViewNotesModal, setShowViewNotesModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState(null);

  const abortControllerRef = useRef(null);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/check`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 401) navigate('/login');
          throw new Error('Failed to fetch user');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load user data');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch cancelled vendors
  useEffect(() => {
    if (!user) return;

    abortControllerRef.current = new AbortController();
    setLoadingVendors(true);

    const fetchData = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/Order/cancelledvendorlist?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url, {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch cancelled vendors');

        const data = await res.json();
        setVendors(data.cancelledVendors || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error('Failed to load cancelled vendors');
        }
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchData();

    return () => abortControllerRef.current?.abort();
  }, [user, currentPage, searchQuery]);

  const handlePaymentStatusChange = async (vendorId, newStatus) => {
    if (actionLoading || user?.role === 'viewer') return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/Order/cancelledvendor/${vendorId}/paymentStatus`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ paymentStatus: newStatus }),
        }
      );

      if (!res.ok) throw new Error('Failed to update payment status');

      setVendors(prev =>
        prev.map(v =>
          v._id === vendorId ? { ...v, paymentStatus: newStatus } : v
        )
      );

      toast.success('Payment status updated');
    } catch (err) {
      toast.error('Failed to update payment status');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = (vendorId) => {
    if (actionLoading || user?.role === 'viewer') return;
    setSelectedVendorId(vendorId);
    setNoteText('');
    setNoteError(null);
    setShowAddNoteModal(true);
  };

  const handleViewNotes = (vendorId, notes) => {
    if (actionLoading) return;
    setSelectedVendorId(vendorId);
    setSelectedNotes(notes || []);
    setShowViewNotesModal(true);
  };

  const handleSubmitNote = async () => {
    if (!noteText.trim()) {
      setNoteError('Note cannot be empty');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/Order/cancelledvendor/${selectedVendorId}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ note: noteText }),
        }
      );

      if (!res.ok) throw new Error('Failed to add note');

      // Optimistic update (like in your code)
      setVendors(prev =>
        prev.map(v =>
          v._id === selectedVendorId
            ? {
                ...v,
                vendor: {
                  ...v.vendor,
                  notes: [...(v.vendor?.notes || []), { text: noteText, createdAt: new Date() }],
                },
              }
            : v
        )
      );

      toast.success('Note added');
      setShowAddNoteModal(false);
      setNoteText('');
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderClick = (orderId) => {
    if (actionLoading || user?.role === 'viewer' || !orderId) return;
    navigate(`/home/order/details/${orderId}`);
  };

  const isViewer = user?.role === 'viewer';

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      {/* Loading Overlay - same as LitigationOrders */}
      <LoadingOverlay isLoading={loadingUser || loadingVendors || actionLoading} />

      <div className={`${loadingUser || loadingVendors || actionLoading ? 'blur-[1px]' : ''}`}>
        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-auto rounded-md">
            {/* Optional buttons can go here later */}
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search by business name, phone, email, agent, reason..."
              className="px-3 py-2 border rounded w-64 md:w-96 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              disabled={actionLoading || isViewer || loadingVendors}
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-md overflow-x-auto flex-grow relative">
          <table className="w-full text-left text-sm md:text-base">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                {[
                  'Order ID',
                  'Business Name',
                  'Phone',
                  'Email',
                  'Agent',
                  'Total Cost',
                  'Reason',
                  'Canceled At',
                  'Payment Status',
                  'Notes',
                  ...(!isViewer ? ['Action'] : []),
                ].map((header, i) => (
                  <th
                    key={i}
                    className="px-3 md:px-4 py-2 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingVendors ? (
                // Optional: you can show a loading row instead of nothing, but LoadingOverlay already covers it
                <tr>
                  <td colSpan={!isViewer ? 11 : 10} className="text-center py-6 text-gray-500 dark:text-gray-400">
                    Loading cancelled vendors...
                  </td>
                </tr>
              ) : vendors.length > 0 ? (
                vendors.map((vendorData) => (
                  <tr
                    key={vendorData._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td
                      className={`px-3 md:px-4 py-2 whitespace-nowrap ${
                        isViewer
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                      }`}
                      onClick={() =>
                        !isViewer &&
                        !actionLoading &&
                        vendorData.orderId?._id &&
                        handleOrderClick(vendorData.orderId._id)
                      }
                    >
                      {vendorData.orderId?.order_id || 'N/A'}
                    </td>

                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendorData.vendor?.businessName || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendorData.vendor?.phoneNumber || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendorData.vendor?.email || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendorData.vendor?.agentName || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                      ${vendorData.vendor?.totalCost?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendorData.cancellationReason || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                      {vendorData.canceledAt ? new Date(vendorData.canceledAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-3 md:px-4 py-2">
                      {isViewer ? (
                        <span className="text-sm capitalize">{vendorData.paymentStatus || 'pending'}</span>
                      ) : (
                        <select
                          value={vendorData.paymentStatus || 'pending'}
                          onChange={(e) => !actionLoading && handlePaymentStatusChange(vendorData._id, e.target.value)}
                          className="border px-3 py-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                          disabled={actionLoading || loadingVendors}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      )}
                    </td>
                    <td
                      className="px-3 md:px-4 py-2 cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                      onClick={() => vendorData.vendor?.notes?.length > 0 && handleViewNotes(vendorData._id, vendorData.vendor.notes)}
                    >
                      {vendorData.vendor?.notes?.length || 0}
                    </td>

                    {!isViewer && (
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleAddNote(vendorData._id)}
                          disabled={actionLoading || loadingVendors}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 transition"
                        >
                          Add Note
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={!isViewer ? 11 : 10}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No cancelled vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2 bg-[#cbd5e1] dark:bg-gray-800 py-3 rounded-md">
            <button
              onClick={() => !actionLoading && setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || actionLoading || isViewer || loadingVendors}
              className="px-4 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => !actionLoading && !isViewer && !loadingVendors && setCurrentPage(pageNum)}
                  className={`px-4 py-2 border rounded min-w-[40px] text-center ${
                    currentPage === pageNum
                      ? 'bg-blue-500 dark:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={actionLoading || isViewer || loadingVendors}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => !actionLoading && setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || actionLoading || isViewer || loadingVendors}
              className="px-4 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && !isViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Add Note
            </h2>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Enter note here..."
              disabled={actionLoading}
            />
            {noteError && <p className="text-red-600 mt-2 text-sm">{noteError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddNoteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNote}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Notes Modal */}
      {showViewNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Notes
              </h2>
              <button
                onClick={() => setShowViewNotesModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {selectedNotes.length > 0 ? (
              <div className="space-y-4">
                {selectedNotes.map((note, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                No notes available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelledVendors;