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
        trim: true,
        set: (v) => v.replace(/[\r\n]+/g, '')
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