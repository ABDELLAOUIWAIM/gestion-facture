import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Save, X, FileText, Download } from 'lucide-react';
import api from '../utils/api';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: '',
    supplierName: '',
    totalAmount: '',
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const data = await api.invoices.getById(id);
        setInvoice(data);
        setFormData({
          invoiceNumber: data.invoice_number || '',
          date: data.date || '',
          supplierName: data.supplier_name || '',
          totalAmount: data.total_amount || '',
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    
    fetchInvoice();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.invoices.update(id, formData);
      setInvoice({ ...invoice, ...formData });
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.invoices.delete(id);
      navigate('/invoices');
    } catch (err) {
      console.error(err);
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Invoice not found</p>
        <Link to="/invoices" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Back to Invoices
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Invoice File
          </h2>
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <FileText size={64} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-700 font-medium mb-1">
              {invoice.original_filename}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {invoice.file_path}
            </p>
            <button className="btn-secondary inline-flex items-center gap-2">
              <Download size={18} />
              Download File
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Invoice Details
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      invoiceNumber: invoice.invoice_number || '',
                      date: invoice.date || '',
                      supplierName: invoice.supplier_name || '',
                      totalAmount: invoice.total_amount || '',
                    });
                  }}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Invoice Number
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900 font-medium">
                  {invoice.invoice_number || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              {editing ? (
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{formatDate(invoice.date)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierName: e.target.value })
                  }
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{invoice.supplier_name || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Amount
              </label>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }
                  className="input-field"
                />
              ) : (
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(invoice.total_amount)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                File Hash
              </label>
              <p className="text-sm text-slate-500 font-mono break-all">
                {invoice.file_hash || '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Uploaded At
              </label>
              <p className="text-slate-600">
                {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={() => setDeleteModal(true)}
              className="btn-danger inline-flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Invoice
            </button>
          </div>
        </div>
      </div>

      {deleteModal && (
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
                onClick={() => setDeleteModal(false)}
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

export default InvoiceDetailsPage;