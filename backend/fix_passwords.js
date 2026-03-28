const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function fixPasswords() {
  try {
    const password = 'dairy123';
    const hashed = await bcrypt.hash(password, 12);
    
    await db.query('UPDATE users SET password = ?', [hashed]);
    console.log('✅ All user passwords updated to "dairy123" !!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixPasswords();
