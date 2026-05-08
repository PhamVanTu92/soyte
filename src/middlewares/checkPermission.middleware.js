const apiResponse = require('../utils/apiResponse');
const { formatPermissions } = require('../utils/permissionUtils');

/**
 * Xác định Super Admin:
 * - role === 'admin' VÀ KHÔNG có permission nào trong user_permissions → full quyền
 * - role === 'admin' VÀ CÓ permissions cụ thể → chỉ được những quyền đó
 * - role khác → không phải super admin
 *
 * Nhận permissionNames (string[]) thay vì user object để tránh
 * ambiguity giữa Sequelize instance và plain object.
 */
const isSuperAdmin = (user, permissionNames) => {
  if (user.role !== 'admin') return false;
  // Super admin = role='admin' + KHÔNG có permission trực tiếp + KHÔNG có Role được gán
  //
  // Lý do kiểm tra assignedRoleCount:
  //   Dữ liệu cũ (MSSQL migrate) có thể để users.role='admin' cho nhiều tài khoản.
  //   Nếu tài khoản đó được gán một Role (vd: Bệnh viện) thì quyền đến từ Role đó,
  //   không phải super admin.
  //
  // _directPermCount và _assignedRoleCount được set bởi auth.middleware
  // TRƯỚC KHI merge, nên phản ánh đúng dữ liệu gốc trong DB.
  if (user._directPermCount !== undefined && user._assignedRoleCount !== undefined) {
    return user._directPermCount === 0 && user._assignedRoleCount === 0;
  }
  // Fallback khi không qua verifyToken (vd: context login, unit test):
  // dùng assignedRoles nếu có, không thì dùng permissionNames
  const assignedRoleCount = (user.assignedRoles || []).length;
  if (assignedRoleCount > 0) return false;
  const names = permissionNames ?? (user.permissions || []).map(p => p.name);
  return names.length === 0;
};

const resolvePermissionNames = (user) => {
  return (user.permissions || []).map(p => p.name);
};

/**
 * Helper to check if a user has a permission path in their tree.
 * Respects hierarchy: all parent nodes in the path must have 'view: true'.
 */
const hasNestedPermission = (tree, permissionPath) => {
  if (!tree) return false;
  const parts = permissionPath.split('.');

  if (parts.length === 1) {
    const node = tree[parts[0]];
    return !!(node && (node === true || node.view === true));
  }

  let current = tree;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (i === 0) {
      if (!current[part]) return false;
      current = current[part];
    } else if (i === parts.length - 1 && typeof current[part] === 'boolean') {
      return current[part] === true;
    } else {
      if (!current.children || !current.children[part]) return false;
      current = current.children[part];
    }

    if (typeof current === 'object' && current.view !== true) {
      return false;
    }
  }

  return current === true;
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.unauthorized(res);
    }

    const permissionNames = resolvePermissionNames(req.user);

    // Super admin (role=admin, không có permission cụ thể) → bypass
    if (isSuperAdmin(req.user, permissionNames)) {
      return next();
    }

    // Tất cả user còn lại (kể cả admin có permission cụ thể)
    // → kiểm tra user_permissions đã load sẵn
    const tree = formatPermissions(permissionNames, false);

    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    const hasPermission = permissionsToCheck.some(p => hasNestedPermission(tree, p));

    if (hasPermission) {
      return next();
    }

    const permMsg = Array.isArray(permission) ? permission.join(' hoặc ') : permission;
    return apiResponse.forbidden(res, `Bạn không có quyền truy cập vào chức năng này (${permMsg}).`);
  };
};

const checkPermissionIfAuthenticated = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const permissionNames = resolvePermissionNames(req.user);

    // Super admin → bypass
    if (isSuperAdmin(req.user, permissionNames)) {
      return next();
    }

    const tree = formatPermissions(permissionNames, false);

    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    const hasPermission = permissionsToCheck.some(p => hasNestedPermission(tree, p));

    if (hasPermission) {
      return next();
    }

    const permMsg = Array.isArray(permission) ? permission.join(' hoặc ') : permission;
    return apiResponse.forbidden(res, `Bạn không có quyền truy cập vào chức năng này (${permMsg}).`);
  };
};

module.exports = { checkPermission, checkPermissionIfAuthenticated, isSuperAdmin };
