import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const MONGODB_URI = 'mongodb+srv://finsmart:finsmart2026@cluster0.3qqltk3.mongodb.net/finsmart?appName=Cluster0';

async function createAdmin() {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@finsmart.com' });
    if (existingAdmin) {
      console.log('⚠️  Un admin avec cet email existe déjà !');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Role:', existingAdmin.role);
      process.exit(0);
    }

    // Créer le compte admin
    console.log('👤 Création du compte admin...');
    const admin = new User({
      username: 'admin',
      email: 'admin@finsmart.com',
      password: 'Admin@2026', // Ce mot de passe sera hashé automatiquement
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'FinSmart'
      },
      preferences: {
        language: 'fr',
        currency: {
          code: 'USD',
          symbol: '$'
        },
        notifications: true
      }
    });

    await admin.save();
    console.log('✅ Compte admin créé avec succès !');
    console.log('');
    console.log('📋 Informations de connexion :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email    : admin@finsmart.com');
    console.log('🔑 Password : Admin@2026');
    console.log('👤 Username : admin');
    console.log('🎯 Role     : admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🌐 Connectez-vous sur : https://finsmart-admin.vercel.app');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Un utilisateur avec cet email ou username existe déjà');
    }
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
}

// Exécuter la fonction
createAdmin();
