/**
 * Trả về một đối tượng Date nếu chuỗi hợp lệ, ngược lại trả về null
 * @param {string|Date} dateVal 
 * @returns {Date|null}
 */
const parseSafeDate = (dateVal) => {
  if (!dateVal) return null;
  const date = new Date(dateVal);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Tạo khoảng thời gian bắt đầu từ 00:00:00 đến 23:59:59 cho tìm kiếm
 * @param {string} startDateStr 
 * @param {string} endDateStr 
 * @returns {Date[]|null}
 */
const getDateRange = (startDateStr, endDateStr) => {
  const start = parseSafeDate(startDateStr);
  const end = parseSafeDate(endDateStr);

  if (!start && !end) return null;

  const resultStart = start ? new Date(start) : null;
  const resultEnd = end ? new Date(end) : null;

  if (resultStart) resultStart.setHours(0, 0, 0, 0);
  if (resultEnd) resultEnd.setHours(23, 59, 59, 999);

  return [resultStart, resultEnd];
};

module.exports = {
  parseSafeDate,
  getDateRange
};
