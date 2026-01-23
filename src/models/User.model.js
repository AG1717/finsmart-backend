import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Ne pas retourner le mot de passe par défaut
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    }
  },
  preferences: {
    language: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr'
    },
    currency: {
      code: {
        type: String,
        default: 'USD'
      },
      symbol: {
        type: String,
        default: '$'
      }
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  refreshTokens: [{
    type: String
  }],
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour optimiser les recherches
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hasher le mot de passe avant de sauvegarder
userSchema.pre('save', async function() {
  // Seulement si le mot de passe est modifié
  if (!this.isModified('password')) {
    return;
  }

  // Générer le salt et hasher le mot de passe
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Méthode pour ajouter un refresh token
userSchema.methods.addRefreshToken = async function(token) {
  this.refreshTokens.push(token);
  // Garder seulement les 5 derniers tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  await this.save();
};

// Méthode pour supprimer un refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t !== token);
  await this.save();
};

// Méthode pour vérifier si un refresh token est valide
userSchema.methods.hasRefreshToken = function(token) {
  return this.refreshTokens.includes(token);
};

// Méthode pour supprimer tous les refresh tokens (logout de tous les appareils)
userSchema.methods.clearRefreshTokens = async function() {
  this.refreshTokens = [];
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
