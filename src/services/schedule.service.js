const { Op } = require('sequelize');
const { sequelize, WorkSchedule, User, ScheduleAttachment } = require('../models');
const { parseSafeDate, getDateRange } = require('../utils/dateUtils');
const fs = require('fs/promises');
const path = require('path');
const ApiError = require('../utils/ApiError');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');


class ScheduleService {
    /**
     * Lấy danh sách lịch công tác với bộ lọc
     * @param {object} query - Query params từ request
     */
    async getAllSchedules(query) {
        const { start_date, end_date, leader_id, status, priority, keyword, page = 1, limit = 10 } = query;
        const whereClause = {};
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const range = getDateRange(start_date, end_date);
        if (range) {
            if (range[0] && range[1]) {
                whereClause.start_time = { [Op.between]: range };
            } else if (range[0]) {
                whereClause.start_time = { [Op.gte]: range[0] };
            } else if (range[1]) {
                whereClause.start_time = { [Op.lte]: range[1] };
            }
        }
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        const andConditions = [];

        if (keyword) {
            andConditions.push({
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { location: { [Op.like]: `%${keyword}%` } },
                    { content: { [Op.like]: `%${keyword}%` } },
                ],
            });
        }

        if (leader_id) {
            andConditions.push({ presider_id: leader_id });
        }

        if (andConditions.length > 0) {
            whereClause[Op.and] = andConditions;
        }

        const includeOptions = [
            { model: User, as: 'attendees', attributes: ['id', 'full_name'], through: { attributes: [] } },
            { model: User, as: 'presider', attributes: ['id', 'full_name'] },
            { model: ScheduleAttachment, as: 'attachments', attributes: ['id', 'file_name', 'file_path'] }
        ];

        const { count, rows } = await WorkSchedule.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            limit: parseInt(limit, 10),
            offset: offset,
            distinct: true,
            order: [['start_time', 'ASC']],
        });

        return {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            schedules: rows,
        };
    }

    async getScheduleById(id) {
        const schedule = await WorkSchedule.findByPk(id, {
             include: [
                { model: User, as: 'creator', attributes: ['id', 'full_name'] },
                { model: User, as: 'approver', attributes: ['id', 'full_name'] },
                { model: User, as: 'presider', attributes: ['id', 'full_name'] },
                { model: User, as: 'attendees', attributes: ['id', 'full_name'], through: { attributes: [] } },
                { model: ScheduleAttachment, as: 'attachments' }
            ],
        });
        if (!schedule) throw new ApiError(404, 'Lịch công tác không tồn tại.');
        return schedule;
    }
    
    async createSchedule(data, createdById) {
        const t = await sequelize.transaction();
        try {
            const { attendee_ids, ...scheduleData } = data;
            const newSchedule = await WorkSchedule.create({
                ...scheduleData,
                created_by: createdById,
                status: 'DRAFT',
            }, { transaction: t });

            if (attendee_ids && attendee_ids.length > 0) {
                await newSchedule.setAttendees(attendee_ids, { transaction: t });
            }

            await t.commit();
            return this.getScheduleById(newSchedule.id);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
    
    async updateSchedule(id, data, currentUser) {
        const schedule = await this.getScheduleById(id);
        if (schedule.status !== 'DRAFT' && currentUser.role !== 'admin') {
            throw new ApiError(403, 'Không thể cập nhật lịch khi không ở trạng thái DỰ THẢO.');
        }

        const t = await sequelize.transaction();
        try {
            const { attendee_ids, ...scheduleData } = data;
            await schedule.update(scheduleData, { transaction: t });

            if (typeof attendee_ids !== 'undefined') {
                await schedule.setAttendees(attendee_ids, { transaction: t });
            }
            
            await t.commit();
            return this.getScheduleById(id);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
    
    async deleteSchedule(id) {
        const schedule = await WorkSchedule.findByPk(id, { include: 'attachments' });
        if (!schedule) throw new ApiError(404, 'Lịch công tác không tồn tại.');

        // Delete physical files first
        for (const attachment of schedule.attachments) {
            try {
                await fs.unlink(path.resolve(attachment.file_path));
            } catch (err) {
                console.error(`Failed to delete file: ${attachment.file_path}`, err);
            }
        }
        // DB record deletion is handled by `onDelete: 'CASCADE'` in the model association
        await schedule.destroy();
        return true;
    }

    async approveSchedule(id, approvedById) {
        const schedule = await this.getScheduleById(id);
        schedule.status = 'APPROVED';
        schedule.approved_by = approvedById;
        await schedule.save();
        return schedule;
    }

    async cancelSchedule(id) {
        const schedule = await this.getScheduleById(id);
        schedule.status = 'CANCELLED';
        await schedule.save();
        return schedule;
    }

    async addAttachment(scheduleId, fileData) {
        if (!fileData) throw new ApiError(400, 'Chưa tải lên tệp tin.');

        const schedule = await WorkSchedule.findByPk(scheduleId);
        if (!schedule) {
            // Delete the uploaded file if schedule doesn't exist
            await fs.unlink(path.resolve(fileData.path));
            throw new ApiError(404, 'Lịch công tác không tồn tại.');
        }
        
        const attachment = await ScheduleAttachment.create({
            schedule_id: scheduleId,
            file_name: Buffer.from(fileData.originalname, 'latin1').toString('utf8'),
            file_path: fileData.path,
            file_type: fileData.mimetype,
        });

        return attachment;
    }

    async deleteAttachment(attachmentId) {
        const attachment = await ScheduleAttachment.findByPk(attachmentId);
        if (!attachment) throw new ApiError(404, 'Tệp đính kèm không tồn tại.');

        try {
            await fs.unlink(path.resolve(attachment.file_path));
        } catch (err) {
            console.error(`Failed to delete file: ${attachment.file_path}`, err);
        }
        
        await attachment.destroy();
        return true;
    }
    
    async getLeaders() {
        return User.findAll({ where: { role: 'LEADER' }, attributes: ['id', 'full_name'] });
    }

    async exportSchedulesExcel(query) {
        const exportLimit = parseInt(process.env.EXPORT_MAX_ROWS || '5000', 10);
        const { schedules } = await this.getAllSchedules({ ...query, limit: exportLimit, page: 1 });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Lich Cong Tac');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Tiêu đề', key: 'title', width: 40 },
            { header: 'Thời gian bắt đầu', key: 'start_time', width: 20 },
            { header: 'Chủ trì', key: 'presider', width: 25 },
            { header: 'Tình trạng', key: 'status', width: 15 },
        ];
        
        schedules.forEach(s => {
            worksheet.addRow({
                id: s.id,
                title: s.title,
                start_time: s.start_time,
                presider: s.presider ? s.presider.full_name : 'N/A',
                status: s.status,
            });
        });
        
        return workbook.xlsx.writeBuffer();
    }
    
    async exportSchedulesPdf(query) {
        const exportLimit = parseInt(process.env.EXPORT_MAX_ROWS || '5000', 10);
        const { schedules } = await this.getAllSchedules({ ...query, limit: exportLimit, page: 1 });
        const doc = new PDFDocument({ margin: 50 });
        
        // This is a placeholder. Real PDF generation would require more complex formatting.
        doc.fontSize(18).text('Danh sách Lịch công tác', { align: 'center' });
        doc.moveDown();

        schedules.forEach(s => {
            doc.fontSize(12).text(`- ${s.title} (${s.start_time.toLocaleString()}) - Trạng thái: ${s.status}`);
            doc.moveDown(0.5);
        });
        
        doc.end();
        return doc;
    }
}

module.exports = new ScheduleService();
