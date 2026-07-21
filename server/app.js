const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const modelTestRoutes = require('./routes/modelTestRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// Static uploads (student photos, logo, signature)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tutorium API is running',
    health: '/health',
    docs: '/api-docs',
  });
});

app.get('/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/students', '/students'], studentRoutes);
app.use(['/api/payments', '/payments'], paymentRoutes);
app.use(['/api/model-tests', '/model-tests'], modelTestRoutes);
app.use(['/api/receipt', '/receipt'], receiptRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/reports', '/reports'], reportRoutes);
app.use(['/api/settings', '/settings'], settingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
