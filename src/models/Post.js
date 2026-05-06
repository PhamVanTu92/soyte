const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => { // Export a function that defines the model
  class Post extends Model {}

  Post.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Corresponds to IDENTITY
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Assuming it can be null, adjust if needed
      // references: { model: 'news_categories', key: 'id' } // Define foreign key relationship
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Assuming it can be null, adjust if needed
      // references: { model: 'users', key: 'id' } // Define foreign key relationship
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
    },
    content: {
      type: DataTypes.TEXT,
    },
    image_url: {
      type: DataTypes.TEXT, // Changed from STRING(500) to TEXT to support NVARCHAR(MAX)
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft',
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
    // For soft deletes, you would add:
    // paranoid: true,
    // deletedAt: 'deleted_at'
  }, {
    sequelize, // Use the passed sequelize instance
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true, // Enables createdAt and updatedAt
    createdAt: 'created_at', // Map to the desired column name
    updatedAt: false, // Assuming no updated_at column as per spec
    indexes: [
      {
        fields: ['category_id'],
      },
      {
        fields: ['status', 'created_at'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['is_featured'],
      }
    ]
  });

  return Post; // Return the defined Post model
};

