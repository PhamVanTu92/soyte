/**
 * Chuyển đổi danh sách các quyền từ dạng phẳng sang cấu trúc lồng nhau (hierarchical)
 * Phục vụ cho frontend hiển thị và quản lý.
 * Với Admin, trả về full quyền cho tất cả các key.
 * 
 * @param {string[]} permissionNames - Danh sách tên quyền dưới dạng phẳng
 * @param {boolean} isAdmin - Cờ xác định xem có phải admin không
 * @returns {object} - Cấu trúc quyền lồng nhau theo format yêu cầu.
 */
const formatPermissions = (permissionNames, isAdmin = false) => {
  const result = {};

  // Nếu là admin, ta sẽ trả về một bộ quyền đầy đủ (Full Access)
  // Lưu ý: Danh sách này khớp với cấu trúc seed để frontend nhận đủ key
  if (isAdmin) {
    const modules = ['posts', 'users', 'smtp', 'work_schedule', 'social_facilities', 'permissions', 'reflect', 'evaluate', 'report', 'affiliated_facility'];
    const actions = ['view', 'create', 'update', 'delete', 'reply', 'update_status', 'export'];
    const subChildren = ['form', 'list_feedback', 'survey', 'report_1', 'report_2', 'report_3'];

    modules.forEach(mod => {
      result[mod] = { view: true, create: true, update: true, delete: true };

      if (['reflect', 'evaluate', 'report'].includes(mod)) {
        result[mod].children = {};
        subChildren.forEach(child => {
          // Chỉ thêm các children hợp lệ cho từng module
          const isValidChild = (mod === 'report' && ['report_1', 'report_2', 'report_3'].includes(child)) ||
            (mod !== 'report' && ['form', 'list_feedback', 'survey'].includes(child));

          if (isValidChild) {
            result[mod].children[child] = {};
            actions.forEach(act => {
              result[mod].children[child][act] = true;
            });
          }
        });
      }
    });

    return result;
  }

  permissionNames.forEach((name) => {
    const parts = name.split('.');

    const category = parts[0];
    if (!result[category]) {
      result[category] = {};
    }

    if (parts.length === 2) {
      result[category][parts[1]] = true;
    } else if (parts.length === 3) {
      if (!result[category].children) {
        result[category].children = {};
      }

      const subCategory = parts[1];
      if (!result[category].children[subCategory]) {
        result[category].children[subCategory] = {};
      }

      result[category].children[subCategory][parts[2]] = true;
    }
  });

  return result;
};

/**
 * Chuyển đổi cấu trúc lồng nhau từ frontend gửi về thành mảng tên quyền dạng phẳng
 * (Ví dụ: { posts: { view: true } } -> ["posts.view"])
 * 
 * QUY TẮC: Nếu một node cha không có quyền 'view', tất cả con của nó sẽ bị bỏ qua.
 * 
 * @param {object} permissionsObj - Object quyền từ frontend
 * @returns {string[]} - Mảng tên quyền dạng phẳng
 */
const flattenPermissions = (permissionsObj) => {
  const flatList = [];

  const traverse = (obj, prefix = '') => {
    for (const key in obj) {
      if (key === 'children') {
        // Chỉ duyệt tiếp vào con nếu node hiện tại có quyền view
        // (Hoặc nếu đây là root level - prefix rỗng)
        if (prefix === '' || obj.view === true) {
          traverse(obj[key], prefix);
        }
      } else if (typeof obj[key] === 'boolean') {
        if (obj[key] === true) {
          const permissionName = prefix ? `${prefix}.${key}` : key;
          flatList.push(permissionName);
        }
      } else if (typeof obj[key] === 'object' && key !== 'children') {
        // Đây là một module hoặc sub-module node
        const newPrefix = prefix ? `${prefix}.${key}` : key;

        // Nếu node này là object và có view: true, ta mới xét tiếp
        if (obj[key].view === true) {
          traverse(obj[key], newPrefix);
        }
      }
    }
  };

  traverse(permissionsObj);
  return [...new Set(flatList)];
};

module.exports = {
  formatPermissions,
  flattenPermissions
};
