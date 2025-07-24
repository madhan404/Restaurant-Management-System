import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import MenuItem from './models/MenuItem.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1234567890'
    });
    await admin.save();

    // Create staff users
    const staff1 = new User({
      name: 'John Chef',
      email: 'chef1@restaurant.com',
      password: 'staff123',
      role: 'staff',
      phone: '+1234567891'
    });

    const staff2 = new User({
      name: 'Sarah Cook',
      email: 'chef2@restaurant.com',
      password: 'staff123',
      role: 'staff',
      phone: '+1234567892'
    });

    await staff1.save();
    await staff2.save();

    // Create customer user
    const customer = new User({
      name: 'Customer User',
      email: 'customer@example.com',
      password: 'customer123',
      role: 'customer',
      phone: '+1234567893'
    });
    await customer.save();

    // Create menu items
    const menuItems = [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
        price: 16.99,
        category: 'main-course',
        image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
        preparationTime: 20
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with croutons, parmesan cheese, and Caesar dressing',
        price: 12.99,
        category: 'appetizer',
        image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
        preparationTime: 10
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon grilled to perfection with herbs and lemon',
        price: 24.99,
        category: 'main-course',
        image: 'https://images.pexels.com/photos/842571/pexels-photo-842571.jpeg',
        preparationTime: 25
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten chocolate center, served with vanilla ice cream',
        price: 8.99,
        category: 'dessert',
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
        preparationTime: 15
      },
      {
        name: 'Craft Beer',
        description: 'Local craft beer selection',
        price: 6.99,
        category: 'beverage',
        image: 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg',
        preparationTime: 2
      },
      {
        name: 'Garlic Bread',
        description: 'Toasted bread with garlic butter and herbs',
        price: 7.99,
        category: 'side-dish',
        image: 'https://images.pexels.com/photos/209540/pexels-photo-209540.jpeg',
        preparationTime: 8
      },
      {
        name: 'Chicken Wings',
        description: 'Spicy buffalo chicken wings served with celery and blue cheese dressing',
        price: 13.99,
        category: 'appetizer',
        image: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg',
        preparationTime: 18
      },
      {
        name: 'Ribeye Steak',
        description: 'Premium ribeye steak cooked to your preference with roasted vegetables',
        price: 32.99,
        category: 'main-course',
        image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg',
        preparationTime: 30
      }
    ];

    await MenuItem.insertMany(menuItems);

    console.log('Seed data created successfully!');
    console.log('Login credentials:');
    console.log('Admin: admin@restaurant.com / admin123');
    console.log('Staff 1: chef1@restaurant.com / staff123');
    console.log('Staff 2: chef2@restaurant.com / staff123');
    console.log('Customer: customer@example.com / customer123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();