const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      Permission.belongsToMany(models.User, {
        through: 'user_permissions',
        foreignKey: 'permission_id',
        otherKey: 'user_id',
        as: 'users',
        timestamps: false
      });

      // Hierarchical relations
      Permission.belongsTo(Permission, {
        foreignKey: 'parent_id',
        as: 'parent',
      });
      Permission.hasMany(Permission, {
        foreignKey: 'parent_id',
        as: 'children',
      });
    }
  }

  Permission.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Permission;
};
