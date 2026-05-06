const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables

const UPLOAD_DIR = path.join(__dirname, '../../uploads/posts');
const APP_BASE_URL = process.env.APP_BASE_URL;

// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Checks if a string is a base64 image data URL.
 * @param {string} dataUrl
 * @returns {boolean}
 */
const isBase64Image = (dataUrl) => {
    return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/');
};

/**
 * Extracts base64 data and file extension from a data URL.
 * @param {string} dataUrl
 * @returns {{base64Data: string, extension: string}|null}
 */
const extractBase64Data = (dataUrl) => {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
    if (matches && matches.length === 3) {
        return {
            extension: matches[1],
            base64Data: matches[2]
        };
    }
    return null;
};

/**
 * Saves base64 image data to a file and returns the public URL.
 * @param {string} base64Data
 * @param {string} extension
 * @returns {string} The public URL of the saved image.
 */
const saveBase64Image = (base64Data, extension) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

    // Return the public URL
    if (!APP_BASE_URL) {
        console.warn('APP_BASE_URL is not defined in .env. Image URLs will be relative.');
        return `/uploads/posts/${filename}`;
    }
    return `${APP_BASE_URL}/uploads/posts/${filename}`;
};

module.exports = {
    isBase64Image,
    extractBase64Data,
    saveBase64Image
};
