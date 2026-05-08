/**
 * urlHelper.js
 * Tiện ích xây dựng & chuẩn hóa URL ảnh/file upload.
 *
 * Cấu hình qua env:
 *   APP_BASE_URL=https://suckhoethudo.vn   ← ưu tiên cao nhất
 *   FRONTEND_URL=https://suckhoethudo.vn   ← fallback
 *
 * Nếu không có env thì dùng http://localhost:3000 (chỉ cho dev).
 */

/**
 * Trả về base URL của server (không có trailing slash).
 * Thứ tự ưu tiên: APP_BASE_URL → FRONTEND_URL → localhost fallback
 */
const getAppBaseUrl = () => {
  const raw = process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  return raw.replace(/\/$/, ''); // bỏ trailing slash
};

/**
 * Tạo full URL cho một đường dẫn upload.
 * @param {string} relativePath  - VD: '/uploads/images/123-abc.png'
 * @returns {string}             - VD: 'https://suckhoethudo.vn/uploads/images/123-abc.png'
 */
const buildUploadUrl = (relativePath) => {
  if (!relativePath) return '';
  // Nếu đã là URL tuyệt đối → trả nguyên
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const base = getAppBaseUrl();
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
};

/**
 * Chuẩn hóa một URL ảnh: thay thế base URL cũ bằng base URL hiện tại.
 * Dùng khi serve data từ DB có thể chứa URL server cũ.
 *
 * @param {string} url          - URL gốc từ DB
 * @param {string[]} [oldBases] - Danh sách prefix cũ cần thay (nếu không truyền,
 *                                dùng OLD_BASE_URLS env hoặc danh sách mặc định)
 * @returns {string}
 */
const rewriteUploadUrl = (url, oldBases) => {
  if (!url || typeof url !== 'string') return url;
  if (!/^https?:\/\//i.test(url)) return url; // relative path → giữ nguyên

  const newBase = getAppBaseUrl();

  // Nếu URL đã dùng base hiện tại → không cần rewrite
  if (url.startsWith(newBase)) return url;

  // Danh sách base URL cũ cần thay
  const candidates = oldBases || parseOldBases();

  for (const old of candidates) {
    if (url.startsWith(old)) {
      return newBase + url.slice(old.length);
    }
  }

  // Heuristic: nếu URL có path /uploads/ nhưng base khác → chỉ giữ phần path
  const uploadsIdx = url.indexOf('/uploads/');
  if (uploadsIdx !== -1) {
    return newBase + url.slice(uploadsIdx);
  }

  return url;
};

/**
 * Parse OLD_BASE_URLS env (phân cách dấu phẩy) thành mảng string.
 * VD: OLD_BASE_URLS=http://160.30.252.5:3000,http://192.168.100.5:3000
 */
const parseOldBases = () => {
  const raw = process.env.OLD_BASE_URLS || '';
  return raw.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
};

/**
 * Rewrite tất cả URL ảnh trong một chuỗi HTML/text.
 * Dùng cho posts.content có thể chứa <img src="http://oldserver/uploads/...">
 */
const rewriteUrlsInHtml = (html, oldBases) => {
  if (!html || typeof html !== 'string') return html;
  const candidates = oldBases || parseOldBases();
  if (candidates.length === 0) return html;

  const newBase = getAppBaseUrl();
  let result = html;
  for (const old of candidates) {
    // Escape đặc biệt cho regex
    const escaped = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), newBase);
  }
  return result;
};

module.exports = { getAppBaseUrl, buildUploadUrl, rewriteUploadUrl, rewriteUrlsInHtml, parseOldBases };
