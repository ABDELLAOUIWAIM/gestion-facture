import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, X, Eye } from 'lucide-react';
import api from '../utils/api';

const DuplicatesPage = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const isConfirmed = filter === 'confirmed' ? true : filter === 'pending' ? false : null;
    
    api.duplicates.getAll(isConfirmed)
      .then(data => {
        setDuplicates(data.duplicates || []);
        setStats(data.stats || { total: 0, pending: 0 });
      })
      .catch(err => {
        console.error(err);
      });
  }, [filter]);

  const handleConfirm = async (id) => {
    try {
      await api.duplicates.confirm(id);
      // Refresh the list
      const isConfirmed = filter === 'confirmed' ? true : filter === 'pending' ? false : null;
      const data = await api.duplicates.getAll(isConfirmed);
      setDuplicates(data.duplicates || []);
      setStats(data.stats || { total: 0, pending: 0 });
    } catch {
      console.error('Failed to confirm duplicate');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.duplicates.delete(id);
      setDuplicates(duplicates.filter(d => d.id !== id));
    } catch {
      console.error('Failed to dismiss duplicate');
    }
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

  const getMatchBadge = (type) => {
    const badges = {
      exact: { label: 'Exact Match', color: 'bg-red-100 text-red-700' },
      hash: { label: 'File Hash', color: 'bg-orange-100 text-orange-700' },
      fuzzy_supplier: { label: 'Fuzzy Supplier', color: 'bg-amber-100 text-amber-700' },
      fuzzy_number: { label: 'Fuzzy Number', color: 'bg-yellow-100 text-yellow-700' },
    };
    const badge = badges[type] || { label: type, color: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Duplicate Detection</h1>
        <p className="text-slate-500">Review and manage potential duplicate invoices</p>
      </div>

      {stats.pending > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <p className="font-medium text-red-700">
              {stats.pending} Potential Duplicates Found
            </p>
            <p className="text-sm text-red-600">
              Review these invoices to confirm or dismiss duplicates
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-sm text-slate-500 mb-1">Total Detected</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-slate-500 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-slate-500 mb-1">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.total - stats.pending}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Pending ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'confirmed'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Confirmed ({stats.total - stats.pending})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          All ({stats.total})
        </button>
      </div>

      <div className="space-y-4">
        {duplicates.length === 0 ? (
          <div className="card py-8 text-center text-slate-500">
            {filter === 'pending'
              ? 'No pending duplicates'
              : filter === 'confirmed'
              ? 'No confirmed duplicates'
              : 'No duplicates found'}
          </div>
        ) : (
          duplicates.map((dup) => (
            <div
              key={dup.id}
              className={`card ${
                dup.is_confirmed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getMatchBadge(dup.match_type)}
                  {dup.is_confirmed && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      <Check size={12} />
                      Confirmed
                    </span>
                  )}
                </div>
                {!dup.is_confirmed && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirm(dup.id)}
                      className="btn-primary flex items-center gap-1"
                    >
                      <Check size={16} />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleDismiss(dup.id)}
                      className="btn-secondary flex items-center gap-1"
                    >
                      <X size={16} />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">Invoice A</h4>
                    <Link
                      to={`/invoice/${dup.invoice_a_id}`}
                      className="text-primary-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice #</span>
                      <span className="font-medium text-slate-900">
                        {dup.invoice_a_number || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="text-slate-900">
                        {formatDate(dup.invoice_a_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supplier</span>
                      <span className="text-slate-900">
                        {dup.invoice_a_supplier || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(dup.invoice_a_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">Invoice B</h4>
                    <Link
                      to={`/invoice/${dup.invoice_b_id}`}
                      className="text-primary-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice #</span>
                      <span className="font-medium text-slate-900">
                        {dup.invoice_b_number || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="text-slate-900">
                        {formatDate(dup.invoice_b_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supplier</span>
                      <span className="text-slate-900">
                        {dup.invoice_b_supplier || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(dup.invoice_b_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DuplicatesPage;
