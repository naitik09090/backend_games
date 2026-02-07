import mongoose from 'mongoose';

const gmGameSchema = new mongoose.Schema({
    game_id: Number,
    catalog_id: String,
    game_name: String,
    name: String,
    image: String,
    import: Number,
    category: Number,
    plays: Number,
    rating: Number,
    description: String,
    instructions: String,
    file: String,
    game_type: String,
    w: Number,
    h: Number,
    date_added: Number,
    published: Number,
    featured: Number,
    mobile: Number,
    featured_sorting: String
}, {
    collection: 'gm_games'
});

const GMGame = mongoose.model('GMGame', gmGameSchema);

export default GMGame;
