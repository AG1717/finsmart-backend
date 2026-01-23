import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminNotificationSchema = new Schema({
  type: {
    type: String,
    enum: [
      // User events
      'user_registered',
      'user_first_goal',
      'user_milestone',

      // Goal events
      'goal_completed',
      'goal_high_value',

      // Admin actions
      'admin_action',

      // System events
      'suspicious_activity',
      'system_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'success', 'warning', 'critical'],
    default: 'info'
  },
  // Utilisateur concerné (si applicable)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Admin qui a fait l'action (pour admin_action)
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Objectif concerné (si applicable)
  goalId: {
    type: Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  // Données supplémentaires
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  // Statut de lecture
  isRead: {
    type: Boolean,
    default: false
  },
  // Date de lecture
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
adminNotificationSchema.index({ type: 1, createdAt: -1 });
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ severity: 1, createdAt: -1 });

// Méthode statique pour créer une notification
adminNotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Méthode pour marquer comme lu
adminNotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification;
