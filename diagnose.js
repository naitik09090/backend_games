import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './model/gameModels.js';

dotenv.config();

const diagnose = async () => {
    try {
        await mongoose.connect(process.env.MONGODBCON);
        console.log('✅ Connected to MongoDB');
        console.log('📍 Connection String:', process.env.MONGODBCON);
        console.log('🗄️  Database Name:', mongoose.connection.db.databaseName);
        console.log('📦 Collection Name:', Game.collection.name);

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📚 All collections in this database:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        // Count documents in the games collection
        const gamesCount = await Game.countDocuments();
        console.log(`\n🎮 Games in "${Game.collection.name}" collection: ${gamesCount}`);

        // List all games
        if (gamesCount > 0) {
            const games = await Game.find({}).select('gameName _id');
            console.log('\n📋 List of games:');
            games.forEach(game => {
                console.log(`   - ${game.gameName} (ID: ${game._id})`);
            });
        }

        mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

diagnose();
