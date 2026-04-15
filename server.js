console.log("🔥 SERVER STARTING...");
require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

/* ── Middleware ── */
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rate limiter ── */
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
const contactRoute = require('./routes/contact');
app.use('/api/contact', contactLimiter, contactRoute);
console.log('✅ Contact route loaded');

/* ── Health check ── */
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

/* ── Catch-all SPA ── */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error('💥 Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

/* ── DB → Server ── */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️  Starting WITHOUT database...');
    app.listen(PORT, () => console.log(`🚀 Server running WITHOUT DB on port ${PORT}`));
  });
