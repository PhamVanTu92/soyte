'use strict';

/**
 * seed-from-old-db.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrate data từ MSSQL cũ → DB mới (MSSQL hoặc PostgreSQL).
 *
 * Chạy:
 *   node src/scripts/seed-from-old-db.js
 *
 * Yêu cầu biến môi trường trong .env (DB mới) + OLD_DB_* (DB cũ):
 *   OLD_DB_HOST=160.30.252.5
 *   OLD_DB_USER=api_user
 *   OLD_DB_PASSWORD=Api@123456
 *   OLD_DB_NAME=SUCKHUOETHUDO_DB
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Sequelize, Op } = require('sequelize');

// ── Kết nối DB cũ (MSSQL) ───────────────────────────────────────────────────
const oldDb = new Sequelize(
  process.env.OLD_DB_NAME     || 'SUCKHUOETHUDO_DB',
  process.env.OLD_DB_USER     || 'api_user',
  process.env.OLD_DB_PASSWORD || 'Api@123456',
  {
    host:    process.env.OLD_DB_HOST || '160.30.252.5',
    port:    parseInt(process.env.OLD_DB_PORT || '1433'),
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: {
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 60000,
      },
    },
  }
);

// ── Kết nối DB mới (từ .env) ─────────────────────────────────────────────────
const newDb = require('../config/database');

// ── Helpers ──────────────────────────────────────────────────────────────────
const isPG = () => (newDb.options.dialect || '') === 'postgres';

const log  = (msg)  => console.log(`  ${msg}`);
const ok   = (msg)  => console.log(`  ✅ ${msg}`);
const warn = (msg)  => console.warn(`  ⚠️  ${msg}`);
const sep  = (title) => console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`);

/** Query DB cũ */
const qOld = (sql, opts = {}) =>
  oldDb.query(sql, { type: Sequelize.QueryTypes.SELECT, ...opts });

/** Query DB mới */
const qNew = (sql, opts = {}) =>
  newDb.query(sql, { type: Sequelize.QueryTypes.SELECT, ...opts });

/** Execute (INSERT/UPDATE) DB mới */
const execNew = (sql, replacements = {}) =>
  newDb.query(sql, { replacements });

/** Upsert tiện lợi cho DB mới */
const upsertNew = async (table, data, conflictKey) => {
  const cols = Object.keys(data);
  const vals = Object.values(data);

  if (isPG()) {
    const colList  = cols.map(c => `"${c}"`).join(', ');
    const plHolder = cols.map((_, i) => `$${i + 1}`).join(', ');
    const conflict = Array.isArray(conflictKey)
      ? conflictKey.map(k => `"${k}"`).join(', ')
      : `"${conflictKey}"`;
    await newDb.query(
      `INSERT INTO "${table}" (${colList}) VALUES (${plHolder})
       ON CONFLICT (${conflict}) DO NOTHING`,
      { bind: vals }
    );
  } else {
    const pairs  = cols.map(c => `[${c}]`).join(', ');
    const values = cols.map(c => `:${c}`).join(', ');
    const checks = (Array.isArray(conflictKey) ? conflictKey : [conflictKey])
      .map(k => `t.[${k}] = src.[${k}]`).join(' AND ');
    const reps   = {};
    cols.forEach((c, i) => { reps[c] = vals[i]; });
    await newDb.query(
      `MERGE INTO [${table}] AS t
       USING (SELECT ${cols.map(c => `:${c} AS [${c}]`).join(', ')}) AS src
       ON ${checks}
       WHEN NOT MATCHED THEN INSERT (${pairs}) VALUES (${values});`,
      { replacements: reps }
    );
  }
};

// ── Loại hình cơ sở → tên phân loại ─────────────────────────────────────────
const HOSPITAL_TYPES = ['BV', 'bệnh viện', 'benh vien', 'hospital'];
const CLINIC_TYPES   = ['TYT', 'trạm y tế', 'tram y te', 'clinic', 'health station'];

const isFacilityAdmin = (facilityType) => {
  if (!facilityType) return false;
  const t = facilityType.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return (
    HOSPITAL_TYPES.some(h => t.includes(h.toLowerCase())) ||
    CLINIC_TYPES.some(c => t.includes(c.toLowerCase()))
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 0 — Kiểm tra permission ID=4 trong DB cũ
// ─────────────────────────────────────────────────────────────────────────────
async function resolveOldPermission4() {
  try {
    const rows = await qOld(`SELECT id, name, description FROM [permissions] WHERE id = 4`);
    if (rows.length > 0) {
      log(`DB cũ — permission id=4: "${rows[0].name}" (${rows[0].description || ''})`);
      return rows[0];
    }
  } catch (e) {
    warn(`Không đọc được permission id=4 từ DB cũ: ${e.message}`);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 1 — social_facilities
// ─────────────────────────────────────────────────────────────────────────────
async function migrateSocialFacilities() {
  sep('1/7  social_facilities');

  let rows;
  try {
    rows = await qOld(`SELECT * FROM [social_facilities]`);
  } catch (e) {
    warn(`Không đọc được social_facilities: ${e.message}`); return;
  }

  log(`Tìm thấy ${rows.length} cơ sở y tế`);
  let inserted = 0, skipped = 0;

  for (const r of rows) {
    try {
      await upsertNew('social_facilities', {
        id:          r.id,
        name:        r.name,
        type:        r.type        || null,
        category:    r.category    || null,
        address:     r.address     || null,
        phone:       r.phone       || null,
        latitude:    r.latitude    || null,
        longitude:   r.longitude   || null,
        description: r.description || null,
        created_at:  r.created_at  || new Date(),
        updated_at:  r.updated_at  || new Date(),
      }, 'id');
      inserted++;
    } catch (e) {
      warn(`Bỏ qua facility ${r.id}: ${e.message}`);
      skipped++;
    }
  }
  ok(`Inserted: ${inserted}, Skipped/existed: ${skipped}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 2 — users
// ─────────────────────────────────────────────────────────────────────────────
async function migrateUsers() {
  sep('2/7  users');

  let rows;
  try {
    rows = await qOld(`
      SELECT u.*, sf.[type] AS facility_type
      FROM [users] u
      LEFT JOIN [social_facilities] sf ON sf.[id] = u.[unit]
    `);
  } catch (e) {
    // Thử không có join nếu cột không khớp
    try {
      rows = await qOld(`SELECT * FROM [users]`);
    } catch (e2) {
      warn(`Không đọc được users: ${e2.message}`); return;
    }
  }

  log(`Tìm thấy ${rows.length} người dùng`);
  let inserted = 0, skipped = 0;

  for (const r of rows) {
    try {
      const data = {
        email:                   r.email,
        password:                r.password,
        username:                r.username                || null,
        full_name:               r.full_name               || null,
        role:                    r.role                    || 'user',
        status:                  r.status                  ?? -1,
        unit:                    r.unit                    || null,
        is_verified:             r.is_verified             ?? false,
        type:                    r.type                    || null,
        reset_password_token:    r.reset_password_token    || null,
        reset_password_expires:  r.reset_password_expires  || null,
        password_changed_at:     r.password_changed_at     || null,
        created_at:              r.created_at              || new Date(),
        updated_at:              r.updated_at              || new Date(),
      };
      await upsertNew('users', data, 'email');
      inserted++;
    } catch (e) {
      warn(`Bỏ qua user ${r.email}: ${e.message}`);
      skipped++;
    }
  }
  ok(`Inserted: ${inserted}, Skipped/existed: ${skipped}`);
  return rows; // trả về để dùng ở bước gán quyền
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 3 — forms
// ─────────────────────────────────────────────────────────────────────────────
async function migrateForms() {
  sep('3/7  forms');

  let rows;
  try {
    rows = await qOld(`SELECT * FROM [forms] WHERE deleted_at IS NULL`);
  } catch (e) {
    try { rows = await qOld(`SELECT * FROM [forms]`); }
    catch (e2) { warn(`Không đọc được forms: ${e2.message}`); return []; }
  }

  log(`Tìm thấy ${rows.length} biểu mẫu`);
  const idMap = {}; // oldId → newId
  let inserted = 0, skipped = 0;

  for (const r of rows) {
    // Kiểm tra đã có chưa (theo tên)
    const exists = await qNew(
      isPG()
        ? `SELECT id FROM "forms" WHERE name = :name LIMIT 1`
        : `SELECT TOP 1 id FROM [forms] WHERE name = :name`,
      { replacements: { name: r.name } }
    );

    if (exists.length > 0) {
      idMap[r.id] = exists[0].id;
      skipped++;
      continue;
    }

    try {
      const data = {
        name:        r.name,
        description: r.description || null,
        type:        r.type        || null,
        info:        typeof r.info === 'object' ? JSON.stringify(r.info) : (r.info || null),
        data:        typeof r.data === 'object' ? JSON.stringify(r.data) : (r.data || '{}'),
        status:      r.status      || 'active',
        created_at:  r.created_at  || new Date(),
        updated_at:  r.updated_at  || new Date(),
        deleted_at:  r.deleted_at  || null,
      };

      if (isPG()) {
        const [res] = await newDb.query(
          `INSERT INTO "forms" (name,description,type,info,data,status,created_at,updated_at,deleted_at)
           VALUES (:name,:description,:type,:info,:data,:status,:created_at,:updated_at,:deleted_at)
           RETURNING id`,
          { replacements: data }
        );
        idMap[r.id] = res[0].id;
      } else {
        await newDb.query(
          `INSERT INTO [forms] ([name],[description],[type],[info],[data],[status],[created_at],[updated_at],[deleted_at])
           VALUES (:name,:description,:type,:info,:data,:status,:created_at,:updated_at,:deleted_at)`,
          { replacements: data }
        );
        const [nr] = await qNew(`SELECT TOP 1 id FROM [forms] WHERE name = :name ORDER BY id DESC`, { replacements: { name: r.name } });
        idMap[r.id] = nr.id;
      }
      inserted++;
    } catch (e) {
      warn(`Bỏ qua form ${r.id} (${r.name}): ${e.message}`);
      skipped++;
    }
  }

  ok(`Inserted: ${inserted}, Skipped/existed: ${skipped}`);
  return idMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 4 — surveys
// ─────────────────────────────────────────────────────────────────────────────
async function migrateSurveys(formIdMap) {
  sep('4/7  surveys');

  let rows;
  try { rows = await qOld(`SELECT * FROM [surveys]`); }
  catch (e) { warn(`Không đọc được surveys: ${e.message}`); return {}; }

  log(`Tìm thấy ${rows.length} cuộc khảo sát`);
  const idMap = {};
  let inserted = 0, skipped = 0;

  for (const r of rows) {
    // Remap form_ids
    let formIds = [];
    try {
      const raw = typeof r.form_ids === 'string' ? JSON.parse(r.form_ids) : (r.form_ids || []);
      formIds = raw.map(id => formIdMap[id] || id).filter(Boolean);
    } catch { formIds = []; }

    const exists = await qNew(
      isPG()
        ? `SELECT id FROM "surveys" WHERE name = :name AND type = :type LIMIT 1`
        : `SELECT TOP 1 id FROM [surveys] WHERE name = :name AND type = :type`,
      { replacements: { name: r.name, type: r.type } }
    );

    if (exists.length > 0) {
      idMap[r.id] = exists[0].id;
      skipped++;
      continue;
    }

    try {
      const data = {
        name:        r.name,
        type:        r.type,
        date_from:   r.date_from,
        date_to:     r.date_to,
        form_ids:    JSON.stringify(formIds),
        status:      r.status ?? true,
        description: r.description || null,
        created_at:  r.created_at || new Date(),
        updated_at:  r.updated_at || new Date(),
      };

      if (isPG()) {
        const [res] = await newDb.query(
          `INSERT INTO "surveys" (name,type,date_from,date_to,form_ids,status,description,created_at,updated_at)
           VALUES (:name,:type,:date_from,:date_to,:form_ids,:status,:description,:created_at,:updated_at)
           RETURNING id`,
          { replacements: data }
        );
        idMap[r.id] = res[0].id;
      } else {
        await newDb.query(
          `INSERT INTO [surveys] ([name],[type],[date_from],[date_to],[form_ids],[status],[description],[created_at],[updated_at])
           VALUES (:name,:type,:date_from,:date_to,:form_ids,:status,:description,:created_at,:updated_at)`,
          { replacements: data }
        );
        const [nr] = await qNew(`SELECT TOP 1 id FROM [surveys] WHERE name=:name ORDER BY id DESC`, { replacements: { name: r.name } });
        idMap[r.id] = nr.id;
      }
      inserted++;
    } catch (e) {
      warn(`Bỏ qua survey ${r.id}: ${e.message}`);
      skipped++;
    }
  }

  ok(`Inserted: ${inserted}, Skipped/existed: ${skipped}`);
  return idMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 5 — feedbacks + sections + options (batch)
// ─────────────────────────────────────────────────────────────────────────────
async function migrateFeedbacks(formIdMap, surveyIdMap) {
  sep('5/7  feedbacks + sections + options');

  let feedbacks;
  try { feedbacks = await qOld(`SELECT * FROM [feedbacks] ORDER BY id ASC`); }
  catch (e) { warn(`Không đọc được feedbacks: ${e.message}`); return; }

  log(`Tìm thấy ${feedbacks.length} feedbacks`);

  // Lấy users mới để map user_id
  const newUsers = await qNew(
    isPG() ? `SELECT id, email FROM "users"` : `SELECT id, email FROM [users]`
  );
  const userEmailMap = {}; // email → newId

  // Lấy email từ user_id cũ
  const oldUsers = await qOld(`SELECT id, email FROM [users]`);
  const oldUserMap = {}; // oldId → email
  oldUsers.forEach(u => { oldUserMap[u.id] = u.email; });
  newUsers.forEach(u => { userEmailMap[u.email] = u.id; });

  const BATCH = 200;
  let fbInserted = 0, fbSkipped = 0;

  for (let i = 0; i < feedbacks.length; i += BATCH) {
    const chunk = feedbacks.slice(i, i + BATCH);
    const oldIds = chunk.map(f => f.id);

    // Lấy sections + options cho batch này
    const sections = await qOld(
      `SELECT * FROM [feedback_sections] WHERE feedback_id IN (${oldIds.join(',')}) ORDER BY id ASC`
    );
    const secIds = sections.map(s => s.id);
    const options = secIds.length
      ? await qOld(`SELECT * FROM [feedback_options] WHERE feedback_section_id IN (${secIds.join(',')})`)
      : [];

    // Index
    const secByFb  = {};
    sections.forEach(s => { if (!secByFb[s.feedback_id]) secByFb[s.feedback_id] = []; secByFb[s.feedback_id].push(s); });
    const optBySec = {};
    options.forEach(o => { if (!optBySec[o.feedback_section_id]) optBySec[o.feedback_section_id] = []; optBySec[o.feedback_section_id].push(o); });

    for (const fb of chunk) {
      // Map user_id qua email
      let newUserId = null;
      if (fb.user_id && oldUserMap[fb.user_id]) {
        newUserId = userEmailMap[oldUserMap[fb.user_id]] || null;
      }

      // Map form_id và survey_key
      const newFormId    = formIdMap[fb.form_id] || fb.form_id;
      const newSurveyKey = fb.survey_key ? String(surveyIdMap[fb.survey_key] || fb.survey_key) : null;

      try {
        let newFbId;
        const infoStr = fb.info
          ? (typeof fb.info === 'object' ? JSON.stringify(fb.info) : fb.info)
          : null;

        if (isPG()) {
          const [res] = await newDb.query(
            `INSERT INTO "feedbacks" (form_id,creator_name,status,info,type,user_id,survey_key,created_at,updated_at)
             VALUES (:form_id,:creator_name,:status,:info,:type,:user_id,:survey_key,:created_at,:updated_at)
             RETURNING id`,
            { replacements: {
              form_id: newFormId, creator_name: fb.creator_name || 'Ẩn danh',
              status: fb.status || 'pending', info: infoStr, type: fb.type || null,
              user_id: newUserId, survey_key: newSurveyKey,
              created_at: fb.created_at || new Date(), updated_at: fb.updated_at || new Date(),
            }}
          );
          newFbId = res[0].id;
        } else {
          await newDb.query(
            `INSERT INTO [feedbacks] ([form_id],[creator_name],[status],[info],[type],[user_id],[survey_key],[created_at],[updated_at])
             VALUES (:form_id,:creator_name,:status,:info,:type,:user_id,:survey_key,:created_at,:updated_at)`,
            { replacements: {
              form_id: newFormId, creator_name: fb.creator_name || 'Ẩn danh',
              status: fb.status || 'pending', info: infoStr, type: fb.type || null,
              user_id: newUserId, survey_key: newSurveyKey,
              created_at: fb.created_at || new Date(), updated_at: fb.updated_at || new Date(),
            }}
          );
          const [nr] = await qNew(`SELECT TOP 1 id FROM [feedbacks] ORDER BY id DESC`);
          newFbId = nr.id;
        }

        // Insert sections
        for (const sec of (secByFb[fb.id] || [])) {
          let newSecId;
          if (isPG()) {
            const [sr] = await newDb.query(
              `INSERT INTO "feedback_sections" (feedback_id, name) VALUES (:fid, :name) RETURNING id`,
              { replacements: { fid: newFbId, name: sec.name } }
            );
            newSecId = sr[0].id;
          } else {
            await newDb.query(
              `INSERT INTO [feedback_sections] ([feedback_id],[name]) VALUES (:fid,:name)`,
              { replacements: { fid: newFbId, name: sec.name } }
            );
            const [nr] = await qNew(`SELECT TOP 1 id FROM [feedback_sections] ORDER BY id DESC`);
            newSecId = nr.id;
          }

          // Insert options
          for (const opt of (optBySec[sec.id] || [])) {
            const dataStr = opt.data
              ? (typeof opt.data === 'object' ? JSON.stringify(opt.data) : opt.data)
              : null;
            if (isPG()) {
              await newDb.query(
                `INSERT INTO "feedback_options" (feedback_section_id,tiendo,danhgia,ghichu,data)
                 VALUES (:sid,:tiendo,:danhgia,:ghichu,:data)`,
                { replacements: { sid: newSecId, tiendo: opt.tiendo, danhgia: opt.danhgia, ghichu: opt.ghichu, data: dataStr } }
              );
            } else {
              await newDb.query(
                `INSERT INTO [feedback_options] ([feedback_section_id],[tiendo],[danhgia],[ghichu],[data])
                 VALUES (:sid,:tiendo,:danhgia,:ghichu,:data)`,
                { replacements: { sid: newSecId, tiendo: opt.tiendo, danhgia: opt.danhgia, ghichu: opt.ghichu, data: dataStr } }
              );
            }
          }
        }
        fbInserted++;
      } catch (e) {
        warn(`Bỏ qua feedback id=${fb.id}: ${e.message}`);
        fbSkipped++;
      }
    }

    process.stdout.write(`\r    Progress: ${Math.min(i + BATCH, feedbacks.length)}/${feedbacks.length}`);
  }

  console.log('');
  ok(`Feedbacks inserted: ${fbInserted}, skipped: ${fbSkipped}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 6 — posts
// ─────────────────────────────────────────────────────────────────────────────
async function migratePosts() {
  sep('6/7  posts');

  let rows;
  try { rows = await qOld(`SELECT * FROM [posts] ORDER BY id ASC`); }
  catch (e) { warn(`Không đọc được posts: ${e.message}`); return; }

  log(`Tìm thấy ${rows.length} bài viết`);

  // Map author_id qua email
  const oldUsers = await qOld(`SELECT id, email FROM [users]`);
  const newUsers = await qNew(isPG() ? `SELECT id, email FROM "users"` : `SELECT id, email FROM [users]`);
  const oldUserEmailMap = {};
  const newUserEmailMap = {};
  oldUsers.forEach(u => { oldUserEmailMap[u.id] = u.email; });
  newUsers.forEach(u => { newUserEmailMap[u.email] = u.id; });

  let inserted = 0, skipped = 0;

  for (const r of rows) {
    const newAuthorId = r.author_id
      ? (newUserEmailMap[oldUserEmailMap[r.author_id]] || null)
      : null;

    try {
      if (isPG()) {
        await newDb.query(
          `INSERT INTO "posts" (category_id,author_id,title,summary,content,image_url,status,view_count,is_featured,expires_at,created_at)
           VALUES (:cat,:author,:title,:summary,:content,:image,:status,:views,:featured,:expires,:created)
           ON CONFLICT DO NOTHING`,
          { replacements: {
            cat: r.category_id, author: newAuthorId,
            title: r.title, summary: r.summary, content: r.content, image: r.image_url,
            status: r.status || 'draft', views: r.view_count || 0, featured: r.is_featured || false,
            expires: r.expires_at || null, created: r.created_at || new Date(),
          }}
        );
      } else {
        await newDb.query(
          `IF NOT EXISTS (SELECT 1 FROM [posts] WHERE title=:title AND created_at=:created)
           INSERT INTO [posts] ([category_id],[author_id],[title],[summary],[content],[image_url],[status],[view_count],[is_featured],[expires_at],[created_at])
           VALUES (:cat,:author,:title,:summary,:content,:image,:status,:views,:featured,:expires,:created)`,
          { replacements: {
            cat: r.category_id, author: newAuthorId,
            title: r.title, summary: r.summary, content: r.content, image: r.image_url,
            status: r.status || 'draft', views: r.view_count || 0, featured: r.is_featured ? 1 : 0,
            expires: r.expires_at || null, created: r.created_at || new Date(),
          }}
        );
      }
      inserted++;
    } catch (e) {
      warn(`Bỏ qua post "${r.title}": ${e.message}`);
      skipped++;
    }
  }
  ok(`Inserted: ${inserted}, Skipped: ${skipped}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 7 — Gán quyền cho admin có loại hình BV / TYT
// ─────────────────────────────────────────────────────────────────────────────
async function assignFacilityPermissions(oldPerm4) {
  sep('7/7  Gán quyền người dùng admin BV / TYT');

  // ── Lấy permissions từ DB cũ (user_permissions) ──────────────────
  let oldUserPerms = [];
  try {
    oldUserPerms = await qOld(`
      SELECT up.user_id, up.permission_id, p.name AS perm_name, u.email
      FROM [user_permissions] up
      JOIN [permissions] p ON p.id = up.permission_id
      JOIN [users] u ON u.id = up.user_id
    `);
    log(`DB cũ có ${oldUserPerms.length} user-permission records`);
  } catch (e) {
    warn(`Không đọc được user_permissions từ DB cũ: ${e.message}`);
  }

  // ── Load users mới có unit + facility type ───────────────────────
  const usersWithFacility = await qNew(
    isPG()
      ? `SELECT u.id, u.email, u.role, u.unit, sf.type AS facility_type, sf.name AS facility_name
         FROM "users" u
         LEFT JOIN "social_facilities" sf ON sf.id = u.unit
         WHERE u.role IN ('admin','office','leader') OR u.unit IS NOT NULL`
      : `SELECT u.id, u.email, u.role, u.unit, sf.type AS facility_type, sf.name AS facility_name
         FROM [users] u
         LEFT JOIN [social_facilities] sf ON sf.id = u.unit
         WHERE u.role IN ('admin','office','leader') OR u.unit IS NOT NULL`
  );

  log(`Users có unit/role admin: ${usersWithFacility.length}`);

  // ── Load permissions trong DB mới ───────────────────────────────
  const newPerms = await qNew(
    isPG() ? `SELECT id, name FROM "permissions"` : `SELECT id, name FROM [permissions]`
  );
  const permByName = {};
  newPerms.forEach(p => { permByName[p.name] = p.id; });

  // ── Map permission cũ → mới theo name ───────────────────────────
  const oldPermIdToNewId = {};
  if (oldUserPerms.length > 0) {
    // Lấy tên permission cũ
    const oldPermNames = await qOld(`SELECT id, name FROM [permissions]`);
    const oldPermNameMap = {};
    oldPermNames.forEach(p => { oldPermNameMap[p.id] = p.name; });

    for (const [oldId, name] of Object.entries(oldPermNameMap)) {
      if (permByName[name]) oldPermIdToNewId[oldId] = permByName[name];
    }
  }

  // ── Xác định permissions cần gán cho BV/TYT admins ──────────────
  // Permissions hợp lý cho người dùng loại BV/TYT:
  const facilityUserPermNames = [
    'evaluate',
    'evaluate.list_feedback.view',
    'evaluate.survey.view',
    'reflect',
    'reflect.list_feedback.view',
    'reflect.survey.view',
    'report',
    'report.report_1.view',
    'report.report_2.view',
    'report.report_3.view',
    'social_facilities',
    'social_facilities.view',
  ];

  // Nếu DB cũ có permission id=4 tên "Bệnh viện / Trạm y tế" → map thêm
  if (oldPerm4) {
    log(`Mapping permission cũ id=4 ("${oldPerm4.name}") → evaluate + reflect + report`);
  }

  let assigned = 0, skipped = 0, errors = 0;

  // ── Migrate user_permissions từ DB cũ (theo name mapping) ────────
  const emailToNewUserId = {};
  usersWithFacility.forEach(u => { emailToNewUserId[u.email] = u.id; });

  for (const up of oldUserPerms) {
    const newUserId = emailToNewUserId[up.email];
    const newPermId = oldPermIdToNewId[up.permission_id];
    if (!newUserId || !newPermId) continue;

    try {
      await upsertNew('user_permissions', { user_id: newUserId, permission_id: newPermId }, ['user_id', 'permission_id']);
      assigned++;
    } catch (e) { errors++; }
  }
  if (oldUserPerms.length > 0) ok(`Migrate từ DB cũ: ${assigned} user_permissions`);

  // ── Gán permissions cho BV/TYT admins ───────────────────────────
  assigned = 0;
  for (const user of usersWithFacility) {
    const isBvTyt = isFacilityAdmin(user.facility_type);
    const isAdmin = ['admin', 'office', 'leader'].includes(user.role);

    if (!isBvTyt && !isAdmin) continue;

    for (const pname of facilityUserPermNames) {
      const pid = permByName[pname];
      if (!pid) continue;
      try {
        await upsertNew('user_permissions', { user_id: user.id, permission_id: pid }, ['user_id', 'permission_id']);
        assigned++;
      } catch { errors++; }
    }
  }

  ok(`Gán permissions BV/TYT: +${assigned} records (errors: ${errors})`);

  // ── Report summary ───────────────────────────────────────────────
  const facilityAdmins = usersWithFacility.filter(u =>
    isFacilityAdmin(u.facility_type) || ['admin','office','leader'].includes(u.role)
  );
  log(`\n  Danh sách users được gán quyền:`);
  facilityAdmins.slice(0, 20).forEach(u => {
    log(`    • ${u.email} | role=${u.role} | facility=${u.facility_name || '—'} (${u.facility_type || '—'})`);
  });
  if (facilityAdmins.length > 20) log(`    ... và ${facilityAdmins.length - 20} user khác`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  SEED FROM OLD DB');
  console.log(`  Old: ${process.env.OLD_DB_HOST || '160.30.252.5'} / ${process.env.OLD_DB_NAME || 'SUCKHUOETHUDO_DB'}`);
  console.log(`  New: ${newDb.options.host} / ${newDb.options.dialect}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    log('Kết nối DB cũ...');
    await oldDb.authenticate();
    ok('DB cũ OK');

    log('Kết nối DB mới...');
    await newDb.authenticate();
    ok('DB mới OK');
  } catch (e) {
    console.error(`❌ Không thể kết nối DB: ${e.message}`);
    process.exit(1);
  }

  try {
    const oldPerm4  = await resolveOldPermission4();
    await migrateSocialFacilities();
    await migrateUsers();
    const formIdMap = await migrateForms();
    const survIdMap = await migrateSurveys(formIdMap);
    await migrateFeedbacks(formIdMap, survIdMap);
    await migratePosts();
    await assignFacilityPermissions(oldPerm4);

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  ✅ SEED HOÀN TẤT');
    console.log('══════════════════════════════════════════════════════════════\n');
  } catch (e) {
    console.error(`\n❌ Lỗi: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await oldDb.close();
    await newDb.close();
  }
}

main();
