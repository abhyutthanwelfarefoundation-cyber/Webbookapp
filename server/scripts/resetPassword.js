/**
 * ─────────────────────────────────────────
 *  BookPresent — Password Reset Script
 *  
 *  HOW TO USE:
 *  1. Open this file
 *  2. Change EMAIL and NEW_PASSWORD below
 *  3. Run: node scripts/resetPassword.js
 * ─────────────────────────────────────────
 */

const mongoose = require('mongoose');
require('dotenv').config();

// ✏️ CHANGE THESE TWO VALUES
const EMAIL        = 'admin@company.com';
const NEW_PASSWORD = 'NewAdmin@2024';
// ─────────────────────────────

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');
    const user = await User.findOne({ email: EMAIL }).select('+password');

    if (!user) {
      console.log(`❌ No user found with email: ${EMAIL}`);
      process.exit(1);
    }

    if (NEW_PASSWORD.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      process.exit(1);     
    }

    // Set plain password — pre-save hook will hash it automatically
    user.password = NEW_PASSWORD;
    user.passwordChangedAt = undefined; // clear so old tokens still work briefly
    await user.save();

    console.log(`✅ Password updated for: ${user.name} (${user.email})`);
    console.log(`📧 Email:    ${EMAIL}`);
    console.log(`🔑 Password: ${NEW_PASSWORD}`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();