const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => { // Export a function that defines the model
  class User extends Model {
    /**
     * Helper method to compare password.
     * @param {string} candidatePassword
     * @returns {Promise<boolean>}
     */
    async isPasswordMatch(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    static associate(models) {
      User.belongsToMany(models.Permission, {
        through: 'user_permissions',
        foreignKey: 'user_id',
        otherKey: 'permission_id',
        as: 'permissions',
        timestamps: false
      });
    }

    /**
     * Override toJSON to transform status to integer (1 for active, 0 for inactive)
     * and format other fields if needed.
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique: true, // Commented out to allow sync in MSSQL with existing NULL values
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'office', 'leader'), // Updated roles
      defaultValue: 'user',
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize, // Use the passed sequelize instance
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          user.password_changed_at = new Date();
        }
      },
    },
  });

  return User; // Return the defined User model
};
