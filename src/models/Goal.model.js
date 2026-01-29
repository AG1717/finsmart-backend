import mongoose from 'mongoose';

const { Schema } = mongoose;

const goalSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: [100, 'Goal name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['survival', 'necessity', 'lifestyle'],
      message: '{VALUE} is not a valid category'
    },
    index: true
  },
  timeframe: {
    type: String,
    required: [true, 'Timeframe is required'],
    enum: {
      values: ['short', 'long'],
      message: '{VALUE} is not a valid timeframe. Use "short" or "long"'
    },
    index: true
  },
  amounts: {
    current: {
      type: Number,
      required: [true, 'Current amount is required'],
      default: 0,
      min: [0, 'Current amount cannot be negative']
    },
    target: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0, 'Target amount cannot be negative'],
      validate: {
        validator: function(value) {
          return value > 0;
        },
        message: 'Target amount must be greater than 0'
      }
    },
    currency: {
      code: {
        type: String,
        default: 'USD',
        uppercase: true
      },
      symbol: {
        type: String,
        default: '$'
      }
    }
  },
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  dates: {
    target: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value > new Date();
        },
        message: 'Target date must be in the future'
      }
    },
    started: {
      type: Date,
      default: Date.now
    },
    completed: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'paused', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active',
    index: true
  },
  icon: {
    type: String,
    default: 'star'
  },
  metadata: {
    contributions: [{
      amount: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      note: {
        type: String,
        maxlength: 200
      }
    }],
    milestones: [{
      percentage: {
        type: Number,
        required: true
      },
      achievedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composés pour optimiser les requêtes
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, timeframe: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });

// Virtual pour calculer le pourcentage de progression
goalSchema.virtual('progressPercentage').get(function() {
  if (this.amounts.target === 0) return 0;
  return Math.min(
    Math.round((this.amounts.current / this.amounts.target) * 100),
    100
  );
});

// Middleware pour mettre à jour la progression avant sauvegarde
goalSchema.pre('save', function() {
  // Mettre à jour la progression si les montants ont changé
  if (this.isModified('amounts.current') || this.isModified('amounts.target')) {
    const percentage = Math.min(
      Math.round((this.amounts.current / this.amounts.target) * 100),
      100
    );

    this.progress.percentage = percentage;
    this.progress.lastUpdated = new Date();

    // Ajouter un milestone si atteint des seuils (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];
    const existingMilestones = this.metadata.milestones.map(m => m.percentage);

    milestones.forEach(milestone => {
      if (percentage >= milestone && !existingMilestones.includes(milestone)) {
        this.metadata.milestones.push({
          percentage: milestone,
          achievedAt: new Date()
        });
      }
    });

    // Marquer l'objectif comme complété si 100% atteint
    if (percentage >= 100 && this.status === 'active') {
      this.status = 'completed';
      this.dates.completed = new Date();
    }
  }
});

// Méthode pour ajouter une contribution
goalSchema.methods.addContribution = async function(amount, note = '') {
  if (amount <= 0) {
    throw new Error('Contribution amount must be positive');
  }

  // Ajouter le montant au montant actuel
  this.amounts.current += amount;

  // Ajouter la contribution à l'historique
  this.metadata.contributions.push({
    amount,
    date: new Date(),
    note
  });

  // Sauvegarder (cela déclenchera le middleware pre-save pour calculer la progression)
  await this.save();

  return this;
};

// Méthode statique pour obtenir les statistiques d'un utilisateur
goalSchema.statics.getUserStatistics = async function(userId, filters = {}) {
  // Construire la requête avec les filtres
  const query = { userId };
  if (filters.timeframe) query.timeframe = filters.timeframe;
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;

  const goals = await this.find(query);

  const stats = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    pausedGoals: goals.filter(g => g.status === 'paused').length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.amounts.target, 0),
    totalCurrentAmount: goals.reduce((sum, g) => sum + g.amounts.current, 0),
    overallProgress: 0,
    byTimeframe: {
      short: {
        count: 0,
        targetAmount: 0,
        currentAmount: 0,
        progress: 0
      },
      long: {
        count: 0,
        targetAmount: 0,
        currentAmount: 0,
        progress: 0
      }
    },
    byCategory: {
      survival: { count: 0, targetAmount: 0, currentAmount: 0, progress: 0 },
      necessity: { count: 0, targetAmount: 0, currentAmount: 0, progress: 0 },
      lifestyle: { count: 0, targetAmount: 0, currentAmount: 0, progress: 0 }
    }
  };

  // Calculer la progression globale
  if (stats.totalTargetAmount > 0) {
    stats.overallProgress = Math.round(
      (stats.totalCurrentAmount / stats.totalTargetAmount) * 100
    );
  }

  // Statistiques par timeframe
  ['short', 'long'].forEach(timeframe => {
    const timeframeGoals = goals.filter(g => g.timeframe === timeframe);
    const targetSum = timeframeGoals.reduce((sum, g) => sum + g.amounts.target, 0);
    const currentSum = timeframeGoals.reduce((sum, g) => sum + g.amounts.current, 0);

    stats.byTimeframe[timeframe] = {
      count: timeframeGoals.length,
      targetAmount: targetSum,
      currentAmount: currentSum,
      progress: targetSum > 0 ? Math.round((currentSum / targetSum) * 100) : 0
    };
  });

  // Statistiques par catégorie
  ['survival', 'necessity', 'lifestyle'].forEach(category => {
    const categoryGoals = goals.filter(g => g.category === category);
    const targetSum = categoryGoals.reduce((sum, g) => sum + g.amounts.target, 0);
    const currentSum = categoryGoals.reduce((sum, g) => sum + g.amounts.current, 0);

    stats.byCategory[category] = {
      count: categoryGoals.length,
      targetAmount: targetSum,
      currentAmount: currentSum,
      progress: targetSum > 0 ? Math.round((currentSum / targetSum) * 100) : 0
    };
  });

  return stats;
};

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
