import { query } from '../config/db.js';

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const similarity = (a, b) => {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
};

export const findExactMatches = async (invoice) => {
  const result = await query(
    `SELECT id, invoice_number, date, supplier_name, total_amount 
     FROM invoices 
     WHERE invoice_number = $1 
       AND date = $2 
       AND total_amount = $3
       AND id != $4`,
    [invoice.invoice_number, invoice.date, invoice.total_amount, invoice.id || 0]
  );
  return result.rows;
};

export const findHashMatches = async (fileHash) => {
  const result = await query(
    `SELECT id, invoice_number, date, supplier_name, total_amount, file_hash
     FROM invoices 
     WHERE file_hash = $1`,
    [fileHash]
  );
  return result.rows;
};

export const findFuzzyMatches = async (invoice) => {
  const result = await query(
    `SELECT id, invoice_number, date, supplier_name, total_amount 
     FROM invoices 
     WHERE id != $1`,
    [invoice.id || 0]
  );

  const matches = [];
  for (const row of result.rows) {
    if (invoice.supplier_name && row.supplier_name) {
      const supplierSim = similarity(invoice.supplier_name, row.supplier_name);
      if (supplierSim >= 0.75) {
        matches.push({ ...row, matchType: 'fuzzy_supplier', confidence: supplierSim });
        continue;
      }
    }
    if (invoice.invoice_number && row.invoice_number) {
      const numberSim = similarity(invoice.invoice_number, row.invoice_number);
      if (numberSim >= 0.85) {
        matches.push({ ...row, matchType: 'fuzzy_number', confidence: numberSim });
      }
    }
  }
  return matches;
};

export const detectDuplicates = async (invoice) => {
  const duplicates = [];

  const exactMatches = await findExactMatches(invoice);
  for (const match of exactMatches) {
    duplicates.push({ ...match, matchType: 'exact', confidence: 100 });
  }

  if (!duplicates.length && invoice.file_hash) {
    const hashMatches = await findHashMatches(invoice.file_hash);
    for (const match of hashMatches) {
      duplicates.push({ ...match, matchType: 'hash', confidence: 100 });
    }
  }

  if (!duplicates.length) {
    const fuzzyMatches = await findFuzzyMatches(invoice);
    duplicates.push(...fuzzyMatches);
  }

  return duplicates;
};

export const saveDuplicate = async (invoiceAId, invoiceBId, matchType) => {
  const existing = await query(
    `SELECT id FROM duplicates 
     WHERE (invoice_a_id = $1 AND invoice_b_id = $2) 
        OR (invoice_a_id = $2 AND invoice_b_id = $1)`,
    [invoiceAId, invoiceBId]
  );

  if (existing.rows.length === 0) {
    await query(
      `INSERT INTO duplicates (invoice_a_id, invoice_b_id, match_type) VALUES ($1, $2, $3)`,
      [invoiceAId, invoiceBId, matchType]
    );
  }
};

export const getSavedDuplicates = async () => {
  const result = await query(
    `SELECT d.id, d.match_type, d.is_confirmed, d.created_at,
            a.id as invoice_a_id, a.invoice_number as invoice_a_number, 
            a.date as invoice_a_date, a.supplier_name as invoice_a_supplier,
            a.total_amount as invoice_a_amount,
            b.id as invoice_b_id, b.invoice_number as invoice_b_number,
            b.date as invoice_b_date, b.supplier_name as invoice_b_supplier,
            b.total_amount as invoice_b_amount
     FROM duplicates d
     JOIN invoices a ON d.invoice_a_id = a.id
     JOIN invoices b ON d.invoice_b_id = b.id
     ORDER BY d.created_at DESC`
  );
  return result.rows;
};

export const confirmDuplicate = async (duplicateId) => {
  await query(
    `UPDATE duplicates SET is_confirmed = TRUE WHERE id = $1`,
    [duplicateId]
  );
};

export const deleteDuplicate = async (duplicateId) => {
  await query(`DELETE FROM duplicates WHERE id = $1`, [duplicateId]);
};