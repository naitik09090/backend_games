import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './model/gameModels.js';

dotenv.config();

const seedData = [
  {
    gameName: 'Stickman Adventure',
    gameLogo: '/images/stickman.jpg',
    gameUrl: 'https://stickyman.vercel.app/',
    iframs: [
      'https://stickyman.vercel.app/',
    ]
  },
  {
    gameName: 'Space Explorer',
    gameLogo: '/images/stickman.jpg', // Placeholder
    gameUrl: 'https://stickyman.vercel.app/',
    iframs: [
      '/images/stickman.jpg',
      '/images/stickman.jpg'
    ]
  },
  {
    gameName: 'Puzzle Master',
    gameLogo: '/images/stickman.jpg', // Placeholder
    gameUrl: 'https://stickyman.vercel.app/',
    iframs: [
      '/images/stickman.jpg',
      '/images/stickman.jpg',
      '/images/stickman.jpg',
      '/images/stickman.jpg'
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODBCON);
    console.log('Connected to MongoDB');

    await Game.deleteMany(); // Clear existing data
    console.log('Cleared existing games');

    await Game.insertMany(seedData);
    console.log('Sample games added successfully');

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();