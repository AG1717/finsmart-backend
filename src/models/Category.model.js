import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    enum: {
      values: ['survival', 'necessity', 'lifestyle'],
      message: '{VALUE} is not a valid category'
    },
    unique: true
  },
  label: {
    fr: {
      type: String,
      required: true
    },
    en: {
      type: String,
      required: true
    }
  },
  description: {
    fr: {
      type: String,
      required: true
    },
    en: {
      type: String,
      required: true
    }
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code']
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index sur le nom et l'ordre
categorySchema.index({ name: 1 });
categorySchema.index({ order: 1 });

// Données pré-remplies pour les catégories
const defaultCategories = [
  {
    name: 'survival',
    label: {
      fr: 'Survie',
      en: 'Survival'
    },
    description: {
      fr: 'Besoins essentiels à la vie (nourriture, logement, santé de base)',
      en: 'Essential life needs (food, housing, basic health)'
    },
    icon: 'shield-checkmark',
    color: '#EF4444', // Rouge
    order: 1,
    isActive: true
  },
  {
    name: 'necessity',
    label: {
      fr: 'Nécessité',
      en: 'Necessity'
    },
    description: {
      fr: 'Besoins importants (transport, éducation, santé avancée)',
      en: 'Important needs (transportation, education, advanced health)'
    },
    icon: 'car',
    color: '#F59E0B', // Orange
    order: 2,
    isActive: true
  },
  {
    name: 'lifestyle',
    label: {
      fr: 'Style de vie',
      en: 'Lifestyle'
    },
    description: {
      fr: 'Amélioration du confort (loisirs, voyages, luxe)',
      en: 'Comfort improvement (hobbies, travel, luxury)'
    },
    icon: 'star',
    color: '#10B981', // Vert
    order: 3,
    isActive: true
  }
];

// Méthode statique pour initialiser les catégories
categorySchema.statics.seedCategories = async function() {
  try {
    const count = await this.countDocuments();

    if (count === 0) {
      await this.insertMany(defaultCategories);
      console.log('✅ Categories seeded successfully');
      return { success: true, message: 'Categories seeded', count: defaultCategories.length };
    } else {
      console.log('ℹ️  Categories already exist, skipping seed');
      return { success: true, message: 'Categories already exist', count };
    }
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
