const postService = require('../services/post.service');
const { validationResult } = require('express-validator');
const { success, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const fetchAndStoreNews = async (req, res, next) => {
  try {
    const createdPosts = await postService.fetchAndStoreNewsFromAPI();
    return created(res, createdPosts, `Successfully fetched and stored ${createdPosts.length} posts.`);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation error', errors.array());
    }
    const postData = {
      ...req.body,
      author_id: req.user.id // Set author_id from the logged-in user
    };
    const post = await postService.createPost(postData);

    return created(res, post, 'Post created successfully');
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const result = await postService.getPosts(req.query);
    return success(res, result.rows, 'Posts retrieved successfully', 200, {
      total: result.count,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      totalPages: Math.ceil(result.count / (parseInt(req.query.limit, 10) || 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getPostsByCategories = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation error', errors.array());
    }
    const posts = await postService.getPostsByCategories(req.body);
    return success(res, posts, 'Posts by categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) {
      throw new ApiError(404, 'Post not found or has expired');
    }
    return success(res, post, 'Post retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation error', errors.array());
    }
    const [affectedRows] = await postService.updatePost(req.params.id, req.body);
    if (affectedRows === 0) {
      throw new ApiError(404, 'Post not found');
    }
    // Since MSSQL with Sequelize doesn't return the updated object,
    // we fetch it again to return it in the response.
    const updatedPost = await postService.getPostById(req.params.id);
    return success(res, updatedPost, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const affectedRows = await postService.deletePost(req.params.id);
    if (affectedRows === 0) {
      throw new ApiError(404, 'Post not found');
    }
    return success(res, null, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};

const uploadPostImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded.');
    }
    // Construct the URL to the uploaded image
    // Assuming your server is configured to serve static files from /uploads
    const imageUrl = `/uploads/posts/${req.file.filename}`;
    return success(res, { imageUrl }, 'Image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fetchAndStoreNews,
  createPost,
  getPosts,
  getPostsByCategories,
  getPostById,
  updatePost,
  deletePost,
  uploadPostImage,
};
