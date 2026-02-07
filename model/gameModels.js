import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    gameName: {
        type: String,
        required: true,
        trim: true
    },
    gameLogo: {
        type: String,
        required: true,
        trim: true
    },
    gameUrl: {
        type: String,
        trim: true
    },
    iframs: [{
        type: String,
        trim: true
    }],
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Game = mongoose.model('Game', gameSchema);

export default Game;