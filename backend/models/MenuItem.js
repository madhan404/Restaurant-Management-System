import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'main-course', 'dessert', 'beverage', 'side-dish']
  },
  image: {
    type: String,
    default: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15,
    min: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('MenuItem', menuItemSchema);