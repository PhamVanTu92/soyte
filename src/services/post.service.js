const db = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const axios = require('axios');
const cheerio = require('cheerio');
const { isBase64Image, extractBase64Data, saveBase64Image } = require('../utils/imageProcessor');

/**
 * Fetches news from NewsAPI and stores them as posts.
 * @returns {Promise<Post[]>}
 */
const fetchAndStoreNewsFromAPI = async () => {
  // Construct the NewsAPI URL
  const apiKey = '513be48610e9a14584445c57fc79a86b';
  const query = '("Bệnh viện" OR "Y Tế" OR "Ngành Y") AND ("Hà Nội" OR "Ha Noi")';
  // const newsApiUrl = `https://newsapi.org/v2/everything?apiKey=${apiKey}&q=${query}`;
  const newsApiUrl = `https://gnews.io/api/v4/top-headlines?country=vn&apikey=${apiKey}&q=${query}`;
  const response = await axios.get(newsApiUrl);
  const articles = response.data.articles;

  if (!articles || articles.length === 0) {
    return [];
  }
  const postsToCreate = articles.map(article => ({
    id: article.id,
    title: article.title,
    summary: article.description,
    content: article.content,
    image_url: article.image,
    status: 'published',
    created_at: article.publishedAt,
  }));

  return postsToCreate;
};

/**
 * Processes the content of a post, converting base64 images to file-based images.
 * @param {string} contentHtml
 * @returns {Promise<string>} The processed HTML content.
 */
const processContentImages = async (contentHtml) => {
  if (!contentHtml) {
    return contentHtml;
  }
  const $ = cheerio.load(contentHtml);
  const imagePromises = [];
  let imagesFound = 0;
  let base64ImagesProcessed = 0;

  $('img').each((i, el) => {
    imagesFound++;
    const src = $(el).attr('src');

    if (src && isBase64Image(src)) {
      base64ImagesProcessed++;
      imagePromises.push(
        (async () => {
          try {
            const { base64Data, extension } = extractBase64Data(src);
            if (base64Data && extension) {
              const imageUrl = saveBase64Image(base64Data, extension);
              $(el).attr('src', imageUrl);
            } else {
              console.warn('  Could not extract base64 data or extension from:', src);
            }
          } catch (error) {
            console.error('  Error processing base64 image:', error);
          }
        })()
      );
    } else {
      console.log('  Skipping non-base64 image:', src);
    }
  });
 
  await Promise.all(imagePromises);
  const finalHtml = $.html();
  return finalHtml;
};

/**
 * Create a new post
 * @param {object} postData
 * @returns {Promise<Post>}
 */
const createPost = async (postData) => {
  if (postData.content) {
    postData.content = await processContentImages(postData.content);
  }
  const post = await db.Post.create(postData);
  return post;
};

/**
 * Get a list of posts with filters and pagination
 * @param {object} filters
 * @returns {Promise<{rows: Post[], count: number}>}
 */
const getPosts = async (filters) => {
  const { status, category_id, is_featured, page = 1, limit = 10, q } = filters;
  const where = {
    // Only show published posts by default as per business logic
    status: status || 'published',
    // Business logic: Don't show expired posts
    [Op.or]: [
      { expires_at: null },
      { expires_at: { [Op.gt]: new Date() } }
    ]
  };
  if (q && q.trim() !== '') {
    where.title = {
      [Op.like]: `%${q}%`
    };
  }

  if (category_id) {
    where.category_id = category_id;
  }
  if (is_featured !== undefined) {
    where.is_featured = is_featured;
  }

  const offset = (page - 1) * limit;

  return db.Post.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['created_at', 'DESC']],
  });
};

/**
 * Get a list of posts based on a list of categories and limits.
 * @param {Array<{category_id: number, limit: number}>} categoriesAndLimits
 * @returns {Promise<Array<{category_id: number, posts: Post[]}>>}
 */
const getPostsByCategories = async (categoriesAndLimits) => {
  const results = await Promise.all(
    categoriesAndLimits.map(async ({ category_id, limit }) => {
      const posts = await db.Post.findAll({
        where: {
          category_id,
          status: 'published',
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        },
        limit: parseInt(limit, 10),
        order: [['created_at', 'DESC']],
      });
      return { category_id, posts };
    })
  );
  return results;
};


/**
 * Get a single post by its ID and increment view count
 * @param {number} id
 * @returns {Promise<Post|null>}
 */
const getPostById = async (id) => {
  const post = await db.Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Bài viết không tồn tại');
  }
  // Increment view_count asynchronously
  post.increment('view_count').catch(err => console.error('Failed to increment view count:', err));
  return post;
};

/**
 * Update a post by its ID
 * @param {number} id
 * @param {object} updateData
 * @returns {Promise<[number, Post[]]>}
 */
const updatePost = async (id, updateData) => {
  if (updateData.content) {
    updateData.content = await processContentImages(updateData.content);
  }
  const post = await db.Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Bài viết không tồn tại');
  }
  return db.Post.update(updateData, {
    where: { id },
    returning: true, // Not supported by MSSQL, will not return the updated post
  });
};

/**
 * Delete a post by its ID
 * @param {number} id
 * @returns {Promise<number>}
 */
const deletePost = async (id) => {
  // This is a hard delete. For soft delete, the model needs `paranoid: true`
  // and you would call `Post.destroy({ where: { id } })`.
  const post = await db.Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Bài viết không tồn tại');
  }
  return db.Post.destroy({
    where: { id },
  });
};

module.exports = {
  fetchAndStoreNewsFromAPI,
  createPost,
  getPosts,
  getPostsByCategories,
  getPostById,
  updatePost,
  deletePost,
};
