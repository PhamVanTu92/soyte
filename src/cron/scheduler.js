const cron = require('node-cron');
const { crawlAndSaveData } = require('../services/crawler.service');

/**
 * Khởi tạo các cron job của ứng dụng.
 * Hiện tại chỉ có job crawl lịch công tác.
 */
const initCronJobs = () => {
  // Lịch chạy: 06:00 mỗi ngày
  // Cú pháp: phút giờ ngày tháng thứ
  const cronExpression = '0 6 * * *';  
  cron.schedule(cronExpression, async () => {
    console.log('CRON: Bắt đầu chạy tác vụ crawl lịch công tác theo lịch...');
    await crawlAndSaveData();
    console.log('CRON: Đã hoàn thành tác vụ crawl.');
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  }); 

  // Chạy ngay một lần khi server khởi động để đảm bảo có dữ liệu
  crawlAndSaveData(); 
};

module.exports = { initCronJobs };
