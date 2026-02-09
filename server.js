import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import Game from './model/gameModels.js';
import User from './model/userModel.js';
import GMGame from './model/gmGameModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/images', express.static('images'));

let isMongoConnected = false;

async function connectToMongo() {
  if (isMongoConnected) return;

  try {
    await mongoose.connect(process.env.MONGODBCON);
    console.log('Connected to MongoDB');
    isMongoConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

app.use((req, res, next) => {
  if (!isMongoConnected) {
    connectToMongo();
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World');
})


app.get('/gm_games', async (req, res) => {
  try {
    let query = GMGame.find({});

    // Check if pagination parameters are provided
    if (req.query.page && req.query.limit) {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);

      if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
      }
    }

    const games = await query;
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/gm_games/:id', async (req, res) => {
  try {
    const gameId = req.params.id.trim();
    const game = await GMGame.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new gm_game
app.post('/gm_games', upload.single('gameLogo'), async (req, res) => {
  try {
    const gameData = {
      game_name: req.body.gameName,
      name: req.body.gameName,
      image: req.file ? `/images/${req.file.filename}` : req.body.gameLogo,
      file: req.body.gameUrl || req.body.iframs,
      status: true,
      published: 1
    };
    const newGame = new GMGame(gameData);
    await newGame.save();
    res.status(201).json(newGame);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a gm_game by ID
app.put('/gm_games/:id', upload.single('gameLogo'), async (req, res) => {
  try {
    const { id } = req.params;
    const existingGame = await GMGame.findById(id);

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update fields if provided
    if (req.body.gameName) {
      existingGame.game_name = req.body.gameName;
      existingGame.name = req.body.gameName;
    }
    if (req.body.gameUrl || req.body.iframs) {
      existingGame.file = req.body.gameUrl || req.body.iframs;
    }

    // Handle image update
    if (req.file) {
      existingGame.image = `/images/${req.file.filename}`;
    } else if (req.body.gameLogo) {
      existingGame.image = req.body.gameLogo;
    }

    const updatedGame = await existingGame.save();
    res.json(updatedGame);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a gm_game by ID
app.delete('/gm_games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGame = await GMGame.findByIdAndDelete(id);
    if (!deletedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle gm_game status (Active/Inactive)
app.patch('/gm_games/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await GMGame.findById(id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = !game.status;
    await game.save();
    res.json({ message: 'Status updated', status: game.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Start with GMGame as it contains the bulk of the data (25k+ records)
    // This allows the join to work even if the local 'games' collection is empty.
    const games = await GMGame.aggregate([
      {
        $project: {
          _id: 1,
          gameName: { $ifNull: ["$name", "$game_name"] },
          gameLogo: "$image",
          gameUrl: "$file",
          iframs: { $ifNull: ["$file", ""] },
          status: { $literal: true },
          createdAt: { $ifNull: ["$createdAt", { $toDate: "$_id" }] },
          source: { $literal: 'gm_games' }
        }
      },
      {
        $unionWith: {
          coll: 'games',
          pipeline: [
            {
              $project: {
                _id: 1,
                gameName: 1,
                gameLogo: 1,
                gameUrl: 1,
                iframs: { $ifNull: [{ $arrayElemAt: ["$iframs", 0] }, "$gameUrl"] },
                status: 1,
                createdAt: { $ifNull: ["$createdAt", { $toDate: "$_id" }] },
                source: { $literal: 'local' }
              }
            }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id.trim(); // Clean up accidental spaces/newlines

    // 1. Try finding in local Game collection
    let game = await Game.findById(gameId);

    // 2. If not found, try GMGame collection
    if (!game) {
      const gmGame = await GMGame.findById(gameId);
      if (gmGame) {
        // Normalize GMGame
        game = {
          _id: gmGame._id,
          gameName: gmGame.name || gmGame.game_name,
          gameLogo: gmGame.image,
          gameUrl: gmGame.file,
          iframs: gmGame.file ? [gmGame.file] : [],
          description: gmGame.description,
          instructions: gmGame.instructions,
          source: 'gm_games'
        };
      }
    }

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/games', upload.single('gameLogo'), async (req, res) => {
  try {
    const gameData = {
      gameName: req.body.gameName,
      gameLogo: req.file ? `/images/${req.file.filename}` : req.body.gameLogo,
      gameUrl: req.body.gameUrl,
      iframs: req.body.iframs ? req.body.iframs.split(',').map(url => url.trim()) : []
    };
    const newGame = new Game(gameData);
    await newGame.save();
    res.status(201).json(newGame);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a game by ID
app.put('/games/:id', upload.single('gameLogo'), async (req, res) => {
  try {
    const { id } = req.params;
    const existingGame = await Game.findById(id);

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update fields if provided
    if (req.body.gameName) existingGame.gameName = req.body.gameName;
    if (req.body.gameUrl) existingGame.gameUrl = req.body.gameUrl;

    // Handle gameLogo update
    if (req.file) {
      existingGame.gameLogo = `/images/${req.file.filename}`;
    } else if (req.body.gameLogo) {
      existingGame.gameLogo = req.body.gameLogo;
    }

    // Handle iframs update
    if (req.body.iframs) {
      if (typeof req.body.iframs === 'string') {
        existingGame.iframs = req.body.iframs.split(',').map(url => url.trim()).filter(url => url.length > 0);
      } else if (Array.isArray(req.body.iframs)) {
        existingGame.iframs = req.body.iframs;
      }
    }

    const updatedGame = await existingGame.save();
    res.json(updatedGame);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle game status (Active/Inactive)
app.patch('/games/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = !game.status;
    await game.save();
    res.json({ message: 'Status updated', status: game.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a game by ID
app.delete('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGame = await Game.findByIdAndDelete(id);
    if (!deletedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register Route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const trimmedUsername = username.trim();

    // Check if user exists
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: trimmedUsername,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Create token (using a simple secret for now, ideally in .env)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey123', {
      expiresIn: '1h'
    });

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;