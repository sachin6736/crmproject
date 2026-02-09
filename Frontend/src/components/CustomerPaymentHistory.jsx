// src/components/CustomerPaymentHistory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from './LoadingOverlay';

const CustomerPaymentHistory = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [confirmedLeads, setConfirmedLeads] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');

  // Note modals
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showViewNotesModal, setShowViewNotesModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
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

  // Fetch confirmed payments
  useEffect(() => {
    if (!user) return;

    abortControllerRef.current = new AbortController();
    setLoadingLeads(true);

    const fetchData = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/Lead/confirmed-payments?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url, {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch payment history');

        const data = await res.json();
        setConfirmedLeads(data.confirmedLeads || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error('Failed to load payment history');
        }
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchData();

    return () => abortControllerRef.current?.abort();
  }, [user, currentPage, searchQuery]);

  const handleAddNote = (leadId) => {
    if (actionLoading) return;
    setSelectedLeadId(leadId);
    setNoteText('');
    setNoteError(null);
    setShowAddNoteModal(true);
  };

  const handleViewNotes = (leadId, notes) => {
    if (actionLoading) return;
    setSelectedLeadId(leadId);
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
        `${import.meta.env.VITE_API_URL}/Lead/updateNotes/${selectedLeadId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: noteText }),
        }
      );

      if (!res.ok) throw new Error('Failed to add note');

      const updatedData = await res.json();
      const updatedLead = updatedData.lead;

      setConfirmedLeads((prev) =>
        prev.map((lead) =>
          lead._id === selectedLeadId
            ? { ...lead, notes: updatedLead.notes || lead.notes }
            : lead
        )
      );

      toast.success('Note added');
      setShowAddNoteModal(false);
      setNoteText('');
    } catch (err) {
      toast.error('Failed to add note');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const isViewer = user?.role === 'viewer';

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={loadingUser || loadingLeads || actionLoading} />

      <div className={`${loadingUser || loadingLeads || actionLoading ? 'blur-[1px]' : ''}`}>
        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-auto rounded-md">
            {/* You can add buttons here later if needed */}
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              className="px-3 py-2 border rounded w-64 md:w-80 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              disabled={actionLoading}
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-md overflow-x-auto flex-grow relative">
          <table className="w-full text-left text-sm md:text-base">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                {[
                  'Client Name',
                  'Email',
                  'Phone',
                  'Part Requested',
                  'Amount Paid',
                  'Paid On',
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
              {confirmedLeads.length > 0 ? (
                confirmedLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {/* Client Name - now clickable to open lead details (non-viewers only) */}
                    <td
                      className={`px-3 md:px-4 py-2 whitespace-nowrap ${
                        isViewer
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                      }`}
                      onClick={() =>
                        !isViewer && !actionLoading && navigate(`/home/sales/lead/${lead._id}`)
                      }
                    >
                      {lead.clientName || 'N/A'}
                    </td>

                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.email || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.phoneNumber || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.partRequested || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap font-medium">
                      ${Number(lead.paymentDetails?.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                      {lead.paymentDetails?.paymentDate
                        ? new Date(lead.paymentDetails.paymentDate).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td
                      className="px-3 md:px-4 py-2 cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                      onClick={() => lead.notes?.length > 0 && handleViewNotes(lead._id, lead.notes)}
                    >
                      {lead.notes?.length || 0}
                    </td>

                    {!isViewer && (
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleAddNote(lead._id)}
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
                    colSpan={!isViewer ? 8 : 7}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No confirmed payments found
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
                  className={`px-4 py-2 border rounded min-w-[40px] text-center ${
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

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Add Note
            </h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
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
                Save Note
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
                    className={`p-4 rounded border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
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

export default CustomerPaymentHistory;