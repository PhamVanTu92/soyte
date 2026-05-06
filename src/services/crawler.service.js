const axios = require('axios');
const cheerio = require('cheerio');
const { WorkSchedule } = require('../models');

const TARGET_URL = 'http://lichcongtac.qnict.vn/sythanoi/';

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
};  

const parseDateTime = (dateString, timeString) => {
  const [day, month, year] = dateString.split('/').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  if (!day || !month || !year || isNaN(hour) || isNaN(minute)) return null;
  
  // Create date in local timezone (Vietnam)
  const date = new Date(year, month - 1, day, hour, minute, 0);
  return isNaN(date.getTime()) ? null : date;
};
 
const fetchPage = async () => {
  const { data: html } = await axios.get(TARGET_URL, { headers: HTTP_HEADERS });
  return cheerio.load(html);
};

/**
 * Lưu schedule nếu chưa tồn tại, trả về true nếu đã lưu mới
 */
const saveIfNotExists = async (scheduleData) => {
  const existing = await WorkSchedule.findOne({
    where: {
      start_time: scheduleData.start_time.toISOString(),
      title: scheduleData.title,
      created_by: 1,
    },
  });

  if (existing) return false;

  await WorkSchedule.create(scheduleData);
  return true;
};

/**
 * Tạo object scheduleData từ các thông tin cơ bản
 */
const buildScheduleData = (title, content, startTime) => ({
  title,
  content,
  start_time: startTime,
  end_time: new Date(startTime.getTime() + 60 * 60 * 1000),
  location: '',
  created_by: 1,
  approved_by: null,
  presider_id: 1,
  status: 'DRAFT',
  priority: 'NORMAL',
});

/**
 * Crawl lịch công tác trong ngày (bảng nổi bật trên trang)
 */
const crawlToDay = async () => {
  console.log('CRON: Crawl lịch hôm nay...');

  const today = new Date();
  const todayFormatted = [
    String(today.getDate()).padStart(2, '0'),
    String(today.getMonth() + 1).padStart(2, '0'),
    today.getFullYear(),
  ].join('/');

  let savedCount = 0;

  try {
    const $ = await fetchPage();
    const rows = $('table[bgcolor="#FFFFFF"] table[width="100%"] tr');

    for (const row of rows) {
      for (const p of $(row).find('p[align="justify"]')) {
        const timeEl = $(p).find('font[color="#FF0000"] b');
        const contentEl = $(p).find('font[color="#006633"]');

        if (!timeEl.length || !contentEl.length) continue;

        const timeClean = timeEl.text().replace(/giờ/g, ':').replace(/\s+/g, '').trim();
        const content = contentEl.text().trim();
        const startTime = parseDateTime(todayFormatted, timeClean);

        if (!content || !startTime) continue;

        const saved = await saveIfNotExists(buildScheduleData(content.substring(0, 50), content, startTime));
        if (saved) savedCount++;
      }
    }
  } catch (err) {
    console.error('CRON [crawlToDay]:', err.message);
  }

  console.log(savedCount > 0 ? `CRON: Bổ sung ${savedCount} lịch mới (hôm nay)` : 'CRON: Không có lịch mới (hôm nay).');
  return savedCount;
};

/**
 * Crawl toàn bộ lịch công tác trong tuần
 */
const crawlAndSaveData = async () => {
  console.log('CRON: Crawl toàn bộ lịch công tác...');

  let savedCount = 0;
  let currentDate = '';

  try {
    await crawlToDay();

    const $ = await fetchPage();
    const rows = $('table[bgcolor="#FFFFFF"] tr');

    for (const row of rows) {
      const dateHeader = $(row).find('font[color="#0066FF"]');
      const rowText = $(row).text().replace(/\s+/g, ' ').trim();

      if (dateHeader.length) {
        const match = $(row).text().replace(/\s+/g, ' ').trim().match(/ngày\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (match) currentDate = match[1];
        continue;
      }

      if (!currentDate) continue;

      for (const p of $(row).find('p[align="justify"]')) {
        const timeEl = $(p).find('font[color="#FF0000"] b');
        const contentEl = $(p).find('font[color="#660000"]');

        if (!timeEl.length || !contentEl.length) continue;

        const timeClean = timeEl.text().replace(/giờ/g, ':').replace(/\s+/g, '').trim();
        const content = contentEl.text().trim();
        const startTime = parseDateTime(currentDate, timeClean);

        if (!content || !startTime) continue;

        const saved = await saveIfNotExists(buildScheduleData(content.substring(0, 100), content, startTime));
        if (saved) savedCount++;
      }
    }
  } catch (err) {
    console.error('CRON [crawlAndSaveData]:', err.message);
  }

  console.log(savedCount > 0 ? `CRON: Bổ sung ${savedCount} lịch mới` : 'CRON: Không có lịch mới.');
};

module.exports = { crawlAndSaveData, crawlToDay };