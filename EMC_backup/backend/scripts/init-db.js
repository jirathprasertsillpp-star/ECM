const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  try {
    console.log('--- Initializing Database Schema ---');

    // Enable UUID extension if needed
    // await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 1. Users table update
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(255);
    `);

    // 2. expense_claims table update
    await pool.query(`
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(255);
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS ai_anomaly_flagged BOOLEAN DEFAULT FALSE;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS ai_anomaly_reason TEXT;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS sheets_synced BOOLEAN DEFAULT FALSE;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);

    // 3. expense_items table update
    await pool.query(`
      ALTER TABLE expense_items ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
      ALTER TABLE expense_items ADD COLUMN IF NOT EXISTS receipt_drive_link TEXT;
    `);

    // 4. receipts table update
    await pool.query(`
      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS drive_link TEXT;
      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255);
    `);

    // 5. approval_logs table update
    await pool.query(`
      ALTER TABLE approval_logs ADD COLUMN IF NOT EXISTS performed_via VARCHAR(50) DEFAULT 'web';
      ALTER TABLE approval_logs ADD COLUMN IF NOT EXISTS from_status VARCHAR(50);
      ALTER TABLE approval_logs ADD COLUMN IF NOT EXISTS to_status VARCHAR(50);
    `);

    // 6. Create line_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS line_sessions (
        id SERIAL PRIMARY KEY,
        line_user_id VARCHAR(255) NOT NULL,
        session_type VARCHAR(50) NOT NULL,
        session_data JSONB NOT NULL,
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Create activity_logs for full audit trail
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Performance Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_claims_user_id ON expense_claims(user_id);
      CREATE INDEX IF NOT EXISTS idx_claims_status ON expense_claims(status);
      CREATE INDEX IF NOT EXISTS idx_claims_number ON expense_claims(claim_number);
      CREATE INDEX IF NOT EXISTS idx_items_claim_id ON expense_items(claim_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_item_id ON receipts(item_id);
      CREATE INDEX IF NOT EXISTS idx_users_line_id ON users(line_user_id);
    `);

    // 9. Extra User Fields for completeness
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
    `);

    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

init();
