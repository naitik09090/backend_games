import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './model/gameModels.js';

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODBCON);
        console.log('Connected to MongoDB');

        const games = await Game.find({});
        console.log(`Found ${games.length} games in the database:`);
        games.forEach(game => {
            console.log(`- ${game.gameName} (ID: ${game._id})`);
        });

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error checking database:', error);
        process.exit(1);
    }
};

checkData();
