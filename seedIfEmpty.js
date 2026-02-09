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

const addGamesWithoutDeleting = async () => {
    try {
        await mongoose.connect(process.env.MONGODBCON);
        console.log('✅ Connected to MongoDB');
        console.log('🗄️  Database:', mongoose.connection.db.databaseName);

        // Check existing games
        const existingCount = await Game.countDocuments();
        console.log(`📊 Current games in database: ${existingCount}`);

        if (existingCount === 0) {
            console.log('\n📦 Database is empty. Adding sample games...');
            await Game.insertMany(seedData);
            console.log('✅ Sample games added successfully!');
        } else {
            console.log('\n⚠️  Database already has games. Skipping seed.');
            console.log('   Run seed.js if you want to clear and re-seed.');
        }

        const finalCount = await Game.countDocuments();
        console.log(`\n📊 Final game count: ${finalCount}`);

        mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

addGamesWithoutDeleting();
