import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './model/gameModels.js';

dotenv.config();

const seedData = [
  {
    gameName: 'Moto X3M',
    gameLogo: 'https://images.crazygames.com/moto-x3m/20240508125431/moto-x3m-cover?auto=format%2Ccompress&q=45&cs=strip&ch=DPR&w=275&h=155&fit=crop',
    gameUrl: 'https://html5.gamemonetize.com/et5cfkegc1ohyt0ewhzt80mmrfzzgx60/',
    iframs: [
      'https://html5.gamemonetize.com/et5cfkegc1ohyt0ewhzt80mmrfzzgx60/'
    ]
  },
  {
    gameName: 'Drift Hunters',
    gameLogo: 'https://images.crazygames.com/drifthunters/20240212165034/drifthunters-cover?auto=format%2Ccompress&q=45&cs=strip&ch=DPR&w=275&h=155&fit=crop',
    gameUrl: 'https://html5.gamemonetize.com/et5cfkegc1ohyt0ewhzt80mmrfzzgx60/',
    iframs: [
      'https://html5.gamemonetize.com/et5cfkegc1ohyt0ewhzt80mmrfzzgx60/'
    ]
  },
  {
    gameName: '2-Player Pong',
    gameLogo: 'https://images.crazygames.com/pong-the-classic/20240508125431/pong-the-classic-cover?auto=format%2Ccompress&q=45&cs=strip&ch=DPR&w=275&h=155&fit=crop',
    gameUrl: 'https://html5.gamemonetize.com/et5cfkegc1ohyt0ewhzt80mmrfzzgx60/',
    iframs: [
      'https://html5.gamemonetize.com/et5cfkegc1ohyt0ewhzt80mmrfzzgx60/'
    ]
  },
  {
    gameName: 'Stickman Adventure',
    gameLogo: '/images/stickman.jpg',
    gameUrl: 'https://stickyman.vercel.app/',
    iframs: [
      'https://stickyman.vercel.app/',
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