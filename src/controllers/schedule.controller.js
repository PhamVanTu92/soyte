const scheduleService = require('../services/schedule.service');
const apiResponse = require('../utils/apiResponse');

class ScheduleController {

    /**
     * @description Lấy danh sách các lịch công tác với khả năng lọc và phân trang.
     * @route GET /api/schedules
     * @param {object} req - Đối tượng request của Express, chứa các query params để lọc.
     * @param {object} res - Đối tượng response của Express.
     */
    async getAllSchedules(req, res, next) {
        try {
            const result = await scheduleService.getAllSchedules(req.query);
            return apiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Lấy chi tiết một lịch công tác duy nhất bằng ID.
     * @route GET /api/schedules/:id
     * @param {object} req - Đối tượng request của Express, chứa ID lịch trong params.
     * @param {object} res - Đối tượng response của Express.
     */
    async getScheduleById(req, res, next) {
        try {
            const schedule = await scheduleService.getScheduleById(req.params.id);
            return apiResponse.success(res, schedule);
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * @description Tạo một lịch công tác mới.
     * @route POST /api/schedules
     * @param {object} req - Đối tượng request của Express, chứa dữ liệu lịch trong body.
     * @param {object} res - Đối tượng response của Express.
     */
    async createSchedule(req, res, next) {
        try {
            const newSchedule = await scheduleService.createSchedule(req.body, req.user.id);
            return apiResponse.created(res, newSchedule);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Cập nhật một lịch công tác hiện có.
     * @route PUT /api/schedules/:id
     * @param {object} req - Đối tượng request của Express, chứa ID lịch trong params và dữ liệu cập nhật trong body.
     * @param {object} res - Đối tượng response của Express.
     */
    async updateSchedule(req, res, next) {
        try {
            const updatedSchedule = await scheduleService.updateSchedule(req.params.id, req.body, req.user);
            return apiResponse.success(res, updatedSchedule);
        } catch (error) {
             next(error);
        }
    }
    
    /**
     * @description Xóa một lịch công tác bằng ID của nó.
     * @route DELETE /api/schedules/:id
     * @param {object} req - Đối tượng request của Express, chứa ID lịch trong params.
     * @param {object} res - Đối tượng response của Express.
     */
    async deleteSchedule(req, res, next) {
        try {
            await scheduleService.deleteSchedule(req.params.id);
            return apiResponse.success(res, null, 'Đã xóa lịch thành công.');
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Phê duyệt một lịch công tác.
     * @route PATCH /api/schedules/:id/approve
     * @param {object} req - Đối tượng request của Express, chứa ID lịch trong params.
     * @param {object} res - Đối tượng response của Express.
     */
    async approveSchedule(req, res, next) {
        try {
            const schedule = await scheduleService.approveSchedule(req.params.id, req.user.id);
            return apiResponse.success(res, schedule, 'Lịch đã được phê duyệt.');
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Hủy một lịch công tác.
     * @route PATCH /api/schedules/:id/cancel
     * @param {object} req - Đối tượng request của Express, chứa ID lịch trong params.
     * @param {object} res - Đối tượng response của Express.
     */
    async cancelSchedule(req, res, next) {
        try {
            const schedule = await scheduleService.cancelSchedule(req.params.id);
            return apiResponse.success(res, schedule, 'Lịch đã được hủy.');
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Thêm một tệp đính kèm vào lịch công tác.
     * @route POST /api/schedules/:id/attachments
     * @param {object} req - Đối tượng request của Express, với ID lịch trong params và tệp trong req.file.
     * @param {object} res - Đối tượng response của Express.
     */
    async addAttachment(req, res, next) {
        try {
            const attachment = await scheduleService.addAttachment(req.params.id, req.file);
            return apiResponse.created(res, attachment);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Xóa một tệp đính kèm bằng ID của nó.
     * @route DELETE /api/attachments/:id
     * @param {object} req - Đối tượng request của Express, chứa ID tệp đính kèm trong params.
     * @param {object} res - Đối tượng response của Express.
     */
    async deleteAttachment(req, res, next) {
        try {
            await scheduleService.deleteAttachment(req.params.id);
            return apiResponse.success(res, null, 'Đã xóa tệp đính kèm thành công.');
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Lấy danh sách tất cả người dùng có vai trò 'LEADER'.
     * @route GET /api/users/leaders
     * @param {object} req - Đối tượng request của Express.
     * @param {object} res - Đối tượng response của Express.
     */
    async getLeaders(req, res, next) {
        try {
            const leaders = await scheduleService.getLeaders();
            return apiResponse.success(res, leaders);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Xuất lịch công tác ra file Excel.
     * @route GET /api/schedules/export/excel
     * @param {object} req - Đối tượng request của Express, với các tùy chọn lọc trong query.
     * @param {object} res - Đối tượng response của Express.
     */
    async exportSchedulesExcel(req, res, next) {
        try {
            const buffer = await scheduleService.exportSchedulesExcel(req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="LichCongTac.xlsx"');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * @description Xuất lịch công tác ra file PDF.
     * @route GET /api/schedules/export/pdf
     * @param {object} req - Đối tượng request của Express, với các tùy chọn lọc trong query.
     * @param {object} res - Đối tượng response của Express.
     */
    async exportSchedulesPdf(req, res, next) {
        try {
            const stream = await scheduleService.exportSchedulesPdf(req.query);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="LichCongTac.pdf"');
            stream.pipe(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ScheduleController();
