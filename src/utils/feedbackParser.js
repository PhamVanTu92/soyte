/**
 * feedbackParser.js
 * Chuyển raw DB row (feedback) thành object sạch để xử lý/phân tích.
 *
 * Cấu trúc info trong DB:
 *   {
 *     "1": { "key": "1", "value": { "key": "bv-abc", "value": "Bệnh viện ABC" } },  ← đơn vị
 *     "2": { "key": "2", "value": "2026-03-17T17:00:00.000Z" },                       ← ngày
 *     "3": { "key": "3", "value": { "key": "1", "value": "Người bệnh tự điền" } },    ← loại người điền
 *     ...
 *     "title": "PHIẾU KHẢO SÁT...",
 *     "description": "..."
 *   }
 */

/**
 * Parse info JSON — trả về object, không throw.
 * @param {string|object} raw
 * @returns {object}
 */
const parseInfo = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
};

/**
 * Tìm facility (đơn vị) từ info.
 * Ưu tiên key có value là { key: string_không_phải_số, value: string }
 * Ví dụ: info["1"].value = { key: "bv-hong-ngoc", value: "BVĐK Hồng Ngọc" }
 *
 * @param {object} info  đã qua parseInfo
 * @returns {{ facilityKey: string, facilityName: string } | null}
 */
const extractFacility = (info) => {
  if (!info || typeof info !== 'object') return null;

  for (const k of Object.keys(info)) {
    // Bỏ qua key không phải số (title, description, ...)
    if (isNaN(Number(k))) continue;

    const item = info[k];
    if (!item) continue;

    // Dạng value là object { key, value }
    const v = item.value;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const fKey = v.key;
      const fVal = v.value;
      if (fKey && typeof fKey === 'string' && isNaN(Number(fKey)) && fKey.length > 2) {
        return { facilityKey: fKey, facilityName: String(fVal || fKey) };
      }
    }

    // Dạng item có key + value trực tiếp (format cũ)
    if (item.key && item.value && typeof item.key === 'string' && isNaN(Number(item.key))) {
      return { facilityKey: String(item.key), facilityName: String(item.value) };
    }
  }

  return null;
};

/**
 * Lấy giá trị của một trường theo số thứ tự key (ví dụ key "3" → loại người điền).
 * @param {object} info
 * @param {string|number} keyIndex  VD: "3"
 * @returns {string|null}
 */
const getInfoField = (info, keyIndex) => {
  const item = info[String(keyIndex)];
  if (!item) return null;
  const v = item.value;
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && v !== null) return String(v.value ?? v.key ?? '');
  return String(v);
};

/**
 * Map form_id → loại khảo sát
 * 19 = nội trú, 20 = ngoại trú, 21 = tiêm chủng
 * (có thể mở rộng qua tham số formTypeMap nếu cần)
 */
const DEFAULT_FORM_TYPE_MAP = {
  '19': 'noi_tru',
  '20': 'ngoai_tru',
  '21': 'tiem_chung',
};

/**
 * Chuyển một raw DB row thành object sạch.
 *
 * @param {object} row  — raw row từ Sequelize (raw: true) hoặc .toJSON()
 * @param {object} [formTypeMap]  — tuỳ chọn override map form_id → survey_type
 * @returns {{
 *   id: number,
 *   formId: string,
 *   surveyType: string,       // 'noi_tru' | 'ngoai_tru' | 'tiem_chung' | 'unknown'
 *   facilityKey: string|null, // VD: "bv-hong-ngoc-yen-ninh"
 *   facilityName: string|null,// VD: "BVĐK Hồng Ngọc"
 *   isQR: boolean,            // true nếu nộp qua QR (source='qr'); dữ liệu cũ: suy luận từ user_id
 *   submittedBy: string|null, // VD: "Người bệnh tự điền"
 *   respondentType: string|null, // VD: "Người bệnh"
 *   surveyDate: string|null,  // ISO date string từ info
 *   status: string,
 *   createdAt: Date|string,
 *   type: string,             // 'evaluate' | 'reflect' | ...
 *   surveyKey: string|null,
 *   _info: object,            // info đã parse, để truy cập thêm nếu cần
 * }}
 */
const parseFeedbackRow = (row, formTypeMap = DEFAULT_FORM_TYPE_MAP) => {
  const info = parseInfo(row.info);
  const facility = extractFacility(info);
  const formId = String(row.form_id || '');
  const surveyType = formTypeMap[formId] || 'unknown';

  return {
    id: row.id,
    formId,
    surveyType,
    facilityKey: facility?.facilityKey ?? null,
    facilityName: facility?.facilityName ?? null,
    // Ưu tiên cột source mới ('qr'|'web'); dữ liệu cũ (NULL) → suy luận theo user_id
    isQR: row.source ? row.source === 'qr' : !row.user_id,
    submittedBy: getInfoField(info, 3),   // key "3": loại người điền
    respondentType: getInfoField(info, 4), // key "4": người bệnh / người nhà
    surveyDate: getInfoField(info, 2),     // key "2": ngày khảo sát
    status: row.status || '',
    createdAt: row.created_at,
    type: row.type,
    surveyKey: row.survey_key ?? null,
    _info: info,
  };
};

/**
 * Parse hàng loạt — trả về array object sạch.
 * @param {object[]} rows
 * @param {object} [formTypeMap]
 * @returns {object[]}
 */
const parseFeedbackRows = (rows, formTypeMap = DEFAULT_FORM_TYPE_MAP) =>
  rows.map(r => parseFeedbackRow(r, formTypeMap));

module.exports = {
  parseInfo,
  extractFacility,
  getInfoField,
  parseFeedbackRow,
  parseFeedbackRows,
  DEFAULT_FORM_TYPE_MAP,
};
