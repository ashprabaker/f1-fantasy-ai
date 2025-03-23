// This script fixes the database schema issues
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function fixDatabase() {
  console.log('Starting database schema fix script...');
  
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    // Check if the active column exists in the subscriptions table
    const tableInfo = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'active'
    `;
    
    if (tableInfo.length === 0) {
      console.log('Active column does not exist in subscriptions table. Adding it...');
      
      // Add the active column if it doesn't exist
      await sql`
        ALTER TABLE subscriptions 
        ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE
      `;
      
      console.log('Successfully added active column to subscriptions table!');
    } else {
      console.log('Active column already exists in subscriptions table.');
    }
    
    // Ensure all users in the table have active set to true
    await sql`
      UPDATE subscriptions 
      SET active = TRUE
      WHERE active = FALSE OR active IS NULL
    `;
    
    console.log('Updated all subscriptions to have active = TRUE.');
    
    console.log('Database schema fix completed successfully!');
  } catch (error) {
    console.error('Error fixing database schema:', error);
  } finally {
    await sql.end();
  }
}

fixDatabase().catch(console.error); 