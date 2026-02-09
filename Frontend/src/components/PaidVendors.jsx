// src/components/PaidVendors.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import LoadingOverlay from './LoadingOverlay';

const PaidVendors = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [paidVendors, setPaidVendors] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');

  // Notes modal
  const [showViewNotesModal, setShowViewNotesModal] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

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

  // Fetch paid vendors
  useEffect(() => {
    if (!user) return;

    abortControllerRef.current = new AbortController();
    setLoadingVendors(true);

    const fetchData = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/Order/paidvendorhistory?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url, {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch paid vendors');

        const data = await res.json();
        setPaidVendors(data.paidVendors || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error('Failed to load paid vendors history');
        }
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchData();

    return () => abortControllerRef.current?.abort();
  }, [user, currentPage, searchQuery]);

  const handleViewNotes = (notes = []) => {
    if (actionLoading) return;
    setSelectedNotes(notes);
    setShowViewNotesModal(true);
  };

  const isViewer = user?.role === 'viewer';

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={loadingUser || loadingVendors || actionLoading} />

      <div className={`${loadingUser || loadingVendors || actionLoading ? 'blur-[1px]' : ''}`}>
        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-auto rounded-md">
            {/* Future: can add buttons here like in leads page */}
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search by business name, phone, email, agent..."
              className="px-3 py-2 border rounded w-64 md:w-96 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              disabled={actionLoading || isViewer}
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
                  'Paid At',
                  'Notes',
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
              {paidVendors.length > 0 ? (
                paidVendors.map((vendor) => {
                  const notes = vendor.vendor?.notes || [];
                  return (
                    <tr
                      key={vendor._id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendor.orderId?.order_id || 'N/A'}</td>
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap font-medium">
                        {vendor.vendor?.businessName || 'N/A'}
                      </td>
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendor.vendor?.phoneNumber || 'N/A'}</td>
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendor.vendor?.email || 'N/A'}</td>
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">{vendor.vendor?.agentName || 'N/A'}</td>
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap font-medium">
                        ${vendor.vendor?.totalCost?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                        {vendor.paidAt ? new Date(vendor.paidAt).toLocaleString() : 'N/A'}
                      </td>
                      <td
                        className="px-3 md:px-4 py-2 cursor-pointer hover:underline"
                        onClick={() => notes.length > 0 && handleViewNotes(notes)}
                      >
                        {notes.length > 0 ? notes.length : '0'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No paid vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination – same as leads page */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2 bg-[#cbd5e1] dark:bg-gray-800 py-3 rounded-md">
            <button
              onClick={() => !actionLoading && setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || actionLoading || isViewer}
              className="px-4 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => !actionLoading && !isViewer && setCurrentPage(pageNum)}
                  className={`px-4 py-2 border rounded min-w-[40px] text-center ${
                    currentPage === pageNum
                      ? 'bg-blue-500 dark:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={actionLoading || isViewer}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => !actionLoading && setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || actionLoading || isViewer}
              className="px-4 py-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* View Notes Modal */}
      {showViewNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Vendor Notes
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
                      {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'}
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

export default PaidVendors;