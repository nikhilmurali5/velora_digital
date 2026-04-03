console.log("🔥 SERVER STARTING...");
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rate Limiter: max 5 contact submissions per hour per IP ── */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this IP. Please try again after an hour.'
  }
});

/* ── Static files (your HTML lives in /public) ── */
app.use(express.static(path.join(__dirname, 'public')));

/* ── Routes ── */
//app.use('/api/contact', contactLimiter, require('./routes/contact'));
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

/* ── Catch-all: serve index.html for any unmatched route ── */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── MongoDB connection ── */
app.listen(PORT, () => {
  console.log("Server running");
});
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
  })
  .catch(err => {
  console.error('❌  MongoDB connection failed:', err.message);
  app.listen(PORT, () => console.log(`🚀 Server running WITHOUT DB on port ${PORT}`));
});
