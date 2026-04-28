import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import fs from 'fs';

export const extractDataFromPDF = async (fileBuffer) => {
  try {
    const data = await pdf(fileBuffer);
    const text = data.text;

    const result = {
      invoiceNumber: '',
      date: null,
      supplierName: '',
      totalAmount: 0
    };

    const numberMatch = text.match(/ invoice #?\s*:?\s*([A-Z0-9-]+)/i) || 
                         text.match(/ (#)\s*([A-Z0-9-]+)/i);
    if (numberMatch) result.invoiceNumber = numberMatch[1] || numberMatch[2];

    const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/) ||
                    text.match(/(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed)) result.date = parsed.toISOString().split('T')[0];
    }

    const supplierMatch = text.match(/ from\s*:?\s*([A-Za-z\s]+?)(?:\n|$)/i) ||
                         text.match(/ supplier\s*:?\s*([A-Za-z\s]+?)(?:\n|$)/i);
    if (supplierMatch) result.supplierName = supplierMatch[1].trim();

    const amountMatch = text.match(/ total\s*:?\s*\$?([\d,]+\.?\d*)/i) ||
                    text.match(/\$\s*([\d,]+\.\d{2})/);
    if (amountMatch) {
      result.totalAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    return result;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return { invoiceNumber: '', date: null, supplierName: '', totalAmount: 0 };
  }
};

export const extractDataFromExcel = async (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const result = {
      invoiceNumber: '',
      date: null,
      supplierName: '',
      totalAmount: 0
    };

    const flatData = data.flat().join(' ').toLowerCase();

    const numberMatch = flatData.match(/invoice\s*#?\s*:?\s*([a-z0-9-]+)/i);
    if (numberMatch) result.invoiceNumber = numberMatch[1];

    const dateMatch = flatData.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed)) result.date = parsed.toISOString().split('T')[0];
    }

    const supplierMatch = flatData.match(/from\s*:?\s*([a-z\s]+?)(?:\n|$)/i);
    if (supplierMatch) result.supplierName = supplierMatch[1].trim();

    const amountMatch = flatData.match(/total\s*:?\s*\$?([\d,]+\.?\d*)/i);
    if (amountMatch) {
      result.totalAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    return result;
  } catch (error) {
    console.error('Excel extraction error:', error);
    return { invoiceNumber: '', date: null, supplierName: '', totalAmount: 0 };
  }
};

export const computeFileHash = (fileBuffer) => {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

export const saveFile = async (file, folder = 'uploads') => {
  const uploadDir = `./${folder}`;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = `${uploadDir}/${filename}`;
  fs.writeFileSync(filepath, file.buffer);
  return filepath;
};