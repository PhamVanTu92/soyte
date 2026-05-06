const db = require('../models');
const sequelize = require('../config/database');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const { getDateRange } = require('../utils/dateUtils');

/**
 * Internal helper to extract unit information from feedback info.
 */
const getUnitFromInfo = (info) => {
  if (!info) return null;
  let data = info;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { return null; }
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    for (const k in data) {
      if (k === 'title' || k === 'description') continue;
      const item = data[k];
      if (item && item.value) {
        if (typeof item.value === 'object' && item.value.key && item.value.value && typeof item.value.key === 'string' && isNaN(Number(item.value.key))) {
          return { unitName: item.value.value, unitKey: item.value.key };
        }
        if (item.key && item.value && typeof item.key === 'string' && isNaN(Number(item.key)) && typeof item.value === 'string') {
          return { unitName: item.value, unitKey: item.key };
        }
      }
    }
  } else if (Array.isArray(data)) {
    const unitItem = data.find(i => {
      const name = (i.name || '').toLowerCase();
      const label = (i.label || '').toLowerCase();
      return name.includes('đơn vị') || name === 'unit' || label.includes('đơn vị') || label === 'unit';
    });

    if (unitItem && unitItem.value) {
      if (typeof unitItem.value === 'object' && unitItem.value.value) {
        return { unitName: unitItem.value.value, unitKey: unitItem.value.key || unitItem.value.value };
      } else {
        return { unitName: unitItem.value, unitKey: unitItem.value };
      }
    }
  }
  return null;
};

/**
 * Create a new feedback using a transaction and nested creation.
 */
const createFeedback = async (feedbackData) => {
  const { form_id, creator_name, info, type, submission_data, user_id } = feedbackData;
  let { survey_key, status } = feedbackData;

  if (!survey_key) {
    const activeSurvey = await db.Survey.findOne({
      where: { status: true, type },
      order: [['created_at', 'DESC']],
    });

    if (!activeSurvey) {
      throw new ApiError(400, 'Không tìm thấy cuộc khảo sát nào đang hoạt động. Vui lòng thử lại sau.');
    }
    survey_key = String(activeSurvey.id);
  }

  const unitInfo = getUnitFromInfo(info);
  if (unitInfo && unitInfo.unitKey && unitInfo.unitKey !== 'unknown') {
    const realFacility = await db.SocialFacility.findByPk(unitInfo.unitKey);

    if (realFacility) {
      const surveyFeedbacks = await db.Feedback.findAll({
        where: { survey_key: String(survey_key) },
        attributes: ['id', 'info']
      });

      let duplicate = surveyFeedbacks.find(f => {
        const existingUnit = getUnitFromInfo(f.info);
        return existingUnit && existingUnit.unitKey === unitInfo.unitKey;
      });
      if (type == 'evaluate') {
        duplicate = false;
      }
      if (duplicate) {
        throw new ApiError(400, `Đơn vị "${unitInfo.unitName}" đã gửi phản hồi cho cuộc khảo sát này rồi.`);
      }
    }
  }

  if (user_id) {
    status = 'approved';
  }

  const sectionsToCreate = submission_data.map(section => ({
    name: section.name,
    option: (section.options || section.option || []).map(opt => ({
      tiendo: opt.progress ? opt.progress.value : opt.tiendo,
      danhgia: opt.rating ? opt.rating.value : opt.danhgia,
      ghichu: opt.note || opt.ghichu,
      data: opt
    })),
  }));

  const result = await sequelize.transaction(async (t) => {
    const newFeedback = await db.Feedback.create({
      form_id,
      creator_name,
      info,
      type,
      status,
      user_id,
      survey_key,
      sections: sectionsToCreate,
    }, {
      include: [{
        model: db.FeedbackSection,
        as: 'sections',
        include: [{
          model: db.FeedbackOption,
          as: 'option',
        }],
      }],
      transaction: t,
    });

    return newFeedback;
  });

  return result;
};

const formatFeedbackResponse = (feedback) => {
  if (!feedback) return null;
  const json = feedback.toJSON();
  if (json.sections) {
    json.sections = json.sections.map(section => {
      if (section.option) {
        section.option = section.option.map(opt => {
          const { data, ...rest } = opt;
          return {
            ...rest,
            ...(data || {})
          };
        });
      }
      return section;
    });
  }
  return json;
};

const MAX_LIST_LIMIT = 100;

const getFeedbacks = async (queryOptions) => {
  const page = parseInt(queryOptions.page, 10) || 1;
  const limit = Math.min(parseInt(queryOptions.limit, 10) || 10, MAX_LIST_LIMIT);
  const offset = (page - 1) * limit;

  let { type, startDate, endDate, report_type, unit, unit_id, unit_type } = queryOptions;

  let unitKeys = null;
  let typeIds = null;

  if (unit || unit_id) {
    const rawUnits = unit || unit_id;
    unitKeys = Array.isArray(rawUnits) ? rawUnits.map(String) : String(rawUnits).split(',').map(s => s.trim());
  }

  if (unit_type) {
    const facilitiesOfType = await db.SocialFacility.findAll({
      where: { type: unit_type },
      attributes: ['id']
    });
    typeIds = facilitiesOfType.map(f => String(f.id));
  }

  const needsJsFilter = typeIds !== null && unitKeys === null;
  if (!type && report_type) {
    if (report_type == 1 || report_type == 3) type = 'reflect';
    else if (report_type == 2) type = 'evaluate';
  }
  const where = {
    survey_key: { [Op.ne]: null }
  };
  if (type) {
    where.type = type;
  }
  if (queryOptions.survey_key) {
    where.survey_key = { [Op.in]: Array.isArray(queryOptions.survey_key) ? queryOptions.survey_key : queryOptions.survey_key.split(',') };
  }

  if (unitKeys && unitKeys.length > 0) {
    const safeLike = unitKeys
      .map(key => key.replace(/'/g, "''"))
      .map(key => `[info] LIKE N'%${key}%'`)
      .join(' OR ');
    where[Op.and] = sequelize.literal(`(${safeLike})`);
  }

  try {
    const range = getDateRange(startDate, endDate);
    if (range) {
      if (range[0] && range[1]) {
        where.created_at = { [Op.between]: range };
      } else if (range[0]) {
        where.created_at = { [Op.gte]: range[0] };
      } else if (range[1]) {
        where.created_at = { [Op.lte]: range[1] };
      }
    }
  } catch (e) {}

  const listAttributes = ['id', 'form_id', 'creator_name', 'type', 'status', 'survey_key', 'info', 'user_id', 'created_at'];

  if (needsJsFilter) {
    const UNIT_FILTER_MAX_FETCH = parseInt(process.env.UNIT_FILTER_MAX_FETCH || '5000', 10);

    const allRows = await db.Feedback.findAll({
      where,
      attributes: listAttributes,
      order: [['created_at', 'DESC']],
      limit: UNIT_FILTER_MAX_FETCH,
    });

    const filteredRows = allRows.filter(row => {
      const unitInfo = getUnitFromInfo(row.info);
      if (!unitInfo) return false;

      if (typeIds) {
        const matchType = typeIds.includes(String(unitInfo.unitKey)) || typeIds.includes(String(unitInfo.unitName));
        if (!matchType) return false;
      }

      return true;
    });

    const count = filteredRows.length;
    const paginatedRows = filteredRows.slice(offset, offset + limit);

    return {
      items: paginatedRows.map(row => row.toJSON()),
      total: count,
      page,
      limit,
    };
  }

  const { count, rows } = await db.Feedback.findAndCountAll({
    where,
    attributes: listAttributes,
    distinct: true,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return {
    items: rows.map(row => row.toJSON()),
    total: count,
    page,
    limit,
  };
};

const getFeedbackById = async (id) => {
  const result = await db.Feedback.findByPk(id, {
    include: [{
      model: db.FeedbackSection,
      as: 'sections',
      include: [{
        model: db.FeedbackOption,
        as: 'option',
      }],
    }],
  });
  if (!result || !result.survey_key) {
    throw new ApiError(404, 'Phản hồi không tồn tại');
  }
  return formatFeedbackResponse(result);
};

/**
 * Get feedback statistics.
 * Strategy:
 *   1. Simple aggregate queries (overview + trend) — nhanh, không JOIN
 *   2. Load feedback IDs matching conditions
 *   3. Load sections+options bằng parallel batches (không dùng JSON_VALUE)
 *   4. Aggregate trong JS — chính xác, xử lý mọi format data
 */
const getFeedbackStats = async (query) => {
  let { startDate, endDate, type, survey_key, report_type } = query;
  if (!type && report_type) {
    if (report_type == 1 || report_type == 3) type = 'reflect';
    else if (report_type == 2) type = 'evaluate';
  }

  const emptyResult = () => ({
    overview: { total: 0, statusCount: 0, averageRating: 0 },
    reflect: {
      tiendo: { daLam: 0, dangLam: 0, chuaLam: 0 },
      danhgia: { dat: 0, khongDat: 0 },
      summary: { totalContent: 0, completedProgress: 0, completedRate: 0, reachedRate: 0, needsFix: 0 },
      bySection: []
    },
    evaluate: { ratingDistribution: { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, star0: 0 } },
    trend: [], summary: [], categories: []
  });

  try {
    // ── Xác định unit keys ────────────────────────────────────
    let unitKeys = null;
    let typeKeys = null;

    if (query.unit || query.unit_id) {
      const raw = query.unit || query.unit_id;
      unitKeys = Array.isArray(raw) ? raw.map(String) : String(raw).split(',').map(s => s.trim());
    }
    if (query.unit_type) {
      const facilitiesOfType = await db.SocialFacility.findAll({
        where: { type: query.unit_type }, attributes: ['id']
      });
      typeKeys = facilitiesOfType.map(f => String(f.id));
    }

    // ── Build WHERE SQL ───────────────────────────────────────
    const conditions = [`f.[survey_key] IS NOT NULL`];
    const replacements = {};

    if (type) { conditions.push(`f.[type] = :type`); replacements.type = type; }
    if (survey_key) {
      const keys = Array.isArray(survey_key) ? survey_key : survey_key.split(',');
      conditions.push(`f.[survey_key] IN (:surveyKeys)`);
      replacements.surveyKeys = keys;
    }
    try {
      const range = getDateRange(startDate, endDate);
      if (range && range[0] && range[1]) {
        conditions.push(`f.[created_at] BETWEEN :dateFrom AND :dateTo`);
        replacements.dateFrom = range[0]; replacements.dateTo = range[1];
      } else if (range && range[0]) {
        conditions.push(`f.[created_at] >= :dateFrom`);
        replacements.dateFrom = range[0];
      } else if (range && range[1]) {
        conditions.push(`f.[created_at] <= :dateTo`);
        replacements.dateTo = range[1];
      }
    } catch (_) {}

    if (unitKeys && unitKeys.length > 0) {
      const likeParts = unitKeys.map(k => k.replace(/'/g, "''")).map(k => `f.[info] LIKE N'%${k}%'`).join(' OR ');
      conditions.push(`(${likeParts})`);
    }

    let whereSQL = conditions.join(' AND ');

    // ── typeKeys (unit_type): load info → JS filter → narrow WHERE ─
    if (typeKeys !== null && !unitKeys) {
      const infoRows = await sequelize.query(
        `SELECT f.[id], f.[info] FROM [feedbacks] f WHERE ${whereSQL}`,
        { replacements, type: sequelize.QueryTypes.SELECT }
      );
      const filteredIds = infoRows
        .filter(row => {
          const parsed = typeof row.info === 'string'
            ? (() => { try { return JSON.parse(row.info); } catch { return null; } })()
            : row.info;
          const unitInfo = getUnitFromInfo(parsed);
          if (!unitInfo) return false;
          return typeKeys.includes(String(unitInfo.unitKey)) || typeKeys.includes(String(unitInfo.unitName));
        })
        .map(row => row.id);

      if (filteredIds.length === 0) return emptyResult();

      whereSQL = `f.[survey_key] IS NOT NULL AND f.[id] IN (:filteredIds)`;
      if (type) whereSQL += ` AND f.[type] = :type`;
      Object.keys(replacements).forEach(k => { if (k !== 'type') delete replacements[k]; });
      replacements.filteredIds = filteredIds;
    }

    // ── STEP 1: Overview + Trend (song song, không JOIN) ─────
    const [overviewRows, trendRows] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN f.[status] = 'approved' THEN 1 ELSE 0 END) AS approved_count
         FROM [feedbacks] f WHERE ${whereSQL}`,
        { replacements, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT CAST(f.[created_at] AS DATE) AS date_val, COUNT(*) AS cnt
         FROM [feedbacks] f WHERE ${whereSQL}
         GROUP BY CAST(f.[created_at] AS DATE) ORDER BY date_val`,
        { replacements, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const total = overviewRows[0]?.total || 0;
    if (total === 0) return emptyResult();
    const approvedCount = overviewRows[0]?.approved_count || 0;

    // ── STEP 2: Lấy feedback IDs + metadata ──────────────────
    const feedbackRows = await sequelize.query(
      `SELECT f.[id], f.[form_id], f.[type], f.[status], f.[created_at]
       FROM [feedbacks] f WHERE ${whereSQL} ORDER BY f.[id]`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    if (feedbackRows.length === 0) return emptyResult();

    const feedbackIds = feedbackRows.map(r => r.id);

    // ── STEP 3: Load sections+options bằng parallel batches ──
    // Mỗi batch 500 IDs, tối đa 8 batches chạy song song
    const BATCH_SIZE = 500;
    const CONCURRENCY = 8;
    const allSectionRows = [];

    for (let i = 0; i < feedbackIds.length; i += BATCH_SIZE * CONCURRENCY) {
      const batchPromises = [];
      for (let j = i; j < Math.min(i + BATCH_SIZE * CONCURRENCY, feedbackIds.length); j += BATCH_SIZE) {
        const batch = feedbackIds.slice(j, j + BATCH_SIZE);
        batchPromises.push(
          sequelize.query(
            `SELECT fs.[feedback_id], fs.[name] AS s_name,
                    fo.[tiendo], fo.[danhgia], fo.[data]
             FROM [feedback_sections] fs
             LEFT JOIN [feedback_options] fo ON fo.[feedback_section_id] = fs.[id]
             WHERE fs.[feedback_id] IN (:ids)`,
            { replacements: { ids: batch }, type: sequelize.QueryTypes.SELECT }
          )
        );
      }
      const results = await Promise.all(batchPromises);
      results.forEach(r => allSectionRows.push(...r));
    }

    // ── STEP 4: Aggregate trong JS ───────────────────────────
    // Group section rows by feedback_id
    const fbSectionsMap = new Map();
    for (const row of allSectionRows) {
      if (!fbSectionsMap.has(row.feedback_id)) fbSectionsMap.set(row.feedback_id, []);
      fbSectionsMap.get(row.feedback_id).push(row);
    }

    // Counters
    let rt3 = 0, rt2 = 0, rt1 = 0, rDat = 0, rKhong = 0;
    const reflectBySec = new Map();
    let totalStar = 0, totalStarCount = 0;
    const ratingDist = { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, star0: 0 };
    const formStats = {};
    const trendMap = {};

    for (const fb of feedbackRows) {
      const sRows = fbSectionsMap.get(fb.id) || [];

      // Group options by section name
      const secNameMap = new Map();
      for (const row of sRows) {
        if (!secNameMap.has(row.s_name)) secNameMap.set(row.s_name, []);
        secNameMap.get(row.s_name).push(row);
      }

      const fbDate = new Date(fb.created_at);
      const monthYear = String(fbDate.getMonth() + 1).padStart(2, '0') + '-' + fbDate.getFullYear();
      const dateStr = String(fbDate.getDate()).padStart(2, '0') + '/' + String(fbDate.getMonth() + 1).padStart(2, '0');
      trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;

      for (const [sName, opts] of secNameMap) {
        for (const o of opts) {
          if (fb.type === 'reflect') {
            const t = o.tiendo, dv = o.danhgia;
            if (t == 3) rt3++; else if (t == 2) rt2++; else if (t == 1) rt1++;
            if (dv == 1) rDat++; else if (dv == 2) rKhong++;

            if (!reflectBySec.has(sName)) {
              reflectBySec.set(sName, {
                name: sName,
                tiendo: { daLam: 0, dangLam: 0, chuaLam: 0 },
                danhgia: { dat: 0, khongDat: 0 },
                total: 0
              });
            }
            const sec = reflectBySec.get(sName);
            if (t == 3) sec.tiendo.daLam++; else if (t == 2) sec.tiendo.dangLam++; else if (t == 1) sec.tiendo.chuaLam++;
            if (dv == 1) sec.danhgia.dat++; else if (dv == 2) sec.danhgia.khongDat++;
            sec.total++;

          } else if (fb.type === 'evaluate') {
            // Parse data JSON (stored as string in MSSQL)
            const optData = (() => {
              try { return typeof o.data === 'string' ? JSON.parse(o.data) : (o.data || {}); }
              catch { return {}; }
            })();

            let star = null;
            if (optData.ratingVote && optData.ratingVote.value !== undefined && optData.ratingVote.value >= 0) {
              star = optData.ratingVote.value;
            } else if (optData.answerValue !== undefined && !isNaN(Number(optData.answerValue))) {
              const v = Number(optData.answerValue);
              if (v >= 0) star = Math.round(v);
            }

            if (star !== null && star >= 0 && star <= 5) {
              ratingDist[`star${star}`]++;
              totalStar += star;
              totalStarCount++;

              if (!formStats[fb.form_id]) formStats[fb.form_id] = { _overall: {} };
              if (!formStats[fb.form_id]._overall[monthYear]) formStats[fb.form_id]._overall[monthYear] = { sum: 0, count: 0 };
              formStats[fb.form_id]._overall[monthYear].sum += star;
              formStats[fb.form_id]._overall[monthYear].count++;

              if (!formStats[fb.form_id][sName]) formStats[fb.form_id][sName] = {};
              if (!formStats[fb.form_id][sName][monthYear]) formStats[fb.form_id][sName][monthYear] = { sum: 0, count: 0 };
              formStats[fb.form_id][sName][monthYear].sum += star;
              formStats[fb.form_id][sName][monthYear].count++;
            }
          }
        }
      }
    }

    // ── Build result ──────────────────────────────────────────
    const result = {
      overview: { total, statusCount: approvedCount, averageRating: 0 },
      reflect: {
        tiendo: { daLam: rt3, dangLam: rt2, chuaLam: rt1 },
        danhgia: { dat: rDat, khongDat: rKhong },
        summary: {},
        bySection: [...reflectBySec.values()]
      },
      evaluate: { ratingDistribution: ratingDist },
      trend: [], summary: [], categories: []
    };

    // Reflect summary
    const reflectTotal = rt3 + rt2 + rt1;
    result.reflect.summary = {
      totalContent: reflectTotal,
      completedProgress: rt3,
      completedRate: reflectTotal > 0 ? parseFloat(((rt3 / reflectTotal) * 100).toFixed(1)) : 0,
      reachedRate: reflectTotal > 0 ? parseFloat(((rDat / reflectTotal) * 100).toFixed(1)) : 0,
      needsFix: rKhong
    };

    // Average rating
    result.overview.averageRating = totalStarCount > 0 ? parseFloat((totalStar / totalStarCount).toFixed(1)) : 0;

    // Trend (từ trendMap để giữ đúng thứ tự ngày)
    result.trend = trendRows.map(r => {
      const d = new Date(r.date_val);
      return {
        date: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
        count: r.cnt
      };
    });

    // Load form names
    const formIdSet = Object.keys(formStats).map(Number);
    let formMap = {};
    if (formIdSet.length > 0) {
      const forms = await db.Form.findAll({ where: { id: { [Op.in]: formIdSet } }, attributes: ['id', 'name'] });
      formMap = forms.reduce((acc, f) => ({ ...acc, [f.id]: f.name }), {});
    }

    // Categories: 12 tháng gần nhất
    const categories = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      categories.push(String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear());
    }
    result.categories = categories;

    // Summary: per-form chart data với section series
    result.summary = Object.entries(formStats).map(([formId, sectionData]) => {
      const sectionNames = Object.keys(sectionData).filter(k => k !== '_overall');
      return {
        id: parseInt(formId),
        name: formMap[formId] || 'Biểu mẫu không xác định',
        series: [
          {
            name: 'Điểm hài lòng chung',
            data: categories.map(m => {
              const d = sectionData._overall[m];
              return d && d.count > 0 ? parseFloat((d.sum / d.count).toFixed(2)) : 0;
            })
          },
          ...sectionNames.map(sName => ({
            name: sName,
            data: categories.map(m => {
              const d = sectionData[sName][m];
              return d && d.count > 0 ? parseFloat((d.sum / d.count).toFixed(2)) : 0;
            })
          }))
        ]
      };
    });

    return result;
  } catch (error) {
    console.error('[getFeedbackStats] ERROR:', error.message, error.original?.message || '');
    throw error;
  }
};

/**
 * Internal helper to calculate bySection statistics for a list of feedbacks.
 */
const calculateBySectionStats = (feedbacks) => {
  const bySection = [];
  feedbacks.forEach((f) => {
    if (f.sections) {
      f.sections.forEach((s) => {
        let sectionItem = bySection.find((item) => item.name === s.name);
        if (!sectionItem) {
          sectionItem = {
            name: s.name,
            tiendo: { daLam: 0, dangLam: 0, chuaLam: 0 },
            danhgia: { dat: 0, khongDat: 0 },
            total: 0,
            _sumRating: 0,
            _ratingCount: 0,
          };
          bySection.push(sectionItem);
        }

        if (s.option) {
          s.option.forEach((o) => {
            if (f.type === 'reflect') {
              if (o.tiendo == 3) sectionItem.tiendo.daLam++;
              else if (o.tiendo == 2) sectionItem.tiendo.dangLam++;
              else if (o.tiendo == 1) sectionItem.tiendo.chuaLam++;

              if (o.danhgia == 2) sectionItem.danhgia.khongDat++;
              else if (o.danhgia == 1) sectionItem.danhgia.dat++;

              sectionItem.total++;
            } else if (f.type === 'evaluate') {
              const optData = o.data || {};
              let star = null;
              if (optData.ratingVote && optData.ratingVote.value !== undefined) {
                star = optData.ratingVote.value;
              } else if (optData.answerValue !== undefined && !isNaN(optData.answerValue)) {
                star = parseInt(optData.answerValue);
              }

              if (star !== null && star >= 0 && star <= 5) {
                sectionItem._sumRating += star;
                sectionItem._ratingCount++;
                sectionItem.total++;
              }
            }
          });
        }
      });
    }
  });

  return bySection.map((item) => {
    const { _sumRating, _ratingCount, ...rest } = item;
    if (_ratingCount > 0) {
      rest.averageRating = parseFloat((_sumRating / _ratingCount).toFixed(2));
      rest.ratingCount = _ratingCount;
    }
    return rest;
  });
};

/**
 * Get feedback comparison between current and previous survey, grouped by unit.
 */
const getFeedbackComparison = async (query) => {
  let { survey_key, startDate, endDate, type, report_type, unit, unit_id, unit_type } = query;
  let allowedUnitIds = null;

  if (unit || unit_id || unit_type) {
    if (unit || unit_id) {
      const rawUnits = unit || unit_id;
      allowedUnitIds = Array.isArray(rawUnits) ? rawUnits.map(String) : String(rawUnits).split(',').map(s => s.trim());
    }
    if (unit_type) {
      const facilitiesOfType = await db.SocialFacility.findAll({
        where: { type: unit_type },
        attributes: ['id']
      });
      const idsOfType = facilitiesOfType.map(f => String(f.id));
      if (allowedUnitIds) {
        allowedUnitIds = allowedUnitIds.filter(id => idsOfType.includes(id));
      } else {
        allowedUnitIds = idsOfType;
      }
      if (!allowedUnitIds) allowedUnitIds = [];
    }
  }

  if (!type && report_type) {
    if (report_type == 1 || report_type == 3) type = 'reflect';
    else if (report_type == 2) type = 'evaluate';
  }

  let currentSurvey;
  if (survey_key) {
    currentSurvey = await db.Survey.findByPk(survey_key);
  } else if (type) {
    currentSurvey = await db.Survey.findOne({
      where: { type },
      order: [['created_at', 'DESC']]
    });
  } else {
    throw new ApiError(400, 'Cần có survey_key hoặc type để so sánh');
  }

  if (!currentSurvey) {
    throw new ApiError(404, 'Không tìm thấy cuộc khảo sát hiện tại');
  }

  survey_key = String(currentSurvey.id);

  const previousSurvey = await db.Survey.findOne({
    where: {
      type: currentSurvey.type,
      status: false,
      created_at: { [Op.lt]: currentSurvey.created_at },
      id: { [Op.ne]: currentSurvey.id }
    },
    order: [['created_at', 'DESC']]
  });

  const fetchAndGroupStats = async (sKey) => {
    if (!sKey) return null;

    const where = { survey_key: String(sKey) };
    if (type) where.type = type;

    try {
      const range = getDateRange(startDate, endDate);
      if (range) {
        if (range[0] && range[1]) where.created_at = { [Op.between]: range };
        else if (range[0]) where.created_at = { [Op.gte]: range[0] };
        else if (range[1]) where.created_at = { [Op.lte]: range[1] };
      }
    } catch (e) {}

    const feedbacks = await db.Feedback.findAll({
      where,
      include: [
        {
          model: db.FeedbackSection,
          as: 'sections',
          include: [{ model: db.FeedbackOption, as: 'option' }],
        },
      ],
    });

    const grouped = {};
    feedbacks.forEach(f => {
      const unitInfo = getUnitFromInfo(f.info) || { unitName: 'Khác', unitKey: 'unknown' };
      const { unitName, unitKey } = unitInfo;

      if (allowedUnitIds && !allowedUnitIds.includes(String(unitKey)) && !allowedUnitIds.includes(String(unitName))) {
        return;
      }

      if (!grouped[unitKey]) {
        grouped[unitKey] = { unitName, unitKey, feedbacks: [], form_id: f.form_id };
      }
      grouped[unitKey].feedbacks.push(f);
    });

    return Object.values(grouped).map(group => ({
      unit: group.unitName,
      unitKey: group.unitKey,
      form_id: group.form_id,
      bySection: calculateBySectionStats(group.feedbacks)
    }));
  };

  const current = await fetchAndGroupStats(survey_key);
  const previous = previousSurvey ? await fetchAndGroupStats(previousSurvey.id) : null;

  return {
    current,
    previous,
    currentSurvey,
    previousSurvey: previousSurvey || null
  };
};

const checkUnitSubmission = async (query) => {
  let { unit_id, type, survey_key, form_id, report_type } = query;

  if (!type && report_type) {
    if (report_type == 1 || report_type == 3) type = 'reflect';
    else if (report_type == 2) type = 'evaluate';
  }

  if (!unit_id) {
    throw new ApiError(400, 'id đơn vị là bắt buộc');
  }

  if (!type && form_id) {
    const form = await db.Form.findByPk(form_id);
    if (form) {
      type = form.type;
    }
  }

  let survey;
  if (survey_key) {
    survey = await db.Survey.findByPk(survey_key);
    if (!survey) {
      throw new ApiError(404, 'Không tìm thấy cuộc khảo sát yêu cầu.');
    }
  } else {
    if (!type) {
      throw new ApiError(400, 'Loại khảo sát hoặc ID biểu mẫu là bắt buộc');
    }
    survey = await db.Survey.findOne({
      where: { status: true, type },
      order: [['created_at', 'DESC']],
    });

    if (!survey) {
      throw new ApiError(404, `Không tìm thấy cuộc khảo sát loại "${type}" nào đang hoạt động.`);
    }
  }

  const finalSurveyKey = String(survey.id);

  const facility = await db.SocialFacility.findByPk(unit_id);
  const unitName = facility ? facility.name : unit_id;

  const whereClause = { survey_key: finalSurveyKey };
  if (form_id) whereClause.form_id = form_id;

  const feedbacks = await db.Feedback.findAll({
    where: whereClause,
    attributes: ['info']
  });

  const submission = feedbacks.find(f => {
    const unit = getUnitFromInfo(f.info);
    return unit && String(unit.unitKey) === String(unit_id);
  });

  if (type == 'evaluate') {
    return {};
  }

  if (submission) {
    return {
      success: true,
      message: `Đơn vị "${unitName}" đã tham gia khảo sát`,
      is_submitted: true,
    };
  } else {
    return {
      success: true,
      message: `Đơn vị "${unitName}" chưa tham gia khảo sát`,
      is_submitted: false,
    };
  }
};

const deleteFeedback = async (id) => {
  const result = await db.Feedback.findByPk(id);
  if (!result) {
    throw new ApiError(404, 'Phản hồi không tồn tại');
  }
  await result.destroy();
  return result;
};

module.exports = {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  getFeedbackStats,
  getFeedbackComparison,
  checkUnitSubmission,
  deleteFeedback,
};
