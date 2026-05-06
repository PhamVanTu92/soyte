const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailConfirm extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  EmailConfirm.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    smtp_host: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'smtp.gmail.com',
    },
    smtp_port: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 587,
    },
    smtp_secure: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    smtp_user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    smtp_pass: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      allowNull: false,
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
    sequelize,
    modelName: 'EmailConfirm',
    tableName: 'email_confirm',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return EmailConfirm;
};
