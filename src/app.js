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
const tradingFacilityRoutes = require('./routes/tradingFacility.route');
const roleRoutes = require('./routes/role.route');
const bannerRoutes = require('./routes/banner.route');
const { initCronJobs } = require('./cron/scheduler');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Tin tưởng reverse proxy (Nginx) — cần thiết để req.ip, req.protocol đúng
app.set('trust proxy', 1);

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

// ── CORS ─────────────────────────────────────────────────────────
// ALLOWED_ORIGINS = danh sách origin hợp lệ, phân cách bằng dấu phẩy
// VD: https://suckhoethudo.vn,https://backend.suckhoethudo.vn
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, mobile app, server-to-server)
    if (!origin) return callback(null, true);

    // Nếu không cấu hình ALLOWED_ORIGINS hoặc đặt là '*' → cho phép tất cả
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`CORS: origin "${origin}" không được phép`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400, // preflight cache 24h
}));

// Xử lý preflight OPTIONS cho tất cả routes
// Express 5 không chấp nhận '*' — dùng regex thay thế
app.options(/.*/, cors());

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
// Header CORP cho phép frontend (khác subdomain) load ảnh/file
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

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
app.use('/api/trading-facilities', tradingFacilityRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/banners', bannerRoutes);

app.use(errorHandler);

module.exports = app;
