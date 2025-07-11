// server.js
require('dotenv').config(); // ✅ Load environment variables immediately

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const { connectProducer } = require('./utils/kafkaClient');
const { startWeb3EventListener } = require('./services/web3Listener');
const { startProcessor } = require('./services/eventProcessor');

// ✅ Validate required environment variables early
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ Import routes
const reportRoutes = require('./routes/reportRoutes');
const riskRoutes = require('./routes/riskRoutes');
const authRoutes = require('./routes/authRoutes');
const contractRoutes = require('./routes/contractRoutes');
const walletRoutes = require('./routes/wallet');
const statsRoutes = require('./routes/statsRoutes');
const loginLogRoutes = require('./routes/loginLogRoutes');
const userRoutes = require('./routes/userRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const exportRoutes = require('./routes/exportRoutes');
const eventRoutes = require('./routes/eventRoutes');

// ✅ Import middlewares
const auditLogger = require('./middleware/auditLogger');
const authMiddleware = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimit');

// ✅ CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Logging
app.use(morgan('combined'));

// ✅ JSON body parsing
app.use(express.json());

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ✅ Test route
app.get('/test', (req, res) => {
  console.log('✅ /test route hit');
  res.send('It works!');
});

// ✅ Public routes
app.use('/api/auth', authRoutes);
app.use('/api/contract', contractRoutes);

// ✅ Authentication middleware (protects everything below)
app.use(authMiddleware);
app.use(rateLimiter);

// ✅ Wallet routes (protected)
app.use('/api/wallet', walletRoutes);

// ✅ Audit logging (after authentication)
app.use(auditLogger);

// ✅ Protected routes
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/reports/export', exportRoutes);
app.use('/api/login-logs', loginLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports/summary', summaryRoutes);
app.use('/api/events', eventRoutes);


// ✅ MongoDB connection and startup
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    // ✅ Start Kafka producer if enabled
    await connectProducer();

    // ✅ Ensure default admin user exists
    const User = require('./models/User');
    const email = process.env.ADMIN_EMAIL || 'keval7114@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ email });
    if (!existingAdmin) {
      console.log(`ℹ️ No admin found. Creating default admin user: ${email}`);
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        email,
        password: hashedPassword,
        role: 'admin',
      });

      console.log(`✅ Default admin created: ${email}`);
    } else {
      console.log(`ℹ️ Admin already exists: ${email}`);
    }

    // ✅ Start smart contract event listener
    startWeb3EventListener();

    // ✅ Start in-memory / Kafka processor
    startProcessor();

    // ✅ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
