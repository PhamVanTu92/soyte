const db = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Build a tree from a flat list of items using parent_id
 * @param {Array} list 
 * @param {number|null} parentId 
 * @returns {Array}
 */
const buildPermissionTree = (list, parentId = null) => {
  const tree = [];
  for (const item of list) {
    if (item.parent_id === parentId) {
      const children = buildPermissionTree(list, item.id);
      const node = item.toJSON ? item.toJSON() : { ...item };
      if (children.length > 0) {
        node.children = children;
      }
      tree.push(node);
    }
  }
  return tree;
};

/**
 * Get all permissions as a tree structure
 * @returns {Promise<Permission[]>}
 */
const getPermissions = async () => {
  const permissions = await db.Permission.findAll({
    attributes: ['id', 'name', 'description', 'parent_id', 'created_at', 'updated_at'],
    order: [['id', 'ASC']]
  });

  return buildPermissionTree(permissions);
};

/**
 * Get a single permission by ID
 * @param {number} id
 * @returns {Promise<Permission|null>}
 */
const getPermissionById = async (id) => {
  const permission = await db.Permission.findByPk(id, {
    attributes: ['id', 'name', 'description', 'parent_id', 'created_at', 'updated_at'],
    include: [{
      model: db.Permission,
      as: 'children',
      attributes: ['id', 'name', 'description']
    }]
  });
  if (!permission) {
    throw new ApiError(404, 'Không tìm thấy quyền này');
  }
  return permission;
};

/**
 * Create a new permission
 * @param {object} data
 * @returns {Promise<Permission>}
 */
const createPermission = async (data) => {
  // data should include parent_id if provided
  return db.Permission.create(data);
};

/**
 * Update a permission
 * @param {number} id
 * @param {object} data
 * @returns {Promise<[number, Permission[]]>}
 */
const updatePermission = async (id, data) => {
  const [updatedCount] = await db.Permission.update(data, {
    where: { id }
  });
  if (updatedCount === 0) {
    throw new ApiError(404, 'Không tìm thấy quyền để cập nhật');
  }
  return getPermissionById(id);
};

/**
 * Delete a permission
 * @param {number} id
 * @returns {Promise<number>}
 */
const deletePermission = async (id) => {
  const permission = await db.Permission.findByPk(id);
  if (!permission) {
    throw new ApiError(404, 'Không tìm thấy quyền để xóa');
  }
  // Optional: Check if it has children and decide logic (delete cascade or prevent?)
  return db.Permission.destroy({
    where: { id }
  });
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
