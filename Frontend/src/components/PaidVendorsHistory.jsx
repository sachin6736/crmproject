import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from './LoadingOverlay';

const Modal = ({ isOpen, onClose, title, children, showActions = true, cancelLabel = 'Close' }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className={`rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-fade-in ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h2>
        {children}
        {showActions && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
            >
              {cancelLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PaidVendors = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [paidVendors, setPaidVendors] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // View Notes Modal State
  const [isViewNotesModalOpen, setIsViewNotesModalOpen] = useState(false);
  const [selectedVendorNotes, setSelectedVendorNotes] = useState([]);

  const abortControllerRef = useRef(null);

  // Fetch User
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/check`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) navigate('/login');
          throw new Error('Unauthorized');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        toast.error('Failed to load user');
        navigate('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch Paid Vendors
  useEffect(() => {
    if (!user) return;

    const fetchVendors = async () => {
      abortControllerRef.current = new AbortController();
      try {
        setLoadingVendors(true);
        setError(null);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/Order/paidvendorhistory?page=${page}&search=${encodeURIComponent(search)}`,
          { credentials: 'include', signal: abortControllerRef.current.signal }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch vendors');
        setPaidVendors(data.paidVendors || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load data');
        }
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchVendors();
    return () => abortControllerRef.current?.abort();
  }, [user, page, search]);

  const handleViewNotes = (notes = []) => {
    setSelectedVendorNotes(notes);
    setIsViewNotesModalOpen(true);
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <LoadingOverlay isLoading={loadingUser || loadingVendors} />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Paid Vendors History</h1>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by business, phone, email, agent..."
            className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
            disabled={loadingVendors}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => setPage(1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!error && paidVendors.length > 0 ? (
          <>
            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table className={`min-w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                  <tr className="text-left text-sm uppercase tracking-wider">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Agent</th>
                    <th className="px-6 py-4">Total Cost</th>
                    <th className="px-6 py-4">Paid At</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paidVendors.map((vendor) => {
                    const notes = vendor.vendor.notes || [];
                    const latestNote = notes[0];

                    return (
                      <tr
                        key={vendor._id}
                        className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 text-sm">{vendor.orderId?.order_id || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium">{vendor.vendor.businessName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{vendor.vendor.phoneNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{vendor.vendor.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{vendor.vendor.agentName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          ${vendor.vendor.totalCost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {vendor.paidAt ? new Date(vendor.paidAt).toLocaleString() : 'N/A'}
                        </td>
                        <td
                          className="px-6 py-4 text-sm cursor-pointer text-blue-500 hover:underline"
                          onClick={() => handleViewNotes(notes)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleViewNotes(notes)}
                        >
                          {notes.length > 0 ? (
                            <span>
                              {latestNote.text.length > 50
                                ? `${latestNote.text.substring(0, 47)}...`
                                : latestNote.text}
                              {notes.length > 1 && (
                                <span className="text-xs text-gray-500 ml-1">(+{notes.length - 1})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">No notes</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-4 items-center">
                <button
                  disabled={page === 1 || loadingVendors}
                  onClick={() => setPage(p => p - 1)}
                  className="px-5 py-2 bg-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-400 transition"
                >
                  Previous
                </button>
                <span className="text-lg font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages || loadingVendors}
                  onClick={() => setPage(p => p + 1)}
                  className="px-5 py-2 bg-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-400 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : !loadingVendors && !error && (
          <p className="text-center text-gray-500 py-12 text-lg">No paid vendors found.</p>
        )}

        {/* View Notes Modal */}
        <Modal
          isOpen={isViewNotesModalOpen}
          onClose={() => setIsViewNotesModalOpen(false)}
          title="Vendor Notes"
          showActions={true}
          cancelLabel="Close"
        >
          {selectedVendorNotes.length > 0 ? (
            <div className="space-y-3">
              {selectedVendorNotes.map((note, i) => (
                <div key={i} className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className="text-sm">{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Unknown date'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notes available.</p>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default PaidVendors;