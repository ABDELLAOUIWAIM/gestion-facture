import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
  const [filters, setFilters] = useState({
    search: '',
    supplier: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    const params = { ...filters, page: pagination.page, limit: pagination.limit };
    
    api.invoices.getAll(params)
      .then(data => {
        setInvoices(data.invoices || []);
        setStats(data.stats || { total: 0, thisMonth: 0 });
        setPagination((p) => ({ ...p, total: data.total || 0 }));
      })
      .catch(err => {
        console.error(err);
      });
  }, [filters, pagination.page, pagination.limit]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.invoices.delete(deleteModal.id);
      setDeleteModal({ open: false, id: null });
      // Refresh the list
      const params = { ...filters, page: pagination.page, limit: pagination.limit };
      const data = await api.invoices.getAll(params);
      setInvoices(data.invoices || []);
      setStats(data.stats || { total: 0, thisMonth: 0 });
      setPagination((p) => ({ ...p, total: data.total || 0 }));
    } catch {
      console.error('Failed to delete invoice');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      supplier: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-500">Manage and view all your invoices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-sm text-slate-500 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-slate-500 mb-1">This Month</p>
          <p className="text-2xl font-bold text-primary-600">{stats.thisMonth}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-slate-500 mb-1">Duplicates Found</p>
          <p className="text-2xl font-bold text-amber-600">-</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Invoice number or supplier..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              placeholder="Supplier name..."
              value={filters.supplier}
              onChange={(e) =>
                setFilters({ ...filters, supplier: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="input-field"
            />
          </div>

          <button onClick={clearFilters} className="btn-secondary">
            Clear
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Supplier
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {invoice.invoice_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {invoice.supplier_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {invoice.status === 'duplicate' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          <AlertCircle size={12} />
                          Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/invoice/${invoice.id}`}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteModal({ open: true, id: invoice.id })
                          }
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                disabled={pagination.page === totalPages}
                className="btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Invoice
            </h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this invoice? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, id: null })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
