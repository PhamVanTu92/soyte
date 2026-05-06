const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const postRoutes = require('./routes/post.route');
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const scheduleRoutes = require('./routes/schedule.route');
const crawlerRoutes = require('./routes/crawler.route');
const formRoutes = require('./routes/form.route');
const feedbackRoutes = require('./routes/feedback.route');
const uploadRoutes = require('./routes/upload.route');
const socialFacilityRoutes = require('./routes/socialFacility.route');
const permissionRoutes = require('./routes/permission.route');
const emailConfirmRoutes = require('./routes/emailConfirm.route');
const surveyRoutes = require('./routes/survey.route');
const affiliatedFacilityRoutes = require('./routes/affiliatedFacility.route');
const reportRoutes = require('./routes/report.route');
const { initCronJobs } = require('./cron/scheduler');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security headers — tắt contentSecurityPolicy để Swagger UI hoạt động
app.use(helmet({ contentSecurityPolicy: false }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SOYTE API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// CORS — development: cho phép tất cả; production: chỉ cho phép ALLOWED_ORIGINS
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean);
const allowAllOrigins = allowedOrigins.includes('*');
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép: dev mode / request không có origin (mobile app, Postman, curl) /
    //           chưa cấu hình danh sách / wildcard '*' / origin nằm trong danh sách
    if (isDev || !origin || allowedOrigins.length === 0 || allowAllOrigins || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

// Rate limiting cho auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Khởi tạo Cron Job khi server bắt đầu
initCronJobs();

// Set Content-Type header for all API responses
app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// API Routes
app.get('/', (req, res) => {
  res.send('SOYTE_BE API is running...');
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api', scheduleRoutes);
app.use('/api/crawled-schedules', crawlerRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/social-facilities', socialFacilityRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/email-confirm', emailConfirmRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/affiliated-facilities', affiliatedFacilityRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

module.exports = app;
