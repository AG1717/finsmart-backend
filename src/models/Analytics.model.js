import mongoose from 'mongoose';

/**
 * Schéma pour suivre les événements et métriques utilisateurs
 */
const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_registered',
      'user_login',
      'goal_created',
      'goal_updated',
      'goal_deleted',
      'goal_completed',
      'contribution_added',
      'profile_updated',
      'app_opened',
      'language_changed',
      'currency_changed'
    ],
    index: true
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    deviceType: String,
    appVersion: String,
    platform: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index composé pour requêtes rapides
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, eventType: 1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
