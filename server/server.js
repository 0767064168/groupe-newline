require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { pool, initAdminIfNeeded } = require('./db');

const apiPublicRoutes = require('./routes/apiPublic');
const apiAdminRoutes = require('./routes/apiAdmin');
const apiAuthRoutes = require('./routes/apiAuth');
const apiTestimonialsRoutes = require('./routes/apiTestimonials');


const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'http://localhost:3001', 'ws://localhost:3001'],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    }
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: false
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Serve uploaded media
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files from project root
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'db_unreachable' });
  }
});

app.use('/api', apiPublicRoutes);
app.use('/api/admin', apiAuthRoutes);
app.use('/api/admin', apiAdminRoutes);
app.use('/api', apiTestimonialsRoutes);


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Ensure DB is reachable before serving
initAdminIfNeeded().catch(err => {
  console.error('initAdminIfNeeded failed:', err);
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`GroupeNewline server listening on http://localhost:${port}`);
});

