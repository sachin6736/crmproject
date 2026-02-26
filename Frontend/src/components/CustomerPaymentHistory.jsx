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
  const [confirmedCustomers, setConfirmedCustomers] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
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

  // Fetch current user
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

  // Fetch confirmed payment customers
  useEffect(() => {
    if (!user) return;

    abortControllerRef.current = new AbortController();
    setLoadingData(true);

    const fetchData = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/Order/confirmed-payment-customers?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url, {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status} - ${errText}`);
        }

        const data = await res.json();
        setConfirmedCustomers(data.confirmedCustomers || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
          toast.error('Failed to load confirmed payment customers');
        }
      } finally {
        setLoadingData(false);
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

      setConfirmedCustomers((prev) =>
        prev.map((lead) =>
          lead._id === selectedLeadId
            ? { ...lead, notes: updatedLead.notes || lead.notes }
            : lead
        )
      );

      toast.success('Note added successfully');
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
      <LoadingOverlay isLoading={loadingUser || loadingData || actionLoading} />

      <div className={`${loadingUser || loadingData || actionLoading ? 'blur-[1px]' : ''}`}>
        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-auto rounded-md">
            {/* Future filter buttons can go here */}
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

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-md overflow-x-auto flex-grow">
          <table className="w-full text-left text-sm md:text-base">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                {[
                  'Client Name',
                  'Email',
                  'Phone',
                  'Vehicle',
                  'Amount Paid',
                  'Paid On',
                  'Notes',
                  ...(!isViewer ? ['Action'] : []),
                ].map((header, i) => (
                  <th
                    key={i}
                    className="px-3 md:px-4 py-3 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confirmedCustomers.length > 0 ? (
                confirmedCustomers.map((lead) => {
                  // Find most recently confirmed order
                  const confirmedOrders = (lead.orders || []).filter(
                    (o) => o.customerPaymentDetails?.isConfirmed === true
                  );

                  const latestOrder = confirmedOrders.sort((a, b) =>
                    new Date(b.customerPaymentDetails.confirmedAt) - new Date(a.customerPaymentDetails.confirmedAt)
                  )[0];

                  const amount = latestOrder?.customerPaymentDetails?.amountConfirmed || 0;
                  const paidOn = latestOrder?.customerPaymentDetails?.confirmedAt
                    ? new Date(latestOrder.customerPaymentDetails.confirmedAt).toLocaleString()
                    : '—';

                  return (
                    <tr
                      key={lead._id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td
                        className={`px-3 md:px-4 py-3 whitespace-nowrap ${
                          isViewer
                            ? ''
                            : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                        }`}
                        onClick={() =>
                          !isViewer && !actionLoading && navigate(`/home/sales/lead/${lead._id}`)
                        }
                      >
                        {lead.clientName || '—'}
                      </td>
                      <td className="px-3 md:px-4 py-3 whitespace-nowrap">{lead.email || '—'}</td>
                      <td className="px-3 md:px-4 py-3 whitespace-nowrap">{lead.phone || '—'}</td>
                      <td className="px-3 md:px-4 py-3 whitespace-nowrap">
                        {lead.make && lead.model && lead.year
                          ? `${lead.make} ${lead.model} (${lead.year})`
                          : '—'}
                      </td>
                      <td className="px-3 md:px-4 py-3 whitespace-nowrap font-medium">
                        ${Number(amount).toFixed(2)}
                      </td>
                      <td className="px-3 md:px-4 py-3 whitespace-nowrap">{paidOn}</td>
                      <td
                        className="px-3 md:px-4 py-3 cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                        onClick={() => lead.notes?.length > 0 && handleViewNotes(lead._id, lead.notes)}
                      >
                        {lead.notes?.length || 0}
                      </td>

                      {!isViewer && (
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleAddNote(lead._id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition disabled:opacity-50"
                          >
                            Add Note
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={!isViewer ? 8 : 7}
                    className="text-center py-10 text-gray-500 dark:text-gray-400"
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
          <div className="flex justify-center items-center mt-6 space-x-2 bg-gray-200 dark:bg-gray-800 py-3 rounded-md">
            <button
              onClick={() => !actionLoading && setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || actionLoading}
              className="px-5 py-2 border rounded bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => !actionLoading && setCurrentPage(pageNum)}
                  className={`px-4 py-2 border rounded min-w-[44px] ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                  disabled={actionLoading}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => !actionLoading && setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || actionLoading}
              className="px-5 py-2 border rounded bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Add Note</h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px]"
              placeholder="Enter your note here..."
              disabled={actionLoading}
            />
            {noteError && <p className="text-red-600 mt-2 text-sm">{noteError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddNoteModal(false)}
                disabled={actionLoading}
                className="px-5 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNote}
                disabled={actionLoading}
                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Notes Modal */}
      {showViewNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">Notes</h2>
              <button
                onClick={() => setShowViewNotesModal(false)}
                className="text-3xl leading-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            {selectedNotes.length > 0 ? (
              <div className="space-y-4">
                {selectedNotes.map((note, index) => (
                  <div
                    key={index}
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
              <p className="text-center py-10 text-gray-500 dark:text-gray-400">
                No notes available for this lead.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPaymentHistory;