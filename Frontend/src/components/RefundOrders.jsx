// src/components/RefundOrders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from './LoadingOverlay';
import ConfirmationModal from './ConfirmationModal';

const RefundOrders = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10; // match leads page

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Refund', 'Refund Completed'

  // Confirmation modal state (same pattern as leads)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Confirm');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmOverrideClass, setConfirmOverrideClass] = useState('');

  // Note modal (kept simple modal – can later extract if needed)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState(null);

  const abortControllerRef = useRef(null);

  // Status badge colors (aligned with leads page style)
  const statusStyles = {
    Refund: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Refund Completed': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  // ────────────────────────────────────────────────
  //  Fetch user (same as leads)
  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
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

  // ────────────────────────────────────────────────
  //  Fetch refund orders
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    abortControllerRef.current = new AbortController();

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        let url = `${import.meta.env.VITE_API_URL}/LiteReplace/refund-orders?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`;
        if (statusFilter !== 'all') {
          url += `&status=${encodeURIComponent(statusFilter)}`;
        }

        const res = await fetch(url, {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch refund orders');

        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error('Failed to load refund orders');
        }
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();

    return () => abortControllerRef.current?.abort();
  }, [user, currentPage, searchQuery, statusFilter]);

  // ────────────────────────────────────────────────
  //  Handlers
  // ────────────────────────────────────────────────
  const handleMarkRefundCompleted = (orderId) => {
    setConfirmTitle('Confirm Refund Completed');
    setConfirmMessage('Are you sure you want to mark this refund as completed?');
    setConfirmText('Yes, Mark Completed');
    setConfirmOverrideClass('!bg-green-600 !hover:bg-green-700 !focus:ring-green-500');
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/LiteReplace/refund-completed/${orderId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );

        if (!res.ok) throw new Error('Failed to mark as completed');

        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: 'Refund Completed' } : o))
        );

        toast.success('Refund marked as completed');
      } catch (err) {
        toast.error('Failed to mark refund as completed');
      } finally {
        setActionLoading(false);
        setShowConfirmModal(false);
      }
    });

    setShowConfirmModal(true);
  };

  const handleAddNote = (orderId) => {
    setSelectedOrderId(orderId);
    setNoteText('');
    setNoteError(null);
    setShowAddNoteModal(true);
  };

  const handleSubmitNote = async () => {
    if (!noteText.trim()) {
      setNoteError('Note cannot be empty');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/Order/${selectedOrderId}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ note: noteText }),
        }
      );

      if (!res.ok) throw new Error('Failed to add note');

      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrderId
            ? { ...o, notes: [...(o.notes || []), { text: noteText, createdAt: new Date() }] }
            : o
        )
      );

      toast.success('Note added');
      setShowAddNoteModal(false);
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const isViewer = user?.role === 'viewer';

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={loadingUser || loadingOrders || actionLoading} />

      <div className={`${loadingUser || loadingOrders || actionLoading ? 'blur-[1px]' : ''}`}>
        {/* Filters & Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-auto rounded-md">
            {/* You can add "New Refund" or other actions here later if needed */}
          </div>

          <div className="flex items-center space-x-4 flex-wrap gap-y-3">
            {!isViewer && (
              <>
                <input
                  type="text"
                  placeholder="Search by order ID, name, phone, email..."
                  className="px-3 py-2 border rounded w-60 md:w-80 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={actionLoading}
                />

                <select
                  className="border px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={actionLoading}
                >
                  <option value="all">All Refund Statuses</option>
                  <option value="Refund">Pending Refund</option>
                  <option value="Refund Completed">Refund Completed</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-md shadow-md overflow-x-auto flex-grow relative">
          <table className="w-full text-left text-sm md:text-base">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                {['Order ID', 'Client Name', 'Phone', 'Email', 'Amount', 'Refund Date', 'Status', 'Notes', ...(!isViewer ? ['Actions'] : [])].map((header, i) => (
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
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{order.order_id || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{order.clientName || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{order.phone || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{order.email || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                      ${order.amount?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-3 md:px-4 py-2">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                          statusStyles[order.status] || statusStyles.default
                        }`}
                      >
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                    <td
                      className="px-3 md:px-4 py-2 cursor-pointer hover:underline"
                      onClick={() => order.notes?.length > 0 && toast.info(`Notes: ${order.notes.length}`)}
                    >
                      {order.notes?.length || 0}
                    </td>

                    {!isViewer && (
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap flex gap-2">
                        {order.status === 'Refund' && (
                          <button
                            onClick={() => !actionLoading && handleMarkRefundCompleted(order._id)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50 transition"
                          >
                            Mark Completed
                          </button>
                        )}
                        <button
                          onClick={() => !actionLoading && handleAddNote(order._id)}
                          disabled={actionLoading}
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
                    colSpan={!isViewer ? 9 : 8}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No refund orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination – exact same style as leads */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2 bg-[#cbd5e1] dark:bg-gray-800 py-3 rounded-md">
            <button
              onClick={() => !actionLoading && setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || actionLoading}
              className="px-4 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => !actionLoading && setCurrentPage(pageNum)}
                  className={`px-4 py-2 border rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-500 dark:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={actionLoading}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => !actionLoading && setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || actionLoading}
              className="px-4 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal – reused from leads page */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        cancelText="Cancel"
        confirmButtonProps={{
          className: `${confirmOverrideClass} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`,
          disabled: actionLoading,
        }}
        cancelButtonProps={{ disabled: actionLoading }}
      />

      {/* Add Note Modal – kept simple, but styled similarly */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Add Note
            </h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
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
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundOrders;