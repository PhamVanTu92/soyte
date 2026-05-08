const ApiError = require('../utils/ApiError');
const { buildUploadUrl } = require('../utils/urlHelper');

const uploadImage = (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError(400, 'Please upload a file');
        }

        // Xác định sub-path (images/ hoặc documents/)
        const subPath = req.file.destination.replace(/^uploads\/?/, '').replace(/\/?$/, '/');
        const relativePath = `/uploads/${subPath}${req.file.filename}`;
        const imageUrl = buildUploadUrl(relativePath);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadImage
};
