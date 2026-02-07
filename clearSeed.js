import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './model/gameModels.js';

dotenv.config();

async function clearSeedData() {
    try {
        await mongoose.connect(process.env.MONGODBCON);
        const res = await Game.deleteMany({
            gameName: { $in: ['Stickman Adventure', 'Space Explorer', 'Puzzle Master'] }
        });
        console.log(`Successfully removed ${res.deletedCount} seed items from 'games' collection.`);
        mongoose.connection.close();
    } catch (err) {
        console.error('Error clearing seed data:', err);
        process.exit(1);
    }
}

clearSeedData();
