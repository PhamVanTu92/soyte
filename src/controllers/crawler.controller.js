const { WorkSchedule } = require('../models');
const { success, error } = require('../utils/apiResponse');

/**
 * Lấy tất cả lịch công tác đã được crawl (từ bảng work_schedules) có hỗ trợ phân trang
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCrawledSchedules = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await WorkSchedule.findAndCountAll({
      where: {
        created_by: 1 // Chỉ lấy các lịch do hệ thống crawl tạo ra
      },
      order: [
        ['start_time', 'DESC'] // Sắp xếp theo thời gian bắt đầu
      ],
      limit: limit,
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    const meta = {
      totalItems: count,
      totalPages: totalPages,
      currentPage: page,
      itemsPerPage: limit
    };

    return success(res, rows, 'Lấy dữ liệu lịch công tác đã crawl thành công.', 200, meta);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCrawledSchedules,
};
