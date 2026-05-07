const db = require('../models');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getDateRange } = require('../utils/dateUtils');
const { parseFeedbackRow, parseInfo, extractFacility } = require('../utils/feedbackParser');

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

const formatFeedbackResponse = (feedback) => {
  if (!feedback) return null;
  const json = feedback.toJSON ? feedback.toJSON() : feedback;
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

const fetchAllFeedbacksForReport = async (queryOptions, type) => {
  let { startDate, endDate, survey_key, unit, unit_id, unit_type } = queryOptions;
  
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

  const where = { type };
  if (survey_key) {
      where.survey_key = { [Op.in]: Array.isArray(survey_key) ? survey_key : survey_key.split(',') };
  }

  try {
    const range = getDateRange(startDate, endDate);
    if (range) {
      if (range[0] && range[1]) where.created_at = { [Op.between]: range };
      else if (range[0]) where.created_at = { [Op.gte]: range[0] };
      else if (range[1]) where.created_at = { [Op.lte]: range[1] };
    }
  } catch (e) {
    // Ignore date issues
  }

  const allRows = await db.Feedback.findAll({
    where,
    order: [['created_at', 'ASC']], 
    attributes: ['id', 'info', 'form_id', 'user_id', 'created_at', 'type', 'survey_key'],
    include: [{
      model: db.FeedbackSection,
      as: 'sections',
      attributes: ['id'],
      include: [{ model: db.FeedbackOption, as: 'option', attributes: ['data'] }],
    }],
  });

  if (allowedUnitIds !== null) {
    return allRows.filter(row => {
      const unitInfo = getUnitFromInfo(row.info);
      const facId = row.facility_id || (unitInfo ? unitInfo.unitKey : null);
      if (!facId) return false;
      return allowedUnitIds.includes(String(facId)) || (unitInfo && allowedUnitIds.includes(String(unitInfo.unitName)));
    });
  }
  
  return allRows;
};

const getReportDCBC = async (query) => {
    const feedbacks = await fetchAllFeedbacksForReport(query, 'reflect');
    
    // Group by form_id and deduplicate by unitKey (keep latest)
    const formUnitMap = {
        "3": {}, "17": {}, "18": {}
    };
    
    const titles = {
        "3": "Khối các bệnh viện trực thuộc",
        "17": "Đơn vị trợ giúp xã hội trực thuộc",
        "18": "Khối các trạm y tế xã, phường"
    };

    feedbacks.forEach(fb => {
        const fId = String(fb.form_id || "unknown");
        
        // Chỉ xử lý các form 3, 17, 18
        if (["3", "17", "18"].includes(fId)) {
            let unitKey = null;
            const unitInfo = getUnitFromInfo(fb.info);
            if (unitInfo && unitInfo.unitKey && unitInfo.unitKey !== 'unknown') {
                unitKey = unitInfo.unitKey;
            } else {
                unitKey = fb.facility_id || fb.info?.facility_id;
                if (!unitKey && fb.info) {
                   const candidateKeys = Object.entries(fb.info)
                        .filter(([k]) => !isNaN(Number(k)))
                        .map(([_, v]) => (v && typeof v === 'object' && v.value && typeof v.value === 'object' && v.value.key) ? String(v.value.key) : null)
                        .filter(k => !!k);
                   if (candidateKeys.length > 0) unitKey = candidateKeys[0];
                }
                if (!unitKey) unitKey = `fb-${fb.id}`;
            }
            
            const existing = formUnitMap[fId][unitKey];
            if (!existing) {
                formUnitMap[fId][unitKey] = fb;
            } else {
                const existingDate = new Date(existing.created_at || existing.createdAt || 0);
                const fbDate = new Date(fb.created_at || fb.createdAt || 0);
                if (fbDate > existingDate) {
                    formUnitMap[fId][unitKey] = fb;
                }
            }
        }
    });

    const groupedFeedbacks = {};
    Object.keys(formUnitMap).forEach(fId => {
        const items = Object.values(formUnitMap[fId]).map(fb => formatFeedbackResponse(fb));
        groupedFeedbacks[fId] = {
            title: titles[fId],
            items: items
        };
    });

    return groupedFeedbacks;
};

const getReportTCT01 = async (query) => {
    // API TCT01 sẽ tự động tính toán dữ liệu
    const groupedFeedbacks = await getReportDCBC(query);
    const forms = await db.Form.findAll({ where: { id: ['3', '17', '18'] } });
    const formTemplates = {};
    forms.forEach(f => {
        formTemplates[String(f.id)] = typeof f.template === 'string' ? JSON.parse(f.template) : f.template;
    });

    const userFacilities = await db.SocialFacility.findAll();

    // Helper functions from reportDataUtils
    const getExpectedFacilities = (template, facilities) => {
        if (!template) return [];
        let expected = [];
        if (template.applicableUnits && Array.isArray(template.applicableUnits)) {
            expected = template.applicableUnits;
        } else if (template.applicableUnitTypes && Array.isArray(template.applicableUnitTypes)) {
            const types = template.applicableUnitTypes;
            expected = facilities.filter(f => types.includes(f.type) || types.includes(f.type_id));
        } else {
            expected = facilities;
        }
        const excludedIds = (template.excludedUnits || []).map(u => String(u.id || u));
        expected = expected.filter(f => !excludedIds.includes(String(f.id)));
        return expected;
    };

    const calculateTotalUnits = (template, facilities) => {
        return getExpectedFacilities(template, facilities).length;
    };

    const calculateOnTimeStats = (items, template) => {
        if (!items || !items.length) return { onTimeCount: 0, lateCount: 0 };
        let onTimeCount = 0;
        let lateCount = 0;
        
        let startLimit = null;
        let endLimit = null;
        if (template && (template.startDate || template.endDate)) {
            startLimit = template.startDate ? new Date(template.startDate) : null;
            endLimit = template.endDate ? new Date(template.endDate) : null;
            if (startLimit) startLimit.setHours(0, 0, 0, 0);
            if (endLimit) endLimit.setHours(23, 59, 59, 999);
        }

        items.forEach(item => {
            const submissionDate = new Date(item.createdAt || item.created_at || item.date || Date.now());
            const isAfterStart = !startLimit || submissionDate >= startLimit;
            const isBeforeEnd = !endLimit || submissionDate <= endLimit;
            if (isAfterStart && isBeforeEnd) {
                onTimeCount++;
            } else {
                lateCount++;
            }
        });
        return { onTimeCount, lateCount };
    };

    const formatRate = (count, total) => {
        if (!total || total === 0) return "0%";
        return ((count / total) * 100).toFixed(2) + "%";
    };

    const reportData = {
        benhVien: { title: "Khối các bệnh viện trực thuộc", tongSo: 0, tiepNhan: [], deCuong: [], danhSach: [] },
        troGiupXaHoi: { title: "Đơn vị trợ giúp xã hội trực thuộc", tongSo: 0, tiepNhan: [], deCuong: [], danhSach: [] },
        tramYTe: { title: "Khối các trạm y tế xã, phường", tongSo: 0, tiepNhan: [], deCuong: [], danhSach: [] },
    };

    const categories = [
        { id: "3", key: "benhVien", nhom: "Khối các bệnh viện trực thuộc" },
        { id: "17", key: "troGiupXaHoi", nhom: "Các đơn vị trợ giúp xã hội trực thuộc" },
        { id: "18", key: "tramYTe", nhom: "Khối các trạm y tế xã, phường" },
    ];

    categories.forEach((cat) => {
        const group = groupedFeedbacks[cat.id];
        const items = group?.items || [];
        const template = formTemplates[cat.id];

        const totalUnits = calculateTotalUnits(template, userFacilities);
        const reportedCount = items.length;
        const notReportedCount = Math.max(0, totalUnits - reportedCount);
        const { onTimeCount, lateCount } = calculateOnTimeStats(items, template);

        reportData[cat.key] = {
            title: group?.title || cat.nhom,
            tongSo: totalUnits,
            tiepNhan: [
                { stt: 1, noiDung: "Đơn vị báo cáo", soLuong: reportedCount, tyLe: formatRate(reportedCount, totalUnits) },
                { stt: 2, noiDung: "Đơn vị không báo cáo", soLuong: notReportedCount, tyLe: formatRate(notReportedCount, totalUnits) }
            ],
            deCuong: [
                { stt: 1, noiDung: "Đơn vị báo cáo đúng theo đề cương và biểu mẫu", soLuong: onTimeCount, tyLe: formatRate(onTimeCount, reportedCount) },
                { stt: 2, noiDung: "Đơn vị báo cáo không đúng theo đề cương và biểu mẫu", soLuong: lateCount, tyLe: formatRate(lateCount, reportedCount) }
            ]
        };

        if (reportedCount > 0) {
            const facilityNames = items.map(fb => {
                if (fb.info) {
                    const candidateKeys = Object.entries(fb.info)
                        .filter(([k]) => !isNaN(Number(k)))
                        .map(([_, v]) => (v && typeof v === 'object' && v.value && typeof v.value === 'object' && v.value.key) ? String(v.value.key) : null)
                        .filter(k => !!k);
                    for (const key of candidateKeys) {
                        const facility = userFacilities.find(f => String(f.id) === String(key));
                        if (facility) return facility.name;
                    }
                    const firstMatchedField = Object.entries(fb.info).filter(([k]) => !isNaN(Number(k))).find(([_, v]) => v?.value?.key && v?.value?.value);
                    if (firstMatchedField) return String(firstMatchedField[1].value.value);
                }
                const facilityId = fb.info?.facility_id || fb.facility_id;
                const facility = userFacilities.find(f => String(f.id) === String(facilityId));
                return facility ? facility.name : (fb.fullName || fb.name || `Đơn vị (${facilityId || '?'})`);
            });
            reportData[cat.key].danhSach = Array.from(new Set(facilityNames));
        }
    });

    return {
        reportData,
        groupedFeedbacks
    };
};

const getReportKSHL = async (query) => {
    const { startDate, endDate, survey_key, unit, unit_type } = query;
    
    // Tối ưu hoá cực mạnh bằng cách fetch raw Feedbacks
    const where = { type: 'evaluate' };
    if (survey_key) {
        where.survey_key = { [Op.in]: Array.isArray(survey_key) ? survey_key : survey_key.split(',') };
    }
    const range = getDateRange(startDate, endDate);
    if (range) {
      if (range[0] && range[1]) where.created_at = { [Op.between]: range };
      else if (range[0]) where.created_at = { [Op.gte]: range[0] };
      else if (range[1]) where.created_at = { [Op.lte]: range[1] };
    }

    const rawFeedbacks = await db.Feedback.findAll({
        where,
        attributes: ['id', 'info', 'form_id', 'user_id', 'created_at', 'type', 'survey_key'],
        raw: true
    });

    const feedbackIds = rawFeedbacks.map(f => f.id);
    let optionsByFb = {};

    if (feedbackIds.length > 0) {
        // Batch parallel fetch — tránh IN(n nghìn ids) gây timeout
        const BATCH_SIZE = 500;
        const CONCURRENCY = 8;
        const allSectionRows = [];

        for (let i = 0; i < feedbackIds.length; i += BATCH_SIZE * CONCURRENCY) {
            const batchPromises = [];
            for (let j = i; j < Math.min(i + BATCH_SIZE * CONCURRENCY, feedbackIds.length); j += BATCH_SIZE) {
                const batch = feedbackIds.slice(j, j + BATCH_SIZE);
                batchPromises.push(
                    sequelize.query(
                        `SELECT fs."feedback_id", fo."data"
                         FROM "feedback_sections" fs
                         LEFT JOIN "feedback_options" fo ON fo."feedback_section_id" = fs."id"
                         WHERE fs."feedback_id" IN (:ids)`,
                        { replacements: { ids: batch }, type: QueryTypes.SELECT }
                    )
                );
            }
            const results = await Promise.all(batchPromises);
            results.forEach(r => allSectionRows.push(...r));
        }

        allSectionRows.forEach(row => {
            const fbId = row.feedback_id;
            if (!fbId) return;
            if (!optionsByFb[fbId]) optionsByFb[fbId] = [];
            let optData = row.data;
            if (typeof optData === 'string') {
                try { optData = JSON.parse(optData); } catch (e) {}
            }
            if (optData) optionsByFb[fbId].push(optData);
        });
    }

    // Nạp dữ liệu options + parse info thành object sạch
    rawFeedbacks.forEach(fb => {
        const parsed = parseFeedbackRow(fb);
        fb._parsed = parsed;          // facilityKey, surveyType, isQR, ...
        fb.info = parsed._info;       // info đã parse sẵn (object)
        fb.optionsData = optionsByFb[fb.id] || [];
    });

    const forms = await db.Form.findAll({ where: { type: 'evaluate' }, raw: true });
    
    let allUnits = await db.SocialFacility.findAll();
    if (unit_type) {
        allUnits = allUnits.filter(f => (f.type || "").toUpperCase() === String(unit_type).toUpperCase());
    }
    if (unit && unit !== 'none') {
        const unitIds = unit.split(',').map(id => id.trim());
        allUnits = allUnits.filter(f => unitIds.includes(String(f.id)));
    }

    const formTypeMap = {};
    forms.forEach(f => {
        const sId = String(f.id);
        if (sId === "19") formTypeMap[sId] = "noi_tru";
        else if (sId === "20") formTypeMap[sId] = "ngoai_tru";
        else if (sId === "21") formTypeMap[sId] = "tiem_chung";
        else {
            const name = (f.name || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").trim();
            if (name.includes("noitru") || name.includes("noi")) formTypeMap[sId] = "noi_tru";
            else if (name.includes("tiem") || name.includes("vaccine")) formTypeMap[sId] = "tiem_chung";
            else if (name.includes("ngoaitru") || name.includes("ngoai")) formTypeMap[sId] = "ngoai_tru";
        }
    });

    const unitGroups = {};
    const unmappedFeedbacks = {
        'noi_tru': { self: [], qr: [] },
        'ngoai_tru': { self: [], qr: [] },
        'tiem_chung': { self: [], qr: [] },
        'unknown': { self: [], qr: [] }
    };

    rawFeedbacks.forEach(fb => {
        const p = fb._parsed;  // đã parse sẵn bởi parseFeedbackRow

        // Xác định loại khảo sát (noi_tru / ngoai_tru / tiem_chung / unknown)
        const finalSType = p.surveyType !== 'unknown' ? p.surveyType
            : (p.formId && formTypeMap[p.formId] ? formTypeMap[p.formId] : 'unknown');

        const target = p.isQR ? 'qr' : 'self';

        // Tìm đơn vị khớp trong allUnits
        const unitId = p.facilityKey || (fb.facility_id ? String(fb.facility_id).trim() : null);
        const matchedUnit = unitId ? allUnits.find(u => String(u.id).trim() === unitId) : null;

        if (matchedUnit) {
            if (!unitGroups[matchedUnit.id]) unitGroups[matchedUnit.id] = {};
            if (!unitGroups[matchedUnit.id][finalSType]) unitGroups[matchedUnit.id][finalSType] = { self: [], qr: [] };
            unitGroups[matchedUnit.id][finalSType][target].push(fb);
        } else {
            if (!unmappedFeedbacks[finalSType]) unmappedFeedbacks[finalSType] = { self: [], qr: [] };
            unmappedFeedbacks[finalSType][target].push(fb);
        }
    });

    const calcRate = (arr) => {
        if (!arr || !arr.length) return 0;
        let totalWeightedScore = 0;
        let count = 0;

        arr.forEach(fb => {
            let fbScore = 0;
            let fbMax = 0;

            if (fb.optionsData && fb.optionsData.length) {
                fb.optionsData.forEach(optData => {
                    if (!optData) return;
                    const val = optData.ratingVote?.value ?? optData.rating?.value ?? optData.answerValue;
                    if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
                        fbScore += Number(val);
                        fbMax += 5;
                    }
                });
            }

            if (fbMax === 0) {
                const r = fb.rating ?? fb.score ?? fb.info?.rating ?? 0;
                if (r > 0) { fbScore = Number(r); fbMax = 5; }
            }

            if (fbMax > 0) {
                totalWeightedScore += (fbScore / fbMax);
                count++;
            }
        });

        if (count === 0) return 0;
        return (totalWeightedScore / count) * 100;
    };

    const displayRate = (val) => val > 0 ? val.toFixed(2) : "0";
    const formatNumber = (n) => n.toLocaleString('vi-VN');

    const publicHospitals = allUnits.filter(u => u.type === 'BV' && u.category !== "Cơ sở y tế tư nhân");
    const privateHospitals = allUnits.filter(u => u.type === 'BV' && u.category === "Cơ sở y tế tư nhân");
    const tytUnits = allUnits.filter(u => u.type === 'TYT');

    const createSummaryData = (units, surveyType, label) => {
        let selfUnitsReported = 0, selfTotalPhieu = 0, selfTotalRate = 0;
        let qrUnitsReported = 0, qrTotalPhieu = 0, qrTotalRate = 0;

        units.forEach(u => {
            const g = unitGroups[u.id];
            const s = g ? g[surveyType] : null;
            if (s && s.self.length > 0) { selfUnitsReported++; selfTotalPhieu += s.self.length; selfTotalRate += calcRate(s.self); }
            if (s && s.qr.length > 0) { qrUnitsReported++; qrTotalPhieu += s.qr.length; qrTotalRate += calcRate(s.qr); }
        });

        const selfRate = selfUnitsReported > 0 ? (selfTotalRate / selfUnitsReported).toFixed(2) : "0";
        const qrRate = qrUnitsReported > 0 ? (qrTotalRate / qrUnitsReported).toFixed(2) : "0";

        return {
            type: label,
            col1: units.length > 0 ? `${selfUnitsReported}/${units.length}` : "",
            col2: formatNumber(selfTotalPhieu),
            col3: selfRate,
            col4: units.length > 0 ? `${qrUnitsReported}/${units.length}` : "",
            col5: formatNumber(qrTotalPhieu),
            col6: qrRate
        };
    };

    const summaryNgoaiTru = [
        { id: '1', ...createSummaryData(publicHospitals, 'ngoai_tru', 'BV công lập') },
        { id: '2', ...createSummaryData(privateHospitals, 'ngoai_tru', 'BV ngoài công lập') },
        { id: '3', ...createSummaryData(tytUnits, 'ngoai_tru', 'Trạm Y tế') },
        {
            id: '4', type: 'Không ghi địa chỉ', col1: '',
            col2: formatNumber(unmappedFeedbacks.ngoai_tru.self.length + unmappedFeedbacks.unknown.self.length),
            col3: displayRate(calcRate([...unmappedFeedbacks.ngoai_tru.self, ...unmappedFeedbacks.unknown.self])),
            col4: '',
            col5: formatNumber(unmappedFeedbacks.ngoai_tru.qr.length + unmappedFeedbacks.unknown.qr.length),
            col6: displayRate(calcRate([...unmappedFeedbacks.ngoai_tru.qr, ...unmappedFeedbacks.unknown.qr]))
        },
        { id: '', type: 'Tổng', isTotal: true, ...createSummaryData([...publicHospitals, ...privateHospitals, ...tytUnits], 'ngoai_tru', 'Tổng') }
    ];
    const lastRow = summaryNgoaiTru[summaryNgoaiTru.length - 1];
    lastRow.col2 = formatNumber(parseInt(lastRow.col2.replace(/\./g, '') || '0') + unmappedFeedbacks.ngoai_tru.self.length + unmappedFeedbacks.unknown.self.length);
    lastRow.col5 = formatNumber(parseInt(lastRow.col5.replace(/\./g, '') || '0') + unmappedFeedbacks.ngoai_tru.qr.length + unmappedFeedbacks.unknown.qr.length);

    const summaryNoiTru = [
        { id: '1', ...createSummaryData(publicHospitals, 'noi_tru', 'BV công lập') },
        { id: '2', ...createSummaryData(privateHospitals, 'noi_tru', 'BV ngoài công lập') },
        {
            id: '3', type: 'Không ghi địa chỉ', col1: '',
            col2: formatNumber(unmappedFeedbacks.noi_tru.self.length + unmappedFeedbacks.unknown.self.length),
            col3: displayRate(calcRate([...unmappedFeedbacks.noi_tru.self, ...unmappedFeedbacks.unknown.self])),
            col4: '',
            col5: formatNumber(unmappedFeedbacks.noi_tru.qr.length + unmappedFeedbacks.unknown.qr.length),
            col6: displayRate(calcRate([...unmappedFeedbacks.noi_tru.qr, ...unmappedFeedbacks.unknown.qr]))
        },
        { id: '', type: 'Tổng', isTotal: true, ...createSummaryData([...publicHospitals, ...privateHospitals], 'noi_tru', 'Tổng') }
    ];
    const lastRowNoiTru = summaryNoiTru[summaryNoiTru.length - 1];
    lastRowNoiTru.col2 = formatNumber(parseInt(lastRowNoiTru.col2.replace(/\./g, '') || '0') + unmappedFeedbacks.noi_tru.self.length + unmappedFeedbacks.unknown.self.length);
    lastRowNoiTru.col5 = formatNumber(parseInt(lastRowNoiTru.col5.replace(/\./g, '') || '0') + unmappedFeedbacks.noi_tru.qr.length + unmappedFeedbacks.unknown.qr.length);

    const summaryTiemChung = [
        { id: '1', ...createSummaryData(allUnits.filter(f => f.type === 'BV'), 'tiem_chung', 'Khối Bệnh viện') },
        { id: '2', ...createSummaryData(tytUnits, 'tiem_chung', 'Khối TYT') },
        {
            id: '3', type: 'Không ghi địa chỉ', col1: '',
            col2: formatNumber(unmappedFeedbacks.tiem_chung.self.length + unmappedFeedbacks.unknown.self.length),
            col3: displayRate(calcRate([...unmappedFeedbacks.tiem_chung.self, ...unmappedFeedbacks.unknown.self])),
            col4: '',
            col5: formatNumber(unmappedFeedbacks.tiem_chung.qr.length + unmappedFeedbacks.unknown.qr.length),
            col6: displayRate(calcRate([...unmappedFeedbacks.tiem_chung.qr, ...unmappedFeedbacks.unknown.qr]))
        },
        { id: '', type: 'Tổng', isTotal: true, ...createSummaryData([...allUnits.filter(f => f.type === 'BV'), ...tytUnits], 'tiem_chung', 'Tổng') }
    ];
    const lastRowTiemChung = summaryTiemChung[summaryTiemChung.length - 1];
    lastRowTiemChung.col2 = formatNumber(parseInt(lastRowTiemChung.col2.replace(/\./g, '') || '0') + unmappedFeedbacks.tiem_chung.self.length + unmappedFeedbacks.unknown.self.length);
    lastRowTiemChung.col5 = formatNumber(parseInt(lastRowTiemChung.col5.replace(/\./g, '') || '0') + unmappedFeedbacks.tiem_chung.qr.length + unmappedFeedbacks.unknown.qr.length);

    const createAppendixData = (units, type1, type2, groupCommune = false) => {
        const rawRows = units.map((u) => {
            const g = unitGroups[u.id];
            const s1 = g ? g[type1] : null;
            const s2 = g ? g[type2] : null;

            let typeName = u.name;
            if (groupCommune) {
                const addressMatch = u.address?.match(/(?:xã|phường|thị trấn|x\.|p\.)\s*([^-,.]+)/i);
                const nameMatch = u.name.match(/(?:xã|phường|thị trấn|x\.|p\.)\s*([^-,.]+)/i);
                if (addressMatch && addressMatch[1]) typeName = addressMatch[1].trim();
                else if (nameMatch && nameMatch[1]) typeName = nameMatch[1].trim();
                else typeName = u.name.replace(/Trạm y tế /i, '').trim();
                typeName = typeName.normalize('NFC');
            }

            return {
                typeName,
                col1: s1 ? calcRate(s1.self) : 0,
                col2: s2 ? calcRate(s2.self) : 0,
                col3: s1?.self.length || 0,
                col4: s2?.self.length || 0,
                col5: s1 ? calcRate(s1.qr) : 0,
                col6: s2 ? calcRate(s2.qr) : 0,
                col7: s1?.qr.length || 0,
                col8: s2?.qr.length || 0,
            };
        });

        if (groupCommune) {
            const grouped = {};
            rawRows.forEach(row => {
                if (!grouped[row.typeName]) {
                    grouped[row.typeName] = { ...row, sumRate1: 0, sumRate2: 0, sumRate5: 0, sumRate6: 0, active1: 0, active2: 0, active5: 0, active6: 0 };
                }
                const g = grouped[row.typeName];
                g.col3 += row.col3; g.col4 += row.col4; g.col7 += row.col7; g.col8 += row.col8;
                if (row.col1 > 0) { g.sumRate1 += row.col1; g.active1++; }
                if (row.col2 > 0) { g.sumRate2 += row.col2; g.active2++; }
                if (row.col5 > 0) { g.sumRate5 += row.col5; g.active5++; }
                if (row.col6 > 0) { g.sumRate6 += row.col6; g.active6++; }
            });

            return Object.keys(grouped).sort().map((name, idx) => {
                const g = grouped[name];
                return {
                    id: (idx + 1).toString(), type: name,
                    col1: g.active1 > 0 ? (g.sumRate1 / g.active1).toFixed(2) + "%" : "",
                    col2: g.active2 > 0 ? (g.sumRate2 / g.active2).toFixed(2) + "%" : "",
                    col3: g.col3 > 0 ? formatNumber(g.col3) : "",
                    col4: g.col4 > 0 ? formatNumber(g.col4) : "",
                    col5: g.active5 > 0 ? (g.sumRate5 / g.active5).toFixed(2) + "%" : "",
                    col6: g.active6 > 0 ? (g.sumRate6 / g.active6).toFixed(2) + "%" : "",
                    col7: g.col7 > 0 ? formatNumber(g.col7) : "",
                    col8: g.col8 > 0 ? formatNumber(g.col8) : ""
                };
            });
        }

        return rawRows.map((r, idx) => ({
            id: (idx + 1).toString(), type: r.typeName,
            col1: r.col1 > 0 ? r.col1.toFixed(2) + "%" : "",
            col2: r.col2 > 0 ? r.col2.toFixed(2) + "%" : "",
            col3: r.col3 > 0 ? formatNumber(r.col3) : "",
            col4: r.col4 > 0 ? formatNumber(r.col4) : "",
            col5: r.col5 > 0 ? r.col5.toFixed(2) + "%" : "",
            col6: r.col6 > 0 ? r.col6.toFixed(2) + "%" : "",
            col7: r.col7 > 0 ? formatNumber(r.col7) : "",
            col8: r.col8 > 0 ? formatNumber(r.col8) : ""
        }));
    };

    return {
        dataNgoaiTru: summaryNgoaiTru,
        dataNoiTru: summaryNoiTru,
        dataTiemChung: summaryTiemChung,
        dataPhuLuc1: createAppendixData(publicHospitals, 'noi_tru', 'ngoai_tru'),
        dataPhuLuc2: createAppendixData(privateHospitals, 'noi_tru', 'ngoai_tru'),
        dataPhuLuc3: createAppendixData(tytUnits, 'tiem_chung', 'ngoai_tru', true)
    };
};

module.exports = {
    getReportDCBC,
    getReportTCT01,
    getReportKSHL
};
