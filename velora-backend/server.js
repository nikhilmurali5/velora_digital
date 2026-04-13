console.log("🔥 SERVER STARTING...");
require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rate Limiter ── */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many submissions from this IP. Please try again after an hour.'
  }
});

/* ── Static files ── */
app.use(express.static(path.join(__dirname, 'public')));

/* ── Routes ── */
console.log("🔥 Loading contact route...");
try {
  const contactRoute = require('./routes/contact');
  app.use('/api/contact', contactLimiter, contactRoute);
  console.log("✅ Contact route loaded");
} catch (err) {
  console.error("❌ Route load failed:", err);
}

/* ── Health check ── */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

/* ── Catch-all ── */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── Start: connect DB first, then listen ── */  // ✅ FIXED
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️  Starting server WITHOUT database...');
    app.listen(PORT, () => console.log(`🚀 Server running WITHOUT DB on port ${PORT}`));
  });
