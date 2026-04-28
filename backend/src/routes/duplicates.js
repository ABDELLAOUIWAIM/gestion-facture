import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getSavedDuplicates, confirmDuplicate, deleteDuplicate, detectDuplicates } from '../services/duplicate.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { confirmed } = req.query;
    
    let sql = `
      SELECT d.id, d.match_type, d.is_confirmed, d.created_at,
             a.id as invoice_a_id, a.invoice_number as invoice_a_number, 
             a.date as invoice_a_date, a.supplier_name as invoice_a_supplier,
             a.total_amount as invoice_a_amount, a.original_filename as invoice_a_file,
             b.id as invoice_b_id, b.invoice_number as invoice_b_number,
             b.date as invoice_b_date, b.supplier_name as invoice_b_supplier,
             b.total_amount as invoice_b_amount, b.original_filename as invoice_b_file
      FROM duplicates d
      JOIN invoices a ON d.invoice_a_id = a.id
      JOIN invoices b ON d.invoice_b_id = b.id
    `;
    
    if (confirmed !== undefined) {
      sql += ` WHERE d.is_confirmed = $1`;
      const result = await query(sql, [confirmed === 'true']);
      return res.json(result.rows);
    }
    
    sql += ' ORDER BY d.created_at DESC';
    const result = await query(sql);
    
    const countResult = await query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN is_confirmed = FALSE THEN 1 ELSE 0 END) as pending
       FROM duplicates`
    );
    
    res.json({
      duplicates: result.rows,
      stats: {
        total: parseInt(countResult.rows[0].total),
        pending: parseInt(countResult.rows[0].pending)
      }
    });
  } catch (error) {
    console.error('Get duplicates error:', error);
    res.status(500).json({ error: 'Failed to get duplicates' });
  }
});

router.post('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    await confirmDuplicate(req.params.id);
    res.json({ message: 'Duplicate confirmed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm duplicate' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await deleteDuplicate(req.params.id);
    res.json({ message: 'Duplicate removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove duplicate' });
  }
});

router.get('/scan/all', authenticateToken, async (req, res) => {
  try {
    const invoices = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    
    let newDuplicates = 0;
    
    for (let i = 0; i < invoices.rows.length; i++) {
      for (let j = i + 1; j < invoices.rows.length; j++) {
        const dup = await detectDuplicates(invoices.rows[i]);
        if (dup.length > 0) {
          for (const d of dup) {
            if (d.id === invoices.rows[j].id) {
              newDuplicates++;
            }
          }
        }
      }
    }
    
    res.json({ message: 'Scan complete', newDuplicates });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan duplicates' });
  }
});

export default router;