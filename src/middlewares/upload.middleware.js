const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif'];

const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_DOC_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

// Tạo thư mục upload nếu chưa tồn tại (không dùng existsSync)
fs.mkdirSync('uploads/images/', { recursive: true });
fs.mkdirSync('uploads/documents/', { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = ALLOWED_IMAGE_MIMES.includes(file.mimetype);
    cb(null, isImage ? 'uploads/images/' : 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = ALLOWED_IMAGE_MIMES.includes(file.mimetype) && ALLOWED_IMAGE_EXTS.includes(ext);
  const isDoc = ALLOWED_DOC_MIMES.includes(file.mimetype) && ALLOWED_DOC_EXTS.includes(ext);

  if (isImage || isDoc) {
    cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ. Chỉ cho phép ảnh (JPEG, PNG, GIF) và tài liệu (PDF, DOC, DOCX, XLS, XLSX).'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = upload;
