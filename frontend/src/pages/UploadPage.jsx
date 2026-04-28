import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, Check, AlertCircle, X } from 'lucide-react';
import api from '../utils/api';

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: '',
    supplierName: '',
    totalAmount: '',
  });

  const handleFile = (selectedFile) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Excel file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setError('');
    setFile(selectedFile);
    setDuplicates([]);
    setFormData({ invoiceNumber: '', date: '', supplierName: '', totalAmount: '' });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('invoiceNumber', formData.invoiceNumber);
    formDataToSend.append('date', formData.date);
    formDataToSend.append('supplierName', formData.supplierName);
    formDataToSend.append('totalAmount', formData.totalAmount);

    try {
      const result = await api.invoices.upload(formDataToSend);
      if (result.duplicates?.length > 0) {
        setDuplicates(result.duplicates);
      }
      navigate('/invoices');
    } catch {
      setError('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upload Invoice</h1>
        <p className="text-slate-500">Upload PDF or Excel invoices to extract data</p>
      </div>

      {duplicates.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle size={20} />
            Potential Duplicates Detected
          </div>
          <ul className="space-y-1">
            {duplicates.map((dup, i) => (
              <li key={i} className="text-sm text-red-600">
                Match with invoice #{dup.invoice_number} ({dup.matchType})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 hover:border-primary-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <File size={40} className="text-primary-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="ml-4 p-1 hover:bg-slate-100 rounded"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            ) : (
              <>
                <Upload
                  size={40}
                  className="mx-auto mb-4 text-slate-400"
                />
                <p className="text-slate-700 font-medium mb-2">
                  Drag and drop your invoice here
                </p>
                <p className="text-slate-500 text-sm mb-4">or</p>
                <label className="btn-secondary cursor-pointer inline-block">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-4">
                  PDF, XLSX, XLS (max 10MB)
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Extracted Data
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNumber: e.target.value })
                }
                className="input-field"
                placeholder="INV-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                className="input-field"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, totalAmount: e.target.value })
                }
                className="input-field"
                placeholder="0.00"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
