import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const initDatabase = async () => {
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(100),
      date DATE,
      supplier_name VARCHAR(255),
      total_amount DECIMAL(12,2),
      file_path VARCHAR(500),
      file_hash VARCHAR(64),
      original_filename VARCHAR(255),
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS duplicates (
      id SERIAL PRIMARY KEY,
      invoice_a_id INTEGER REFERENCES invoices(id) ON DELETE Cascade,
      invoice_b_id INTEGER REFERENCES invoices(id) ON DELETE Cascade,
      match_type VARCHAR(50),
      is_confirmed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
    CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_name);
    CREATE INDEX IF NOT EXISTS idx_invoices_amount ON invoices(total_amount);
    CREATE INDEX IF NOT EXISTS idx_invoices_hash ON invoices(file_hash);
  `;

  await pool.query(createTables);
  console.log('Database initialized successfully');
};