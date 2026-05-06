const db = require('../models');

async function seedPermissions() {
  const tree = {
    // 1. Posts
    'posts': {
      view: 'Xem danh sách bài viết',
      create: 'Tạo bài viết mới',
      update: 'Cập nhật bài viết',
      delete: 'Xóa bài viết',
    },
    // 2. Users management
    'users': {
      view: 'Xem danh sách người dùng',
      create: 'Tạo người dùng mới',
      update: 'Cập nhật thông tin người dùng',
      delete: 'Xóa người dùng',
    },
    // 3. SMTP
    'smtp': {
      view: 'Xem cấu hình SMTP',
      update: 'Cập nhật cấu hình SMTP',
    },
    // 4. Work Schedule
    'work_schedule': {
      view: 'Xem lịch công tác',
      create: 'Tạo lịch công tác',
      update: 'Cập nhật lịch công tác',
      delete: 'Xóa lịch công tác',
    },
    // 5. Social Facilities
    'social_facilities': {
      view: 'Xem danh sách cơ sở',
      create: 'Thêm cơ sở mới',
      update: 'Cập nhật thông tin cơ sở',
      delete: 'Xóa cơ sở',
    },
    // 6. Permissions Management
    'permissions': {
      view: 'Xem danh sách quyền',
      create: 'Tạo quyền mới',
      update: 'Cập nhật quyền',
      delete: 'Xóa quyền',
    },
    // 7. Reflect (Phản ánh y tế)
    'reflect': {
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
        }
      }
    },
    // 8. Evaluate (Giám sát chất lượng)
    'evaluate': {
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
        }
      }
    },
    // 9. Reports
    'report': {
      view: 'Truy cập module Báo cáo',
      children: {
        report_1: {
          view: 'Xem báo cáo phản ảnh y tế',
          export: 'Xuất báo cáo phản ảnh y tế'
        },
        report_2: {
          view: 'Xem báo cáo giám sát chất lượng',
          export: 'Xuất báo cáo giám sát chất lượng'
        },
        report_3: {
          view: 'Xem báo cáo phản ảnh y tế - kết quả khảo sát',
          export: 'Xuất báo cáo phản ảnh y tế - kết quả khảo sát'
        }
      }
    }
  };

  try {
    for (const [topKey, topVal] of Object.entries(tree)) {
      // 1. Create Top-level Node
      const [topNode] = await db.Permission.findOrCreate({
        where: { name: topKey },
        defaults: { name: topKey, description: `Module ${topKey}`, parent_id: null }
      });
      console.log(`Ensured top module: ${topKey}`);

      for (const [key, val] of Object.entries(topVal)) {
        if (key === 'children') {
          // 2. Handle sub-groups
          for (const [childKey, childVal] of Object.entries(val)) {
            const childName = `${topKey}.${childKey}`; // e.g. reflect.form
            const [childNode] = await db.Permission.findOrCreate({
              where: { name: childName },
              defaults: { name: childName, description: `Tác vụ ${childKey} trong ${topKey}`, parent_id: topNode.id }
            });

            for (const [actionKey, actionDesc] of Object.entries(childVal)) {
              const actionName = `${childName}.${actionKey}`; // e.g. reflect.form.view
              await db.Permission.findOrCreate({
                where: { name: actionName },
                defaults: { name: actionName, description: actionDesc, parent_id: childNode.id }
              });
            }
          }
        } else {
          // 2. Direct simple actions (view, create, etc)
          const name = `${topKey}.${key}`;
          await db.Permission.findOrCreate({
            where: { name },
            defaults: { name, description: val, parent_id: topNode.id }
          });
        }
      }
    }
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  } finally {
    process.exit();
  }
}

seedPermissions();
