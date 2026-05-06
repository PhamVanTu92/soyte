const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the storage destination and filename for post images
const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/posts/';
        // Ensure the directory exists
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create a unique filename to avoid conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // Handle UTF-8 filenames
        cb(null, `${uniqueSuffix}${fileExtension}`);
    }
});

// File filter to accept only image types
const postFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('File upload only supports image filetypes: jpeg, jpg, png, gif.'));
};

const uploadPostImage = multer({
    storage: postStorage,
    limits: {
        fileSize: 1024 * 1024 * 100 // 100MB file size limit
    },
    fileFilter: postFileFilter
});

module.exports = uploadPostImage;
