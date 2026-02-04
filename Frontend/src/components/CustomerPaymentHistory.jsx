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

const CustomerPaymentHistory = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [confirmedLeads, setConfirmedLeads] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isViewNotesModalOpen, setIsViewNotesModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLeadNotes, setSelectedLeadNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState(null);
  const [noteSuccess, setNoteSuccess] = useState(null);

  const timeoutRef = useRef(null);
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

  // Fetch confirmed payment leads
  useEffect(() => {
    if (!user) return;

    const fetchConfirmedLeads = async () => {
      abortControllerRef.current = new AbortController();
      setLoadingLeads(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/Lead/confirmed-payments?page=${page}&search=${encodeURIComponent(search)}`,
          {
            credentials: 'include',
            signal: abortControllerRef.current.signal,
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to fetch payment history');
        }

        const data = await res.json();
        setConfirmedLeads(data.confirmedLeads || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load payment history');
        console.error(err);
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchConfirmedLeads();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [user, page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    if (!actionLoading) {
      setSearch('');
      setPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (!actionLoading && newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleAddNote = (leadId) => {
    if (!actionLoading) {
      setSelectedLeadId(leadId);
      setNoteText('');
      setNoteError(null);
      setNoteSuccess(null);
      setIsAddNoteModalOpen(true);
    }
  };

  const handleViewNotes = (leadId, notes) => {
    if (!actionLoading) {
      setSelectedLeadId(leadId);
      setSelectedLeadNotes(notes || []);
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/Lead/${selectedLeadId}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: noteText }),
        }
      );

      if (!res.ok) throw new Error('Failed to add note');

      // Refresh list (or optimistically update if you prefer)
      setNoteSuccess('Note added successfully');
      timeoutRef.current = setTimeout(() => {
        setIsAddNoteModalOpen(false);
        setNoteSuccess(null);
      }, 1500);
    } catch (err) {
      setNoteError(err.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAddNoteModal = () => {
    if (!actionLoading) {
      clearTimeout(timeoutRef.current);
      setIsAddNoteModalOpen(false);
      setNoteSuccess(null);
      setNoteError(null);
    }
  };

  const handleCloseViewNotesModal = () => {
    if (!actionLoading) {
      setIsViewNotesModalOpen(false);
      setSelectedLeadId(null);
      setSelectedLeadNotes([]);
    }
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <LoadingOverlay isLoading={loadingUser || loadingLeads || actionLoading} />
      <div className={`${loadingUser || loadingLeads || actionLoading ? 'blur-[1px]' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <h1 className={`text-3xl sm:text-4xl font-bold text-center mb-8 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Customer Payment History
          </h1>

          {/* Search */}
          <div className="mb-6 max-w-lg mx-auto relative">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, email, phone..."
              className={`w-full p-3 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                theme === 'dark' ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
              disabled={actionLoading}
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={actionLoading}
              >
                ×
              </button>
            )}
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className={`text-lg ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
              <button
                onClick={() => { setError(null); setPage(1); }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={actionLoading}
              >
                Retry
              </button>
            </div>
          ) : confirmedLeads.length === 0 ? (
            <p className={`text-center text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No confirmed payments found.
            </p>
          ) : (
            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table className={`min-w-full ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'}`}>
                <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  <tr className="text-left text-sm uppercase font-medium">
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Part Requested</th>
                    <th className="px-6 py-4">Amount Paid</th>
                    <th className="px-6 py-4">Paid On</th>
                    <th className="px-6 py-4">Notes</th>
                    {user?.role !== 'viewer' && <th className="px-6 py-4">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {confirmedLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      className={`border-b ${
                        theme === 'dark'
                          ? 'border-gray-700 hover:bg-gray-700/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">{lead.clientName || 'N/A'}</td>
                      <td className="px-6 py-4">{lead.email || 'N/A'}</td>
                      <td className="px-6 py-4">{lead.phoneNumber || 'N/A'}</td>
                      <td className="px-6 py-4">{lead.partRequested || 'N/A'}</td>
                      <td className="px-6 py-4 font-medium">
                        ${Number(lead.paymentDetails?.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {lead.paymentDetails?.paymentDate
                          ? new Date(lead.paymentDetails.paymentDate).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td
                        className={`px-6 py-4 cursor-pointer hover:text-blue-500 ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}
                        onClick={() => handleViewNotes(lead._id, lead.notes)}
                      >
                        {lead.notes?.length > 0 ? `${lead.notes.length} note${lead.notes.length > 1 ? 's' : ''}` : 'No notes'}
                      </td>
                      {user?.role !== 'viewer' && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleAddNote(lead._id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            disabled={actionLoading}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || actionLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || actionLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Add Note Modal */}
        <Modal
          isOpen={isAddNoteModalOpen}
          onClose={handleCloseAddNoteModal}
          onSubmit={handleNoteSubmit}
          title="Add Note to Customer Payment"
          submitLabel="Save Note"
        >
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
            rows={4}
            placeholder="Enter note here..."
            disabled={actionLoading}
          />
          {noteError && <p className="text-red-500 mt-2">{noteError}</p>}
          {noteSuccess && <p className="text-green-500 mt-2">{noteSuccess}</p>}
        </Modal>

        {/* View Notes Modal */}
        <Modal
          isOpen={isViewNotesModalOpen}
          onClose={handleCloseViewNotesModal}
          title="Payment Notes"
          showActions={false}
        >
          {selectedLeadNotes.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedLeadNotes.map((note, i) => (
                <div key={i} className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p>{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No notes yet</p>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default CustomerPaymentHistory;