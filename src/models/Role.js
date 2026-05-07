const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Role <-> Permission (N-N qua role_permissions)
      Role.belongsToMany(models.Permission, {
        through: 'role_permissions',
        foreignKey: 'role_id',
        otherKey: 'permission_id',
        as: 'permissions',
        timestamps: false,
      });

      // Role -> User (1-N)
      Role.hasMany(models.User, {
        foreignKey: 'role_id',
        as: 'users',
      });
    }
  }

  Role.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Tên role (vd: Quản lý, Nhân viên, Kế toán...)',
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Mô tả role',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Role;
};
