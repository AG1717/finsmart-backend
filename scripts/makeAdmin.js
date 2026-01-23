/**
 * Script pour promouvoir un utilisateur en admin
 *
 * Usage:
 * node scripts/makeAdmin.js <email>
 *
 * Exemple:
 * node scripts/makeAdmin.js admin@finsmart.com
 */

import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import config from '../src/config/environment.js';

const makeAdmin = async (email) => {
  try {
    // Connexion à MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✓ Connected to MongoDB\n');

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`✗ User with email "${email}" not found.`);
      process.exit(1);
    }

    // Vérifier si déjà admin
    if (user.role === 'admin') {
      console.log(`ℹ User "${email}" is already an admin.`);
      process.exit(0);
    }

    // Promouvoir en admin
    user.role = 'admin';
    await user.save();

    console.log('✓ Success!');
    console.log(`\nUser Details:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role} (promoted from 'user')`);
    console.log(`  Joined: ${user.createdAt.toLocaleDateString()}\n`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/makeAdmin.js <email>');
  console.error('Example: node scripts/makeAdmin.js admin@finsmart.com');
  process.exit(1);
}

makeAdmin(email);
