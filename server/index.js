const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app'
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ── Rate Limiters — only active in production ─────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 0, // 0 = disabled
  skip: () => process.env.NODE_ENV !== 'production',   // skip entirely in dev
  message: { message: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 0,
  skip: () => process.env.NODE_ENV !== 'production',   // skip entirely in dev
  message: { message: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, require('./routes/auth'));
app.use('/api/pages',      apiLimiter,  require('./routes/pages'));
app.use('/api/workspaces', apiLimiter,  require('./routes/workspaces'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${err.stack}`);
  res.status(500).json({ message: 'Something went wrong on our end.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`));
