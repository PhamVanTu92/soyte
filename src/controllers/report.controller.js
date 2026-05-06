const reportService = require('../services/report.service');
const ApiError = require('../utils/ApiError');

const getReportDCBC = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await reportService.getReportDCBC(queryParams);
    res.status(200).json({ success: true, message: 'Lấy dữ liệu báo cáo DCBC thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const getReportTCT01 = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await reportService.getReportTCT01(queryParams);
    res.status(200).json({ success: true, message: 'Lấy dữ liệu báo cáo TCT01 thành công', data: result });
  } catch (error) {
    next(error);
  }
};

const getReportKSHL = async (req, res, next) => {
  try {
    const queryParams = { ...req.query, ...req.body };
    const result = await reportService.getReportKSHL(queryParams);
    res.status(200).json({ success: true, message: 'Lấy dữ liệu báo cáo KSHL thành công', data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportDCBC,
  getReportTCT01,
  getReportKSHL,
};
