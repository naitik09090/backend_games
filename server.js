import express from 'express';
import sharp from 'sharp';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Game from './model/gameModels.js';
import User from './model/userModel.js';
import GMGame from './model/gmGameModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure images directory exists on startup (keep for backward compatibility or local dev)
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

// Use Memory Storage to store files as Buffer, then convert to Base64
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10 MB max per field (safety net)
    fileSize: 10 * 1024 * 1024,  // 10 MB max per file
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug logging for image requests
app.use('/images', (req, res, next) => {
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

/* Helper function is no longer needed for conversion, but we keep the static serving for old files */

// ─── Image Proxy Endpoint ───────────────────────────────────────────────────
// Fetches any image URL, resizes to 370x370 WebP, and serves with cache headers.
// This fixes Lighthouse "Use modern image formats" and "Properly size images" audits
// for legacy game logos stored as raw .gif / .png / .ico / .jpg URLs.
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing ?url parameter');

  // ?w= lets the client request the exact size: 185 for 1x, 370 for 2x (retina)
  const requestedSize = Math.min(Math.max(parseInt(req.query.w) || 185, 32), 800);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Upstream responded ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const webpBuffer = await sharp(inputBuffer)
      .resize(requestedSize, requestedSize, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toBuffer();

    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'Vary': 'Accept-Encoding',
    });
    res.send(webpBuffer);
  } catch (err) {
    console.error('image-proxy error:', err.message);
    // Fall back: redirect to the original URL so the image still loads
    res.redirect(imageUrl);
  }
});

let isMongoConnected = false;

async function connectToMongo() {
  if (mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODBCON);
    console.log('Connected to MongoDB');
    isMongoConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World');
})

// Stats endpoint for dashboard
// app.get('/stats', async (req, res) => {
//   try {
//     const gamesCount = await Game.countDocuments();
//     const gmGamesCount = await GMGame.countDocuments();
//     const totalGames = gamesCount + gmGamesCount;

//     res.json({
//       totalGames,
//       gamesCount,
//       gmGamesCount
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// app.get('/gm_games', async (req, res) => {
//   try {
//     let query = GMGame.find({});

//     // Check if pagination parameters are provided
//     if (req.query.page && req.query.limit) {
//       const page = parseInt(req.query.page);
//       const limit = parseInt(req.query.limit);

//       if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
//         const skip = (page - 1) * limit;
//         query = query.skip(skip).limit(limit);
//       }
//     }

//     const games = await query;
//     res.json(games);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/gm_games/:id', async (req, res) => {
//   try {
//     const gameId = req.params.id.trim();
//     const game = await GMGame.findById(gameId);
//     if (!game) {
//       return res.status(404).json({ error: 'Game not found' });
//     }
//     res.json(game);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Create a new gm_game
// app.post('/gm_games', upload.single('gameLogo'), async (req, res) => {
//   try {
//     const gameData = {
//       game_name: req.body.gameName,
//       name: req.body.gameName,
//       image: req.file ? `/images/${req.file.filename}` : req.body.gameLogo,
//       file: req.body.gameUrl || req.body.iframs,
//       status: true,
//       published: 1
//     };
//     const newGame = new GMGame(gameData);
//     await newGame.save();
//     res.status(201).json(newGame);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // Update a gm_game by ID
// app.put('/gm_games/:id', upload.single('gameLogo'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const existingGame = await GMGame.findById(id);

//     if (!existingGame) {
//       return res.status(404).json({ error: 'Game not found' });
//     }

//     // Update fields if provided
//     if (req.body.gameName) {
//       existingGame.game_name = req.body.gameName;
//       existingGame.name = req.body.gameName;
//     }
//     if (req.body.gameUrl || req.body.iframs) {
//       existingGame.file = req.body.gameUrl || req.body.iframs;
//     }

//     // Handle image update
//     if (req.file) {
//       existingGame.image = `/images/${req.file.filename}`;
//     } else if (req.body.gameLogo) {
//       existingGame.image = req.body.gameLogo;
//     }

//     const updatedGame = await existingGame.save();
//     res.json(updatedGame);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // Delete a gm_game by ID
// app.delete('/gm_games/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedGame = await GMGame.findByIdAndDelete(id);
//     if (!deletedGame) {
//       return res.status(404).json({ error: 'Game not found' });
//     }
//     res.json({ message: 'Game deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Toggle gm_game status (Active/Inactive)
// app.patch('/gm_games/:id/toggle-status', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const game = await GMGame.findById(id);
//     if (!game) return res.status(404).json({ error: 'Game not found' });

//     game.status = !game.status;
//     await game.save();
//     res.json({ message: 'Status updated', status: game.status });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

app.get('/games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get total count first - ONLY local games
    const totalGames = await Game.countDocuments();

    // Exclude gameLogo (base64 blob) from the list response to keep payload small.
    // The frontend uses /games/:id/logo to fetch thumbnails on demand.
    const games = await Game.find({}, { gameName: 1, gameUrl: 1, iframs: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalGames / limit);
    const hasMore = page < totalPages;

    res.json({
      games: games,
      pagination: {
        currentPage: page,
        limit: limit,
        totalGames: totalGames,
        totalPages: totalPages,
        hasMore: hasMore,
        nextPage: hasMore ? page + 1 : null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint to get ALL games from both collections together
// app.get('/all-games', async (req, res) => {
//   try {
//     // Combine both collections using aggregation
//     const allGames = await GMGame.aggregate([
//       {
//         $project: {
//           _id: 1,
//           gameName: { $ifNull: ["$name", "$game_name"] },
//           gameLogo: "$image",
//           gameUrl: "$file",
//           iframs: { $ifNull: ["$file", ""] },
//           status: { $literal: true },
//           createdAt: { $ifNull: ["$createdAt", { $toDate: "$_id" }] },
//           source: { $literal: 'gm_games' }
//         }
//       },
//       {
//         $unionWith: {
//           coll: 'games',
//           pipeline: [
//             {
//               $project: {
//                 _id: 1,
//                 gameName: 1,
//                 gameLogo: 1,
//                 gameUrl: 1,
//                 iframs: { $ifNull: [{ $arrayElemAt: ["$iframs", 0] }, "$gameUrl"] },
//                 status: 1,
//                 createdAt: { $ifNull: ["$createdAt", { $toDate: "$_id" }] },
//                 source: { $literal: 'local' }
//               }
//             }
//           ]
//         }
//       },
//       { $sort: { createdAt: -1 } }
//     ]);

//     res.json({
//       total: allGames.length,
//       games: allGames
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Serve a game's logo as a resized WebP image (avoids sending raw base64 in API responses)
app.get('/games/:id/logo', async (req, res) => {
  try {
    const gameId = req.params.id.trim();
    const requestedSize = Math.min(Math.max(parseInt(req.query.w) || 185, 32), 480);

    const game = await Game.findById(gameId, { gameLogo: 1 });
    if (!game || !game.gameLogo) {
      return res.status(404).send('Logo not found');
    }

    const logo = game.gameLogo;
    let inputBuffer;

    if (logo.startsWith('data:')) {
      // Case 1: base64 data URI (new uploads processed by sharp on upload)
      const base64Data = logo.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else if (logo.startsWith('http://') || logo.startsWith('https://')) {
      // Case 2: external URL — fetch and pipe through sharp
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(logo, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Upstream responded ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else {
      // Case 3: relative path like /images/foo.png — read from local filesystem
      const localPath = path.join(__dirname, logo.startsWith('/') ? logo.slice(1) : logo);
      inputBuffer = fs.readFileSync(localPath);
    }

    const webpBuffer = await sharp(inputBuffer)
      .resize(requestedSize, requestedSize, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toBuffer();

    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
      'Vary': 'Accept-Encoding',
    });
    res.send(webpBuffer);
  } catch (err) {
    console.error('logo endpoint error:', err.message);
    res.status(500).send('Error processing logo');
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

const processImageUpload = async (file) => {
  if (!file) return null;

  try {
    // Resize to 500x500 (cover crop) and convert to WebP at 80% quality.
    // 500px gives us headroom to downscale cleanly to 480px (desktop 2x) without upscaling.
    // This turns a 1MB+ PNG/GIF/ICO into a ~25-60KB WebP thumbnail.
    const webpBuffer = await sharp(file.buffer)
      .resize(500, 500, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toBuffer();

    const b64 = webpBuffer.toString('base64');
    return `data:image/webp;base64,${b64}`;
  } catch (err) {
    // Fallback: if sharp fails (e.g. unsupported format), store original
    console.warn('sharp processing failed, storing original:', err.message);
    const b64 = Buffer.from(file.buffer).toString('base64');
    return `data:${file.mimetype};base64,${b64}`;
  }
}

app.post('/games', upload.single('gameLogo'), async (req, res) => {
  try {
    let gameLogo = req.body.gameLogo;

    // If a file is uploaded, resize + convert to WebP base64
    if (req.file) {
      gameLogo = await processImageUpload(req.file);
    }

    const gameData = {
      gameName: req.body.gameName,
      gameLogo: gameLogo,
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
      existingGame.gameLogo = await processImageUpload(req.file);
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