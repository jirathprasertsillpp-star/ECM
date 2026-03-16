const db = require('./config/database');

async function migrate() {
    console.log('🔄 Running ECMS database migrations...\n');

    const queries = [
        {
            name: 'Users table',
            sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          department VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Expense Claims table',
            sql: `
        CREATE TABLE IF NOT EXISTS expense_claims (
          id SERIAL PRIMARY KEY,
          claim_number VARCHAR(50) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id),
          project_name VARCHAR(255) NOT NULL,
          project_code VARCHAR(100),
          claim_month DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'draft',
          total_amount DECIMAL(12,2) DEFAULT 0,
          notes TEXT,
          submitted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Expense Items table',
            sql: `
        CREATE TABLE IF NOT EXISTS expense_items (
          id SERIAL PRIMARY KEY,
          claim_id INTEGER REFERENCES expense_claims(id) ON DELETE CASCADE,
          item_date DATE NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          is_fuel BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Fuel Details table',
            sql: `
        CREATE TABLE IF NOT EXISTS fuel_details (
          id SERIAL PRIMARY KEY,
          item_id INTEGER REFERENCES expense_items(id) ON DELETE CASCADE,
          odometer_start INTEGER NOT NULL,
          odometer_end INTEGER NOT NULL,
          distance_km DECIMAL(8,2),
          origin_address TEXT NOT NULL,
          origin_lat DECIMAL(10,7),
          origin_lng DECIMAL(10,7),
          destination_address TEXT NOT NULL,
          destination_lat DECIMAL(10,7),
          destination_lng DECIMAL(10,7),
          maps_distance_km DECIMAL(8,2),
          work_type VARCHAR(100),
          project_task TEXT NOT NULL,
          work_category VARCHAR(100),
          ai_verified BOOLEAN DEFAULT FALSE,
          ai_verification_note TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Receipts table',
            sql: `
        CREATE TABLE IF NOT EXISTS receipts (
          id SERIAL PRIMARY KEY,
          item_id INTEGER REFERENCES expense_items(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255),
          file_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type VARCHAR(100),
          ai_extracted_data JSONB,
          ai_confidence DECIMAL(3,2),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Approval Logs table',
            sql: `
        CREATE TABLE IF NOT EXISTS approval_logs (
          id SERIAL PRIMARY KEY,
          claim_id INTEGER REFERENCES expense_claims(id),
          action VARCHAR(50) NOT NULL,
          performed_by INTEGER REFERENCES users(id),
          note TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Notifications table',
            sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          claim_id INTEGER REFERENCES expense_claims(id),
          recipient_id INTEGER REFERENCES users(id),
          type VARCHAR(100) NOT NULL,
          message TEXT,
          email_sent BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
        },
        {
            name: 'Indexes',
            sql: `
        CREATE INDEX IF NOT EXISTS idx_claims_user_id ON expense_claims(user_id);
        CREATE INDEX IF NOT EXISTS idx_claims_status ON expense_claims(status);
        CREATE INDEX IF NOT EXISTS idx_claims_month ON expense_claims(claim_month);
        CREATE INDEX IF NOT EXISTS idx_items_claim_id ON expense_items(claim_id);
        CREATE INDEX IF NOT EXISTS idx_fuel_item_id ON fuel_details(item_id);
        CREATE INDEX IF NOT EXISTS idx_receipts_item_id ON receipts(item_id);
        CREATE INDEX IF NOT EXISTS idx_logs_claim_id ON approval_logs(claim_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
      `
        }
    ];

    for (const q of queries) {
        try {
            await db.query(q.sql);
            console.log(`  ✅ ${q.name}`);
        } catch (err) {
            console.error(`  ❌ ${q.name}: ${err.message}`);
        }
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
