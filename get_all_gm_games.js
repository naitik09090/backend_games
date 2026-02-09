import dotenv from 'dotenv';
import mongoose from 'mongoose';
import GMGame from './model/gmGameModel.js';

dotenv.config();

/**
 * Script to fetch and display all games from the gm_games collection
 * This provides a comprehensive view of all game data with field explanations
 */

async function getAllGMGames() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODBCON);
        console.log('✓ Connected to MongoDB successfully\n');

        // Fetch all games from gm_games collection
        console.log('Fetching all games from gm_games collection...');
        const games = await GMGame.find({});

        console.log(`\n✓ Found ${games.length} games in the gm_games collection\n`);
        console.log('='.repeat(100));

        // Display each game with detailed comments
        games.forEach((game, index) => {
            console.log(`\nGame #${index + 1}:`);
            console.log('-'.repeat(100));

            // MongoDB and External Identifiers
            console.log(`  _id:              ${game._id}                 // MongoDB unique document ID`);
            console.log(`  game_id:          ${game.game_id}             // External game ID from source system`);
            console.log(`  catalog_id:       ${game.catalog_id}          // Catalog classification identifier`);

            // Game Names (may have both fields for compatibility)
            console.log(`  game_name:        ${game.game_name}           // Original game name field`);
            console.log(`  name:             ${game.name}                // Display name (alternative field)`);

            // Visual Assets
            console.log(`  image:            ${game.image}               // Game thumbnail/logo image URL`);

            // Categorization
            console.log(`  category:         ${game.category}            // Category ID for game classification`);
            console.log(`  game_type:        ${game.game_type}           // Type of game (HTML5, Flash, etc.)`);

            // Engagement Metrics
            console.log(`  plays:            ${game.plays}               // Total number of times this game was played`);
            console.log(`  rating:           ${game.rating}              // User rating score`);

            // Game Content (truncated for readability)
            const desc = game.description ? game.description.substring(0, 80) + '...' : 'N/A';
            const inst = game.instructions ? game.instructions.substring(0, 80) + '...' : 'N/A';
            console.log(`  description:      ${desc}  // Game description`);
            console.log(`  instructions:     ${inst}  // How to play instructions`);

            // Game File and Display Dimensions
            console.log(`  file:             ${game.file}                // Game file URL (HTML5 game or iframe source)`);
            console.log(`  w:                ${game.w}                   // Recommended width in pixels`);
            console.log(`  h:                ${game.h}                   // Recommended height in pixels`);

            // Publishing and Feature Status
            console.log(`  import:           ${game.import}              // Import status flag`);
            console.log(`  published:        ${game.published}           // Published status (1=published, 0=draft)`);
            console.log(`  featured:         ${game.featured}            // Featured status (1=featured, 0=normal)`);
            console.log(`  featured_sorting: ${game.featured_sorting}    // Sorting order for featured games`);
            console.log(`  mobile:           ${game.mobile}              // Mobile compatibility (1=mobile-friendly)`);

            // Timestamps
            const dateStr = game.date_added ? new Date(game.date_added * 1000).toLocaleString() : 'N/A';
            console.log(`  date_added:       ${game.date_added} (${dateStr})  // Unix timestamp of when game was added`);

            console.log('-'.repeat(100));
        });

        console.log('\n' + '='.repeat(100));
        console.log(`\nTotal Games Retrieved: ${games.length}`);

        // Summary Statistics
        const publishedGames = games.filter(g => g.published === 1).length;
        const featuredGames = games.filter(g => g.featured === 1).length;
        const mobileGames = games.filter(g => g.mobile === 1).length;
        const totalPlays = games.reduce((sum, g) => sum + (g.plays || 0), 0);
        const avgRating = games.length > 0 ? (games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.length).toFixed(2) : 0;

        console.log('\n📊 Summary Statistics:');
        console.log(`  Published Games:      ${publishedGames} / ${games.length}`);
        console.log(`  Featured Games:       ${featuredGames}`);
        console.log(`  Mobile-Friendly:      ${mobileGames}`);
        console.log(`  Total Plays:          ${totalPlays.toLocaleString()}`);
        console.log(`  Average Rating:       ${avgRating}`);

        // Category breakdown
        const categories = {};
        games.forEach(g => {
            if (g.category) {
                categories[g.category] = (categories[g.category] || 0) + 1;
            }
        });

        console.log('\n📁 Games by Category:');
        Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`  Category ${cat}: ${count} games`);
        });

    } catch (error) {
        console.error('❌ Error fetching games:', error.message);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Execute the function
getAllGMGames();
