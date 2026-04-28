import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { extractDataFromPDF, extractDataFromExcel, computeFileHash, saveFile } from '../services/extract.js';
import { detectDuplicates, saveDuplicate } from '../services/duplicate.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, supplier, startDate, endDate, minAmount, maxAmount, page = 1, limit = 10 } = req.query;
    
    let conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(invoice_number ILIKE $${paramIndex} OR supplier_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (supplier) {
      conditions.push(`supplier_name ILIKE $${paramIndex}`);
      params.push(`%${supplier}%`);
      paramIndex++;
    }
    if (startDate) {
      conditions.push(`date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    if (minAmount) {
      conditions.push(`total_amount >= $${paramIndex}`);
      params.push(minAmount);
      paramIndex++;
    }
    if (maxAmount) {
      conditions.push(`total_amount <= $${paramIndex}`);
      params.push(maxAmount);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT * FROM invoices WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM invoices WHERE ${whereClause}`,
      params.slice(0, -2)
    );

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as this_month
      FROM invoices
    `);

    res.json({
      invoices: result.rows,
      total: parseInt(countResult.rows[0].count),
      stats: {
        total: parseInt(statsResult.rows[0].total),
        thisMonth: parseInt(statsResult.rows[0].this_month)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const fileBuffer = req.file.buffer;
    const fileHash = computeFileHash(fileBuffer);
    
    let extracted = { invoiceNumber: '', date: null, supplierName: '', totalAmount: 0 };
    
    if (req.file.mimetype === 'application/pdf') {
      extracted = await extractDataFromPDF(fileBuffer);
    } else if (
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      req.file.mimetype === 'application/vnd.ms-excel'
    ) {
      extracted = await extractDataFromExcel(fileBuffer);
    }

    const manualData = req.body;
    const invoiceData = {
      invoice_number: manualData.invoiceNumber || extracted.invoiceNumber,
      date: manualData.date || extracted.date,
      supplier_name: manualData.supplierName || extracted.supplierName,
      total_amount: manualData.totalAmount || extracted.totalAmount,
      file_hash: fileHash,
      original_filename: req.file.originalname
    };

    const duplicates = await detectDuplicates({ ...invoiceData, file_hash: fileHash });

    const filePath = await saveFile(req.file);

    const result = await query(
      `INSERT INTO invoices (invoice_number, date, supplier_name, total_amount, file_path, file_hash, original_filename, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        invoiceData.invoice_number,
        invoiceData.date,
        invoiceData.supplier_name,
        invoiceData.total_amount,
        filePath,
        invoiceData.file_hash,
        invoiceData.original_filename,
        req.user.id
      ]
    );

    const invoice = result.rows[0];

    for (const dup of duplicates) {
      await saveDuplicate(invoice.id, dup.id, dup.matchType);
    }

    res.status(201).json({
      invoice,
      duplicates,
      extracted
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload invoice' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber, date, supplierName, totalAmount } = req.body;
    
    const result = await query(
      `UPDATE invoices 
       SET invoice_number = $1, date = $2, supplier_name = $3, total_amount = $4
       WHERE id = $5 RETURNING *`,
      [invoiceNumber, date, supplierName, totalAmount, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;