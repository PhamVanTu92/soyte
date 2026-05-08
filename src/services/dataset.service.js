'use strict';

const db      = require('../models');
const seq     = db.sequelize;
const ApiError = require('../utils/ApiError');

const ENUM_THRESHOLD = 50;
const SAFE_SORT = { id: 'r.id', created_at: 'r.created_at', updated_at: 'r.updated_at' };

// ── Helpers ───────────────────────────────────────────────────────

async function resolveDatasetType(code) {
  const dt = await db.DatasetType.findOne({ where: { code } });
  if (!dt) throw new ApiError(404, `Dataset '${code}' không tồn tại.`);
  return dt;
}

function parseFilter(rawFilter) {
  if (!rawFilter) return {};
  if (typeof rawFilter === 'string') {
    try { return JSON.parse(rawFilter); } catch { return {}; }
  }
  return rawFilter;
}

function buildWhere(datasetTypeId, query, fieldDefs = []) {
  const conditions = [`r.dataset_type_id = $1`];
  const values     = [datasetTypeId];
  let   idx        = 2;

  const typeMap = {};
  for (const f of fieldDefs) typeMap[f.name] = f.datatype || 'text';

  if (query.search) {
    conditions.push(`r.data::text ILIKE $${idx}`);
    values.push(`%${query.search}%`);
    idx++;
  }

  const filter = parseFilter(query.filter);

  for (const [field, val] of Object.entries(filter)) {
    const safeField = field.replace(/'/g, "''");
    const datatype  = typeMap[field] || 'text';

    if (val && typeof val === 'object') {
      if (val.gte !== undefined) {
        conditions.push(datatype === 'number'
          ? `(r.data->>'${safeField}')::numeric >= $${idx}`
          : `r.data->>'${safeField}' >= $${idx}`
        );
        values.push(datatype === 'number' ? Number(val.gte) : val.gte);
        idx++;
      }
      if (val.lte !== undefined) {
        conditions.push(datatype === 'number'
          ? `(r.data->>'${safeField}')::numeric <= $${idx}`
          : `r.data->>'${safeField}' <= $${idx}`
        );
        values.push(datatype === 'number' ? Number(val.lte) : val.lte);
        idx++;
      }
      continue;
    }

    if (!val) continue;

    switch (datatype) {
      case 'enum':
        conditions.push(`r.data->>'${safeField}' = $${idx}`);
        values.push(val);
        break;
      case 'number':
        conditions.push(`(r.data->>'${safeField}')::numeric = $${idx}`);
        values.push(Number(val));
        break;
      default:
        conditions.push(`r.data->>'${safeField}' ILIKE $${idx}`);
        values.push(`%${val}%`);
    }
    idx++;
  }

  return { where: conditions.join(' AND '), values, nextIdx: idx };
}

function detectDatatype(samples) {
  const nonNull = samples
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .map(v => String(v).trim());
  if (!nonNull.length) return 'text';
  if (nonNull.every(v => !isNaN(Number(v.replace(/,/g, ''))))) return 'number';
  const dateRx = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})$/;
  if (nonNull.every(v => dateRx.test(v))) return 'date';
  if (new Set(nonNull).size <= ENUM_THRESHOLD) return 'enum';
  return 'text';
}

async function detectFieldsFromData(datasetTypeId) {
  const [rows] = await seq.query(`
    SELECT key,
      array_agg(DISTINCT value ORDER BY value) FILTER (WHERE value IS NOT NULL) AS distinct_values
    FROM dataset_records r,
         jsonb_each_text(r.data) AS kv(key, value)
    WHERE r.dataset_type_id = :id
    GROUP BY key ORDER BY key
  `, { replacements: { id: datasetTypeId } });

  return rows.map(row => {
    const values   = row.distinct_values || [];
    const datatype = detectDatatype(values);
    return { name: row.key, datatype, ...(datatype === 'enum' ? { values: values.slice(0, ENUM_THRESHOLD) } : {}) };
  });
}

// ── Dataset Types ─────────────────────────────────────────────────

async function listDatasets() {
  const [rows] = await seq.query(`
    SELECT dt.id, dt.code, dt.name, dt.description, dt.fields, dt.source_file, dt.created_at, dt.updated_at,
      (SELECT COUNT(*) FROM dataset_records r WHERE r.dataset_type_id = dt.id)::int AS total_records
    FROM dataset_types dt
    ORDER BY dt.created_at DESC
  `);
  return rows;
}

async function getDataset(code) {
  const dt = await resolveDatasetType(code);
  const [[{ count }]] = await seq.query(
    `SELECT COUNT(*)::int AS count FROM dataset_records WHERE dataset_type_id = :id`,
    { replacements: { id: dt.id } }
  );
  return { ...dt.toJSON(), total_records: count };
}

async function createDataset({ code, name, description, fields, source_file }) {
  if (!code || !name) throw new ApiError(400, 'code và name là bắt buộc.');
  const existing = await db.DatasetType.findOne({ where: { code } });
  if (existing) throw new ApiError(409, `Dataset '${code}' đã tồn tại.`);
  return db.DatasetType.create({ code, name, description, fields: fields || null, source_file: source_file || null });
}

async function updateDataset(code, data) {
  const dt = await resolveDatasetType(code);
  const allowed = ['name', 'description', 'fields', 'source_file'];
  const updates = {};
  for (const k of allowed) if (data[k] !== undefined) updates[k] = data[k];
  await dt.update(updates);
  return dt;
}

async function deleteDataset(code) {
  const dt = await resolveDatasetType(code);
  await dt.destroy();
  return { code };
}

// ── Records ───────────────────────────────────────────────────────

async function listRecords(code, query) {
  const dt     = await resolveDatasetType(code);
  const page   = Math.max(1, parseInt(query.page)  || 1);
  const limit  = Math.min(500, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  const sortCol = SAFE_SORT[query.sort_by] || 'r.id';
  const sortDir = query.sort_dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const fieldDefs = Array.isArray(dt.fields) ? dt.fields : [];
  const { where, values } = buildWhere(dt.id, query, fieldDefs);

  const [[countRow], [rows]] = await Promise.all([
    seq.query(`SELECT COUNT(*)::int AS count FROM dataset_records r WHERE ${where}`, { bind: values }),
    seq.query(
      `SELECT r.id, r.data, r.created_at, r.updated_at
       FROM dataset_records r WHERE ${where}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT ${limit} OFFSET ${offset}`,
      { bind: values }
    ),
  ]);

  return {
    data: rows,
    meta: { total: countRow.count, page, limit, total_pages: Math.ceil(countRow.count / limit) },
  };
}

async function getRecord(code, id) {
  const dt = await resolveDatasetType(code);
  const [[row]] = await seq.query(
    `SELECT id, data, created_at, updated_at FROM dataset_records WHERE id = $1 AND dataset_type_id = $2`,
    { bind: [id, dt.id] }
  );
  if (!row) throw new ApiError(404, 'Bản ghi không tồn tại.');
  return row;
}

async function createRecord(code, body) {
  const dt   = await resolveDatasetType(code);
  const data = body.data || body;
  const rec  = await db.DatasetRecord.create({ dataset_type_id: dt.id, data });
  return rec;
}

async function updateRecord(code, id, body) {
  const dt   = await resolveDatasetType(code);
  const data = body.data || body;
  const [[row]] = await seq.query(
    `UPDATE dataset_records SET data = $1 WHERE id = $2 AND dataset_type_id = $3 RETURNING *`,
    { bind: [JSON.stringify(data), id, dt.id] }
  );
  if (!row) throw new ApiError(404, 'Bản ghi không tồn tại.');
  return row;
}

async function patchRecord(code, id, body) {
  const dt    = await resolveDatasetType(code);
  const patch = body.data || body;
  const [[row]] = await seq.query(
    `UPDATE dataset_records SET data = data || $1::jsonb WHERE id = $2 AND dataset_type_id = $3 RETURNING *`,
    { bind: [JSON.stringify(patch), id, dt.id] }
  );
  if (!row) throw new ApiError(404, 'Bản ghi không tồn tại.');
  return row;
}

async function deleteRecord(code, id) {
  const dt = await resolveDatasetType(code);
  const [[row]] = await seq.query(
    `DELETE FROM dataset_records WHERE id = $1 AND dataset_type_id = $2 RETURNING id`,
    { bind: [id, dt.id] }
  );
  if (!row) throw new ApiError(404, 'Bản ghi không tồn tại.');
  return { id: row.id };
}

async function truncateRecords(code) {
  const dt = await resolveDatasetType(code);
  const [[result]] = await seq.query(
    `WITH deleted AS (DELETE FROM dataset_records WHERE dataset_type_id = $1 RETURNING id)
     SELECT COUNT(*)::int AS deleted FROM deleted`,
    { bind: [dt.id] }
  );
  return { deleted: result.deleted };
}

async function bulkInsert(datasetTypeId, rows) {
  if (!rows.length) return 0;
  const records = rows.map(r => ({ dataset_type_id: datasetTypeId, data: r }));
  const created = await db.DatasetRecord.bulkCreate(records);
  return created.length;
}

// ── Fields ────────────────────────────────────────────────────────

async function getFields(code) {
  const dt = await resolveDatasetType(code);
  return { dataset: dt.code, fields: dt.fields || [] };
}

async function updateFields(code, incoming) {
  if (!Array.isArray(incoming)) throw new ApiError(400, 'Body phải là mảng field definitions.');
  const DATATYPES = ['text', 'number', 'date', 'enum'];
  for (const f of incoming) {
    if (!f.name) throw new ApiError(400, 'Mỗi field phải có name.');
    if (f.datatype && !DATATYPES.includes(f.datatype))
      throw new ApiError(400, `datatype '${f.datatype}' không hợp lệ. Chấp nhận: ${DATATYPES.join(', ')}.`);
  }

  const dt = await resolveDatasetType(code);
  const currentMap = Object.fromEntries((dt.fields || []).map(f => [f.name, f]));
  for (const f of incoming) currentMap[f.name] = { ...currentMap[f.name], ...f };

  await dt.update({ fields: Object.values(currentMap) });
  return { dataset: dt.code, fields: dt.fields };
}

async function detectFields(code) {
  const dt     = await resolveDatasetType(code);
  const fields = await detectFieldsFromData(dt.id);
  await dt.update({ fields });
  return { dataset: dt.code, fields };
}

async function getFieldValues(code, fieldName, query) {
  const dt     = await resolveDatasetType(code);
  const limit  = Math.min(500, parseInt(query.limit) || 100);
  const search = query.search;
  const safe   = fieldName.replace(/'/g, "''");

  let sql = `
    SELECT DISTINCT r.data->>'${safe}' AS value, COUNT(*)::int AS count
    FROM dataset_records r
    WHERE r.dataset_type_id = $1 AND r.data->>'${safe}' IS NOT NULL
  `;
  const params = [dt.id];

  if (search) {
    sql += ` AND r.data->>'${safe}' ILIKE $2`;
    params.push(`%${search}%`);
  }
  sql += ` GROUP BY value ORDER BY count DESC, value LIMIT ${limit}`;

  const [rows] = await seq.query(sql, { bind: params });
  return { dataset: dt.code, field: fieldName, values: rows };
}

// ── Stats ─────────────────────────────────────────────────────────

async function getDatasetStats(code) {
  const dt         = await resolveDatasetType(code);
  const fields     = Array.isArray(dt.fields) ? dt.fields : [];
  const enumFields = fields.filter(f => f.datatype === 'enum');

  const [[countRow], ...distResults] = await Promise.all([
    seq.query(`SELECT COUNT(*)::int AS count FROM dataset_records WHERE dataset_type_id = $1`, { bind: [dt.id] }),
    ...enumFields.map(f => seq.query(
      `SELECT r.data->>'${f.name.replace(/'/g, "''")}' AS value, COUNT(*)::int AS count
       FROM dataset_records r
       WHERE r.dataset_type_id = $1 AND r.data->>'${f.name.replace(/'/g, "''")}' IS NOT NULL
       GROUP BY value ORDER BY count DESC LIMIT 20`,
      { bind: [dt.id] }
    )),
  ]);

  const distributions = {};
  enumFields.forEach((f, i) => { distributions[f.name] = distResults[i][0]; });

  return {
    dataset: dt.code, name: dt.name, description: dt.description,
    total_records: countRow.count, fields, distributions,
    source_file: dt.source_file, updated_at: dt.updated_at,
  };
}

async function getSystemStats() {
  const [rows] = await seq.query(`
    SELECT dt.id, dt.code, dt.name, dt.description, dt.source_file, dt.updated_at, dt.fields,
      COUNT(r.id)::int AS total_records
    FROM dataset_types dt
    LEFT JOIN dataset_records r ON r.dataset_type_id = dt.id
    GROUP BY dt.id ORDER BY dt.created_at ASC
  `);
  const total_records  = rows.reduce((s, r) => s + r.total_records, 0);
  return { total_datasets: rows.length, total_records, datasets: rows };
}

module.exports = {
  listDatasets, getDataset, createDataset, updateDataset, deleteDataset,
  listRecords, getRecord, createRecord, updateRecord, patchRecord, deleteRecord,
  truncateRecords, bulkInsert, detectFieldsFromData,
  getFields, updateFields, detectFields, getFieldValues,
  getDatasetStats, getSystemStats,
};
