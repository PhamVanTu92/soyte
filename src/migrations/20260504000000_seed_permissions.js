'use strict';

/**
 * Migration: seed_permissions
 * Tạo toàn bộ cây quyền vào bảng permissions.
 * Idempotent — dùng INSERT IF NOT EXISTS.
 * Tương thích: MSSQL & PostgreSQL
 */

const isPG = (seq) => (seq.options.dialect || '') === 'postgres';

const permissionTree = {
  posts: {
    view: 'Xem danh sách bài viết',
    create: 'Tạo bài viết mới',
    update: 'Cập nhật bài viết',
    delete: 'Xóa bài viết',
  },
  users: {
    view: 'Xem danh sách người dùng',
    create: 'Tạo người dùng mới',
    update: 'Cập nhật thông tin người dùng',
    delete: 'Xóa người dùng',
  },
  smtp: {
    view: 'Xem cấu hình SMTP',
    update: 'Cập nhật cấu hình SMTP',
  },
  work_schedule: {
    view: 'Xem lịch công tác',
    create: 'Tạo lịch công tác',
    update: 'Cập nhật lịch công tác',
    delete: 'Xóa lịch công tác',
  },
  social_facilities: {
    view: 'Xem danh sách cơ sở',
    create: 'Thêm cơ sở mới',
    update: 'Cập nhật thông tin cơ sở',
    delete: 'Xóa cơ sở',
  },
  permissions: {
    view: 'Xem danh sách quyền',
    create: 'Tạo quyền mới',
    update: 'Cập nhật quyền',
    delete: 'Xóa quyền',
  },
  affiliated_facility: {
    view: 'Xem danh sách đơn vị trực thuộc',
    create: 'Thêm đơn vị trực thuộc',
    update: 'Cập nhật đơn vị trực thuộc',
    delete: 'Xóa đơn vị trực thuộc',
  },
  reflect: {
    view: 'Truy cập module Phản ánh y tế',
    children: {
      form: {
        view: 'Xem biểu mẫu Phản ánh',
        create: 'Tạo biểu mẫu Phản ánh',
        update: 'Cập nhật biểu mẫu Phản ánh',
        delete: 'Xóa biểu mẫu Phản ánh',
      },
      list_feedback: {
        view: 'Xem danh sách phản hồi Phản ánh',
        reply: 'Trả lời phản hồi Phản ánh',
        update_status: 'Cập nhật trạng thái phản hồi Phản ánh',
      },
      survey: {
        view: 'Xem khảo sát Phản ánh',
        create: 'Tạo khảo sát Phản ánh',
        update: 'Cập nhật khảo sát Phản ánh',
        delete: 'Xóa khảo sát Phản ánh',
      },
    },
  },
  evaluate: {
    view: 'Truy cập module Giám sát chất lượng',
    children: {
      form: {
        view: 'Xem biểu mẫu Giám sát',
        create: 'Tạo biểu mẫu Giám sát',
        update: 'Cập nhật biểu mẫu Giám sát',
        delete: 'Xóa biểu mẫu Giám sát',
      },
      list_feedback: {
        view: 'Xem danh sách phản hồi Giám sát',
        reply: 'Trả lời phản hồi Giám sát',
        update_status: 'Cập nhật trạng thái phản hồi Giám sát',
      },
      survey: {
        view: 'Xem khảo sát Giám sát',
        create: 'Tạo khảo sát Giám sát',
        update: 'Cập nhật khảo sát Giám sát',
        delete: 'Xóa khảo sát Giám sát',
      },
    },
  },
  report: {
    view: 'Truy cập module Báo cáo',
    children: {
      report_1: {
        view: 'Xem báo cáo phản ảnh y tế',
        export: 'Xuất báo cáo phản ảnh y tế',
      },
      report_2: {
        view: 'Xem báo cáo giám sát chất lượng',
        export: 'Xuất báo cáo giám sát chất lượng',
      },
      report_3: {
        view: 'Xem báo cáo phản ảnh y tế - kết quả khảo sát',
        export: 'Xuất báo cáo phản ảnh y tế - kết quả khảo sát',
      },
    },
  },
};

// Helper: upsert một permission, trả về id
async function upsertPermission(sequelize, transaction, name, description, parentId) {
  const [existing] = await sequelize.query(
    `SELECT id FROM permissions WHERE name = :name`,
    { replacements: { name }, transaction }
  );

  if (existing.length > 0) return existing[0].id;

  if (isPG(sequelize)) {
    const [inserted] = await sequelize.query(
      `INSERT INTO permissions (name, description, parent_id, created_at, updated_at)
       VALUES (:name, :desc, :parentId, NOW(), NOW())
       RETURNING id`,
      { replacements: { name, desc: description, parentId: parentId ?? null }, transaction }
    );
    return inserted[0].id;
  } else {
    await sequelize.query(
      `INSERT INTO [permissions] ([name], [description], [parent_id], [created_at], [updated_at])
       VALUES (:name, :desc, :parentId, GETDATE(), GETDATE())`,
      { replacements: { name, desc: description, parentId: parentId ?? null }, transaction }
    );
    const [newRow] = await sequelize.query(
      `SELECT [id] FROM [permissions] WHERE [name] = :name`,
      { replacements: { name }, transaction }
    );
    return newRow[0].id;
  }
}

module.exports = {
  async up(sequelize, transaction) {
    let total = 0;

    for (const [topKey, topVal] of Object.entries(permissionTree)) {
      const topId = await upsertPermission(
        sequelize, transaction,
        topKey,
        `Module ${topKey}`,
        null
      );
      total++;

      for (const [key, val] of Object.entries(topVal)) {
        if (key === 'children') {
          for (const [childKey, childVal] of Object.entries(val)) {
            const childName = `${topKey}.${childKey}`;
            const childId = await upsertPermission(
              sequelize, transaction,
              childName,
              `Nhóm ${childKey} trong ${topKey}`,
              topId
            );
            total++;

            for (const [actionKey, actionDesc] of Object.entries(childVal)) {
              await upsertPermission(
                sequelize, transaction,
                `${childName}.${actionKey}`,
                actionDesc,
                childId
              );
              total++;
            }
          }
        } else {
          await upsertPermission(
            sequelize, transaction,
            `${topKey}.${key}`,
            val,
            topId
          );
          total++;
        }
      }
    }

    console.log(`      ✅ Upserted ${total} permissions vào bảng permissions.`);
  },

  async down(sequelize, transaction) {
    await sequelize.query(`DELETE FROM user_permissions`, { transaction });
    await sequelize.query(`DELETE FROM permissions`, { transaction });
    console.log('      ✅ Đã xóa toàn bộ permissions và user_permissions.');
  },
};
